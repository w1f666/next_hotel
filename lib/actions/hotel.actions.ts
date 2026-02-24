/* 酒店增删改查 —— Server Actions (Prisma) */

import prisma from '@/lib/prisma';
import type { HotelFormData } from '@/types';

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
 * 获取所有酒店（管理员视角）
 */
export async function getAllHotels(params?: {
  page?: number;
  pageSize?: number;
  status?: number;
  keyword?: string;
}) {
  const { page = 1, pageSize = 10, status, keyword } = params || {};

  const where: any = {};
  if (status !== undefined && status !== null) {
    where.status = status;
  }
  if (keyword) {
    where.name = { contains: keyword };
  }

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.hotel.count({ where }),
  ]);

  return {
    data: hotels.map(serializeHotel),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
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

// ---- 序列化工具 ----

function serializeHotel(hotel: any) {
  return {
    ...hotel,
    minPrice: Number(hotel.minPrice),
    openingTime: hotel.openingTime ? hotel.openingTime.toISOString().split('T')[0] : null,
    facilities: Array.isArray(hotel.facilities) ? hotel.facilities : [],
    gallery: Array.isArray(hotel.gallery) ? hotel.gallery : [],
    createdAt: hotel.createdAt.toISOString(),
    updatedAt: hotel.updatedAt.toISOString(),
  };
}

function serializeRoom(room: any) {
  return {
    ...room,
    price: Number(room.price),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
