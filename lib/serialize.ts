/* 序列化工具 — Prisma 对象转 JSON 安全格式 */

export function serializeHotel(hotel: any) {
  return {
    ...hotel,
    minPrice: Number(hotel.minPrice) || 0,
    openingTime: hotel.openingTime ? hotel.openingTime.toISOString().split('T')[0] : null,
    facilities: Array.isArray(hotel.facilities) ? hotel.facilities : [],
    gallery: Array.isArray(hotel.gallery) ? hotel.gallery : [],
    latitude: hotel.latitude ?? null,
    longitude: hotel.longitude ?? null,
    createdAt: hotel.createdAt?.toISOString ? hotel.createdAt.toISOString() : hotel.createdAt,
    updatedAt: hotel.updatedAt?.toISOString ? hotel.updatedAt.toISOString() : hotel.updatedAt,
  };
}

export function serializeRoom(room: any) {
  return {
    ...room,
    price: Number(room.price),
    imageUrl: room.imageUrl || null,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
