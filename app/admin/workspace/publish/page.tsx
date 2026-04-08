'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Breadcrumb, Button, Space, Spin, App } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import HotelForm from '../_components/HotelForm';
import type { HotelFormData } from '@/types';
import { fetchApi } from '@/lib/fetch-api';

const { Title, Paragraph } = Typography;

export default function PublishHotelPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (!userId) {
      // 用户未登录，跳转到登录页
      message.error('请先登录');
      router.push('/admin/auth');
      return;
    }
    
    const id = Number(userId);
    if (isNaN(id) || id === 0) {
      message.error('商户ID无效，请重新登录');
      router.push('/admin/auth');
      return;
    }
    
    setIsChecking(false);
  }, [router, message]);

  const handleSubmit = async (formData: HotelFormData) => {
    setLoading(true);
    try {
      const result = await fetchApi('/api/hotels', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!result.ok) {
        message.error(result.message || '提交失败');
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

  // 检查用户登录状态期间显示加载
  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 16 }}>
        <Spin size="large" />
        <span style={{ color: '#999' }}>检查登录状态...</span>
      </div>
    );
  }

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
