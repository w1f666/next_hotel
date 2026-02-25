import React from 'react';
import { getAllHotels } from '@/lib/actions/hotel.actions';
import HotelTableClient from '@/components/admin/HotelTableClient';
import { Breadcrumb } from 'antd';

export default async function AdminHotelsPage() {
    // 获取所有状态的酒店以便审核管理
    const res = await getAllHotels({ pageSize: 100 });
    const hotels = res.data || [];

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { title: '首页' },
                    { title: '酒店管理' },
                    { title: '列表与审核' },
                ]}
            />

            <HotelTableClient initialData={hotels} />
        </div>
    );
}