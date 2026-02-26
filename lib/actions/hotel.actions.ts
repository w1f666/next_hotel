'use server';
/* 酒店增删改查 —— Server Actions (Prisma) */

import prisma from '@/lib/prisma';
import { ActionResponse } from '@/types/api';
import type { Hotel } from '@prisma/client';
import type { HotelFormData } from '@/types';

/**
 * 获取管理员酒店列表（所有酒店，用于审核管理）
 */
export async function getAdminHotels(): Promise<ActionResponse<{ hotels: any[] }>> {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return { success: true, message: '获取酒店列表成功', data: { hotels: hotels.map(serializeHotel) } };
  } catch (error) {
    return { success: false, message: '获取酒店列表失败' };
  }
}

/**
 * 获取C端酒店列表（已发布的酒店，用于客户端展示）
 */
export async function getPublishedHotels() {
  const hotels = await prisma.hotel.findMany({
    where: {
      status: 1, // 只获取已发布的酒店
    },
    orderBy: {
      updatedAt: 'desc',
    },
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
}) {
  const { page = 1, pageSize = 10, cursor, status, keyword, minPrice, maxPrice, starRating, facilities } = params || {};

  const where: any = {};
  if (status !== undefined && status !== null) {
    where.status = status;
  }
  if (keyword) {
    where.name = { contains: keyword };
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

  let hotels;
  let total: number;
  
  // 使用游标分页（优先）- 通过检查 cursor 参数来判断是否使用游标分页
  // cursor 为 undefined 表示使用传统分页，cursor 为 null 或 number 表示使用游标分页
  if (cursor !== undefined) {
    // 游标分页：使用 last item 的 id 作为下一个起点
    const cursorWhere = cursor !== null 
      ? { ...where, id: { lt: cursor } }  // 获取 id 小于游标的记录
      : where;  // 首次加载，不加 id 限制
    
    [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where: cursorWhere,
        orderBy: { id: 'desc' },
        take: pageSize,
      }),
      prisma.hotel.count({ where }),
    ]);
    
    const nextCursor = hotels.length === pageSize ? hotels[hotels.length - 1].id : null;
    const hasMore = hotels.length === pageSize;
    
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
 * 获取酒店详情（含房型）
 */
export async function getHotelById(id: number) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
  });

  if (!hotel) return null;

  const rooms = await prisma.hotelRoom.findMany({
    where: { hotelId: id },
    orderBy: { price: 'asc' },
  });

  return {
    ...serializeHotel(hotel),
    rooms: rooms.map(serializeRoom),
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

  return serializeHotel(hotel);
}

/**
 * 更新酒店 + 房型
 */
export async function updateHotel(hotelId: number, data: HotelFormData) {
  const minPrice = data.rooms.length > 0
    ? Math.min(...data.rooms.map((r) => r.price))
    : 0;

  const hotel = await prisma.hotel.update({
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
  await prisma.hotelRoom.deleteMany({ where: { hotelId } });

  if (data.rooms.length > 0) {
    await prisma.hotelRoom.createMany({
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

  return serializeHotel(hotel);
}

/**
 * 删除酒店及其房型
 */
export async function deleteHotel(hotelId: number) {
  await prisma.hotelRoom.deleteMany({ where: { hotelId } });
  await prisma.hotel.delete({ where: { id: hotelId } });
  return true;
}

/**
 * 审核酒店 - 通过
 */
export async function approveHotel(hotelId: number): Promise<ActionResponse> {
  try {
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { status: 1 },
    });
    return { success: true, message: '审核通过' };
  } catch (error) {
    return { success: false, message: '操作失败' };
  }
}

/**
 * 审核酒店 - 拒绝
 */
export async function rejectHotel(hotelId: number, reason: string): Promise<ActionResponse> {
  try {
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { 
        status: 2,
        rejectReason: reason,
      },
    });
    return { success: true, message: '已拒绝' };
  } catch (error) {
    return { success: false, message: '操作失败' };
  }
}

// ---- 序列化工具 ----

function serializeHotel(hotel: any) {
  return {
    ...hotel,
    minPrice: Number(hotel.minPrice) || 0,
    openingTime: hotel.openingTime ? hotel.openingTime.toISOString().split('T')[0] : null,
    facilities: Array.isArray(hotel.facilities) ? hotel.facilities : [],
    gallery: Array.isArray(hotel.gallery) ? hotel.gallery : [],
    createdAt: hotel.createdAt?.toISOString ? hotel.createdAt.toISOString() : hotel.createdAt,
    updatedAt: hotel.updatedAt?.toISOString ? hotel.updatedAt.toISOString() : hotel.updatedAt,
  };
}

function serializeRoom(room: any) {
  return {
    ...room,
    price: Number(room.price),
    imageUrl: room.imageUrl || null,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
