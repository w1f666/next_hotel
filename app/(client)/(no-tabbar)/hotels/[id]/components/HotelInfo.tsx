import React from 'react';
import type { HotelWithRooms } from '@/types';

export default function HotelInfo({ hotel }: { hotel: HotelWithRooms }) {
  return (
    <div className="bg-white rounded-t-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {hotel.name}
        </h1>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        <div className="bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
             <span className="text-blue-500 text-xs">★</span>
             <span className="text-blue-600 font-bold text-sm">{hotel.starRating}星</span>
        </div>
        <span className="text-xs text-gray-500">
            {hotel.openingTime && new Date(hotel.openingTime).getFullYear()} 年开业
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
          {hotel.facilities?.map((facility, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {facility}
              </span>
          ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
             <span className="text-gray-400 shrink-0">📍</span>
             <p className="text-xs text-gray-600 truncate">{hotel.address}</p>
          </div>
          <span className="text-blue-600 text-xs font-bold shrink-0 ml-2">
              地图 &gt;
          </span>
      </div>
    </div>
  );
}