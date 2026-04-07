'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Spin, Typography, App } from 'antd';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userRole, setUserRole] = useState<string>('');

    // 如果是 auth 页面，不检查登录状态
    const isAuthPage = pathname === '/admin/auth';

    // 检查登录状态
    useEffect(() => {
        // middleware 已在服务端拦截未登录用户，这里只做 UI 状态
        const role = localStorage.getItem('role');
        
        if (!role) {
            router.push('/admin/auth');
            return;
        }

        setIsAuthenticated(true);
        setUserRole(role);

        const currentPath = pathname;
        const targetPath = role === 'merchant' ? '/admin/workspace' : '/admin/hotels';
        
        if (!currentPath.startsWith(targetPath)) {
            router.push(targetPath);
        }
    }, [router, pathname]);

    // auth 页面直接渲染
    if (isAuthPage) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ background: '#f0f2f5' }}>
                    <App>
                        {children}
                    </App>
                </Content>
            </Layout>
        );
    }

    // 未认证时显示 loading && 防止页面闪烁
    if (!isAuthenticated) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    // 获取欢迎文案
    const getWelcomeText = () => {
        return userRole === 'admin' ? '超级管理员' : '商户';
    };

    // 退出登录
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // 即使请求失败也清除本地状态
        }
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('csrfToken');
        router.push('/admin/auth');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <App>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f0f0f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Title level={4} style={{ margin: 0, color: '#333' }}>
                        {userRole === 'admin' ? '审核管理' : '商户工作台'}
                    </Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ color: '#666' }}>欢迎登入, {getWelcomeText()}</span>
                        <a 
                            onClick={handleLogout}
                            style={{ cursor: 'pointer', color: '#ff4d4f' }}
                        >
                            退出登录
                        </a>
                    </div>
                </Header>
                <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
                    {children}
                </Content>
            </App>
        </Layout>
    );
}
