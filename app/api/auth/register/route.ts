import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password, role } = body;

  if (!username || !password || !role) {
    return NextResponse.json(
      { message: '参数不完整' },
      { status: 400 }
    );
  }

  // 模拟“用户名已存在”
  if (username === 'admin') {
    return NextResponse.json(
      { message: '账号已存在' },
      { status: 409 }
    );
  }

  // 模拟注册成功
  return NextResponse.json({
    message: '注册成功',
    user: {
      username,
      role
    }
  });
}
