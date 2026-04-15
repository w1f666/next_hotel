'use client';

import React, { useState } from 'react';
import {
  Typography, Breadcrumb, Button, Space, Tag, App,
} from 'antd';
import {
  ArrowLeftOutlined, HomeOutlined, FormOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import HotelForm from '@/app/admin/workspace/_components/HotelForm';
import type { HotelFormData, HotelWithRooms } from '@/types';
import { HOTEL_STATUS_MAP } from '@/types';
import { updateHotelAction } from '@/lib/actions/hotel.mutations';

const { Title, Paragraph } = Typography;

export default function EditHotelClient({ hotel }: { hotel: HotelWithRooms }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const statusInfo = HOTEL_STATUS_MAP[hotel.status];

  const handleSubmit = async (formData: HotelFormData) => {
    setSubmitting(true);
    try {
      const result = await updateHotelAction(hotel.id, formData);

      if (!result.ok) {
        message.error(result.message || '保存失败');
        return;
      }

      await Promise.all([
        mutate('/api/merchant/hotels'),
        mutate('/api/admin/hotels'),
        mutate(
          (key: unknown) => typeof key === 'string' && key.startsWith('/api/hotels?'),
          undefined,
          { revalidate: true },
        ),
      ]);

      message.success('✅ 酒店信息已更新，等待重新审核');
      router.push('/admin/workspace');
    } catch {
      message.error('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 导航 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 工作台</>, href: '/admin/workspace' },
            { title: hotel.name },
            { title: '编辑' },
          ]}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/workspace')}
            style={{ padding: '4px 8px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                <Space>
                  <FormOutlined style={{ color: '#0066FF' }} />
                  编辑酒店信息
                </Space>
              </Title>
              {statusInfo && (
                <Tag color={statusInfo.color} style={{ borderRadius: 6 }}>
                  {statusInfo.label}
                </Tag>
              )}
            </div>
            <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              正在编辑 <strong>{hotel.name}</strong>，保存后将重新进入审核流程
            </Paragraph>
          </div>
        </div>
      </div>

      {/* 驳回原因提示 */}
      {hotel.status === 2 && hotel.rejectReason && (
        <div
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
          }}
        >
          <Typography.Text strong style={{ color: '#ff4d4f' }}>
            ⚠️ 上次审核未通过，原因：
          </Typography.Text>
          <Typography.Text style={{ color: '#ff4d4f', marginLeft: 8 }}>
            {hotel.rejectReason}
          </Typography.Text>
        </div>
      )}

      <HotelForm
        mode="edit"
        initialData={hotel}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
