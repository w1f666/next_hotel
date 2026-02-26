import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getHotelById, updateHotel, deleteHotel } from '@/lib/actions/hotel.actions';

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
  } catch (error: any) {
    console.error('[GET /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: error.message || '服务器内部错误' },
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
    const { id } = await params;
    const body = await req.json();

    if (!body.name || !body.address) {
      return NextResponse.json(
        { success: false, message: '酒店名称和地址为必填项' },
        { status: 400 }
      );
    }

    const hotel = await updateHotel(Number(id), body);
    
    // 清除移动端酒店列表页缓存，实现数据实时更新
    revalidatePath('/hotels/list');
    
    return NextResponse.json({
      success: true,
      message: '酒店信息已更新，等待重新审核',
      data: hotel,
    });
  } catch (error: any) {
    console.error('[PUT /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: error.message || '更新失败' },
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
    const { id } = await params;
    await deleteHotel(Number(id));
    
    // 清除移动端酒店列表页缓存，实现数据实时更新
    revalidatePath('/hotels/list');
    
    return NextResponse.json({ success: true, message: '酒店已删除' });
  } catch (error: any) {
    console.error('[DELETE /api/hotels/:id]', error);
    return NextResponse.json(
      { success: false, message: error.message || '删除失败' },
      { status: 500 }
    );
  }
}
