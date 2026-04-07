import { NextResponse } from 'next/server';
import { createClearTokenCookie, createClearCsrfCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: '已退出登录' });
  response.headers.append('Set-Cookie', createClearTokenCookie());
  response.headers.append('Set-Cookie', createClearCsrfCookie());
  return response;
}
