import React from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from 'antd-mobile';
import { MoreOutline, StarOutline } from 'antd-mobile-icons';

// 简单封装，复用性更高
export default function HotelNavBar({ title }: { title: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const rightContent = (
    <div style={{ fontSize: 24, display: 'flex', gap: '12px' }}>
      <StarOutline />
      <MoreOutline />
    </div>
  );

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <NavBar
        back="返回"
        onBack={handleBack}
        right={rightContent}
        style={{ '--height': '48px' }}
      >
        <span className="text-sm font-bold truncate block max-w-[180px]">
            {title}
        </span>
      </NavBar>
    </div>
  );
}