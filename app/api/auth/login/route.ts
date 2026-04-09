import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  signToken,
  createTokenCookie,
  createCsrfCookie,
  generateCsrfToken,
  checkRateLimit,
} from '@/lib/auth';

/**
 * POST /api/auth/login — 用户登录（公开接口）
 *
 * 使用场景：admin/auth 登录页面
 * 返回：设置 HttpOnly JWT cookie + csrf cookie，响应体含 role/userId/csrfToken
 * 安全：速率限制（按 IP），密码 bcrypt 比对
 */
export async function POST(request: Request) {
  try {
    // 速率限制
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: '登录尝试过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: '账号或密码不能为空' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: '账号或密码错误' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: '账号或密码错误' }, { status: 401 });
    }

    // 签发 JWT
    const token = signToken({ userId: user.id, username: user.username, role: user.role as 'merchant' | 'admin' });
    const csrfToken = generateCsrfToken();

    // 通过 Set-Cookie 写入 HttpOnly cookie（token）+ 可读 cookie（csrf）
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        role: user.role,
        username: user.username,
        userId: user.id,
        csrfToken, // 前端需要存储并在写操作中带上 X-CSRF-Token header
      },
    });

    response.headers.append('Set-Cookie', createTokenCookie(token));
    response.headers.append('Set-Cookie', createCsrfCookie(csrfToken));

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}

