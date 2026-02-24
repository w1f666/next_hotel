'use client';

import React, { useState } from 'react';
import {
  Form, Input, Select, DatePicker, InputNumber, Switch, Button,
  Card, Space, Divider, Tag, Typography, Row, Col, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, HomeOutlined, EnvironmentOutlined,
  StarOutlined, CalendarOutlined, PictureOutlined, AppstoreOutlined,
  DollarOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  STAR_RATING_OPTIONS, FACILITY_OPTIONS, CANCEL_POLICY_OPTIONS,
} from '@/types';
import type { HotelFormData, HotelRoom, HotelWithRooms } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface HotelFormProps {
  initialData?: HotelWithRooms;
  onSubmit: (data: HotelFormData) => Promise<void>;
  loading?: boolean;
  mode: 'create' | 'edit';
}

// 区块标题组件
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({
  icon, title, subtitle,
}) => (
  <div style={{ marginBottom: 24 }}>
    <Space align="center" size={8}>
      <span style={{ fontSize: 20, color: '#0066FF' }}>{icon}</span>
      <Title level={4} style={{ margin: 0, fontWeight: 600 }}>{title}</Title>
    </Space>
    {subtitle && (
      <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, marginLeft: 28 }}>
        {subtitle}
      </Paragraph>
    )}
  </div>
);

const HotelForm: React.FC<HotelFormProps> = ({ initialData, onSubmit, loading, mode }) => {
  const [form] = Form.useForm();

  // 初始化房型列表
  const defaultRooms: Partial<HotelRoom>[] = initialData?.rooms?.length
    ? initialData.rooms.map((r) => ({
        roomName: r.roomName,
        bedInfo: r.bedInfo,
        capacity: r.capacity,
        hasBreakfast: r.hasBreakfast,
        price: r.price,
        stock: r.stock,
        cancelPolicy: r.cancelPolicy,
      }))
    : [{ roomName: '', bedInfo: '', capacity: 2, hasBreakfast: false, price: 0, stock: 10, cancelPolicy: '免费取消' }];

  const initialValues = initialData
    ? {
        name: initialData.name,
        address: initialData.address,
        starRating: initialData.starRating,
        openingTime: initialData.openingTime ? dayjs(initialData.openingTime) : null,
        coverImage: initialData.coverImage || '',
        gallery: initialData.gallery?.join('\n') || '',
        facilities: initialData.facilities || [],
        rooms: defaultRooms,
      }
    : {
        starRating: 3,
        facilities: [],
        rooms: defaultRooms,
      };

  const handleFinish = async (values: any) => {
    try {
      const galleryStr: string = values.gallery || '';
      const galleryArr = galleryStr
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const formData: HotelFormData = {
        name: values.name,
        address: values.address,
        starRating: values.starRating,
        openingTime: values.openingTime ? values.openingTime.format('YYYY-MM-DD') : null,
        facilities: values.facilities || [],
        coverImage: values.coverImage || '',
        gallery: galleryArr,
        rooms: (values.rooms || []).map((room: any) => ({
          roomName: room.roomName,
          bedInfo: room.bedInfo || '',
          capacity: room.capacity || 2,
          hasBreakfast: room.hasBreakfast || false,
          price: Number(room.price) || 0,
          stock: room.stock || 10,
          cancelPolicy: room.cancelPolicy || '免费取消',
        })),
      };

      await onSubmit(formData);
    } catch (err) {
      console.error('表单提交异常', err);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      scrollToFirstError
      requiredMark="optional"
      size="large"
    >
      {/* ============ 基础信息 ============ */}
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <SectionHeader
          icon={<HomeOutlined />}
          title="基础信息"
          subtitle="填写酒店的核心信息，这些将直接展示给用户"
        />

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="酒店名称"
              rules={[{ required: true, message: '请输入酒店名称' }]}
              tooltip="支持中英文，建议包含地标或品牌便于用户搜索"
            >
              <Input placeholder="如：上海陆家嘴禧玥酒店 / Grand Hyatt Shanghai" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="starRating"
              label="酒店星级"
              rules={[{ required: true, message: '请选择星级' }]}
            >
              <Select options={STAR_RATING_OPTIONS} placeholder="选择星级档次" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label={<Space><EnvironmentOutlined /> 详细地址</Space>}
          rules={[{ required: true, message: '请输入酒店地址' }]}
        >
          <Input placeholder="省/市/区/街道门牌号" />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="openingTime"
              label={<Space><CalendarOutlined /> 开业时间</Space>}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="选择开业日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ============ 媒体素材 ============ */}
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <SectionHeader
          icon={<PictureOutlined />}
          title="媒体素材"
          subtitle="优质的图片能显著提升酒店的点击率与转化率"
        />

        <Form.Item
          name="coverImage"
          label="封面图 URL"
          tooltip="将展示在列表页卡片中，建议尺寸 800×600"
        >
          <Input placeholder="https://example.com/cover.jpg" />
        </Form.Item>

        <Form.Item
          name="gallery"
          label={
            <Space>
              相册图片 URL
              <Tooltip title="每行一个链接，将展示在详情页轮播区">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
        >
          <TextArea
            rows={4}
            placeholder={`每行粘贴一个图片链接，例如：\nhttps://example.com/lobby.jpg\nhttps://example.com/room.jpg\nhttps://example.com/pool.jpg`}
          />
        </Form.Item>
      </Card>

      {/* ============ 设施与服务 ============ */}
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <SectionHeader
          icon={<AppstoreOutlined />}
          title="设施与服务"
          subtitle="勾选酒店提供的设施，帮助用户快速了解配套"
        />

        <Form.Item name="facilities">
          <Select
            mode="multiple"
            placeholder="点击选择或搜索设施标签"
            options={FACILITY_OPTIONS.map((f) => ({ value: f, label: f }))}
            maxTagCount="responsive"
            allowClear
          />
        </Form.Item>
      </Card>

      {/* ============ 房型管理 ============ */}
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <SectionHeader
          icon={<DollarOutlined />}
          title="房型与定价"
          subtitle="至少添加一个房型，系统将自动计算最低展示价"
        />

        <Form.List name="rooms">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{
                    background: '#fafbfc',
                    borderRadius: 12,
                    padding: '20px 20px 4px',
                    marginBottom: 16,
                    border: '1px solid #f0f0f0',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Tag color="blue" style={{ margin: 0, borderRadius: 6 }}>
                      房型 {index + 1}
                    </Tag>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => remove(name)}
                      />
                    )}
                  </div>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'roomName']}
                        label="房型名称"
                        rules={[{ required: true, message: '请输入房型名称' }]}
                      >
                        <Input placeholder="如：豪华大床房" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'bedInfo']}
                        label="床型信息"
                      >
                        <Input placeholder="如：1张2米特大床" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'capacity']}
                        label="可住人数"
                      >
                        <InputNumber min={1} max={10} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label="每晚价格 (¥)"
                        rules={[{ required: true, message: '请输入价格' }]}
                      >
                        <InputNumber
                          min={0}
                          step={10}
                          precision={2}
                          style={{ width: '100%' }}
                          placeholder="936.00"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'stock']}
                        label="库存间数"
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'cancelPolicy']}
                        label="取消政策"
                      >
                        <Select
                          options={CANCEL_POLICY_OPTIONS.map((c) => ({ value: c, label: c }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'hasBreakfast']}
                        label="含早餐"
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="含早" unCheckedChildren="不含" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}

              <Button
                type="dashed"
                onClick={() =>
                  add({
                    roomName: '',
                    bedInfo: '',
                    capacity: 2,
                    hasBreakfast: false,
                    price: 0,
                    stock: 10,
                    cancelPolicy: '免费取消',
                  })
                }
                block
                icon={<PlusOutlined />}
                style={{ borderRadius: 10, height: 48 }}
              >
                添加房型
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* ============ 提交 ============ */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          {mode === 'create'
            ? '💡 提交后将自动进入审核流程，审核通过后即可对外展示'
            : '💡 修改后需要重新审核，审核通过后新信息才会对外展示'}
        </Text>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{
              borderRadius: 10,
              paddingInline: 40,
              height: 48,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0066FF 0%, #5B8DEF 100%)',
              border: 'none',
            }}
          >
            {mode === 'create' ? '提交并发起审核' : '保存修改'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default HotelForm;
