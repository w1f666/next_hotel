import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { cacheTag, cacheLife } from 'next/cache';
import { serializeHotel, serializeRoom } from '@/lib/serialize';

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

export async function getHotelsByMerchant(merchantId: number) {
  'use cache';
  cacheTag(`merchant-${merchantId}-hotels`, 'hotels');
  cacheLife({ revalidate: 60 });

  const hotels = await prisma.hotel.findMany({
    where: { merchantId },
    orderBy: { updatedAt: 'desc' },
  });

  return hotels.map(serializeHotel);
}

export async function getAdminHotels() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  return hotels.map(serializeHotel);
}

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
  const {
    page = 1,
    pageSize = 10,
    cursor,
    status,
    keyword,
    minPrice,
    maxPrice,
    starRating,
    facilities,
    city,
  } = params || {};

  const where: Prisma.HotelWhereInput = {};

  if (status !== undefined && status !== null) {
    where.status = status;
  }

  if (keyword) {
    where.name = { contains: keyword };
  }

  if (city && city !== 'all') {
    where.address = { contains: city };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.minPrice = {};
    if (minPrice !== undefined) {
      where.minPrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.minPrice.lte = maxPrice;
    }
  }

  if (starRating !== undefined) {
    if (Array.isArray(starRating) && starRating.length > 0) {
      where.starRating = { in: starRating };
    } else if (typeof starRating === 'number') {
      where.starRating = starRating;
    }
  }

  if (facilities && facilities.length > 0) {
    where.AND = facilities.map((facility: string) => ({
      facilities: { array_contains: facility },
    }));
  }

  // 不做 use cache：该接口承载搜索、筛选和游标分页，参数组合高基数，命中率低，写后失效面也更难控。
  if (cursor !== undefined) {
    const cursorWhere = cursor !== null
      ? { ...where, id: { lt: cursor } }
      : where;

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

  if (!hotel) {
    return null;
  }

  return {
    ...serializeHotel(hotel),
    rooms: hotel.rooms.map(serializeRoom),
  };
}
