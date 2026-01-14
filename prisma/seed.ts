import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create default admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sipsmart.vn';
    const admin = await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            displayName: 'Super Admin',
            role: 'super_admin',
        },
    });
    console.log('✅ Admin user ready:', admin.email);

    // 2. Create sample store
    const store = await prisma.store.create({
        data: {
            name: 'SipSmart Main Station',
            address: 'Đại học Quốc gia TP.HCM',
            gpsLat: 10.870,
            gpsLng: 106.803,
            cupTotal: 100,
            cupAvailable: 100,
            cupInUse: 0,
            cupCleaning: 0,
            partnerStatus: 'active',
        },
    });
    console.log('✅ Sample store created:', store.name);

    // 3. Create sample rewards
    await prisma.reward.createMany({
        data: [
            {
                name: 'Voucher 20k Coffee House',
                description: 'Giảm 20k cho hóa đơn từ 50k',
                pointsCost: 500,
                category: 'voucher',
                stock: 50,
                image: '/images/rewards/voucher-20k.jpg',
            },
            {
                name: 'Túi vải Canvas Xanh',
                description: 'Túi vải thân thiện môi trường',
                pointsCost: 1500,
                category: 'merchandise',
                stock: 20,
                image: '/images/rewards/tote-bag.jpg',
            },
            {
                name: 'Quyên góp trồng cây',
                description: 'Đóng góp 10k vào quỹ trồng rừng',
                pointsCost: 300,
                category: 'charity',
                stock: 9999,
                image: '/images/rewards/plant-tree.jpg',
            },
        ],
    });
    console.log('✅ Sample rewards created');

    // 4. Create achievements
    await prisma.achievement.createMany({
        data: [
            {
                badgeId: 'seed_sower',
                name: 'Người Gieo Hạt',
                description: 'Tham gia SipSmart và mượn ly lần đầu tiên',
                icon: '🌱',
                rarity: 'common',
                requirement: 1,
                category: 'cups',
                rewardPoints: 50,
            },
            {
                badgeId: 'green_warrior',
                name: 'Chiến Binh Xanh',
                description: 'Đạt chuỗi trả ly đúng hạn 7 ngày liên tiếp',
                icon: '⚔️',
                rarity: 'epic',
                requirement: 7,
                category: 'streak',
                rewardPoints: 200,
            },
        ],
    });
    console.log('✅ Sample achievements created');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
