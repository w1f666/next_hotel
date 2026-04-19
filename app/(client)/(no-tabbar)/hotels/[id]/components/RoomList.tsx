'use client';

import { useState } from 'react';
import { Button, Toast, Popup, Form, Input } from 'antd-mobile';
import NextImage from 'next/image';
import type { HotelRoom } from '@/types';

interface RoomListProps {
  rooms: HotelRoom[];
  hotelId: number;
  checkIn: Date;
  checkOut: Date;
}

export default function RoomList({ rooms, hotelId, checkIn, checkOut }: RoomListProps) {
  const [visible, setVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleBook = (room: HotelRoom) => {
    setSelectedRoom(room);
    form.resetFields();
    setVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { guestName, guestPhone } = values;

      if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
        Toast.show({ content: '请输入正确的手机号', icon: 'fail' });
        return;
      }

      setSubmitting(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom!.id,
          hotelId,
          guestName,
          guestPhone,
          checkIn: formatDate(checkIn),
          checkOut: formatDate(checkOut),
        }),
      });
      const json = await res.json();

      if (json.success) {
        setVisible(false);
        Toast.show({ content: `预订成功！订单号：${json.data.orderNo}`, icon: 'success', duration: 3000 });
      } else {
        Toast.show({ content: json.message || '预订失败', icon: 'fail' });
      }
    } catch {
      Toast.show({ content: '请填写完整信息', icon: 'fail' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = selectedRoom ? selectedRoom.price * nights : 0;

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-base px-1 pt-2">房型预订</h2>
      {rooms?.map((room) => (
        <div key={room.id} className="bg-white rounded-lg p-3 flex gap-3 shadow-sm">
          <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-100 relative">
            <NextImage src={room.imageUrl || '/hotel_img/hotel1.webp'} alt={room.roomName} fill sizes="96px" className="object-cover" />
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{room.roomName}</h3>
              <p className="text-xs text-gray-500 mt-1">{room.bedInfo}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {room.hasBreakfast && (
                  <span className="text-[10px] text-blue-600 border border-blue-100 bg-blue-50 px-1 rounded">含早</span>
                )}
                {room.cancelPolicy && (
                  <span className="text-[10px] text-blue-600 border border-blue-100 bg-blue-50 px-1 rounded">{room.cancelPolicy}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-end mt-2">
              <div className="text-red-500 flex items-baseline">
                <span className="text-xs font-medium">¥</span>
                <span className="text-xl font-bold ml-0.5">{room.price}</span>
                <span className="text-[10px] text-gray-400 ml-1 font-normal">/晚</span>
              </div>
              <Button
                color="primary"
                size="mini"
                shape="rounded"
                style={{ paddingLeft: '16px', paddingRight: '16px', fontWeight: 'bold' }}
                onClick={() => handleBook(room)}
              >
                预订
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* 预订弹窗 */}
      <Popup visible={visible} onMaskClick={() => setVisible(false)} bodyStyle={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '20px' }}>
        {selectedRoom && (
          <div>
            <h3 className="text-lg font-bold text-center mb-1">确认预订</h3>
            <p className="text-sm text-gray-500 text-center mb-4">{selectedRoom.roomName}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">入住</span>
                <span className="font-medium">{formatDate(checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">离店</span>
                <span className="font-medium">{formatDate(checkOut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">房价</span>
                <span>¥{selectedRoom.price} × {nights}晚</span>
              </div>
              <div className="flex justify-between font-bold text-red-500 pt-1 border-t border-gray-200">
                <span>合计</span>
                <span>¥{totalPrice}</span>
              </div>
            </div>

            <Form form={form} layout="horizontal" requiredMarkStyle="none">
              <Form.Item name="guestName" label="入住人" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入入住人姓名" />
              </Form.Item>
              <Form.Item name="guestPhone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" type="tel" maxLength={11} />
              </Form.Item>
            </Form>

            <Button block color="primary" size="large" shape="rounded" loading={submitting} onClick={handleSubmit} className="mt-4">
              确认预订 ¥{totalPrice}
            </Button>
          </div>
        )}
      </Popup>
    </div>
  );
}