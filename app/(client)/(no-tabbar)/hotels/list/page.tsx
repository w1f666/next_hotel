import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllHotels } from '@/lib/actions/hotel.queries';
import HotelListClient from './_components/HotelListClient';

export const metadata: Metadata = {
  title: '酒店搜索 - 易宿',
  description: '搜索预订全国优质酒店，提供多种筛选条件，让您轻松找到理想住所',
};

const CITIES_MAP: Record<string, string> = {
  shanghai: '上海', beijing: '北京', hangzhou: '杭州',
  chengdu: '成都', xian: '西安', guangzhou: '广州', shenzhen: '深圳',
};

/* ── PPR: 异步数据获取组件，服务端获取首屏数据后交给 SWR ── */
async function HotelListWithData({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const keyword = typeof resolvedParams.keyword === 'string' ? resolvedParams.keyword : undefined;
  const city = typeof resolvedParams.city === 'string' ? resolvedParams.city : undefined;
  const price = typeof resolvedParams.price === 'string' ? resolvedParams.price : undefined;
  const starsParam = typeof resolvedParams.stars === 'string' ? resolvedParams.stars : undefined;
  const facilitiesParam = typeof resolvedParams.facilities === 'string' ? resolvedParams.facilities : undefined;

  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  if (price && price !== 'all') {
    if (price === '600+') { minPrice = 600; maxPrice = 99999; }
    else {
      const parts = price.split('-').map(Number);
      if (parts.length === 2) { minPrice = parts[0]; maxPrice = parts[1]; }
    }
  }

  const starRating = starsParam
    ? starsParam.split(',').map(Number).filter((n: number) => !isNaN(n))
    : undefined;
  const facilities = facilitiesParam
    ? facilitiesParam.split(',').filter(Boolean)
    : undefined;

  const cityLabel = city ? CITIES_MAP[city] : undefined;

  const initialData = await getAllHotels({
    status: 1,
    pageSize: 10,
    cursor: null,
    keyword,
    minPrice,
    maxPrice,
    starRating: starRating && starRating.length > 0
      ? (starRating.length === 1 ? starRating[0] : starRating)
      : undefined,
    facilities,
    city: cityLabel === '全部' ? undefined : cityLabel,
  });

  return (
    <HotelListClient
      fallbackData={initialData}
    />
  );
}

/* ── PPR: 轻量骨架屏，纯服务端组件，不需要 JS 水合 ── */
function HotelListSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-[#f4f4f2]">
      {/* 顶部搜索栏骨架 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e1e32] to-[#252538] pb-4 flex-shrink-0">
        <div className="px-4 pt-3.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10" />
            <div className="w-16 h-8 rounded-xl bg-white/10" />
            <div className="flex-1 h-8 rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="px-4 mt-2.5">
          <div className="h-10 bg-white/95 rounded-2xl" />
        </div>
      </div>
      {/* 快捷筛选条骨架 */}
      <div className="bg-white px-4 py-3 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-16 h-7 rounded-full bg-gray-100" />
        ))}
      </div>
      {/* 卡片骨架 */}
      <div className="flex-1 px-4 pt-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="w-full h-[180px] bg-gray-200" />
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 bg-gray-100 rounded w-12" />
                <div className="h-5 bg-gray-100 rounded w-12" />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PPR: 页面入口，Suspense 包裹异步数据获取，静态 shell 先行 ── */
export default async function HotelListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<HotelListSkeleton />}>
      <HotelListWithData searchParams={searchParams} />
    </Suspense>
  );
}
