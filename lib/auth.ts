import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'merchant' | 'admin';
}

const COOKIE_NAME = 'token';
const CSRF_COOKIE_NAME = 'csrf_token';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * 签发 JWT Token
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

/**
 * 验证 JWT Token，返回 payload 或 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 从 NextRequest 的 cookie 中解析并验证 JWT（用于 API Route Handler / middleware）
 */
export function getAuthFromRequest(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 从 Server Action 的 cookie 中解析并验证 JWT
 */
export async function getAuthFromCookies(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 生成 CSRF Token（简单随机字符串）
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 校验 CSRF：对比 cookie 中的 csrf_token 与请求头中的 X-CSRF-Token
 */
export function verifyCsrf(req: NextRequest): boolean {
  const cookieCsrf = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerCsrf = req.headers.get('x-csrf-token');
  if (!cookieCsrf || !headerCsrf) return false;
  return cookieCsrf === headerCsrf;
}

/**
 * 创建 Set-Cookie header 值
 */
export function createTokenCookie(token: string): string {
  const maxAge = 60 * 60 * 24; // 24h
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function createCsrfCookie(csrfToken: string): string {
  const maxAge = 60 * 60 * 24;
  // CSRF cookie 不能是 HttpOnly，前端需要读取它
  return `${CSRF_COOKIE_NAME}=${csrfToken}; HttpOnly;SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function createClearTokenCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE_NAME}=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}

export function createClearCsrfCookie(): string {
  return `${CSRF_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

/**
 * 验证图片 URL 是否安全（防 CSS 注入）
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^\/(uploads|hotel_img)\/[a-zA-Z0-9._-]+$/.test(url);
}

/**
 * 简易速率限制器（内存级，单进程）
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxAttempts = 5, windowMs = 5 * 60 * 1000): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * 密码强度校验
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return '密码至少8位';
  if (password.length > 64) return '密码最多64位';
  if (!/[A-Za-z]/.test(password)) return '密码需包含字母';
  if (!/[0-9]/.test(password)) return '密码需包含数字';
  return null;
}

/**
 * 验证文件魔术字节
 */
const MAGIC_NUMBERS: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

export function validateMagicBytes(buffer: Buffer, mime: string): boolean {
  const expected = MAGIC_NUMBERS[mime];
  if (!expected) return false;
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}
