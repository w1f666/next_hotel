'use client';

import React, { useEffect, useState, use } from 'react';
import {
  Typography, Breadcrumb, message, Button, Space, Spin, Result, Tag,
} from 'antd';
import {
  ArrowLeftOutlined, HomeOutlined, FormOutlined, LoadingOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import HotelForm from '../../_components/HotelForm';
import type { HotelFormData, HotelWithRooms } from '@/types';
import { HOTEL_STATUS_MAP } from '@/types';

const { Title, Paragraph } = Typography;

export default function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await fetch(`/api/hotels/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setHotel(json.data);
        } else {
          setError(json.message || '酒店不存在');
        }
      } catch {
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

  const handleSubmit = async (formData: HotelFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        message.error(json.message || '保存失败');
        return;
      }

      message.success('✅ 酒店信息已更新，等待重新审核');
      router.push('/admin/workspace');
    } catch {
      message.error('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} tip="正在加载酒店信息..." />
      </div>
    );
  }

  // 错误状态
  if (error || !hotel) {
    return (
      <Result
        status="404"
        title="未找到酒店"
        subTitle={error || '该酒店不存在或已被删除'}
        extra={
          <Button type="primary" onClick={() => router.push('/admin/workspace')}>
            返回工作台
          </Button>
        }
      />
    );
  }

  const statusInfo = HOTEL_STATUS_MAP[hotel.status];

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
