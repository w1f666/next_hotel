import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getHotelById, updateHotel, deleteHotel } from '@/lib/actions/hotel.actions';
import prisma from '@/lib/prisma';

/**
 * GET /api/hotels/:id — 获取酒店详情（含房型）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotel = await getHotelById(Number(id));

    if (!hotel) {
      return NextResponse.json(
        { success: false, message: '酒店不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: hotel });
  } catch (error) {
    console.error('[GET /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: '获取酒店信息失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hotels/:id — 更新酒店信息
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = Number(req.headers.get('x-user-id'));
    const userRole = req.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const hotelId = Number(id);

    // IDOR 校验：merchant 只能修改自己的酒店
    if (userRole === 'merchant') {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { merchantId: true } });
      if (!hotel || hotel.merchantId !== userId) {
        return NextResponse.json({ success: false, message: '无权操作该酒店' }, { status: 403 });
      }
    }

    const body = await req.json();

    if (!body.name || !body.address) {
      return NextResponse.json(
        { success: false, message: '酒店名称和地址为必填项' },
        { status: 400 }
      );
    }

    const hotel = await updateHotel(hotelId, body);

    revalidatePath('/hotels/list');

    return NextResponse.json({
      success: true,
      message: '酒店信息已更新，等待重新审核',
      data: hotel,
    });
  } catch (error) {
    console.error('[PUT /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hotels/:id — 删除酒店
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = Number(req.headers.get('x-user-id'));
    const userRole = req.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const hotelId = Number(id);

    // IDOR 校验：merchant 只能删除自己的酒店，admin 可以删除任意酒店
    if (userRole === 'merchant') {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { merchantId: true } });
      if (!hotel || hotel.merchantId !== userId) {
        return NextResponse.json({ success: false, message: '无权操作该酒店' }, { status: 403 });
      }
    }

    await deleteHotel(hotelId);

    revalidatePath('/hotels/list');

    return NextResponse.json({ success: true, message: '酒店已删除' });
  } catch (error) {
    console.error('[DELETE /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    );
  }
}
