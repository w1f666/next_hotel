import { NextRequest, NextResponse } from 'next/server';
import { revalidateHotelCache, revalidateHotelPaths } from '@/lib/actions/hotel.revalidation';
import { getAllHotels, getPublishedHotels } from '@/lib/actions/hotel.queries';
import { createHotelRecord } from '@/lib/actions/hotel.write';

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

    // ========== 快捷路径：首页获取已发布酒店 ==========
    if (searchParams.get('published') === 'true') {
      const hotels = await getPublishedHotels();
      return NextResponse.json({ success: true, data: hotels });
    }

    // ========== 通用分页参数 ==========
    const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || 10), 1), 100);

    // ========== 游标 / 传统分页判定 ==========
    // cursor 参数存在（即使空串）→ 游标分页；不存在 → 传统 offset 分页
    const cursorParam = searchParams.get('cursor');
    let cursor: number | null | undefined;
    if (cursorParam !== null) {
      cursor = cursorParam === '' ? null : Number(cursorParam);
    }
    // 传统分页才需要 page
    const page = cursor === undefined ? Math.max(Number(searchParams.get('page') || 1), 1) : 1;

    // ========== 筛选条件 ==========
    const statusParam = searchParams.get('status');
    const keyword = searchParams.get('keyword') || undefined;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const starRating = searchParams.get('starRating');
    const facilitiesParam = searchParams.get('facilities');
    const cityParam = searchParams.get('city');

    // 星级：支持逗号分隔多选
    let starRatingFilter: number | number[] | undefined;
    if (starRating) {
      const stars = starRating.split(',').map(Number).filter(n => !isNaN(n));
      starRatingFilter = stars.length === 1 ? stars[0] : stars.length > 1 ? stars : undefined;
    }

    const result = await getAllHotels({
      page,
      pageSize,
      cursor,
      status: statusParam ? Number(statusParam) : undefined,
      keyword,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      starRating: starRatingFilter,
      facilities: facilitiesParam ? facilitiesParam.split(',').filter(Boolean) : undefined,
      city: cityParam === '全部' ? undefined : (cityParam || undefined),
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
    const hotel = await createHotelRecord(userId, formData);

    revalidateHotelCache({ hotelId: hotel.id, merchantId: userId });
    revalidateHotelPaths(hotel.id);

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
