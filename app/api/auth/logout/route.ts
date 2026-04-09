import { NextResponse } from 'next/server';
import { createClearTokenCookie, createClearCsrfCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout — 用户登出（公开接口）
 *
 * 使用场景：admin 布局中的登出按钮
 * 效果：清除 JWT cookie 和 CSRF cookie
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: '已退出登录' });
  response.headers.append('Set-Cookie', createClearTokenCookie());
  response.headers.append('Set-Cookie', createClearCsrfCookie());
  return response;
}
