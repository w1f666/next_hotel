import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getHotelById, getPublishedHotels } from '@/lib/actions/hotel.actions';
import HotelBanner from './components/HotelBanner';
import HotelInfo from './components/HotelInfo';
import DateRoomSection from './components/DateRoomSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hotel = await getHotelById(Number(id));
  if (!hotel) return { title: '酒店未找到' };
  return {
    title: `${hotel.name} - 易宿`,
    description: `${hotel.name}，${hotel.starRating}星级，位于${hotel.address}，¥${hotel.minPrice}起`,
  };
}

export async function generateStaticParams() {
  const hotels = await getPublishedHotels();
  return hotels.map((h: { id: number }) => ({ id: String(h.id) }));
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getHotelById(Number(id));

  if (!hotel) notFound();

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-safe">
      <HotelBanner images={hotel.gallery || []} />

      <main className="px-3 relative -mt-4 z-10 space-y-3 pb-8">
        <HotelInfo hotel={hotel} />

        <DateRoomSection rooms={hotel.rooms || []} hotelId={hotel.id} />
      </main>
    </div>
  );
}