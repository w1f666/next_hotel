'use client';

import React, { useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { HOTEL_STATUS_MAP } from '@/types';
import { auditHotel, toggleHotelStatus } from '@/lib/actions/hotel.actions';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface Props {
  initialData: any[];
}

export default function HotelTableClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  // --- 操作处理 ---
  const handleAudit = (record: any) => {
    setCurrentRecord(record);
    setIsModalVisible(true);
  };

  const onModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await auditHotel(currentRecord.id, values.status, values.rejectReason);

      if (res.success) {
        message.success('审核结果已提交');
        // 更新本地数据状态
        setData(prev => prev.map(item =>
          item.id === currentRecord.id
            ? { ...item, status: values.status, rejectReason: values.rejectReason }
            : item
        ));
        setIsModalVisible(false);
        form.resetFields();
      } else {
        message.error(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (record: any) => {
    const res = await toggleHotelStatus(record.id, record.status);
    if (res.success) {
      message.success(res.message);
      setData(prev => prev.map(item =>
        item.id === record.id ? { ...item, status: res.data.newStatus } : item
      ));
    } else {
      message.error(res.message);
    }
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </Space>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'minPrice',
      key: 'minPrice',
      render: (price: number) => <Text type="danger">¥{price}</Text>
    },
    {
      title: '审核状态',
      key: 'status',
      dataIndex: 'status',
      render: (status: number, record: any) => {
        const config = HOTEL_STATUS_MAP[status] || { label: '未知', color: 'default' };
        return (
          <Space>
            <Tag color={config.color}>{config.label}</Tag>
            {status === 2 && (
              <Tooltip title={`不通过原因：${record.rejectReason || '未填写'}`}>
                <InfoCircleOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {/* 只有在待审核或已拒绝时显示审核按钮，或者管理员想重审 */}
          <Button type="link" size="small" onClick={() => handleAudit(record)}>审核</Button>

          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/hotels/${record.id}`)}
          >
            详情
          </Button>

          {record.status === 1 || record.status === 3 ? (
            <Popconfirm
              title={`确定要${record.status === 1 ? '下线' : '上线'}该酒店吗？`}
              onConfirm={() => handleToggleStatus(record)}
            >
              <Button
                type="link"
                danger={record.status === 1}
                size="small"
                icon={record.status === 1 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
              >
                {record.status === 1 ? '下线' : '上线'}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0 }}>酒店列表管理</Title>
        <Space>
          <Input placeholder="检索酒店名称" prefix={<SearchOutlined />} style={{ width: 220 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/hotels/create')}>
            录入新酒店
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={`审核酒店 - ${currentRecord?.name}`}
        open={isModalVisible}
        onOk={onModalOk}
        confirmLoading={loading}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={1}>通过并发布</Select.Option>
              <Select.Option value={2}>不通过</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) =>
              getFieldValue('status') === 2 ? (
                <Form.Item
                  name="rejectReason"
                  label="不通过原因"
                  rules={[{ required: true, message: '请填写原因' }]}
                >
                  <Input.TextArea rows={4} placeholder="例如：资料不全..." />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}