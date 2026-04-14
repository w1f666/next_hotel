import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarFilled, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { getPublishedHotels } from '@/lib/actions/hotel.actions';
import SearchSection from './_components/SearchSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '酒店预订 - 易宿',
  description: '发现和预订全国优质酒店，享受超值优惠',
};

export default async function HotelSearchPage() {
  const hotels = await getPublishedHotels();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      {/* 顶部 Banner */}
      <div className="relative w-full h-48 sm:h-60 bg-blue-600 overflow-hidden">
        <Image
          src="/hotel_img/hotel1.png"
          alt="Luxury Hotel"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-widest">酒店 7 折起</h2>
            <p className="text-sm sm:text-lg opacity-90 mt-2 font-light">发现您的完美避世之所</p>
          </div>
        </div>
      </div>

      {/* 搜索区域 (客户端组件) */}
      <SearchSection />

      {/* 热门酒店列表 (服务端渲染) */}
      <div className="mt-8 px-4 max-w-4xl mx-auto w-full">
        <h4 className="text-lg font-bold mb-4">热门酒店</h4>
        {hotels.length === 0 ? (
          <div className="text-center text-gray-400 py-10">暂无酒店数据</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {hotels.map((hotel) => (
              <Link href={`/hotels/${hotel.id}`} key={hotel.id}>
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="relative h-40">
                    <Image
                      src={hotel.coverImage || '/hotel_img/hotel1.png'}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <span className="text-base font-semibold truncate">{hotel.name}</span>
                      <span className="text-red-500 font-bold text-lg flex-shrink-0 ml-2">
                        ¥{hotel.minPrice}
                        <span className="text-xs font-normal text-gray-400">起</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-2 mb-1">
                      <EnvironmentOutlined />
                      <span className="truncate">{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: hotel.starRating }, (_, i) => (
                        <StarFilled key={i} className="text-yellow-400 text-xs" />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 底部功能区 */}
      <div className="mt-8 px-4 max-w-2xl mx-auto w-full grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div>
            <div className="font-bold text-gray-800">我的订单</div>
            <div className="text-xs text-gray-400">查看行程安排</div>
          </div>
          <RightOutlined className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div>
            <div className="font-bold text-gray-800">特惠酒店</div>
            <div className="text-xs text-gray-400">低价精选推荐</div>
          </div>
          <RightOutlined className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}
