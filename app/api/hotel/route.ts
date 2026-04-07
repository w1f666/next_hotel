import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export interface Room {
  id: string;
  name: string;
  tags: string[];
  price: number;
  currency: string;
  imageUrl: string;
  size: string;
  bed: string;
}

export interface HotelDetailResponse {
  id: string;
  name: string;
  rating: number;
  address: string;
  tags: string[];
  images: string[];
  openYear: string;
  rooms: Room[];
}

/**
 * 获取酒店详情（供客户端组件直接调用）
 */
export const getHotelDetail = async (id: string): Promise<HotelDetailResponse> => {
  if (!id) {
    throw new Error("Invalid ID");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: Number(id) },
  });

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const rooms = await prisma.hotelRoom.findMany({
    where: { hotelId: Number(id) },
    orderBy: { price: 'asc' },
  });

  // 序列化数据以匹配前端期望的格式
  const facilities = (hotel.facilities as string[]) || [];
  const gallery = (hotel.gallery as string[]) || [];
  const coverImage = hotel.coverImage || '';

  return {
    id: String(hotel.id),
    name: hotel.name,
    rating: hotel.starRating * 0.96, // 根据星级生成模拟评分
    address: hotel.address,
    tags: facilities,
    images: gallery.length > 0 ? gallery : [coverImage].filter(Boolean),
    openYear: hotel.openingTime ? hotel.openingTime.getFullYear().toString() : '',
    rooms: rooms.map((room) => ({
      id: String(room.id),
      name: room.roomName,
      tags: [
        ...(room.hasBreakfast ? ['含早'] : []),
        room.cancelPolicy || '',
      ].filter((tag): tag is string => !!tag),
      price: Number(room.price),
      currency: '¥',
      size: '',
      bed: room.bedInfo || '',
      imageUrl: room.imageUrl || '',
    })),
  };
};

/**
 * GET /api/hotel?id=xxx — 获取酒店详情（真实数据库）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: '缺少酒店ID' }, { status: 400 });
  }

  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(id) },
    });

    if (!hotel) {
      return NextResponse.json({ message: '酒店不存在' }, { status: 404 });
    }

    const rooms = await prisma.hotelRoom.findMany({
      where: { hotelId: Number(id) },
      orderBy: { price: 'asc' },
    });

    // 序列化数据
    const facilities = (hotel.facilities as string[]) || [];
    const gallery = (hotel.gallery as string[]) || [];
    const coverImage = hotel.coverImage || '';

    const response: HotelDetailResponse = {
      id: String(hotel.id),
      name: hotel.name,
      rating: hotel.starRating * 0.96,
      address: hotel.address,
      tags: facilities,
      images: gallery.length > 0 ? gallery : [coverImage].filter(Boolean),
      openYear: hotel.openingTime ? hotel.openingTime.getFullYear().toString() : '',
      rooms: rooms.map((room) => ({
        id: String(room.id),
        name: room.roomName,
        tags: [
          ...(room.hasBreakfast ? ['含早'] : []),
          room.cancelPolicy || '',
        ].filter((tag): tag is string => !!tag),
        price: Number(room.price),
        currency: '¥',
        size: '',
        bed: room.bedInfo || '',
        imageUrl: room.imageUrl || '',
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('获取酒店详情失败:', error);
    return NextResponse.json({ message: '获取酒店信息失败' }, { status: 500 });
  }
}
