/*管理列表(table)*/

// app/admin/hotels/page.tsx
import React from 'react';
import { getAdminHotels } from '@/lib/actions/hotel.actions';
import HotelTableClient from '@/components/admin/HotelTableClient'; 

// 服务端组件：在服务器直接查数据库
export default async function AdminHotelsPage() {
  const res = await getAdminHotels();
  const hotels = res.data?.hotels || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">酒店管理</h1>
      </div>
      
      <HotelTableClient initialData={hotels} />
    </div>
  );
}