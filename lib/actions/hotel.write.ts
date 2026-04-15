import prisma from '@/lib/prisma';
import { serializeHotel } from '@/lib/serialize';
import type { HotelFormData } from '@/types';

export async function getHotelMerchantOwnerId(hotelId: number) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { merchantId: true },
  });

  return hotel?.merchantId ?? null;
}

function getMinPrice(data: HotelFormData) {
  return data.rooms.length > 0
    ? Math.min(...data.rooms.map((room) => room.price))
    : 0;
}

export async function createHotelRecord(merchantId: number, data: HotelFormData) {
  const hotel = await prisma.hotel.create({
    data: {
      merchantId,
      name: data.name,
      address: data.address,
      starRating: data.starRating,
      minPrice: getMinPrice(data),
      openingTime: data.openingTime ? new Date(data.openingTime) : null,
      facilities: data.facilities || [],
      coverImage: data.coverImage || null,
      gallery: data.gallery || [],
      status: 0,
    },
  });

  if (data.rooms.length > 0) {
    await prisma.hotelRoom.createMany({
      data: data.rooms.map((room) => ({
        hotelId: hotel.id,
        roomName: room.roomName,
        bedInfo: room.bedInfo,
        capacity: room.capacity,
        hasBreakfast: room.hasBreakfast,
        price: room.price,
        stock: room.stock,
        cancelPolicy: room.cancelPolicy,
        imageUrl: room.imageUrl || null,
      })),
    });
  }

  return serializeHotel(hotel);
}

export async function updateHotelRecord(hotelId: number, data: HotelFormData) {
  const hotel = await prisma.$transaction(async (tx) => {
    const updatedHotel = await tx.hotel.update({
      where: { id: hotelId },
      data: {
        name: data.name,
        address: data.address,
        starRating: data.starRating,
        minPrice: getMinPrice(data),
        openingTime: data.openingTime ? new Date(data.openingTime) : null,
        facilities: data.facilities || [],
        coverImage: data.coverImage || null,
        gallery: data.gallery || [],
        status: 0,
      },
    });

    await tx.hotelRoom.deleteMany({ where: { hotelId } });

    if (data.rooms.length > 0) {
      await tx.hotelRoom.createMany({
        data: data.rooms.map((room) => ({
          hotelId,
          roomName: room.roomName,
          bedInfo: room.bedInfo,
          capacity: room.capacity,
          hasBreakfast: room.hasBreakfast,
          price: room.price,
          stock: room.stock,
          cancelPolicy: room.cancelPolicy,
          imageUrl: room.imageUrl || null,
        })),
      });
    }

    return updatedHotel;
  });

  return serializeHotel(hotel);
}

export async function deleteHotelRecord(hotelId: number) {
  return prisma.hotel.delete({
    where: { id: hotelId },
    select: { id: true, merchantId: true },
  });
}

export async function reviewHotelRecord(
  hotelId: number,
  action: 'approve' | 'reject',
  reason?: string,
) {
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: action === 'approve'
      ? { status: 1, rejectReason: null }
      : { status: 2, rejectReason: reason?.trim() || null },
  });

  return serializeHotel(hotel);
}
