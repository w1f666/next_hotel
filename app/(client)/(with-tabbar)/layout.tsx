import React from 'react';
import TabbarNav from './_components/TabbarNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative pb-16">
            <main>
                {children}
            </main>
            <TabbarNav />
        </div>
    );
}
