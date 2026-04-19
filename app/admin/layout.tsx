import React, { Suspense } from 'react';
import AdminLayoutClient from './_components/AdminLayoutClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div>加载中...</div>
            </div>
        }>
            <AdminLayoutClient>{children}</AdminLayoutClient>
        </Suspense>
    );
}
