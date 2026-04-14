/* 酒店增删改查 —— 数据服务层 (Prisma) */

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { cacheTag, cacheLife } from 'next/cache';
import { updateTag } from 'next/cache';
import { serializeHotel, serializeRoom } from '@/lib/serialize';
import type { HotelFormData } from '@/types';


/**
 * 获取C端酒店列表（已发布的酒店，用于客户端展示）
 * 使用 'use cache' + cacheTag/cacheLife 替代 unstable_cache
 */
export async function getPublishedHotels() {
  'use cache';
  cacheTag('hotels');
  cacheLife({ revalidate: 120 });

  const hotels = await prisma.hotel.findMany({
    where: { status: 1 },
    orderBy: { updatedAt: 'desc' },
  });
  return hotels.map(serializeHotel);
}

// =====================================================
// ========== 商户工作台函数（录入/编辑/修改）==========
// =====================================================

/**
 * 获取商户的酒店列表
 */
export async function getHotelsByMerchant(merchantId: number) {
  const hotels = await prisma.hotel.findMany({
    where: { merchantId },
    orderBy: { updatedAt: 'desc' },
  });
  return hotels.map(serializeHotel);
}

/**
 * 获取所有酒店（支持筛选）- 支持游标分页和传统分页）
 */
export async function getAllHotels(params?: {
  page?: number;
  pageSize?: number;
  cursor?: number | null;
  status?: number;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number | number[];
  facilities?: string[];
  city?: string;
}) {
  const { page = 1, pageSize = 10, cursor, status, keyword, minPrice, maxPrice, starRating, facilities, city } = params || {};

  const where: Prisma.HotelWhereInput = {};
  if (status !== undefined && status !== null) {
    where.status = status;
  }
  if (keyword) {
    where.name = { contains: keyword };
  }

  // 城市筛选 —— 匹配地址中包含的城市名
  if (city && city !== 'all') {
    where.address = { contains: city };
  }
  
  // 价格筛选
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.minPrice = {};
    if (minPrice !== undefined) {
      where.minPrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.minPrice.lte = maxPrice;
    }
  }
  
  // 星级筛选
  if (starRating !== undefined) {
    if (Array.isArray(starRating) && starRating.length > 0) {
      where.starRating = { in: starRating };
    } else if (typeof starRating === 'number') {
      where.starRating = starRating;
    }
  }

  // 设施筛选 — facilities 是 JSON 数组，使用 array_contains 逐个匹配
  if (facilities && facilities.length > 0) {
    where.AND = facilities.map((f: string) => ({
      facilities: { array_contains: f },
    }));
  }
  
  // 使用游标分页（优先）- 通过检查 cursor 参数来判断是否使用游标分页
  // cursor 为 undefined 表示使用传统分页，cursor 为 null 或 number 表示使用游标分页
  if (cursor !== undefined) {
    // 游标分页：使用 last item 的 id 作为下一个起点
    const cursorWhere = cursor !== null 
      ? { ...where, id: { lt: cursor } }  // 获取 id 小于游标的记录
      : where;  // 首次加载，不加 id 限制
    
    // 多取一条用于判断是否还有更多，避免 hotels.length === pageSize 误判
    const hotelsWithExtra = await prisma.hotel.findMany({
      where: cursorWhere,
      orderBy: { id: 'desc' },
      take: pageSize + 1,
    });

    const hasMore = hotelsWithExtra.length > pageSize;
    const hotels = hasMore ? hotelsWithExtra.slice(0, pageSize) : hotelsWithExtra;
    const nextCursor = hasMore ? hotels[hotels.length - 1].id : null;
    
    return {
      data: hotels.map(serializeHotel),
      nextCursor,
      hasMore,
    };
  }
  
  // 使用传统 offset 分页
  const [offsetHotels, offsetTotal] = await Promise.all([
    prisma.hotel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.hotel.count({ where }),
  ]);

  return {
    data: offsetHotels.map(serializeHotel),
    pagination: {
      page,
      pageSize,
      total: offsetTotal,
      totalPages: Math.ceil(offsetTotal / pageSize),
    },
  };
}

/**
 * 获取酒店详情（含房型）—— 使用 include 单次查询
 * 使用 'use cache' + cacheTag/cacheLife 替代 unstable_cache
 */
export async function getHotelById(id: number) {
  'use cache';
  cacheTag('hotels', `hotel-${id}`);
  cacheLife({ revalidate: 60 });

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      rooms: {
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!hotel) return null;

  return {
    ...serializeHotel(hotel),
    rooms: hotel.rooms.map(serializeRoom),
  };
}

/**
 * 创建酒店 + 房型
 */
export async function createHotel(merchantId: number, data: HotelFormData) {
  // 计算最低价
  const minPrice = data.rooms.length > 0
    ? Math.min(...data.rooms.map((r) => r.price))
    : 0;

  const hotel = await prisma.hotel.create({
    data: {
      merchantId,
      name: data.name,
      address: data.address,
      starRating: data.starRating,
      minPrice,
      openingTime: data.openingTime ? new Date(data.openingTime) : null,
      facilities: data.facilities || [],
      coverImage: data.coverImage || null,
      gallery: data.gallery || [],
      status: 0, // 新录入默认待审核
    },
  });

  // 批量创建房型
  if (data.rooms.length > 0) {
    await prisma.hotelRoom.createMany({
      data: data.rooms.map((room) => ({
        hotelId: hotel.id,
        roomName: room.roomName,
        bedInfo: room.bedInfo,
        capacity: room.capacity,
        hasBreakfast: room.hasBreakfast,
        price: room.price,
        stock: room.stock,
        cancelPolicy: room.cancelPolicy,
        imageUrl: room.imageUrl || null,
      })),
    });
  }

  updateTag('hotels');
  return serializeHotel(hotel);
}

/**
 * 更新酒店 + 房型（事务保证原子性）
 */
export async function updateHotel(hotelId: number, data: HotelFormData) {
  const minPrice = data.rooms.length > 0
    ? Math.min(...data.rooms.map((r) => r.price))
    : 0;

  const hotel = await prisma.$transaction(async (tx) => {
    const updatedHotel = await tx.hotel.update({
      where: { id: hotelId },
      data: {
        name: data.name,
        address: data.address,
        starRating: data.starRating,
        minPrice,
        openingTime: data.openingTime ? new Date(data.openingTime) : null,
        facilities: data.facilities || [],
        coverImage: data.coverImage || null,
        gallery: data.gallery || [],
        status: 0, // 修改后重新进入待审核
      },
    });

    // 先删除旧房型，再重建
    await tx.hotelRoom.deleteMany({ where: { hotelId } });

    if (data.rooms.length > 0) {
      await tx.hotelRoom.createMany({
        data: data.rooms.map((room) => ({
          hotelId,
          roomName: room.roomName,
          bedInfo: room.bedInfo,
          capacity: room.capacity,
          hasBreakfast: room.hasBreakfast,
          price: room.price,
          stock: room.stock,
          cancelPolicy: room.cancelPolicy,
          imageUrl: room.imageUrl || null,
        })),
      });
    }

    return updatedHotel;
  });

  updateTag('hotels');
  updateTag(`hotel-${hotelId}`);
  return serializeHotel(hotel);
}

/**
 * 删除酒店（关联房型通过 onDelete: Cascade 自动删除）
 */
export async function deleteHotel(hotelId: number) {
  await prisma.hotel.delete({ where: { id: hotelId } });
  updateTag('hotels');
  updateTag(`hotel-${hotelId}`);
  return true;
}

