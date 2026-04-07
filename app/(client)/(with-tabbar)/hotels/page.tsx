'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Input, DatePicker, Select, Button, Tag, Space, Typography, Card, Empty, Spin, Row, Col } from 'antd';
import { EnvironmentOutlined, SearchOutlined, AimOutlined, RightOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface HotelItem {
    id: number;
    name: string;
    address: string;
    starRating: number;
    minPrice: number;
    coverImage: string | null;
}

export default function HotelSearchPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('domestic');
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 搜索参数
    const [keyword, setKeyword] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs(), dayjs().add(1, 'day')]);
    const [priceFilter, setPriceFilter] = useState<string>('all');

    // 获取已发布的酒店列表
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await fetch('/api/hotels?published=true');
                const json = await res.json();
                if (json.success && json.data) {
                    setHotels(json.data);
                }
            } catch (error) {
                console.error('获取酒店列表失败:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    // 点击搜索按钮跳转到列表页
    const handleSearch = () => {
        // 构建查询参数
        const params = new URLSearchParams();

        // 关键词
        if (keyword) {
            params.set('keyword', keyword);
        }

        // 城市
        params.set('city', 'shanghai'); // 默认上海

        // 日期范围
        params.set('checkIn', dateRange[0].format('YYYY-MM-DD'));
        params.set('checkOut', dateRange[1].format('YYYY-MM-DD'));
        params.set('nights', String(nights));

        // 酒店类型
        params.set('type', activeTab);

        // 价格筛选
        if (priceFilter && priceFilter !== 'all') {
            params.set('price', priceFilter);
        }

        const queryString = params.toString();
        router.push(`/hotels/list${queryString ? `?${queryString}` : ''}`);
    };

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

    // 计算间夜数
    const nights = dateRange[1].diff(dateRange[0], 'day');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
            {/* 顶部 Banner*/}
            <div className="relative w-full h-48 sm:h-60 bg-blue-600 overflow-hidden">
                <Image
                    src="/hotel_img/hotel1.png"
                    alt="Luxury Hotel"
                    fill
                    className="object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20">
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-4xl font-bold tracking-widest">酒店 7 折起</h2>
                        <p className="text-sm sm:text-lg opacity-90 mt-2 font-light">发现您的完美避世之所</p>
                    </div>
                </div>
            </div>

            {/* 核心查询区域 - 增加毛玻璃效果*/}
            <div className="relative px-4 -mt-10 sm:-mt-12 max-w-2xl mx-auto w-full z-20">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/40 overflow-hidden">
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
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
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
                                value={dateRange}
                                onChange={(dates) => {
                                    if (dates && dates[0] && dates[1]) {
                                        setDateRange([dates[0], dates[1]]);
                                    }
                                }}
                                format={(value: any) => value.format('MM月DD日')}
                                placeholder={['入住日期', '离店日期']}
                                renderExtraFooter={() => (
                                    <div className="p-2 text-xs text-orange-500 bg-orange-50 select-none">
                                        当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"
                                    </div>
                                )}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">
                                    {dateRange[0].format('MM月DD日')} 入住 - {dateRange[1].format('MM月DD日')} 离店
                                </span>
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">共{nights}晚</span>
                            </div>
                        </div>

                        {/* 价格/星级 */}
                        <div className="border-b border-gray-100 pb-3">
                            <Select
                                value={priceFilter}
                                onChange={(value) => setPriceFilter(value)}
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
                                onClick={handleSearch}
                            >
                                查询
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 酒店列表展示区域 */}
            <div className="mt-8 px-4 max-w-4xl mx-auto w-full">
                <Title level={4} className="mb-4">热门酒店</Title>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Spin size="large" />
                    </div>
                ) : hotels.length === 0 ? (
                    <Empty description="暂无酒店数据" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {hotels.map((hotel) => (
                            <Col xs={24} sm={12} md={8} key={hotel.id}>
                                <Link href={`/hotels/${hotel.id}`}>
                                    <Card
                                        hoverable
                                        className="h-full overflow-hidden"
                                        cover={
                                            <div className="relative h-40">
                                                <Image
                                                    src={hotel.coverImage || '/hotel_img/hotel1.png'}
                                                    alt={hotel.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        }
                                    >
                                        <Card.Meta
                                            title={
                                                <div className="flex justify-between items-start">
                                                    <span className="text-base font-semibold truncate">{hotel.name}</span>
                                                    <span className="text-red-500 font-bold text-lg">
                                                        ¥{hotel.minPrice}
                                                        <span className="text-xs font-normal text-gray-400">起</span>
                                                    </span>
                                                </div>
                                            }
                                            description={
                                                <div>
                                                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                                                        <EnvironmentOutlined />
                                                        <span className="truncate">{hotel.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: hotel.starRating }, (_, i) => (
                                                            <StarFilled key={i} className="text-yellow-400 text-xs" />
                                                        ))}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* 底部功能区 */}
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
        /* 日期选择器移动端适配 - 单月显示 + 左右翻页 */
        @media (max-width: 640px) {
          .ant-picker-dropdown .ant-picker-panels > .ant-picker-panel:last-child {
            display: none !important;
          }
          .ant-picker-dropdown .ant-picker-panel:first-child .ant-picker-header-next-btn,
          .ant-picker-dropdown .ant-picker-panel:first-child .ant-picker-header-super-next-btn {
            visibility: visible !important;
          }
          .ant-picker-dropdown {
            max-width: 100vw;
          }
        }
      `}</style>
        </div>
    );
}
