'use client';

import React, { useState } from 'react';
import { Tabs, Input, DatePicker, Select, Button, Tag, Space, Typography } from 'antd';
import { EnvironmentOutlined, SearchOutlined, AimOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import Image from 'next/image';

dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function HotelSearchPage() {
    const [activeTab, setActiveTab] = useState('domestic');

    const tabsItems = [
        { key: 'domestic', label: '国内' },
        { key: 'overseas', label: '海外' },
        { key: 'hourly', label: '钟点房' },
        { key: 'bnb', label: '民宿' },
    ];

    const quickTags = [
        '免费停车场',
        '上海浦东国际机场',
        '上海虹桥国际机场',
        '亲子酒店',
        '精品酒店',
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col pb-10">
            {/* 顶部 Banner */}
            <div className="relative w-full h-48 sm:h-64 bg-blue-600 overflow-hidden cursor-pointer group" onClick={() => console.log('Navigate to promo')}>
                <Image
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
                    alt="Luxury Hotel"
                    fill
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold bg-black/20">
                    <div className="text-center drop-shadow-lg">
                        <h2 className="text-2xl sm:text-4xl tracking-widest">酒店 7 折起</h2>
                        <p className="text-sm sm:text-lg opacity-90 mt-2 font-light">发现您的完美避世之所</p>
                    </div>
                </div>
            </div>

            {/* 核心查询区域 */}
            <div className="relative px-4 -mt-10 sm:-mt-16 max-w-2xl mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 overflow-hidden">
                    {/* 类型切换 */}
                    <Tabs
                        activeKey={activeTab}
                        items={tabsItems}
                        onChange={setActiveTab}
                        className="search-tabs mb-2"
                    />

                    <div className="space-y-4">
                        {/* 地点 & 定位 */}
                        <div className="flex items-center border-b border-gray-100 pb-3 gap-2">
                            <div className="flex-shrink-0 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                <span className="text-xl font-bold">上海</span>
                                <EnvironmentOutlined className="text-gray-400" />
                            </div>
                            <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
                            <Input
                                placeholder="位置 / 品牌 / 酒店"
                                variant="borderless"
                                className="flex-grow text-lg"
                                suffix={<AimOutlined className="text-blue-500 text-xl cursor-pointer" />}
                            />
                        </div>

                        {/* 日期选择 */}
                        <div className="border-b border-gray-100 pb-3">
                            <RangePicker
                                variant="borderless"
                                className="w-full text-lg p-0"
                                suffixIcon={null}
                                separator={<span className="text-gray-300 mx-2">—</span>}
                                defaultValue={[dayjs(), dayjs().add(1, 'day')]}
                                format={(value: any) => value.format('MM月DD日')}
                                placeholder={['入住日期', '离店日期']}
                                renderExtraFooter={() => (
                                    <div className="p-2 text-xs text-orange-500 bg-orange-50 select-none">
                                        当前已过0点，如需今天凌晨6点前入住，请选择“今天凌晨”
                                    </div>
                                )}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">今天入住 - 明天离店</span>
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">共1晚</span>
                            </div>
                        </div>

                        {/* 价格/星级 */}
                        <div className="border-b border-gray-100 pb-3">
                            <Select
                                placeholder="价格 / 星级"
                                variant="borderless"
                                className="w-full text-lg p-0"
                                styles={{ popup: { root: { borderRadius: '12px' } } }}
                                options={[
                                    { value: 'all', label: '价格星级不限' },
                                    { value: '0-150', label: '¥150以下' },
                                    { value: '150-300', label: '¥150-300' },
                                    { value: '300-450', label: '¥300-450' },
                                    { value: '450-600', label: '¥450-600' },
                                    { value: '600+', label: '¥600以上' },
                                ]}
                            />
                        </div>

                        {/* 快捷标签 */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {quickTags.map((tag) => (
                                <Tag
                                    key={tag}
                                    className="bg-gray-100 border-none rounded-md px-3 py-1 cursor-pointer hover:bg-gray-200 text-gray-600 transition-all"
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>

                        {/* 查询按钮 */}
                        <div className="pt-4">
                            <Button
                                type="primary"
                                size="large"
                                block
                                className="h-14 text-xl font-bold rounded-xl shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 transition-all"
                                icon={<SearchOutlined />}
                            >
                                查询
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部功能区 (可选) */}
            <div className="mt-8 px-4 max-w-2xl mx-auto w-full grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                    <div>
                        <div className="font-bold text-gray-800">我的订单</div>
                        <div className="text-xs text-gray-400">查看行程安排</div>
                    </div>
                    <RightOutlined className="text-gray-300" />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                    <div>
                        <div className="font-bold text-gray-800">特惠酒店</div>
                        <div className="text-xs text-gray-400">低价精选推荐</div>
                    </div>
                    <RightOutlined className="text-gray-300" />
                </div>
            </div>

            <style jsx global>{`
        .search-tabs .ant-tabs-nav::before {
          display: none;
        }
        .search-tabs .ant-tabs-tab {
          padding: 8px 0;
          margin-right: 24px !important;
        }
        .search-tabs .ant-tabs-tab-btn {
          font-size: 16px;
          font-weight: 500;
          color: #666;
        }
        .search-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #0066FF !important;
          font-weight: 700;
        }
        .search-tabs .ant-tabs-ink-bar {
          height: 3px !important;
          border-radius: 3px;
        }
      `}</style>
        </div>
    );
}
