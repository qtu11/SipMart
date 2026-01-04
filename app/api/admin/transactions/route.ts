import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminApi } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const storeId = searchParams.get('storeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (storeId) {
            where.borrowStoreId = storeId;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    user: {
                        select: {
                            email: true,
                            displayName: true,
                        }
                    },
                    cup: {
                        select: {
                            material: true,
                        }
                    }
                },
                orderBy: { borrowTime: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaction.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            transactions,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { transactionId, status, forceComplete } = body;

        if (!transactionId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updateData: any = { status };
        if (status === 'completed' || status === 'cancelled') {
            updateData.returnTime = new Date();
            if (forceComplete) {
                // Maybe add admin note
            }
        }

        const transaction = await prisma.transaction.update({
            where: { transactionId },
            data: updateData,
        });

        // Also update cup status if needed
        if (transaction.cupId && (status === 'completed' || status === 'cancelled')) {
            await prisma.cup.update({
                where: { cupId: transaction.cupId },
                data: {
                    status: status === 'completed' ? 'cleaning' : 'available',
                    currentTransactionId: null,
                    currentUserId: null
                }
            });
        }

        return NextResponse.json({ success: true, transaction });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
