/*管理列表(table)*/

// app/admin/hotels/page.tsx
import React from 'react';
import { getAdminHotels } from '@/lib/actions/hotel.actions';
import HotelTableClient from '@/components/admin/HotelTableClient'; 

// 服务端组件：在服务器直接查数据库
export default async function AdminHotelsPage() {
  const res = await getAdminHotels();
  const hotels = res.data?.hotels || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">酒店管理</h1>
      </div>
      
      <HotelTableClient initialData={hotels} />
    </div>
  );
'use client';

import React, { useState } from 'react';
import {
    Table,
    Tag,
    Space,
    Button,
    Card,
    Typography,
    Input,
    Select,
    Modal,
    Form,
    message,
    Tooltip,
    Layout,
    Menu,
    Breadcrumb,
    Popconfirm
} from 'antd';
import {
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ArrowDownOutlined,
    ArrowUpOutlined,
    DashboardOutlined,
    AuditOutlined,
    LogoutOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Header, Content, Sider } = Layout;

// --- 类型定义 ---
interface HotelRecord {
    key: string;
    name: string;
    submitTime: string;
    type: string;
    status: 'approved' | 'rejected' | 'auditing';
    isOffline: boolean;
    rejectReason?: string;
    contact: string;
}

export default function HotelAuditPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HotelRecord[]>([
        {
            key: '1',
            name: '上海锦江之星酒店',
            submitTime: '2026-02-21 14:30:00',
            type: '经济型',
            status: 'auditing',
            isOffline: false,
            contact: '138****0001',
        },
        {
            key: '2',
            name: '上海希尔顿大酒店',
            submitTime: '2026-02-20 10:15:00',
            type: '豪华型',
            status: 'approved',
            isOffline: false,
            contact: '021-****8888',
        },
        {
            key: '3',
            name: '浦东汉庭酒店',
            submitTime: '2026-02-19 16:45:00',
            type: '舒适型',
            status: 'rejected',
            isOffline: false,
            rejectReason: '提交的门脸图与实际不符，照片过于模糊',
            contact: '139****1111',
        },
        {
            key: '4',
            name: '外滩W精品酒店',
            submitTime: '2026-02-18 09:00:00',
            type: '豪华型',
            status: 'approved',
            isOffline: true,
            contact: '137****2222',
        }
    ]);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<HotelRecord | null>(null);
    const [form] = Form.useForm();

    // --- 操作处理 ---
    const handleAudit = (record: HotelRecord) => {
        setCurrentRecord(record);
        setIsModalVisible(true);
    };

    const onModalOk = async () => {
        const values = await form.validateFields();
        setLoading(true);
        // 模拟API调用
        setTimeout(() => {
            setData(prev => prev.map(item =>
                item.key === currentRecord?.key
                    ? { ...item, status: values.status, rejectReason: values.rejectReason }
                    : item
            ));
            message.success('审核结果已提交');
            setLoading(false);
            setIsModalVisible(false);
            form.resetFields();
        }, 800);
    };

    const handleToggleOffline = (record: HotelRecord) => {
        const action = record.isOffline ? '上线' : '下线';
        setData(prev => prev.map(item =>
            item.key === record.key ? { ...item, isOffline: !item.isOffline } : item
        ));
        message.success(`酒店已${action}`);
    };

    // --- 表格列定义 ---
    const columns = [
        {
            title: '酒店名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: HotelRecord) => (
                <Space orientation="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>联系：{record.contact}</Text>
                </Space>
            )
        },
        {
            title: '申请类型',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            key: 'submitTime',
        },
        {
            title: '审核状态',
            key: 'status',
            dataIndex: 'status',
            render: (status: string, record: HotelRecord) => {
                let color = 'blue';
                let icon = <SyncOutlined spin />;
                let text = '审核中';

                if (status === 'approved') {
                    color = 'success';
                    icon = <CheckCircleOutlined />;
                    text = '审核通过';
                } else if (status === 'rejected') {
                    color = 'error';
                    icon = <CloseCircleOutlined />;
                    text = '审核不通过';
                }

                return (
                    <Space>
                        <Tag icon={icon} color={color}>{text}</Tag>
                        {status === 'rejected' && (
                            <Tooltip title={`不通过原因：${record.rejectReason}`}>
                                <InfoCircleOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
        {
            title: '运营状态',
            key: 'isOffline',
            render: (_: any, record: HotelRecord) => (
                record.isOffline ? <Tag color="default">已下线</Tag> : <Tag color="cyan">在线中</Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: HotelRecord) => (
                <Space size="middle">
                    {record.status === 'auditing' ? (
                        <Button type="link" size="small" onClick={() => handleAudit(record)}>审核</Button>
                    ) : (
                        <Button type="link" size="small" onClick={() => handleAudit(record)}>重审</Button>
                    )}

                    <Popconfirm
                        title={`确定要${record.isOffline ? '上线' : '下线'}该酒店吗？`}
                        onConfirm={() => handleToggleOffline(record)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="link"
                            danger={!record.isOffline}
                            size="small"
                            icon={record.isOffline ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        >
                            {record.isOffline ? '上线发布' : '下线整改'}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: 24, borderRadius: '8px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>酒店信息审核/发布列表</Title>
                <Space>
                    <Input placeholder="输入酒店名称" prefix={<SearchOutlined />} style={{ width: 250 }} />
                    <Select placeholder="审核状态" style={{ width: 120 }} allowClear>
                        <Select.Option value="auditing">审核中</Select.Option>
                        <Select.Option value="approved">已通过</Select.Option>
                        <Select.Option value="rejected">未通过</Select.Option>
                    </Select>
                    <Button type="primary">搜索</Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
            />

            {/* 审核弹窗 */}
            <Modal
                title={`审核酒店信息 - ${currentRecord?.name}`}
                open={isModalVisible}
                onOk={onModalOk}
                confirmLoading={loading}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                okText="确认完成"
                cancelText="取消"
            >
                <Form form={form} layout="vertical" initialValues={{ status: 'approved' }}>
                    <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="approved">通过并发布</Select.Option>
                            <Select.Option value="rejected">不通过</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('status') === 'rejected' ? (
                                <Form.Item
                                    name="rejectReason"
                                    label="不通过原因"
                                    rules={[{ required: true, message: '请填写不通过的具体原因' }]}
                                >
                                    <Input.TextArea rows={4} placeholder="例如：营业执照过期、图片违规、信息不完整等..." />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}