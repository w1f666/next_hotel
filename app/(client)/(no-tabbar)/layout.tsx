'use client';

import React from 'react';
import { Layout, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useParams, usePathname, useRouter } from 'next/navigation';

const { Header, Content } = Layout;

export default function NoTabbarLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const handleback = () => {
        if(router){
            router.back();
        }
        else{
            window.history.back();
        }
    }

    return (
        <Layout className="min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-auto">
            {!pathname.startsWith('/hotels/list') && (<button className="fixed top-5 left-5 z-50 
        flex items-center gap-1.5 
        px-4 py-2 
        rounded-lg border border-slate-200 
        bg-white/80 backdrop-blur-md 
        text-sm font-medium text-slate-700 
        shadow-sm 
        transition-all duration-200 ease-in-out"
        onClick={handleback}>
                <LeftOutlined/>
            </button>) }
            <Content>
                {children}
            </Content>
        </Layout>
    );
}
