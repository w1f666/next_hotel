/*管理列表(table)*/

'use client';

// app/admin/hotels/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { Typography, Space, Badge } from 'antd';
import {
  AuditOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, InboxOutlined,
} from '@ant-design/icons';
import { fetchApi } from '@/lib/fetch-api';
import HotelTableClient from '@/app/admin/hotels/_components/HotelTableClient'; 
import type { HotelTableRow } from '@/types';

const { Title, Text } = Typography;

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<HotelTableRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新数据
  const refreshData = useCallback(async () => {
    const result = await fetchApi('/api/admin/hotels');
    if (result.ok) {
      setHotels(result.data || []);
    }
    setRefreshKey(prev => prev + 1);
  }, []);

  // 初始加载数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 统计
  const stats = {
    total: hotels.length,
    pending: hotels.filter(h => h.status === 0).length,
    approved: hotels.filter(h => h.status === 1).length,
    rejected: hotels.filter(h => h.status === 2).length,
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 顶部标题区 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>酒店审核管理</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>审核商户提交的酒店信息，确保平台内容质量</Text>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24,
      }}>
        {[
          { label: '全部酒店', value: stats.total, color: '#1a1a2e', bg: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%)', icon: <InboxOutlined /> },
          { label: '待审核', value: stats.pending, color: '#faad14', bg: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)', icon: <ClockCircleOutlined /> },
          { label: '已通过', value: stats.approved, color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', icon: <CheckCircleOutlined /> },
          { label: '已拒绝', value: stats.rejected, color: '#ff4d4f', bg: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)', icon: <CloseCircleOutlined /> },
        ].map(item => (
          <div key={item.label} style={{
            background: item.bg, borderRadius: 14, padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ color: item.color, fontSize: 14 }}>{item.icon}</span>
              <Text type="secondary" style={{ fontSize: 13 }}>{item.label}</Text>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color, lineHeight: 1 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      
      <HotelTableClient 
        key={refreshKey}
        initialData={hotels} 
        onDeleted={refreshData}
        onUpdated={refreshData}
      />
    </div>
  );
}
