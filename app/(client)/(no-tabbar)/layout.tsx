'use client';

import React from 'react';
import { Layout, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;

export default function NoTabbarLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    return (
        <Layout className="min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden">
            <Header className="bg-white border-b border-gray-50 flex items-center px-4 h-14 sticky top-0 z-50">
                <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={() => router.back()}
                    className="flex items-center justify-center"
                />
                <div className="flex-grow text-center font-bold text-gray-800 pr-8">
                    详情信息
                </div>
            </Header>
            <Content>
                {children}
            </Content>
            <style jsx global>{`
        .ant-layout-header {
          padding: 0 16px !important;
          line-height: normal !important;
        }
      `}</style>
        </Layout>
    );
}
