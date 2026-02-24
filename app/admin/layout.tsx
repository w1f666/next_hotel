'use client';

import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
    DashboardOutlined,
    AuditOutlined,
    LogoutOutlined,
    AppstoreOutlined,
    PlusCircleOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: '系统概览',
            onClick: () => router.push('/admin/dashboard')
        },
        {
            key: '/admin/hotels',
            icon: <AuditOutlined />,
            label: '酒店审核与管理',
            onClick: () => router.push('/admin/hotels')
        },
        {
            key: '/admin/hotels/create',
            icon: <PlusCircleOutlined />,
            label: '录入新酒店',
            onClick: () => router.push('/admin/hotels/create')
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: () => router.push('/admin/auth')
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240} style={{ background: '#001529', boxShadow: '2px 0 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002140' }}>
                    <Title level={4} style={{ color: 'white', margin: 0, letterSpacing: '1px' }}>
                        <AppstoreOutlined style={{ marginRight: 8 }} />
                        易宿管理后台
                    </Title>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    style={{ borderRight: 0, paddingTop: 16 }}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1 }}></div>
                    <div style={{ color: '#666' }}>欢迎登入, 超级管理员</div>
                </Header>
                <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 280 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
