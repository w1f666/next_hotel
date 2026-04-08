import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeHotel } from '@/lib/serialize';

/**
 * GET /api/admin/hotels — 管理员获取所有酒店列表（用于审核管理）
 */
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 });
    }

    const hotels = await prisma.hotel.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { hotels: hotels.map(serializeHotel) },
    });
  } catch (error) {
    console.error('[GET /api/admin/hotels]', error);
    return NextResponse.json({ success: false, message: '获取酒店列表失败' }, { status: 500 });
  }
}
