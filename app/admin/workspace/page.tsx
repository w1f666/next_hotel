'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table, Tag, Space, Button, Typography, Input, Empty, Card,
  Statistic, Row, Col, Popconfirm, message, Skeleton, Badge, Flex,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ShopOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EyeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Hotel } from '@/types';
import { HOTEL_STATUS_MAP } from '@/types';
import { fetchApi } from '@/lib/fetch-api';

const { Title, Text, Paragraph } = Typography;

export default function WorkspacePage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 搜索防抖
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText]);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchApi('/api/merchant/hotels');
      if (result.ok) {
        setHotels(result.data || []);
      } else {
        message.error(result.message || '加载酒店列表失败');
      }
    } catch (err) {
      message.error('加载酒店列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleDelete = async (id: number) => {
    try {
      const result = await fetchApi(`/api/hotels/${id}`, { method: 'DELETE' });
      if (result.ok) {
        message.success('已删除');
        fetchHotels();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  // 统计
  const stats = {
    total: hotels.length,
    pending: hotels.filter((h) => h.status === 0).length,
    approved: hotels.filter((h) => h.status === 1).length,
    rejected: hotels.filter((h) => h.status === 2).length,
  };

  // 搜索过滤
  const filteredHotels = debouncedSearchText
    ? hotels.filter((h) => h.name.toLowerCase().includes(debouncedSearchText.toLowerCase()))
    : hotels;

  const columns = [
    {
      title: '酒店信息',
      key: 'info',
      width: 320,
      render: (_: any, record: Hotel) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 20,
              background: '#f0f0f0',
            }}
          >
            {record.coverImage && /^\/(uploads|hotel_img)\/[a-zA-Z0-9._-]+$/.test(record.coverImage) ? (
              <img src={record.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ShopOutlined style={{ color: '#999' }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 15, display: 'block' }} ellipsis>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {record.address}
            </Text>
            <div style={{ marginTop: 4 }}>
              {Array.from({ length: record.starRating }, (_, i) => (
                <span key={i} style={{ color: '#faad14', fontSize: 12 }}>★</span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '最低价',
      key: 'price',
      width: 120,
      render: (_: any, record: Hotel) => (
        <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
          ¥{record.minPrice}
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>/晚</Text>
        </Text>
      ),
    },
    {
      title: '审核状态',
      key: 'status',
      width: 130,
      render: (_: any, record: Hotel) => {
        const statusInfo = HOTEL_STATUS_MAP[record.status] || { label: '未知', color: 'default' };
        const iconMap: Record<number, React.ReactNode> = {
          0: <ClockCircleOutlined />,
          1: <CheckCircleOutlined />,
          2: <CloseCircleOutlined />,
        };
        return (
          <Flex vertical gap={2}>
            <Tag icon={iconMap[record.status]} color={statusInfo.color}>
              {statusInfo.label}
            </Tag>
            {record.status === 2 && record.rejectReason && (
              <Text type="danger" style={{ fontSize: 11 }}>
                原因：{record.rejectReason}
              </Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: '更新时间',
      key: 'updatedAt',
      width: 160,
      render: (_: any, record: Hotel) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date(record.updatedAt).toLocaleString('zh-CN')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: Hotel) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/workspace/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个酒店吗？"
            description="删除后不可恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 欢迎区 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0066FF 0%, #5B8DEF 60%, #A78BFA 100%)',
          borderRadius: 16,
          padding: '32px 36px',
          marginBottom: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            我的酒店工作台
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 20px', fontSize: 15 }}>
            在这里管理您的所有酒店信息，发布新酒店或修改已有信息
          </Paragraph>
          <Button
            type="primary"
            ghost
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/workspace/publish')}
            style={{
              borderRadius: 10,
              borderColor: '#fff',
              color: '#fff',
              fontWeight: 600,
              height: 44,
            }}
          >
            发布新酒店
          </Button>
        </div>
        {/* 装饰圆 */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: 100,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      </div>

      {/* 数据统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: '全部酒店', value: stats.total, color: '#0066FF', icon: <ShopOutlined /> },
          { label: '待审核', value: stats.pending, color: '#faad14', icon: <ClockCircleOutlined /> },
          { label: '已上线', value: stats.approved, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: '未通过', value: stats.rejected, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
        ].map((item) => (
          <Col xs={12} md={6} key={item.label}>
            <Card
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <Statistic
                title={
                  <Space>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    {item.label}
                  </Space>
                }
                value={item.value}
                styles={{ content: { color: item.color, fontWeight: 700 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 列表区 */}
      <Card
        variant="borderless"
        style={{ borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>酒店列表</Title>
          <Space>
            <Input
              placeholder="搜索酒店名称..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchHotels}>
              刷新
            </Button>
          </Space>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : filteredHotels.length === 0 ? (
          <Empty
            description={
              searchText ? '没有找到匹配的酒店' : '还没有录入酒店信息'
            }
            style={{ padding: '60px 0' }}
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/admin/workspace/publish')}
              >
                立即发布
              </Button>
            )}
          </Empty>
        ) : (
          <Table
            dataSource={filteredHotels}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showTotal: (total) => `共 ${total} 家酒店`,
              showSizeChanger: false,
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
}
