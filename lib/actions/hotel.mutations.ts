'use server';

import { getAuthFromCookies } from '@/lib/auth';
import { updateHotelCache, revalidateHotelPaths } from '@/lib/actions/hotel.revalidation';
import {
  createHotelRecord,
  deleteHotelRecord,
  getHotelMerchantOwnerId,
  reviewHotelRecord,
  updateHotelRecord,
} from '@/lib/actions/hotel.write';
import type { HotelFormData } from '@/types';

interface ActionResult<T = any> {
  ok: boolean;
  message: string;
  data?: T;
}

/**
 * Server Action: 创建酒店（商户）
 * 鉴权：通过 cookie 中的 JWT 验证身份
 * 缓存：调用 updateTag 立即失效 use cache 缓存
 */
export async function createHotelAction(formData: HotelFormData): Promise<ActionResult> {
  const auth = await getAuthFromCookies();
  if (!auth) return { ok: false, message: '未登录' };
  if (auth.role !== 'merchant') return { ok: false, message: '无权操作' };

  if (!formData.name || !formData.address) {
    return { ok: false, message: '酒店名称和地址为必填项' };
  }

  const hotel = await createHotelRecord(auth.userId, formData);

  updateHotelCache({ hotelId: hotel.id, merchantId: auth.userId });
  revalidateHotelPaths(hotel.id);
  return { ok: true, data: hotel, message: '酒店信息已保存，等待审核' };
}

/**
 * Server Action: 更新酒店（商户/管理员）
 * 包含 IDOR 校验：商户只能修改自己的酒店
 */
export async function updateHotelAction(hotelId: number, formData: HotelFormData): Promise<ActionResult> {
  const auth = await getAuthFromCookies();
  if (!auth) return { ok: false, message: '未登录' };

  if (auth.role === 'merchant') {
    const merchantId = await getHotelMerchantOwnerId(hotelId);
    if (!merchantId || merchantId !== auth.userId) {
      return { ok: false, message: '无权操作该酒店' };
    }
  }

  if (!formData.name || !formData.address) {
    return { ok: false, message: '酒店名称和地址为必填项' };
  }

  const hotel = await updateHotelRecord(hotelId, formData);

  updateHotelCache({ hotelId, merchantId: hotel.merchantId });
  revalidateHotelPaths(hotelId);
  return { ok: true, data: hotel, message: '酒店信息已更新，等待重新审核' };
}

/**
 * Server Action: 删除酒店（商户/管理员）
 * 包含 IDOR 校验：商户只能删除自己的酒店
 */
export async function deleteHotelAction(hotelId: number): Promise<ActionResult> {
  const auth = await getAuthFromCookies();
  if (!auth) return { ok: false, message: '未登录' };

  if (auth.role === 'merchant') {
    const merchantId = await getHotelMerchantOwnerId(hotelId);
    if (!merchantId || merchantId !== auth.userId) {
      return { ok: false, message: '无权操作该酒店' };
    }
  }

  const deletedHotel = await deleteHotelRecord(hotelId);

  updateHotelCache({ hotelId, merchantId: deletedHotel.merchantId });
  revalidateHotelPaths(hotelId);
  return { ok: true, message: '酒店已删除' };
}

/**
 * Server Action: 审核酒店（仅管理员）
 */
export async function reviewHotelAction(
  hotelId: number,
  action: 'approve' | 'reject',
  reason?: string,
): Promise<ActionResult> {
  const auth = await getAuthFromCookies();
  if (!auth) return { ok: false, message: '未登录' };
  if (auth.role !== 'admin') return { ok: false, message: '无权操作' };

  if (!hotelId || isNaN(hotelId)) {
    return { ok: false, message: '酒店ID无效' };
  }

  if (action === 'reject') {
    if (!reason?.trim()) {
      return { ok: false, message: '拒绝原因不能为空' };
    }
  } else if (action !== 'approve') {
    return { ok: false, message: '非法操作' };
  }

  const hotel = await reviewHotelRecord(hotelId, action, reason);

  updateHotelCache({ hotelId, merchantId: hotel.merchantId });
  revalidateHotelPaths(hotelId);
  return { ok: true, message: action === 'approve' ? '审核通过' : '已拒绝' };
}
