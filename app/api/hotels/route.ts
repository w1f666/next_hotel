import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllHotels, getHotelsByMerchant, getPublishedHotels, createHotel } from '@/lib/actions/hotel.actions';

/**
 * GET /api/hotels — 获取酒店列表
 * 查询参数: 
 *   - merchantId: 商户ID（返回该商户的酒店）
 *   - published: true/false（返回已发布的酒店，用于C端）
 *   - cursor: 游标分页（用于无限滚动）
 *   - page, pageSize, status, keyword: 传统分页和筛选参数
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const published = searchParams.get('published');
    const page = Number(searchParams.get('page') || 1);
    const pageSize = Number(searchParams.get('pageSize') || 10);
    
    // 处理游标参数：如果存在 cursor 参数（即使是空字符串），则使用游标分页
    const cursorParam = searchParams.get('cursor');
    let cursor: number | null | undefined = undefined;
    if (cursorParam !== null) {
      // cursor 参数存在，启用游标分页
      cursor = cursorParam === '' ? null : Number(cursorParam);
    }
    
    const status = searchParams.get('status');
    const keyword = searchParams.get('keyword') || '';
    
    // 新增筛选参数
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const starRating = searchParams.get('starRating');
    const facilitiesParam = searchParams.get('facilities');

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

    // 否则返回分页列表（支持游标分页和传统分页）
    // cursor: undefined → 传统分页, null → 游标首页, number → 游标翻页
    const result = await getAllHotels({
      page,
      pageSize,
      cursor,
      status: status !== null && status !== '' ? Number(status) : undefined,
      keyword: keyword || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      starRating: starRatingFilter,
      facilities: facilitiesParam ? facilitiesParam.split(',').filter(Boolean) : undefined,
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
    
    // 清除移动端酒店列表页缓存，实现数据实时更新
    revalidatePath('/hotels/list');
    
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
