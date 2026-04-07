'use client';

import React from 'react';
import { Button, Toast, Image } from 'antd-mobile';
import type { HotelRoom } from '@/types';


export default function RoomList({ rooms }: { rooms: HotelRoom[] }) {
  
  const handleBook = (roomName: string) => {
      Toast.show({
          content: `准备预订: ${roomName}`,
          icon: 'success'
      });
      
  };

  return (
    <div className="space-y-3">
        <h2 className="font-bold text-base px-1 pt-2">房型预订</h2>
        {rooms?.map((room) => (
            <div key={room.id} className="bg-white rounded-lg p-3 flex gap-3 shadow-sm">
                {/* 左侧：房型图片 */}
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <Image 
                       src={room.imageUrl || ''} 
                       alt={room.roomName} 
                       fit='cover' 
                       width="100%" 
                       height="100%" 
                    />
                </div>

                {/* 右侧：房型详情 */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{room.roomName}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {room.bedInfo} 
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {room.hasBreakfast && (
                                <span className="text-[10px] text-blue-600 border border-blue-100 bg-blue-50 px-1 rounded">
                                    含早
                                </span>
                            )}
                            {room.cancelPolicy && (
                                <span className="text-[10px] text-blue-600 border border-blue-100 bg-blue-50 px-1 rounded">
                                    {room.cancelPolicy}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                        <div className="text-red-500 flex items-baseline">
                            <span className="text-xs font-medium">¥</span>
                            <span className="text-xl font-bold ml-0.5">{room.price}</span>
                            <span className="text-[10px] text-gray-400 ml-1 font-normal">起</span>
                        </div>
                        
                        <Button 
                            color='primary' 
                            size='mini' 
                            shape='rounded'
                            style={{ 
                                paddingLeft: '16px', 
                                paddingRight: '16px',
                                fontWeight: 'bold' 
                            }}
                            onClick={() => handleBook(room.roomName)}
                        >
                            预订
                        </Button>
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
}