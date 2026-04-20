'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function BackButton() {
    const router = useRouter();
    const pathname = usePathname();

    // list 页面有自己的返回按钮，避免重复
    if (pathname.startsWith('/hotels/list')) return null;

    return (
        <button
            className="fixed top-5 left-5 z-50 
                flex items-center gap-1.5 
                px-4 py-2 
                rounded-lg border border-slate-200 
                bg-white/80 backdrop-blur-md 
                text-sm font-medium text-slate-700 
                shadow-sm 
                transition-all duration-200 ease-in-out"
            onClick={() => router.back()}
        >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
    );
}
