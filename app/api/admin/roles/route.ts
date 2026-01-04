// API: Admin Roles & Permissions
import { NextResponse } from 'next/server';
import { createAdminRole, getAdminRoles } from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const roles = await getAdminRoles();
    return NextResponse.json({ success: true, roles });
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
    const { roleName, permissions, description } = body;

    if (!roleName || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createAdminRole({
      roleName,
      permissions,
      description,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

