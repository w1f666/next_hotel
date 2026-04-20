'use client';

import { useRouter, usePathname } from 'next/navigation';

const tabItems = [
    { key: '/hotels', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>, label: '首页' },
    { key: '/favorites', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>, label: '收藏' },
    { key: '/orders', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>, label: '订单' },
    { key: '/mine', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, label: '我的' },
];

export default function TabbarNav() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-0 h-16 flex items-center justify-around z-50">
            {tabItems.map((item) => (
                <div
                    key={item.key}
                    onClick={() => router.push(item.key)}
                    className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${pathname.startsWith(item.key) ? 'text-blue-600' : 'text-gray-400'
                        }`}
                >
                    <div className="text-xl">{item.icon}</div>
                    <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </div>
            ))}
        </footer>
    );
}
