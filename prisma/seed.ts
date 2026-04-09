// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 清理现有数据（由于没有级联删除，需手动按顺序清理）
  // 顺序：先清理子表(房型)，再清理父表(酒店/用户)
  await prisma.booking.deleteMany();
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

  const coverImages = [
    '/hotel_img/hotel1.png',
    '/hotel_img/hotel2.png',
    '/hotel_img/hotel3.png',
    '/hotel_img/hotel4.png',
  ];

  const roomImages = [
    '/hotel_img/room1.jpg',
    '/hotel_img/room2.jpg',
    '/hotel_img/room3.jpg',
  ];

  const publishedHotelTemplates = [
    {
      name: '上海徐汇云栖酒店',
      address: '上海市徐汇区漕溪北路',
      starRating: 4,
      minPrice: 458,
      openingTime: '2021-03-15',
      facilities: ['免费WiFi', '健身房', '餐厅', '行李寄存'],
      latitude: 31.1942,
      longitude: 121.4368,
    },
    {
      name: '上海静安艺选酒店',
      address: '上海市静安区南京西路',
      starRating: 4,
      minPrice: 528,
      openingTime: '2020-09-18',
      facilities: ['免费WiFi', '健身房', '洗衣服务', '24小时前台'],
      latitude: 31.2299,
      longitude: 121.4596,
    },
    {
      name: '上海虹桥臻选酒店',
      address: '上海市长宁区延安西路',
      starRating: 5,
      minPrice: 699,
      openingTime: '2019-07-01',
      facilities: ['免费WiFi', '免费停车', '健身房', '会议室'],
      latitude: 31.2125,
      longitude: 121.4021,
    },
    {
      name: '上海外滩轻奢酒店',
      address: '上海市黄浦区中山东二路',
      starRating: 5,
      minPrice: 888,
      openingTime: '2022-04-08',
      facilities: ['免费WiFi', '餐厅', '酒吧', '礼宾服务'],
      latitude: 31.2401,
      longitude: 121.4906,
    },
    {
      name: '上海浦东会展酒店',
      address: '上海市浦东新区龙阳路',
      starRating: 4,
      minPrice: 436,
      openingTime: '2021-11-20',
      facilities: ['免费WiFi', '会议室', '餐厅', '免费停车'],
      latitude: 31.2043,
      longitude: 121.5498,
    },
    {
      name: '上海前滩悦景酒店',
      address: '上海市浦东新区前滩大道',
      starRating: 5,
      minPrice: 1099,
      openingTime: '2023-02-14',
      facilities: ['免费WiFi', '游泳池', '健身房', '行政酒廊'],
      latitude: 31.1608,
      longitude: 121.4663,
    },
    {
      name: '上海大学城轻居酒店',
      address: '上海市松江区广富林路',
      starRating: 3,
      minPrice: 268,
      openingTime: '2020-08-25',
      facilities: ['免费WiFi', '自助早餐', '洗衣服务', '电梯'],
      latitude: 31.0385,
      longitude: 121.2264,
    },
    {
      name: '上海迪士尼度假酒店',
      address: '上海市浦东新区申迪西路',
      starRating: 5,
      minPrice: 1288,
      openingTime: '2018-05-01',
      facilities: ['免费WiFi', '儿童乐园', '餐厅', '接机服务'],
      latitude: 31.1423,
      longitude: 121.6572,
    },
    {
      name: '上海世博滨江酒店',
      address: '上海市浦东新区雪野路',
      starRating: 4,
      minPrice: 586,
      openingTime: '2019-10-16',
      facilities: ['免费WiFi', '健身房', '餐厅', '会议室'],
      latitude: 31.1805,
      longitude: 121.4928,
    },
    {
      name: '上海五角场设计师酒店',
      address: '上海市杨浦区四平路',
      starRating: 4,
      minPrice: 399,
      openingTime: '2022-06-12',
      facilities: ['免费WiFi', '机器人服务', '咖啡厅', '行李寄存'],
      latitude: 31.2991,
      longitude: 121.5145,
    },
    {
      name: '上海北外滩商务酒店',
      address: '上海市虹口区东长治路',
      starRating: 4,
      minPrice: 620,
      openingTime: '2021-01-09',
      facilities: ['免费WiFi', '会议室', '健身房', '免费停车'],
      latitude: 31.2528,
      longitude: 121.5052,
    },
    {
      name: '上海陆家嘴云端酒店',
      address: '上海市浦东新区世纪大道',
      starRating: 5,
      minPrice: 1399,
      openingTime: '2020-12-05',
      facilities: ['免费WiFi', '游泳池', '健身房', '行政酒廊'],
      latitude: 31.2351,
      longitude: 121.5065,
    },
    {
      name: '上海中山公园都会酒店',
      address: '上海市长宁区长宁路',
      starRating: 3,
      minPrice: 318,
      openingTime: '2019-03-22',
      facilities: ['免费WiFi', '餐厅', '洗衣服务', '24小时前台'],
      latitude: 31.2241,
      longitude: 121.4167,
    },
    {
      name: '上海新天地精品酒店',
      address: '上海市黄浦区马当路',
      starRating: 5,
      minPrice: 960,
      openingTime: '2022-08-30',
      facilities: ['免费WiFi', '酒吧', '餐厅', '礼宾服务'],
      latitude: 31.2197,
      longitude: 121.4744,
    },
    {
      name: '上海曹杨路智选酒店',
      address: '上海市普陀区曹杨路',
      starRating: 3,
      minPrice: 289,
      openingTime: '2021-04-17',
      facilities: ['免费WiFi', '自助早餐', '洗衣服务', '电梯'],
      latitude: 31.2382,
      longitude: 121.4175,
    },
    {
      name: '上海南站城市酒店',
      address: '上海市徐汇区沪闵路',
      starRating: 4,
      minPrice: 358,
      openingTime: '2020-02-28',
      facilities: ['免费WiFi', '免费停车', '餐厅', '会议室'],
      latitude: 31.1571,
      longitude: 121.4294,
    },
    {
      name: '上海宝山滨江酒店',
      address: '上海市宝山区牡丹江路',
      starRating: 4,
      minPrice: 336,
      openingTime: '2018-11-11',
      facilities: ['免费WiFi', '健身房', '免费停车', '行李寄存'],
      latitude: 31.3989,
      longitude: 121.4891,
    },
    {
      name: '上海临港海景酒店',
      address: '上海市浦东新区环湖西一路',
      starRating: 5,
      minPrice: 780,
      openingTime: '2023-05-06',
      facilities: ['免费WiFi', '游泳池', '餐厅', '免费停车'],
      latitude: 30.9045,
      longitude: 121.9276,
    },
  ];

  const targetPublishedHotelCount = 100;
  const existingPublishedSeedCount = 2;
  const generatedPublishedCount = targetPublishedHotelCount - existingPublishedSeedCount;

  const generatedPublishedHotels = Array.from({ length: generatedPublishedCount }, (_, index) => {
    const template = publishedHotelTemplates[index % publishedHotelTemplates.length];
    const batch = Math.floor(index / publishedHotelTemplates.length) + 1;
    const priceOffset = (index % 6) * 18 + batch * 5;
    const latitudeOffset = batch * 0.002 + (index % 3) * 0.0005;
    const longitudeOffset = batch * 0.002 + (index % 4) * 0.0006;

    return {
      ...template,
      name: `${template.name}${batch}号店`,
      address: `${template.address}${batch}号`,
      minPrice: template.minPrice + priceOffset,
      latitude: Number((template.latitude + latitudeOffset).toFixed(6)),
      longitude: Number((template.longitude + longitudeOffset).toFixed(6)),
    };
  });

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
      latitude: 31.2357,
      longitude: 121.5048,
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
      latitude: 31.2292,
      longitude: 121.5120,
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
      latitude: 31.2296,
      longitude: 121.4505,
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
      latitude: 31.2522,
      longitude: 121.4893,
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
        imageUrl: '/hotel_img/room1.jpg',
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
        imageUrl: '/hotel_img/room2.jpg',
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
        imageUrl: '/hotel_img/room3.jpg',
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
        imageUrl: '/hotel_img/room1.jpg',
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
        imageUrl: '/hotel_img/room2.jpg',
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
        imageUrl: '/hotel_img/room1.jpg',
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
        imageUrl: '/hotel_img/room1.jpg',
      },
    ],
  });

  const extraPublishedHotels = [];
  for (let index = 0; index < generatedPublishedHotels.length; index += 1) {
    const item = generatedPublishedHotels[index];
    const coverImage = coverImages[index % coverImages.length];
    const gallery = [
      coverImage,
      coverImages[(index + 1) % coverImages.length],
      coverImages[(index + 2) % coverImages.length],
    ];

    const hotel = await prisma.hotel.create({
      data: {
        merchantId: merchant.id,
        name: item.name,
        address: item.address,
        starRating: item.starRating,
        minPrice: item.minPrice,
        openingTime: new Date(item.openingTime),
        facilities: item.facilities,
        coverImage,
        gallery,
        latitude: item.latitude,
        longitude: item.longitude,
        status: 1,
      },
    });

    extraPublishedHotels.push({
      id: hotel.id,
      minPrice: item.minPrice,
      coverImageIndex: index % roomImages.length,
    });
  }

  for (let index = 0; index < extraPublishedHotels.length; index += 1) {
    const hotel = extraPublishedHotels[index];
    await prisma.hotelRoom.createMany({
      data: [
        {
          hotelId: hotel.id,
          roomName: '高级大床房',
          bedInfo: '1张1.8米大床',
          capacity: 2,
          hasBreakfast: false,
          price: hotel.minPrice,
          stock: 12,
          cancelPolicy: '免费取消',
          imageUrl: roomImages[hotel.coverImageIndex],
        },
        {
          hotelId: hotel.id,
          roomName: '行政双床房',
          bedInfo: '2张1.2米单人床',
          capacity: 2,
          hasBreakfast: true,
          price: hotel.minPrice + 120,
          stock: 8,
          cancelPolicy: '入住前1天免费取消',
          imageUrl: roomImages[(hotel.coverImageIndex + 1) % roomImages.length],
        },
      ],
    });
  }

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
