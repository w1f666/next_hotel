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

  // 3. 创建酒店数据 (使用本地public文件夹中的图片)
  // 酒店 A：上海陆家嘴禧玥酒店
  const hotel1 = await prisma.hotel.create({
    data: {
      merchantId: merchant.id, // 逻辑关联商户
      name: '上海陆家嘴禧玥酒店',
      address: '上海市浦东新区浦明路',
      starRating: 5,
      minPrice: 936.00,
      openingTime: new Date('2020-01-01'),
      facilities: ['免费WiFi', '免费停车', '健身房', '游泳池', '餐厅', '会议室'],
      coverImage: '/hotel_img/hotel1.png',
      gallery: [
        '/hotel_img/hotel1.png',
        '/hotel_img/hotel2.png',
        '/hotel_img/hotel3.png',
      ],
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
      facilities: ['免费WiFi', '免费停车', '机器人服务', '自助早餐'],
      coverImage: '/hotel_img/hotel2.png',
      gallery: [
        '/hotel_img/hotel2.png',
        '/hotel_img/hotel4.png',
      ],
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
      openingTime: new Date('2022-01-01'),
      facilities: ['免费WiFi', '免费停车', '健身房', '游泳池', 'SPA', '行政酒廊'],
      coverImage: '/hotel_img/hotel3.png',
      gallery: [
        '/hotel_img/hotel3.png',
        '/hotel_img/hotel1.png',
      ],
      status: 0, // 待审核 
    },
  });

  // 酒店 D：已拒绝酒店 (演示管理员功能)
  const hotel4 = await prisma.hotel.create({
    data: {
      merchantId: merchant.id,
      name: '上海外滩W酒店 (测试)',
      address: '上海市虹口区东大名路',
      starRating: 5,
      minPrice: 2500.00,
      openingTime: new Date('2019-06-01'),
      facilities: ['免费WiFi', '免费停车', '健身房', '游泳池', '餐厅', '酒吧'],
      coverImage: '/hotel_img/hotel4.png',
      gallery: [
        '/hotel_img/hotel4.png',
        '/hotel_img/hotel2.png',
        '/hotel_img/hotel3.png',
      ],
      status: 2, // 已拒绝
      rejectReason: '提交的图片不清晰，请重新上传高质量图片',
    },
  });

  console.log('🏨 酒店创建成功: 禧玥, 艺龙安悦, 瑞吉, 外滩W');

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
        stock: 10,
        cancelPolicy: '不可取消',
      },
      {
        hotelId: hotel1.id,
        roomName: '江景双床房',
        bedInfo: '2张1.2米单人床',
        capacity: 2,
        hasBreakfast: true,
        price: 1150.00,
        stock: 8,
        cancelPolicy: '免费取消',
      },
      {
        hotelId: hotel1.id,
        roomName: '豪华套房',
        bedInfo: '1张2米特大床',
        capacity: 2,
        hasBreakfast: true,
        price: 2888.00,
        stock: 3,
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
        stock: 20,
        cancelPolicy: '不可取消',
      },
      {
        hotelId: hotel2.id,
        roomName: '标准双床房',
        bedInfo: '2张1.2米单人床',
        capacity: 2,
        hasBreakfast: true,
        price: 268.00,
        stock: 15,
        cancelPolicy: '免费取消',
      },
    ],
  });

  // 瑞吉酒店的房型
  await prisma.hotelRoom.createMany({
    data: [
      {
        hotelId: hotel3.id,
        roomName: '经典客房',
        bedInfo: '1张1.8米大床',
        capacity: 2,
        hasBreakfast: false,
        price: 1200.00,
        stock: 10,
        cancelPolicy: '入住前3天免费取消',
      },
    ],
  });

  // 外滩W酒店的房型
  await prisma.hotelRoom.createMany({
    data: [
      {
        hotelId: hotel4.id,
        roomName: '奇妙客房',
        bedInfo: '1张1.8米大床',
        capacity: 2,
        hasBreakfast: true,
        price: 2500.00,
        stock: 5,
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
