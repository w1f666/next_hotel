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
    
    // 新增筛选参数
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const starRating = searchParams.get('starRating');

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

    // 处理星级筛选
    let starRatingFilter: number | number[] | undefined;
    if (starRating) {
      const stars = starRating.split(',').map(Number).filter(n => !isNaN(n));
      if (stars.length === 1) {
        starRatingFilter = stars[0];
      } else if (stars.length > 1) {
        starRatingFilter = stars;
      }
    }

    // 否则返回分页列表
    const result = await getAllHotels({
      page,
      pageSize,
      status: status !== null && status !== '' ? Number(status) : undefined,
      keyword: keyword || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      starRating: starRatingFilter,
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
