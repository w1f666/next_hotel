import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';

/**
 * PATCH /api/admin/hotels/:id/review — 审核酒店（通过/拒绝）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = req.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
    }

    const { id } = await params;
    const hotelId = Number(id);
    if (!hotelId || isNaN(hotelId)) {
      return NextResponse.json({ success: false, message: '酒店ID无效' }, { status: 400 });
    }

    const body = await req.json();
    const { action, reason } = body;

    if (action === 'approve') {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: { status: 1, rejectReason: null },
      });
      updateTag('hotels');
      updateTag(`hotel-${hotelId}`);
      revalidatePath('/hotels');
      revalidatePath('/hotels/list');
      revalidatePath(`/hotels/${hotelId}`);
      revalidatePath('/admin/workspace');
      revalidatePath('/admin/hotels');
      return NextResponse.json({ success: true, message: '审核通过' });
    }

    if (action === 'reject') {
      if (!reason?.trim()) {
        return NextResponse.json({ success: false, message: '拒绝原因不能为空' }, { status: 400 });
      }
      await prisma.hotel.update({
        where: { id: hotelId },
        data: { status: 2, rejectReason: reason.trim() },
      });
      updateTag('hotels');
      updateTag(`hotel-${hotelId}`);
      revalidatePath('/hotels');
      revalidatePath('/hotels/list');
      revalidatePath(`/hotels/${hotelId}`);
      revalidatePath('/admin/workspace');
      revalidatePath('/admin/hotels');
      return NextResponse.json({ success: true, message: '已拒绝' });
    }

    return NextResponse.json({ success: false, message: '非法操作' }, { status: 400 });
  } catch (error) {
    console.error('[PATCH /api/admin/hotels/:id/review]', error);
    return NextResponse.json({ success: false, message: '操作失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/hotels/:id/review — 管理员删除酒店
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = req.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
    }

    const { id } = await params;
    const hotelId = Number(id);
    if (!hotelId || isNaN(hotelId)) {
      return NextResponse.json({ success: false, message: '酒店ID无效' }, { status: 400 });
    }

    await prisma.hotel.delete({ where: { id: hotelId } });
    updateTag('hotels');
    updateTag(`hotel-${hotelId}`);
    revalidatePath('/hotels');
    revalidatePath('/hotels/list');
    revalidatePath(`/hotels/${hotelId}`);
    revalidatePath('/admin/workspace');
    revalidatePath('/admin/hotels');
    return NextResponse.json({ success: true, message: '酒店已删除' });
  } catch (error) {
    console.error('[DELETE /api/admin/hotels/:id/review]', error);
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
