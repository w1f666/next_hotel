"use client";
import 'antd-mobile/es/global';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Toast, Skeleton, ErrorBlock, CalendarPicker } from "antd-mobile";
import { unstableSetRender } from 'antd-mobile';
import { createRoot, type Root } from 'react-dom/client';
import HotelNavBar from "./components/HotelNavBar";
import HotelBanner from "./components/HotelBanner";
import HotelInfo from "./components/HotelInfo";
import RoomList from "./components/RoomList";

export interface HotelDetailResponse {
  id: number | string;
  name: string;
  images?: string[]; //  标记为可选
  rooms?: any[];     //  标记为可选
  [key: string]: any; 
}

// --- React 19 兼容性补丁 ---
unstableSetRender((node: React.ReactNode, container: Element | DocumentFragment) => {
  const root: Root = createRoot(container as HTMLElement);
  root.render(node);
  return async () => {
    root.unmount();
  };
});

// --- 辅助函数 ---
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

export default function HotelDetailPage() {
  const [data, setData] = useState<HotelDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  const [dateRange, setDateRange] = useState<[Date, Date]>(() => {
    const today = getToday(); 
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [today, tomorrow];
  });
  
  const params = useParams(); 
  const hotelId = params?.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hotels/${hotelId}`); 
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        // console.log("酒店数据：", result.data);
        // console.log("rooms 数据：", result.data.rooms);
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || '获取数据失败');
        }
      } catch (err) {
        console.error("Fetch hotel detail failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchData();
    }
  }, [hotelId]);

  const handleCalendarConfirm = (val: [Date, Date] | null) => {
    if (val) {
      setDateRange(val);
      Toast.show({ content: `已选择 ${getNights(val[0], val[1])} 晚`, icon: 'success' });
    }
  };

  if (error) {
    return <ErrorBlock status="default" title="加载失败" description="请检查网络或稍后再试" fullPage />;
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="h-12 bg-white" />
        <Skeleton.Title animated className="!h-56 !mt-0 !w-full" />
        <div className="p-4 space-y-4">
           <Skeleton.Paragraph lineCount={3} animated />
           <Skeleton.Paragraph lineCount={5} animated />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-safe">
      {/* <HotelNavBar title={data.name} /> */}

      {/* ✅ 核心修复点：加上 || [] 防止 map 报错 */}
      <HotelBanner images={data.gallery || []} />

      <main className="px-3 relative -mt-4 z-10 space-y-3 pb-8">
        <HotelInfo hotel={data} />

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

        <div className="mt-2">
           <RoomList rooms={data.rooms || []} />
        </div>
      </main>

      <CalendarPicker
        selectionMode="range"
        visible={calendarVisible}
        value={dateRange}
        min={getToday()}
        onChange={(val: [Date, Date] | null) => {
          if (val) {
            setDateRange(val);
          }
        }}
        onConfirm={(val: [Date, Date] | null) => {
          if (!val) return;
          setDateRange(val);
          setCalendarVisible(false);
          Toast.show({
            content: `已选择 ${getNights(val[0], val[1])} 晚`,
            icon: 'success',
          });
        }}
        onClose={() => setCalendarVisible(false)}
      />
    </div>
  );
}