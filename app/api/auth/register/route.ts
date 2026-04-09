import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/auth';

/**
 * POST /api/auth/register — 商户注册（公开接口）
 *
 * 使用场景：admin/auth 注册页面
 * 权限：仅允许注册 merchant 角色，admin 需通过其他渠道创建
 * 安全：服务端密码强度校验，强制 role=merchant
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: '所有字段都是必填的' }, { status: 400 });
    }

    // 只允许注册 merchant 角色，admin 需通过其他渠道创建
    if (role && role !== 'merchant') {
      return NextResponse.json({ success: false, message: '无法注册该角色' }, { status: 403 });
    }

    // 用户名长度校验
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ success: false, message: '用户名长度为3-20位' }, { status: 400 });
    }

    // 密码强度服务端校验
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: '该账号已被注册' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'merchant', // 强制 merchant
      },
    });

    return NextResponse.json({ success: true, message: '注册成功' }, { status: 201 });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}
