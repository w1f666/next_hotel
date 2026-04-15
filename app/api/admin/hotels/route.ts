import { NextRequest, NextResponse } from 'next/server';
import { getAdminHotels } from '@/lib/actions/hotel.queries';

/**
 * GET /api/admin/hotels — 管理员获取所有酒店列表（需认证）
 *
 * 使用场景：admin/hotels 管理页面，管理员审核、管理所有酒店
 * 认证：middleware 验证 JWT，注入 x-user-role
 * 权限：仅 admin 角色
 */
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: await getAdminHotels(),
    });
  } catch (error) {
    console.error('[GET /api/admin/hotels]', error);
    return NextResponse.json({ success: false, message: '获取酒店列表失败' }, { status: 500 });
  }
}
