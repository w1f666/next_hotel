import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/bookings — 创建预定订单（公开接口，C 端游客下单）
 *
 * 使用场景：C 端酒店详情页 → 点击"预订"按钮
 * 无需登录：游客直接填写入住人信息即可下单
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, hotelId, guestName, guestPhone, checkIn, checkOut } = body;

    // 基本校验
    if (!roomId || !hotelId || !guestName || !guestPhone || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: '请填写完整的预定信息' },
        { status: 400 }
      );
    }

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
      return NextResponse.json(
        { success: false, message: '请输入正确的手机号' },
        { status: 400 }
      );
    }

    // 日期校验
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, message: '日期格式不正确' },
        { status: 400 }
      );
    }

    if (checkInDate < today) {
      return NextResponse.json(
        { success: false, message: '入住日期不能早于今天' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, message: '离店日期必须晚于入住日期' },
        { status: 400 }
      );
    }

    // 查询房型信息（校验存在性 + 获取价格）
    const room = await prisma.hotelRoom.findUnique({
      where: { id: Number(roomId) },
      include: { hotel: { select: { id: true, name: true, status: true } } },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, message: '房型不存在' },
        { status: 404 }
      );
    }

    if (room.hotel.status !== 1) {
      return NextResponse.json(
        { success: false, message: '该酒店暂不可预定' },
        { status: 400 }
      );
    }

    if (room.hotelId !== Number(hotelId)) {
      return NextResponse.json(
        { success: false, message: '房型与酒店不匹配' },
        { status: 400 }
      );
    }

    // 计算间夜数和总价
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = Number(room.price) * nights;

    // 生成订单号：日期 + 随机数
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNo = `BK${dateStr}${randomStr}`;

    // 创建订单
    const booking = await prisma.booking.create({
      data: {
        orderNo,
        roomId: Number(roomId),
        hotelId: Number(hotelId),
        guestName,
        guestPhone,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        totalPrice,
        status: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: '预定成功',
      data: {
        id: booking.id,
        orderNo: booking.orderNo,
        nights,
        totalPrice: Number(booking.totalPrice),
        roomName: room.roomName,
        hotelName: room.hotel.name,
        checkIn,
        checkOut,
      },
    });
  } catch (error) {
    console.error('[POST /api/bookings]', error);
    return NextResponse.json(
      { success: false, message: '预定失败，请稍后重试' },
      { status: 500 }
    );
  }
}
