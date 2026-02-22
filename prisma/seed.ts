// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 清理现有数据（由于没有级联删除，需手动按顺序清理）
  // 顺序：先清理子表(房型)，再清理父表(酒店/用户)
  await prisma.hotelRoom.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 旧数据已清理');

  // 2. 创建用户 (商户和管理员)
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const merchant = await prisma.user.create({
    data: {
      username: 'merchant01',
      password: hashedPassword,
      role: 'merchant',
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin01',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('👤 用户创建成功: merchant01, admin01');

  // 3. 创建酒店数据 (参考截图内容 )
  // 酒店 A：上海陆家嘴禧玥酒店
  const hotel1 = await prisma.hotel.create({
    data: {
      merchantId: merchant.id, // 逻辑关联商户
      name: '上海陆家嘴禧玥酒店',
      address: '上海市浦东新区浦明路',
      starRating: 5,
      minPrice: 936.00,
      openingTime: new Date('2020-01-01'),
      facilities: ['免费升房', '新中式风', '免费停车', '一线江景'],
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      status: 1, // 已发布 
    },
  });

  // 酒店 B：艺龙安悦酒店
  const hotel2 = await prisma.hotel.create({
    data: {
      merchantId: merchant.id,
      name: '艺龙安悦酒店(上海浦东大道歇浦路地铁站店)',
      address: '上海市浦东新区近歇浦路地铁站',
      starRating: 3,
      minPrice: 199.00,
      openingTime: new Date('2021-05-10'),
      facilities: ['免费停车', '免费洗衣服务', '机器人服务', '自助早餐'],
      coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c0d5e911?w=800&q=80',
      status: 1, // 已发布
    },
  });

  // 酒店 C：待审核酒店 (演示管理员功能)
  const hotel3 = await prisma.hotel.create({
    data: {
      merchantId: merchant.id,
      name: '上海静安瑞吉酒店 (测试)',
      address: '上海市静安区北京西路',
      starRating: 5,
      minPrice: 1200.00,
      status: 0, // 待审核 
    },
  });
  console.log('🏨 酒店创建成功: 禧玥, 艺龙安悦, 瑞吉');

  // 4. 创建房型数据 (根据酒店 ID 逻辑关联)
  // 禧玥酒店的房型
  await prisma.hotelRoom.createMany({
    data: [
      {
        hotelId: hotel1.id,
        roomName: '高级大床房',
        bedInfo: '1张1.8米大床',
        capacity: 2,
        hasBreakfast: false,
        price: 936.00,
        cancelPolicy: '不可取消',
      },
      {
        hotelId: hotel1.id,
        roomName: '江景双床房',
        bedInfo: '2张1.2米单人床',
        capacity: 2,
        hasBreakfast: true,
        price: 1150.00,
        cancelPolicy: '免费取消',
      },
    ],
  });

  // 艺龙安悦酒店的房型
  await prisma.hotelRoom.createMany({
    data: [
      {
        hotelId: hotel2.id,
        roomName: '特惠无窗房',
        bedInfo: '1张1.5米双人床',
        capacity: 2,
        hasBreakfast: false,
        price: 199.00,
        cancelPolicy: '不可取消',
      },
      {
        hotelId: hotel2.id,
        roomName: '标准双床房',
        bedInfo: '2张1.2米单人床',
        capacity: 2,
        hasBreakfast: true,
        price: 268.00,
        cancelPolicy: '免费取消',
      },
    ],
  });
  console.log('🛏️ 房型数据填充完毕');

  console.log('✅ 所有种子数据已就绪！');
}

main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });