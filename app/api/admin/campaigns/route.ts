// API: Campaign Manager (Admin)
import { NextResponse } from 'next/server';
import {
  createCampaign,
  getActiveCampaigns,
  updateCampaign,
  deactivateCampaign,
} from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const campaigns = await getActiveCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, target, rewardType, rewardValue, startDate, endDate } = body;

    if (!name || !type || !target || !rewardType || !rewardValue || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createCampaign({
      name,
      description,
      type,
      target,
      rewardType,
      rewardValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, action, ...updateData } = body;

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'deactivate') {
      result = await deactivateCampaign(campaignId);
    } else {
      result = await updateCampaign(campaignId, updateData);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

