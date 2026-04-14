import React from 'react';
import BackButton from './_components/BackButton';

export default function NoTabbarLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-auto">
            <BackButton />
            <main>
                {children}
            </main>
        </div>
    );
}
