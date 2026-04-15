import { NextRequest, NextResponse } from 'next/server';
import { revalidateHotelCache, revalidateHotelPaths } from '@/lib/actions/hotel.revalidation';
import { deleteHotelRecord, reviewHotelRecord } from '@/lib/actions/hotel.write';

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
      const hotel = await reviewHotelRecord(hotelId, 'approve');
      revalidateHotelCache({ hotelId, merchantId: hotel.merchantId });
      revalidateHotelPaths(hotelId);
      return NextResponse.json({ success: true, message: '审核通过' });
    }

    if (action === 'reject') {
      if (!reason?.trim()) {
        return NextResponse.json({ success: false, message: '拒绝原因不能为空' }, { status: 400 });
      }
      const hotel = await reviewHotelRecord(hotelId, 'reject', reason.trim());
      revalidateHotelCache({ hotelId, merchantId: hotel.merchantId });
      revalidateHotelPaths(hotelId);
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

    const deletedHotel = await deleteHotelRecord(hotelId);
    revalidateHotelCache({ hotelId, merchantId: deletedHotel.merchantId });
    revalidateHotelPaths(hotelId);
    return NextResponse.json({ success: true, message: '酒店已删除' });
  } catch (error) {
    console.error('[DELETE /api/admin/hotels/:id/review]', error);
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
