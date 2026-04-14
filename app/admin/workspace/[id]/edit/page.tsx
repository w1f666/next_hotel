import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getHotelById } from '@/lib/actions/hotel.actions';
import EditHotelClient from './_components/EditHotelClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const hotel = await getHotelById(Number(id));
  return { title: hotel ? `编辑 ${hotel.name} - 工作台` : '酒店不存在' };
}

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hotel = await getHotelById(Number(id));

  if (!hotel) {
    notFound();
  }

  return <EditHotelClient hotel={hotel} />;
}
