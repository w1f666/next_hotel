import { NextRequest, NextResponse } from 'next/server';
import { getHotelsByMerchant } from '@/lib/actions/hotel.queries';

/**
 * GET /api/merchant/hotels — 获取当前商户的酒店列表（需认证）
 *
 * 使用场景：admin/workspace 工作台页面，展示商户自己的酒店
 * 认证：middleware 验证 JWT，注入 x-user-id / x-user-role
 * 权限：仅 merchant 角色
 */
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const userId = Number(req.headers.get('x-user-id'));

    if (userRole !== 'merchant' || !userId) {
      return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 });
    }

    const hotels = await getHotelsByMerchant(userId);
    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    console.error('[GET /api/merchant/hotels]', error);
    return NextResponse.json({ success: false, message: '获取酒店列表失败' }, { status: 500 });
  }
}
