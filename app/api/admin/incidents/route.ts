import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { isWithinGeofence, sendGeofenceAlert } from '@/lib/iot/commands';

/**
 * GET /api/admin/incidents
 * Get security incidents and geofence alerts
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'open';
    const type = searchParams.get('type'); // geofence, tamper, overdue, lost
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get incidents
    let query = supabase
      .from('security_incidents')
      .select(`
                incident_id,
                incident_type,
                severity,
                status,
                asset_type,
                asset_id,
                user_id,
                description,
                location_lat,
                location_lng,
                detected_at,
                resolved_at,
                notes,
                users:user_id (
                    display_name,
                    email
                )
            `)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('incident_type', type);
    }

    const { data: incidents, error } = await query;
    if (error) throw error;

    // Get statistics
    const { data: stats } = await supabase
      .from('security_incidents')
      .select('incident_type, status')
      .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const openIncidents = (stats || []).filter(s => s.status === 'open').length;
    const criticalIncidents = (stats || []).filter(s => s.status === 'open').length;
    const resolvedThisWeek = (stats || []).filter(s => s.status === 'resolved').length;

    return NextResponse.json({
      incidents: incidents || [],
      stats: {
        openIncidents,
        criticalIncidents,
        resolvedThisWeek,
        byType: {
          geofence: (stats || []).filter(s => s.incident_type === 'geofence').length,
          tamper: (stats || []).filter(s => s.incident_type === 'tamper').length,
          overdue: (stats || []).filter(s => s.incident_type === 'overdue').length,
          lost: (stats || []).filter(s => s.incident_type === 'lost').length,
        },
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/incidents
 * Create or update security incident
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'create') {
      // Create new incident
      const { incident_type, asset_type, asset_id, user_id, severity, description, location } = data;

      if (!incident_type || !asset_type || !asset_id) {
        return NextResponse.json(
          { error: 'incident_type, asset_type, and asset_id are required' },
          { status: 400 }
        );
      }

      const { data: incident, error } = await supabase
        .from('security_incidents')
        .insert({
          incident_type,
          asset_type,
          asset_id,
          user_id,
          severity: severity || 'medium',
          description,
          location_lat: location?.lat,
          location_lng: location?.lng,
          status: 'open',
          detected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send alert to user if applicable
      if (user_id) {
        await supabase.from('notifications').insert({
          user_id,
          type: 'alert',
          title: '⚠️ Cảnh báo bảo mật',
          message: description || `Phát hiện sự cố với ${asset_type} của bạn.`,
        });
      }

      return NextResponse.json({ success: true, incident });

    } else if (action === 'resolve') {
      // Resolve incident
      const { incident_id, notes } = data;

      const { error } = await supabase
        .from('security_incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          notes,
        })
        .eq('incident_id', incident_id);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Incident resolved' });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use create or resolve' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Webhook endpoint for IoT devices to report geofence violations
 */
export async function PUT(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.IOT_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { bikeId, alertType, gpsLat, gpsLng } = body;

    // Get bike and current rental info
    const { data: bike } = await supabase
      .from('ebikes')
      .select('bike_id, bike_code, current_station_id')
      .eq('bike_id', bikeId)
      .single();

    if (!bike) {
      return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    }

    // Get current rental
    const { data: rental } = await supabase
      .from('ebike_rentals')
      .select('rental_id, user_id')
      .eq('bike_id', bikeId)
      .eq('status', 'ongoing')
      .single();

    // Create incident
    await supabase.from('security_incidents').insert({
      incident_type: alertType || 'geofence',
      asset_type: 'ebike',
      asset_id: bikeId,
      user_id: rental?.user_id,
      severity: alertType === 'tamper' ? 'critical' : 'high',
      description: `Alert: ${alertType} for bike ${bike.bike_code}`,
      location_lat: gpsLat,
      location_lng: gpsLng,
      status: 'open',
      detected_at: new Date().toISOString(),
    });

    // If user exists, send notification
    if (rental?.user_id) {
      await supabase.from('notifications').insert({
        user_id: rental.user_id,
        type: 'alert',
        title: '⚠️ Cảnh báo xe đạp',
        message: 'Xe đạp của bạn đang ra ngoài vùng cho phép. Vui lòng quay lại trạm.',
      });
    }

    return NextResponse.json({ success: true, message: 'Alert recorded' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
