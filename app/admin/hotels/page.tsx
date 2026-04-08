/*管理列表(table)*/

'use client';

// app/admin/hotels/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/fetch-api';
import HotelTableClient from '@/app/admin/hotels/_components/HotelTableClient'; 
import type { HotelTableRow } from '@/types';

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<HotelTableRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新数据
  const refreshData = useCallback(async () => {
    const result = await fetchApi('/api/admin/hotels');
    if (result.ok) {
      setHotels(result.data?.hotels || []);
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
