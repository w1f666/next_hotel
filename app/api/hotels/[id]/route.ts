import { NextRequest, NextResponse } from 'next/server';
import { revalidateHotelCache, revalidateHotelPaths } from '@/lib/actions/hotel.revalidation';
import { getHotelById } from '@/lib/actions/hotel.queries';
import { deleteHotelRecord, getHotelMerchantOwnerId, updateHotelRecord } from '@/lib/actions/hotel.write';

/**
 * GET /api/hotels/:id — 公开接口，获取酒店详情（含房型）
 *
 * 使用场景：
 * - C 端详情页 /hotels/[id]：游客浏览酒店信息
 * - 管理端编辑页 /admin/workspace/[id]/edit：加载酒店数据供编辑
 *
 * 无需认证，所有人可访问
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
 * PUT /api/hotels/:id — 更新酒店信息（需认证）
 *
 * 使用场景：admin/workspace/[id]/edit 页面保存修改
 * 认证：middleware 验证 JWT + CSRF
 * 权限：merchant 仅能修改自己的酒店（IDOR 校验），admin 可改任意
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
      const merchantId = await getHotelMerchantOwnerId(hotelId);
      if (!merchantId || merchantId !== userId) {
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

    const hotel = await updateHotelRecord(hotelId, body);

    revalidateHotelCache({ hotelId, merchantId: hotel.merchantId });
    revalidateHotelPaths(hotelId);

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
 * DELETE /api/hotels/:id — 删除酒店（需认证）
 *
 * 使用场景：admin/workspace 页面和 admin/hotels 管理页面
 * 认证：middleware 验证 JWT + CSRF
 * 权限：merchant 仅能删除自己的酒店（IDOR 校验），admin 可删任意
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
      const merchantId = await getHotelMerchantOwnerId(hotelId);
      if (!merchantId || merchantId !== userId) {
        return NextResponse.json({ success: false, message: '无权操作该酒店' }, { status: 403 });
      }
    }

    const deletedHotel = await deleteHotelRecord(hotelId);

    revalidateHotelCache({ hotelId, merchantId: deletedHotel.merchantId });
    revalidateHotelPaths(hotelId);

    return NextResponse.json({ success: true, message: '酒店已删除' });
  } catch (error) {
    console.error('[DELETE /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    );
  }
}
