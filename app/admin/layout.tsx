'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Spin, Typography } from 'antd';
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
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token) {
            router.push('/admin/auth');
            return;
        }

        setIsAuthenticated(true);
        setUserRole(role || 'merchant');

        // 只在当前页面不是目标页面时才跳转，避免无限循环
        const currentPath = pathname;
        const targetPath = role === 'merchant' ? '/admin/workspace' : '/admin/hotels';
        
        // 如果当前不在目标页面，则跳转
        if (currentPath !== targetPath) {
            router.push(targetPath);
        }
    }, [router, pathname]);

    // auth 页面直接渲染
    if (isAuthPage) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ background: '#f0f2f5' }}>
                    {children}
                </Content>
            </Layout>
        );
    }

    // 未认证时显示 loading
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
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/admin/auth');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
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
        </Layout>
    );
}
