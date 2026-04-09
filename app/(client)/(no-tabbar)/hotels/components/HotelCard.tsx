'use client';

import React, { memo } from 'react';
import { EnvironmentOutlined, StarFilled, SafetyCertificateFilled } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import type { HotelListItem } from '@/types';

interface HotelCardProps {
  hotel: HotelListItem;
}

const HotelCard = memo(function HotelCard({ hotel }: HotelCardProps) {
  const starConfig = hotel.starRating >= 5
    ? { label: '奢华', scoreColor: 'text-amber-700', badge: 'bg-gradient-to-r from-amber-800/75 to-amber-600/75' }
    : hotel.starRating >= 4
    ? { label: '高档', scoreColor: 'text-[#2d2d3a]', badge: 'bg-[#1a1a2e]/70' }
    : hotel.starRating >= 3
    ? { label: '舒适', scoreColor: 'text-stone-600', badge: 'bg-stone-700/65' }
    : { label: '经济', scoreColor: 'text-gray-500', badge: 'bg-gray-600/60' };

  const score = (hotel.starRating * 0.8 + 1.2).toFixed(1);

  return (
    <Link href={`/hotels/${hotel.id}`} prefetch={false}>
      <div className="mb-3.5 bg-white rounded-2xl overflow-hidden shadow-[0_1px_10px_rgba(0,0,0,0.05)] active:shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.988] transition-all duration-200">
        {/* 上方大图区域 */}
        <div className="relative w-full h-[180px] overflow-hidden">
          <Image
            src={hotel.coverImage || '/hotel_img/hotel1.png'}
            alt={hotel.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className={`absolute top-3 left-3 ${starConfig.badge} backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1`}>
            <StarFilled className="text-[10px]" />
            {starConfig.label}
          </div>

          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
            <span className={`text-sm font-black ${starConfig.scoreColor}`}>{score}</span>
            <span className="text-[9px] text-gray-400 font-medium">分</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <h3 className="font-bold text-[17px] text-white leading-tight line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {hotel.name}
            </h3>
          </div>
        </div>

        {/* 下方信息区域 */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <EnvironmentOutlined className="text-gray-400 text-[11px] flex-shrink-0" />
              <span className="text-[12px] text-gray-500 truncate">{hotel.address}</span>
            </div>
            <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
              {Array.from({ length: hotel.starRating }, (_, i) => (
                <StarFilled key={i} className="text-amber-400 text-[9px]" />
              ))}
            </div>
          </div>

          {hotel.facilities && hotel.facilities.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5 overflow-hidden">
              {hotel.facilities.slice(0, 4).map((facility, idx) => (
                <span key={idx} className="text-[10px] text-gray-500 bg-gray-50/80 py-0.5 px-2 rounded whitespace-nowrap">
                  {facility}
                </span>
              ))}
              {hotel.facilities.length > 4 && (
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  +{hotel.facilities.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-gray-100/80">
            <div className="flex items-center gap-1.5">
              <SafetyCertificateFilled className="text-emerald-500 text-[11px]" />
              <span className="text-[11px] text-emerald-600 font-medium">免费取消</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-[11px] text-gray-400 mr-0.5">¥</span>
              <span className="text-[22px] font-black text-gray-900 leading-none tracking-tighter">{hotel.minPrice}</span>
              <span className="text-[10px] text-gray-400 ml-0.5">/晚起</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

HotelCard.displayName = 'HotelCard';

export default HotelCard;
