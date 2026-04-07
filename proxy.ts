import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET || '');
}

interface JwtPayload {
    userId: number;
    username: string;
    role: string;
}

async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * 移动端设备用户代理关键词
 */
const MOBILE_USER_AGENTS = [
    'Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry',
    'IEMobile', 'Opera Mini', 'Mobile', 'mobile',
    'huawei', 'xiaomi', 'oppo', 'vivo', 'samsung', 'honor',
];

function isMobileRequest(userAgent: string): boolean {
    const lowerUA = userAgent.toLowerCase();
    return MOBILE_USER_AGENTS.some((m) => lowerUA.includes(m.toLowerCase()));
}

/** 需要认证的 API 路由（写操作） */
const PROTECTED_API_PATTERNS = [
    { path: '/api/hotels', methods: ['POST'] },
    { path: '/api/hotels/', methods: ['PUT', 'DELETE'] }, // /api/hotels/:id
    { path: '/api/upload', methods: ['POST', 'PUT'] },
];

/** 需要认证的页面路由 */
const PROTECTED_PAGE_PREFIX = '/admin';
const AUTH_PAGE = '/admin/auth';

/** 写操作需要 CSRF 校验的方法 */
const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // ── 1. 根路径设备检测重定向 ──
    if (pathname === '/') {
        const userAgent = request.headers.get('user-agent') || '';
        const isMobile = isMobileRequest(userAgent);
        const target = isMobile ? '/hotels' : '/admin';
        return addSecurityHeaders(NextResponse.redirect(new URL(target, request.url)));
    }

    // ── 2. 受保护的 API 路由鉴权 ──
    const isProtectedApi = PROTECTED_API_PATTERNS.some(({ path, methods }) => {
        const matchPath = pathname === path || pathname.startsWith(path);
        return matchPath && methods.includes(method);
    });

    if (isProtectedApi) {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return addSecurityHeaders(
                NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
            );
        }
        const payload = await verifyTokenEdge(token);
        if (!payload) {
            return addSecurityHeaders(
                NextResponse.json({ success: false, message: '登录已过期' }, { status: 401 })
            );
        }

        // CSRF 校验：对比 cookie csrf_token 与请求头 X-CSRF-Token
        if (CSRF_METHODS.includes(method)) {
            const cookieCsrf = request.cookies.get('csrf_token')?.value;
            const headerCsrf = request.headers.get('x-csrf-token');
            if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
                return addSecurityHeaders(
                    NextResponse.json({ success: false, message: 'CSRF 校验失败' }, { status: 403 })
                );
            }
        }

        // 将用户信息注入请求头，供下游 Route Handler 使用
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', String(payload.userId));
        requestHeaders.set('x-user-role', payload.role);
        requestHeaders.set('x-username', payload.username);
        const response = NextResponse.next({
            request: { headers: requestHeaders },
        });
        return addSecurityHeaders(response);
    }

    // ── 3. Admin 页面鉴权（排除登录页） ──
    if (pathname.startsWith(PROTECTED_PAGE_PREFIX) && pathname !== AUTH_PAGE) {
        const token = request.cookies.get('token')?.value;
        if (!token || !(await verifyTokenEdge(token))) {
            return addSecurityHeaders(NextResponse.redirect(new URL(AUTH_PAGE, request.url)));
        }
    }

    // ── 4. 其他路由直接放行 ──
    return addSecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: [
        '/',
        '/admin/:path*',
        '/api/hotels/:path*',
        '/api/upload/:path*',
    ],
};
