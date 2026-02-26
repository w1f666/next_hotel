'use client'

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message, Input, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { Hotel } from '@prisma/client';
import Link from 'next/link';
import { deleteHotel, approveHotel, rejectHotel } from '@/lib/actions/hotel.actions';

// 1. 抽取独立的类型
type HotelTableRow = Pick<Hotel, 'id' | 'name' | 'address' | 'starRating' | 'minPrice' | 'coverImage' | 'status' | 'rejectReason' | 'createdAt' | 'updatedAt'>;

interface Props {
  initialData: HotelTableRow[];
  onDeleted?: () => void;  // 删除后回调，用于刷新数据
  onUpdated?: () => void;  // 审核操作后刷新数据
}

export default function HotelTableClient({ initialData, onDeleted, onUpdated }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 删除酒店操作
  const handleDelete = async (id: number) => {
    setLoadingId(id);
    try {
      const result = await deleteHotel(id);
      if (result) {
        message.success('删除成功');
        onDeleted?.();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoadingId(null);
    }
  };

  // 审核通过
  const handleApprove = async (id: number) => {
    setLoadingId(id);
    try {
      const result = await approveHotel(id);
      if (result.success) {
        message.success('审核通过');
        onUpdated?.();
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoadingId(null);
    }
  };

  // 打开拒绝弹窗
  const openRejectModal = (id: number) => {
    setCurrentRejectId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // 确认拒绝
  const handleReject = async () => {
    if (!currentRejectId) return;
    if (!rejectReason.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }

    setLoadingId(currentRejectId);
    try {
      const result = await rejectHotel(currentRejectId, rejectReason);
      if (result.success) {
        message.success('已拒绝');
        setRejectModalVisible(false);
        onUpdated?.();
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoadingId(null);
      setCurrentRejectId(null);
    }
  };

  const columns: ColumnsType<HotelTableRow> = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (text: string) => (
        <span className="text-gray-600">
          <EnvironmentOutlined className="mr-1 text-gray-400" />
          {text}
        </span>
      ),
    },
    {
      title: '起步价',
      dataIndex: 'minPrice',
      key: 'minPrice',
      render: (price: number) => <span className="text-red-500 font-bold">¥{price}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: HotelTableRow) => {
        const statusMap: Record<number, { text: string; color: string }> = {
          0: { text: '待审核', color: 'orange' },
          1: { text: '已通过', color: 'green' },
          2: { text: '未通过', color: 'red' },
        };
        const info = statusMap[status] || { text: '未知', color: 'default' };
        return (
          <Tag color={info.color}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: HotelTableRow) => (
        <Space size="small">
          {/* 待审核状态显示审核按钮 */}
          {record.status === 0 && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                loading={loadingId === record.id}
                className="bg-green-500"
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => openRejectModal(record.id)}
                loading={loadingId === record.id}
              >
                拒绝
              </Button>
            </>
          )}

          {/* 已通过/已拒绝状态显示编辑和删除 */}
          {record.status !== 0 && (
            <>
              <Popconfirm
                title="确定要删除这个酒店吗？"
                description="删除后不可恢复，请谨慎操作"
                onConfirm={() => handleDelete(record.id)}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={loadingId === record.id}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Table
        columns={columns}
        dataSource={initialData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* 拒绝原因弹窗 */}
      <Modal
        title="驳回酒店审核"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={loadingId !== null}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <p className="mb-2 text-gray-500 text-sm">请说明拒绝该酒店上线的详细原因，该原因将发送给商户：</p>
          <Input.TextArea
            rows={4}
            placeholder="例如：酒店图片模糊、地址信息不全等..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
