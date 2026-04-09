import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllHotels, getPublishedHotels, createHotel } from '@/lib/actions/hotel.actions';

/**
 * GET /api/hotels — 公开接口，获取酒店列表
 *
 * 使用场景：
 * - C 端首页 (?published=true)：获取已发布酒店简要列表
 * - C 端列表页 (?status=1&cursor=&keyword=...)：游标分页 + 筛选
 *
 * 无需认证，middleware 不拦截 GET
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || 10), 1), 100);
    
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
    const paramcity = searchParams.get('city');
    const city = paramcity === '全部' ? 'all' : paramcity

    // 如果指定了 published=true，返回已发布的酒店（用于C端）
    if (published === 'true') {
      const hotels = await getPublishedHotels();
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
      city: city || undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[GET /api/hotels]', error);
    return NextResponse.json(
      { success: false, message: '获取酒店列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hotels — 商户创建新酒店（需认证）
 *
 * 使用场景：admin/workspace/publish 页面提交表单
 * 认证：middleware 验证 JWT + CSRF，注入 x-user-id / x-user-role
 * 权限：仅 merchant 角色
 */
export async function POST(req: NextRequest) {
  try {
    // 从 middleware 注入的请求头获取已验证的用户信息
    const userId = Number(req.headers.get('x-user-id'));
    const userRole = req.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 只有 merchant 可以创建酒店
    if (userRole !== 'merchant') {
      return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
    }

    const body = await req.json();
    const { ...formData } = body;

    if (!formData.name || !formData.address) {
      return NextResponse.json(
        { success: false, message: '酒店名称和地址为必填项' },
        { status: 400 }
      );
    }

    // merchantId 从 token 获取，不再信任客户端
    const hotel = await createHotel(userId, formData);

    revalidatePath('/hotels');
    revalidatePath('/hotels/list');
    revalidatePath('/admin/workspace');
    revalidatePath('/admin/hotels');

    return NextResponse.json(
      { success: true, message: '酒店信息已保存，等待审核', data: hotel },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/hotels]', error);
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    );
  }
}
