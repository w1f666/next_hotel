'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, message, Button, Space } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import HotelForm from '../_components/HotelForm';
import type { HotelFormData } from '@/types';

const { Title, Paragraph } = Typography;

export default function PublishHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 从登录态获取 merchantId
  const merchantId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 0;

  const handleSubmit = async (formData: HotelFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, ...formData }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        message.error(json.message || '提交失败');
        return;
      }

      message.success('🎉 酒店信息已提交，等待审核');
      router.push('/admin/workspace');
    } catch (err) {
      message.error('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 导航 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 工作台</>, href: '/admin/workspace' },
            { title: '发布新酒店' },
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
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              <Space>
                <EditOutlined style={{ color: '#0066FF' }} />
                发布新酒店
              </Space>
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              填写酒店详情并添加房型，提交后将进入审核流程
            </Paragraph>
          </div>
        </div>
      </div>

      <HotelForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
