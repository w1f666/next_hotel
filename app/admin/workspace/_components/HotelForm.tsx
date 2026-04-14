'use client';

import React, { useState } from 'react';
import {
  Form, Input, Select, DatePicker, InputNumber, Switch, Button,
  Card, Space, Divider, Tag, Typography, Row, Col, message, Tooltip,
  Upload, Modal, App,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, HomeOutlined, EnvironmentOutlined,
  StarOutlined, CalendarOutlined, PictureOutlined, AppstoreOutlined,
  DollarOutlined, InfoCircleOutlined, UploadOutlined, InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  STAR_RATING_OPTIONS, FACILITY_OPTIONS, CANCEL_POLICY_OPTIONS,
} from '@/types';
import type { HotelFormData, HotelRoom, HotelWithRooms } from '@/types';
import { uploadSingleFile, uploadMultipleFiles } from '@/lib/upload';

const { Title, Text, Paragraph } = Typography;

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
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initialData?.coverImage || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialData?.gallery || []);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // 处理房型图片上传（直接写入表单字段，保持单一数据源）
  const handleRoomImageUpload = async (file: File, roomIndex: number) => {
    setUploading(true);
    try {
      const result = await uploadSingleFile(file);
      if (result.success && result.url) {
        form.setFieldValue(['rooms', roomIndex, 'imageUrl'], result.url);
        message.success('房型图片上传成功');
      } else {
        message.error(result.message || '上传失败');
      }
    } catch (error) {
      message.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
    return false;
  };

  // 删除房型图片
  const handleRemoveRoomImage = (roomIndex: number) => {
    form.setFieldValue(['rooms', roomIndex, 'imageUrl'], '');
  };

  // 处理封面上传
  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadSingleFile(file);
      if (result.success && result.url) {
        setCoverImageUrl(result.url);
        form.setFieldsValue({ coverImage: result.url });
        message.success('封面上传成功');
      } else {
        message.error(result.message || '上传失败');
      }
    } catch (error) {
      message.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
    return false;
  };

  // 处理相册上传 - 支持多文件同时上传
  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const result = await uploadMultipleFiles(Array.from(files));
      if (result.success && result.urls) {
        const newGalleryUrls = [...galleryUrls, ...result.urls];
        setGalleryUrls(newGalleryUrls);
        form.setFieldsValue({ gallery: newGalleryUrls.join('\n') });
        message.success(`成功上传 ${result.urls.length} 张图片`);
      } else {
        message.error(result.message || '上传失败');
      }
    } catch (error) {
      message.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
    return false;
  };

  // 删除相册图片
  const handleRemoveGallery = (url: string) => {
    const newGalleryUrls = galleryUrls.filter(item => item !== url);
    setGalleryUrls(newGalleryUrls);
    form.setFieldsValue({ gallery: newGalleryUrls.join('\n') });
  };

  // 图片预览
  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

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
        imageUrl: r.imageUrl,
      }))
    : [{ roomName: '', bedInfo: '', capacity: 0, hasBreakfast: false, price: 0, stock: 0, cancelPolicy: '', imageUrl: '' }];

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
        rooms: (values.rooms || []).map((room: any, index: number) => ({
          roomName: room.roomName,
          bedInfo: room.bedInfo || '',
          capacity: room.capacity || 0,
          hasBreakfast: room.hasBreakfast || false,
          price: Number(room.price) || 0,
          stock: room.stock || 10,
          cancelPolicy: room.cancelPolicy || '免费取消',
          imageUrl: room.imageUrl || '',
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

        {/* 封面图上传 */}
        <Form.Item
          name="coverImage"
          label="封面图"
          tooltip="将展示在列表页卡片中，建议尺寸 800×600"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div
              style={{
                width: 200,
                height: 150,
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                background: '#fafafa',
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleCoverUpload(file);
                };
                input.click();
              }}
            >
              {coverImageUrl && /^\/(uploads|hotel_img)\/[a-zA-Z0-9._-]+$/.test(coverImageUrl) ? (
                <>
                  <img src={coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  }}
                  className="hover:opacity-100"
                >
                  <Button size="small" style={{ color: '#fff', borderColor: '#fff' }}>
                    更换图片
                  </Button>
                </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <UploadOutlined style={{ fontSize: 32 }} />
                  <div style={{ marginTop: 8 }}>点击上传封面</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                支持 JPG、PNG 格式，文件大小不超过 5MB
              </Text>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="cover-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
              <Button
                icon={<UploadOutlined />}
                onClick={() => document.getElementById('cover-upload')?.click()}
                loading={uploading}
              >
                选择图片
              </Button>
              {coverImageUrl && (
                <Button
                  type="link"
                  danger
                  onClick={() => {
                    setCoverImageUrl('');
                    form.setFieldsValue({ coverImage: '' });
                  }}
                  style={{ marginLeft: 8 }}
                >
                  删除
                </Button>
              )}
            </div>
          </div>
        </Form.Item>

        {/* 相册上传 */}
        <Form.Item
          name="gallery"
          label="酒店相册"
          tooltip="将展示在详情页轮播区"
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                id="gallery-upload"
                onChange={(e) => {
                  const files = e.target.files;
                  handleGalleryUpload(files);
                  e.target.value = '';
                }}
              />
              <Button
                icon={<UploadOutlined />}
                onClick={() => document.getElementById('gallery-upload')?.click()}
                loading={uploading}
              >
                上传相册图片
              </Button>
              <Text type="secondary" style={{ marginLeft: 12 }}>
                支持多选，每张图片不超过 5MB
              </Text>
            </div>
            
            {/* 已上传的图片列表 */}
            {galleryUrls.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {galleryUrls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    <img
                      src={url}
                      alt={`gallery-${index}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onClick={() => handlePreview(url)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleRemoveGallery(url)}
                    >
                      <DeleteOutlined style={{ color: '#fff', fontSize: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form.Item>

        {/* 图片预览弹窗 */}
        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>

        {/* 隐藏的表单字段，用于存储URL */}
        <div style={{ display: 'none' }}>
          <Form.Item name="coverImage" noStyle>
            <Input />
          </Form.Item>
          <Form.Item name="gallery" noStyle>
            <Input />
          </Form.Item>
        </div>
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
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      zIndex: 10,
                    }}
                  >
                    <Tag color="blue" style={{ margin: 0, borderRadius: 6 }}>
                      房型 {index + 1}
                    </Tag>
                    {fields.length > 1 && (
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => remove(name)}
                        style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

                  {/* 房型图片上传 */}
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        label="房型图片"
                        shouldUpdate={(prev, cur) =>
                          prev?.rooms?.[index]?.imageUrl !== cur?.rooms?.[index]?.imageUrl
                        }
                      >
                        {() => {
                          const imageUrl = form.getFieldValue(['rooms', index, 'imageUrl']) || '';
                          const hasImage = imageUrl && /^\/(uploads|hotel_img)\/[a-zA-Z0-9._-]+$/.test(imageUrl);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div
                                style={{
                                  width: 100,
                                  height: 100,
                                  border: '2px dashed #d9d9d9',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  background: hasImage ? undefined : '#fafafa',
                                }}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleRoomImageUpload(file, index);
                                  };
                                  input.click();
                                }}
                              >
                                {hasImage ? (
                                  <>
                                    <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.3s',
                                      }}
                                    >
                                      <Button size="small" style={{ color: '#fff', borderColor: '#fff' }}>更换</Button>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ textAlign: 'center', color: '#999' }}>
                                    <UploadOutlined style={{ fontSize: 24 }} />
                                    <div style={{ fontSize: 10 }}>上传图片</div>
                                  </div>
                                )}
                              </div>
                              {hasImage && (
                                <Button
                                  type="link"
                                  danger
                                  onClick={() => handleRemoveRoomImage(index)}
                                >
                                  删除图片
                                </Button>
                              )}
                            </div>
                          );
                        }}
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
