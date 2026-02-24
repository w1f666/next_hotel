import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ message: '所有字段都是必填的' }, { status: 400 });
    }

    // 2. 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ message: '该账号已被注册' }, { status: 409 });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 插入数据库
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({ message: '注册成功' }, { status: 201 });

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
