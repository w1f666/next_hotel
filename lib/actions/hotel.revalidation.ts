import { revalidatePath, revalidateTag, updateTag } from 'next/cache';

interface HotelCacheScope {
  hotelId?: number;
  merchantId?: number;
}

function getHotelCacheTags(scope: HotelCacheScope = {}) {
  const tags = ['hotels'];

  if (scope.hotelId !== undefined) {
    tags.push(`hotel-${scope.hotelId}`);
  }

  if (scope.merchantId !== undefined) {
    tags.push(`merchant-${scope.merchantId}-hotels`);
  }

  return tags;
}

export function updateHotelCache(scope: HotelCacheScope = {}) {
  for (const tag of getHotelCacheTags(scope)) {
    updateTag(tag);
  }
}

export function revalidateHotelCache(scope: HotelCacheScope = {}) {
  for (const tag of getHotelCacheTags(scope)) {
    revalidateTag(tag, { expire: 0 });
  }
}

export function revalidateHotelPaths(hotelId?: number) {
  revalidatePath('/hotels');
  revalidatePath('/hotels/list');
  revalidatePath('/admin/workspace');
  revalidatePath('/admin/hotels');

  if (hotelId !== undefined) {
    revalidatePath(`/hotels/${hotelId}`);
  }
}
