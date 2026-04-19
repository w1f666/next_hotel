import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarFilled, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { getPublishedHotels } from '@/lib/actions/hotel.queries';
import SearchSection from './_components/SearchSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '酒店预订 - 易宿',
  description: '发现和预订全国优质酒店，享受超值优惠',
};

/* ── PPR: 异步酒店列表组件，包裹在 Suspense 中实现流式渲染 ── */
async function HotelGrid() {
  const hotels = await getPublishedHotels();

  if (hotels.length === 0) {
    return <div className="text-center text-gray-400 py-10">暂无酒店数据</div>;
  }

  const displayHotels = hotels.slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displayHotels.map((hotel) => (
          <Link href={`/hotels/${hotel.id}`} key={hotel.id}>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="relative h-40">
                <Image
                  src={hotel.coverImage || '/hotel_img/hotel1.webp'}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
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
      {hotels.length > 6 && (
        <div className="text-center mt-6">
          <Link
            href="/hotels/list"
            className="inline-block px-6 py-2 text-sm text-blue-600 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            查看全部 {hotels.length} 家酒店 →
          </Link>
        </div>
      )}
    </>
  );
}

/* ── PPR: 骨架屏，静态 shell 先行渲染 ── */
function HotelGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
          <div className="h-40 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="flex gap-1">
              {[1, 2, 3].map(j => (
                <div key={j} className="w-3 h-3 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HotelSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      {/* 顶部 Banner — 静态内容，PPR 立即渲染 */}
      <div className="relative w-full h-48 sm:h-60 bg-blue-600 overflow-hidden">
        <Image
          src="/hotel_img/hotel1.webp"
          alt="Luxury Hotel"
          fill
          sizes="100vw"
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

      {/* 搜索区域 (客户端组件) — PPR: Suspense 边界处理 new Date() */}
      <Suspense>
        <SearchSection />
      </Suspense>

      {/* 热门酒店列表 — PPR: Suspense 边界，数据流式传输 */}
      <div className="mt-8 px-4 max-w-4xl mx-auto w-full">
        <h4 className="text-lg font-bold mb-4">热门酒店</h4>
        <Suspense fallback={<HotelGridSkeleton />}>
          <HotelGrid />
        </Suspense>
      </div>

      {/* 底部功能区 — 静态内容，PPR 立即渲染 */}
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
