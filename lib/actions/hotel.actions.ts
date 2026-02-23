'use server';

import prisma from '@/lib/prisma';
import { ActionResponse } from '@/types/api';
import type { Hotel } from '@prisma/client';

export async function getAdminHotels(): Promise<ActionResponse<{ hotels: Pick<Hotel, 'id' | 'name' | 'address' | 'starRating' | 'minPrice' | 'coverImage' | 'status'>[] }>> {
  try {
    const hotels = await prisma.hotel.findMany({
      where: {
        status: 1, // 已发布的酒店
      },
      select: {
        id: true,
        name: true,
        address: true,
        starRating: true,
        minPrice: true,
        coverImage: true,
        status: true
      },
    });
    return { success: true, message: '获取酒店列表成功', data: { hotels } };
  } catch (error) {
    return { success: false, message: '获取酒店列表失败' };
  }
}
