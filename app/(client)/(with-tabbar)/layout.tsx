'use client';

import React from 'react';
import { App, Layout } from 'antd';
import { HomeOutlined, ShoppingOutlined, UserOutlined, HeartOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Content, Footer } = Layout;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const tabItems = [
        { key: '/hotels', icon: <HomeOutlined />, label: '首页' },
        { key: '/favorites', icon: <HeartOutlined />, label: '收藏' },
        { key: '/orders', icon: <ShoppingOutlined />, label: '订单' },
        { key: '/mine', icon: <UserOutlined />, label: '我的' },
    ];

    return (
        <App>
        <Layout className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative pb-16">
            <Content>
                {children}
            </Content>

            {/* 底部 Tabbar */}
            <Footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-0 h-16 flex items-center justify-around z-50">
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
            </Footer>

            <style jsx global>{`
        .ant-layout-footer {
          padding: 0 !important;
        }
      `}</style>
        </Layout>
        </App>
    );
}
