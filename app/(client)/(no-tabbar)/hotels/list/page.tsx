import React from 'react';
import type { Metadata } from 'next';
import { getAllHotels } from '@/lib/actions/hotel.actions';
import HotelListClient from './_components/HotelListClient';

export const metadata: Metadata = {
  title: '酒店搜索 - 易宿',
  description: '搜索预订全国优质酒店，提供多种筛选条件，让您轻松找到理想住所',
};

const CITIES_MAP: Record<string, string> = {
  shanghai: '上海', beijing: '北京', hangzhou: '杭州',
  chengdu: '成都', xian: '西安', guangzhou: '广州', shenzhen: '深圳',
};

export default async function HotelListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const keyword = typeof params.keyword === 'string' ? params.keyword : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const price = typeof params.price === 'string' ? params.price : undefined;
  const starsParam = typeof params.stars === 'string' ? params.stars : undefined;
  const facilitiesParam = typeof params.facilities === 'string' ? params.facilities : undefined;

  // 解析筛选参数
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

  // 服务端首屏数据
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
