'use client';
import React from 'react';
import { Tag, Toast } from 'antd-mobile';
import { EnvironmentOutline, StarFill } from 'antd-mobile-icons';
import { HotelDetailResponse } from '@/app/api/hotel/route';

export default function HotelInfo({ hotel }: { hotel: HotelDetailResponse }) {
  
  const openMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 题目说明地图可忽略，此处仅做交互演示
    Toast.show('地图模块暂未开放');
  };

  return (
    <div className="bg-white rounded-t-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {hotel.name}
        </h1>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        <div className="bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
             <StarFill className="text-blue-500 text-xs" />
             <span className="text-blue-600 font-bold text-sm">{hotel.rating}分</span>
        </div>
        <span className="text-xs text-gray-500">
            {hotel.openYear}年开业
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
          {hotel.tags.map((tag, i) => (
              <Tag key={i} color="default" style={{ '--background-color': '#f3f4f6', color: '#4b5563' }}>
                  {tag}
              </Tag>
          ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between" onClick={openMap}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
             <EnvironmentOutline className="text-gray-400 shrink-0" />
             <p className="text-xs text-gray-600 truncate">{hotel.address}</p>
          </div>
          <span className="text-blue-600 text-xs font-bold shrink-0 ml-2">
              地图 &gt;
          </span>
      </div>
    </div>
  );
}