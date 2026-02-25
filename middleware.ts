import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 移动端设备用户代理关键词
 */
const MOBILE_USER_AGENTS = [
    'Android',
    'webOS',
    'iPhone',
    'iPad',
    'iPod',
    'BlackBerry',
    'IEMobile',
    'Opera Mini',
    'Mobile',
    'mobile',
    'huawei',
    'xiaomi',
    'oppo',
    'vivo',
    'samsung',
    'honor',
];

/**
 * 判断是否为移动端请求
 */
function isMobileRequest(userAgent: string): boolean {
    const lowerUA = userAgent.toLowerCase();
    return MOBILE_USER_AGENTS.some((mobile) => lowerUA.includes(mobile.toLowerCase()));
}

export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    const { pathname } = request.nextUrl;

    // 只对根路径 '/' 进行设备检测重定向
    // 其他路径不处理
    if (pathname !== '/') {
        return NextResponse.next();
    }

    // 检查是否为移动端
    const isMobile = isMobileRequest(userAgent);

    // 桌面端用户访问根路径，重定向到管理后台
    if (!isMobile) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // 移动端用户访问根路径，重定向到酒店页面
    if (isMobile) {
        return NextResponse.redirect(new URL('/hotels', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * 只匹配根路径
         */
        '/',
    ],
};
