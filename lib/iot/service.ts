/**
 * SipMart IoT Service Layer
 * Handles communication with e-Bike smart locks and solar stations
 */

// MQTT Configuration (for future integration)
const MQTT_CONFIG = {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    topics: {
        bikeCommand: 'sipmart/bikes/{bikeId}/command',
        bikeStatus: 'sipmart/bikes/{bikeId}/status',
        bikeGps: 'sipmart/bikes/{bikeId}/gps',
        stationSolar: 'sipmart/stations/{stationId}/solar',
    },
};

// Bike Commands
export type BikeCommand = 'unlock' | 'lock' | 'alarm' | 'locate';

export interface BikeStatus {
    bikeId: string;
    locked: boolean;
    batteryLevel: number;
    gpsLat: number;
    gpsLng: number;
    lastUpdate: Date;
    isCharging: boolean;
}

export interface SolarStationData {
    stationId: string;
    currentPowerKw: number;
    totalEnergyKwh: number;
    panelStatus: 'active' | 'inactive' | 'error';
    timestamp: Date;
}

/**
 * Send command to e-Bike smart lock
 * Currently uses mock implementation - replace with actual MQTT/HTTP calls
 */
export async function sendBikeCommand(
    bikeId: string,
    command: BikeCommand
): Promise<{ success: boolean; message: string }> {
    console.log(`[IoT] Sending ${command} command to bike: ${bikeId}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production, implement:
    // 1. MQTT publish to `sipmart/bikes/{bikeId}/command`
    // 2. Wait for ACK from device
    // 3. Update database with new status

    /*
    // MQTT Example (with mqtt package):
    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, {
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
    });
  
    return new Promise((resolve, reject) => {
      const topic = MQTT_CONFIG.topics.bikeCommand.replace('{bikeId}', bikeId);
      client.publish(topic, JSON.stringify({ command, timestamp: new Date() }), (err) => {
        if (err) reject(err);
        else resolve({ success: true, message: `Command ${command} sent` });
        client.end();
      });
    });
    */

    return {
        success: true,
        message: `Command "${command}" sent to bike ${bikeId}`,
    };
}

/**
 * Get real-time bike status
 */
export async function getBikeStatus(bikeId: string): Promise<BikeStatus | null> {
    console.log(`[IoT] Fetching status for bike: ${bikeId}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Return mock data
    return {
        bikeId,
        locked: true,
        batteryLevel: Math.floor(Math.random() * 100),
        gpsLat: 10.762622 + (Math.random() - 0.5) * 0.01,
        gpsLng: 106.660172 + (Math.random() - 0.5) * 0.01,
        lastUpdate: new Date(),
        isCharging: Math.random() > 0.7,
    };
}

/**
 * Get solar station data
 */
export async function getSolarStationData(
    stationId: string
): Promise<SolarStationData | null> {
    console.log(`[IoT] Fetching solar data for station: ${stationId}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 200));

    const hour = new Date().getHours();
    // Solar power peaks at noon
    const basePower = hour >= 6 && hour <= 18 ? 0.5 + Math.sin(((hour - 6) / 12) * Math.PI) * 1.5 : 0;

    return {
        stationId,
        currentPowerKw: basePower * (0.8 + Math.random() * 0.4),
        totalEnergyKwh: Math.floor(Math.random() * 1000) + 500,
        panelStatus: 'active',
        timestamp: new Date(),
    };
}

/**
 * Check if bike is within geofence of a station
 */
export function isWithinGeofence(
    bikeLat: number,
    bikeLng: number,
    stationLat: number,
    stationLng: number,
    radiusMeters: number = 50
): boolean {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (bikeLat * Math.PI) / 180;
    const φ2 = (stationLat * Math.PI) / 180;
    const Δφ = ((stationLat - bikeLat) * Math.PI) / 180;
    const Δλ = ((stationLng - bikeLng) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
}

/**
 * Calculate estimated range based on battery level
 * @param batteryLevel - Current battery percentage
 * @returns Estimated range in kilometers
 */
export function calculateEstimatedRange(batteryLevel: number): number {
    // Assume 40km range at 100% battery
    const MAX_RANGE_KM = 40;
    return (batteryLevel / 100) * MAX_RANGE_KM;
}

/**
 * Subscribe to bike updates (for real-time monitoring)
 */
export function subscribeToBikeUpdates(
    bikeId: string,
    callback: (status: BikeStatus) => void
): () => void {
    console.log(`[IoT] Subscribing to updates for bike: ${bikeId}`);

    // Mock implementation using polling
    const interval = setInterval(async () => {
        const status = await getBikeStatus(bikeId);
        if (status) callback(status);
    }, 5000);

    // Return unsubscribe function
    return () => {
        console.log(`[IoT] Unsubscribing from bike: ${bikeId}`);
        clearInterval(interval);
    };
}

/**
 * Send alert to bike (for lost bike scenario)
 */
export async function triggerBikeAlarm(bikeId: string): Promise<boolean> {
    const result = await sendBikeCommand(bikeId, 'alarm');
    return result.success;
}

/**
 * Locate bike (trigger GPS update)
 */
export async function locateBike(bikeId: string): Promise<{ lat: number; lng: number } | null> {
    await sendBikeCommand(bikeId, 'locate');
    const status = await getBikeStatus(bikeId);
    return status ? { lat: status.gpsLat, lng: status.gpsLng } : null;
}

// Types already exported at definition
