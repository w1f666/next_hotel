import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  //  解析前端传来的 JSON
  const body = await request.json();
  const { username, password } = body;

  //  简单校验（还要查数据库）
  if (!username || !password) {
    return NextResponse.json(
      { message: '账号或密码不能为空' },
      { status: 400 }
    );
  }

  //  模拟数据库校验
  if (username === 'admin' && password === 'Admin@123') {
    return NextResponse.json({
      message: '登录成功',
      role: 'admin',
      token: 'mock-jwt-token-123'
    });
  }

  //  登录失败
  return NextResponse.json(
    { message: '账号或密码错误' },
    { status: 401 }
  );
}
