import { NextRequest, NextResponse } from 'next/server';
import { getAllHotels, getHotelsByMerchant, getPublishedHotels, createHotel } from '@/lib/actions/hotel.actions';

/**
 * GET /api/hotels — 获取酒店列表
 * 查询参数: 
 *   - merchantId: 商户ID（返回该商户的酒店）
 *   - published: true/false（返回已发布的酒店，用于C端）
 *   - page, pageSize, status, keyword: 分页和筛选参数
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const published = searchParams.get('published');
    const page = Number(searchParams.get('page') || 1);
    const pageSize = Number(searchParams.get('pageSize') || 10);
    const status = searchParams.get('status');
    const keyword = searchParams.get('keyword') || '';

    // 如果指定了 published=true，返回已发布的酒店（用于C端）
    if (published === 'true') {
      const hotels = await getPublishedHotels();
      return NextResponse.json({ success: true, data: hotels });
    }

    // 如果指定了 merchantId，返回该商户的酒店
    if (merchantId) {
      const hotels = await getHotelsByMerchant(Number(merchantId));
      return NextResponse.json({ success: true, data: hotels });
    }

    // 否则返回分页列表
    const result = await getAllHotels({
      page,
      pageSize,
      status: status !== null && status !== '' ? Number(status) : undefined,
      keyword: keyword || undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[GET /api/hotels]', error);
    return NextResponse.json(
      { success: false, message: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hotels — 创建新酒店
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, ...formData } = body;

    if (!merchantId) {
      return NextResponse.json(
        { success: false, message: '缺少商户ID' },
        { status: 400 }
      );
    }

    if (!formData.name || !formData.address) {
      return NextResponse.json(
        { success: false, message: '酒店名称和地址为必填项' },
        { status: 400 }
      );
    }

    const hotel = await createHotel(Number(merchantId), formData);
    return NextResponse.json(
      { success: true, message: '酒店信息已保存，等待审核', data: hotel },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/hotels]', error);
    return NextResponse.json(
      { success: false, message: error.message || '创建失败' },
      { status: 500 }
    );
  }
}
