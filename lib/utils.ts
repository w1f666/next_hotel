/*通用工具函数 如日期格式化*/

/**
 * 判断是否为移动端设备
 * 检测用户代理字符串中是否包含移动设备特征
 */
export function isMobileDevice(userAgent?: string): boolean {
    if (typeof window === 'undefined') {
        // 服务端渲染时检查 User-Agent header
        if (userAgent) {
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|iphone|ipad|ipod|huawei|xiaomi|oppo|vivo|samsung|honor/i;
            return mobileRegex.test(userAgent);
        }
        return false;
    }
    
    // 客户端检测
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|huawei|xiaomi|oppo|vivo|samsung|honor/i;
    
    // 也可以通过屏幕宽度判断
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    
    return mobileRegex.test(ua) || isSmallScreen;
}

/**
 * 获取设备类型
 */
export function getDeviceType(userAgent?: string): 'mobile' | 'desktop' {
    return isMobileDevice(userAgent) ? 'mobile' : 'desktop';
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day);
}
