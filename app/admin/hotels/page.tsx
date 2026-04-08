/*管理列表(table)*/

'use client';

// app/admin/hotels/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { getClientAuthHeaders } from '@/lib/client-auth';
import HotelTableClient from '@/app/admin/hotels/_components/HotelTableClient'; 

// 与 HotelTableClient 中的类型保持一致
type HotelTableRow = {
  id: number;
  name: string;
  address: string;
  starRating: number;
  minPrice: any;
  coverImage: string | null;
  status: number;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<HotelTableRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新数据
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hotels', {
        headers: getClientAuthHeaders(),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.error('获取酒店列表失败:', errJson?.message);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setHotels(json.data?.hotels || []);
      }
    } catch {
      setHotels([]);
    }
    setRefreshKey(prev => prev + 1);
  }, []);

  // 初始加载数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">酒店管理</h1>
      </div>
      
      <HotelTableClient 
        key={refreshKey}
        initialData={hotels} 
        onDeleted={refreshData}
        onUpdated={refreshData}
      />
    </div>
  );
}
