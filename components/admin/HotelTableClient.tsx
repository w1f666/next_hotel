'use client'

import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
// 引入 ColumnsType 帮助提供准确的列类型推导
import type { ColumnsType } from 'antd/es/table'; 
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Hotel } from '@prisma/client';

// 1. 抽取出一个独立的类型，记得加上表格里用到的 'status' 字段
type HotelTableRow = Pick<Hotel, 'id' | 'name' | 'address' | 'starRating' | 'minPrice' | 'coverImage' | 'status'>;

interface Props {
    initialData: HotelTableRow[];
}

export default function HotelTableClient({ initialData }: Props) {

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
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'orange'}>
          {status === 1 ? '已营业' : '待审核'}
        </Tag>
      ),
    },
    {
  title: '操作',
  key: 'action',
  render: (_: any, record: HotelTableRow) => (
    <Space size="middle">
      <Button 
        type="link" 
        icon={<EditOutlined />}
        // 使用 record.id：点击时，告诉编辑逻辑你要编辑哪个酒店
        onClick={() => {
          console.log('准备编辑酒店 ID:', record.id);
          // router.push(`/hotels/edit/${record.id}`) 
        }}
      >
        编辑
      </Button>
      
      <Button 
        type="link" 
        danger 
        icon={<DeleteOutlined />}
        onClick={() => {
          console.log('准备删除酒店 ID:', record.id);
          // handleDelete(record.id)
        }}
      >
        删除
      </Button>
    </Space>
  ),
},
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="mb-4 flex justify-end">
        <Button type="primary" icon={<PlusOutlined />}>
          录入新酒店
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={initialData} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}