import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 你的 JWT 密钥，生产环境请务必放在 .env 中
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-it';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ message: '账号或密码不能为空' }, { status: 400 });
    }

    // 1. 根据用户名查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }

    // 2. 比对密码 (数据库里的哈希值 vs 用户输入的明文)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }

    // 3. 生成 JWT Token
    // payload 里面只存非敏感信息，比如 id, username, role
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' } // token 24小时后过期
    );

    // 4. 返回结果
    return NextResponse.json({
      message: '登录成功',
      token,
      role: user.role,
      username: user.username
    });

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}

