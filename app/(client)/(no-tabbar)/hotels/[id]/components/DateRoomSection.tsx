'use client';

import React, { useState } from 'react';
import { Toast, CalendarPicker } from 'antd-mobile';
import RoomList from './RoomList';
import type { HotelRoom } from '@/types';

const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatDate = (date: Date) => {
  if (!date) return '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const getNights = (start: Date, end: Date) => {
  if (!start || !end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

interface DateRoomSectionProps {
  rooms: HotelRoom[];
  hotelId: number;
}

export default function DateRoomSection({ rooms, hotelId }: DateRoomSectionProps) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date]>(() => {
    const today = getToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [today, tomorrow];
  });

  return (
    <>
      {/* 日期选择 */}
      <div
        className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setCalendarVisible(true)}
      >
        <div className="flex flex-col">
          <div className="flex items-end gap-2">
            <span className="text-base font-bold text-gray-900">
              {formatDate(dateRange[0])}
            </span>
            <span className="text-xs text-gray-500 mb-0.5">入住</span>
            <span className="text-xs text-gray-300 mx-1">|</span>
            <span className="text-base font-bold text-gray-900">
              {formatDate(dateRange[1])}
            </span>
            <span className="text-xs text-gray-500 mb-0.5">离店</span>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            共 {getNights(dateRange[0], dateRange[1])} 晚
          </span>
        </div>
        <div className="flex items-center text-blue-600 text-sm font-medium">
          <span>修改</span>
          <span className="ml-1">›</span>
        </div>
      </div>

      {/* 房型列表 */}
      <div className="mt-2">
        <RoomList rooms={rooms} hotelId={hotelId} checkIn={dateRange[0]} checkOut={dateRange[1]} />
      </div>

      {/* 日历弹窗 */}
      <CalendarPicker
        selectionMode="range"
        visible={calendarVisible}
        value={dateRange}
        min={getToday()}
        onChange={(val: [Date, Date] | null) => {
          if (val) setDateRange(val);
        }}
        onConfirm={(val: [Date, Date] | null) => {
          if (!val) return;
          setCalendarVisible(false);
          Toast.show({ content: `已选择 ${getNights(val[0], val[1])} 晚` });
        }}
        onClose={() => setCalendarVisible(false)}
      />
    </>
  );
}
