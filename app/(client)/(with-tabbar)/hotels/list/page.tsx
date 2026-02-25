'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Input, DatePicker, Select, Button, Tag, Space, Typography, 
  Card, Spin, Empty, Checkbox, Modal 
} from 'antd';
import { 
  EnvironmentOutlined, SearchOutlined, AimOutlined, 
  StarFilled, FilterOutlined, CloseOutlined, 
  ArrowLeftOutlined, CalendarOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { Group: CheckboxGroup } = Checkbox;

// ==================== 类型定义 ====================
interface HotelItem {
  id: number;
  name: string;
  address: string;
  starRating: number;
  minPrice: number;
  coverImage: string | null;
  facilities: string[];
}

// 筛选条件
interface FilterParams {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  keyword: string;
  priceRange: [number, number] | null;
  starRatings: number[];
  facilities: string[];
}

// ==================== 常量数据 ====================
const CITIES = [
  { value: 'shanghai', label: '上海' },
  { value: 'beijing', label: '北京' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'chengdu', label: '成都' },
  { value: 'xian', label: '西安' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
];

const STAR_OPTIONS = [
  { label: '⭐⭐ 经济型', value: 2 },
  { label: '⭐⭐⭐ 舒适型', value: 3 },
  { label: '⭐⭐⭐⭐ 高档型', value: 4 },
  { label: '⭐⭐⭐⭐⭐ 豪华型', value: 5 },
];

const FACILITY_OPTIONS = [
  '免费WiFi', '免费停车', '健身房', '游泳池', '餐厅',
  '会议室', '行政酒廊', '洗衣服务', '礼宾服务', '机器人服务',
  '空调', '电梯', '无烟楼层', 'SPA', '商务中心',
];

const PRICE_RANGES = [
  { label: '不限', value: 'all' },
  { label: '¥150以下', value: '0-150' },
  { label: '¥150-300', value: '150-300' },
  { label: '¥300-450', value: '300-450' },
  { label: '¥450-600', value: '450-600' },
  { label: '¥600以上', value: '600+' },
];

// ==================== 主页面组件 ====================
export default function HotelListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  
  // 状态管理
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  // 筛选条件状态
  const [filterVisible, setFilterVisible] = useState(false);
  const [city, setCity] = useState(searchParams.get('city') || 'shanghai');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    searchParams.get('checkIn') ? dayjs(searchParams.get('checkIn')) : dayjs(),
    searchParams.get('checkOut') ? dayjs(searchParams.get('checkOut')) : dayjs().add(1, 'day')
  ]);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  
  // 从URL参数初始化价格筛选
  const getInitialPriceRange = (): [number, number] | null => {
    const priceParam = searchParams.get('price');
    if (!priceParam || priceParam === 'all') return null;
    
    if (priceParam === '600+') {
      return [600, 99999];
    }
    const [min, max] = priceParam.split('-').map(Number);
    return [min, max];
  };
  
  // 获取价格筛选的显示值
  const getPriceSelectValue = (): string => {
    if (!priceRange) return 'all';
    if (priceRange[1] >= 99999) return '600+';
    return `${priceRange[0]}-${priceRange[1]}`;
  };
  
  const [priceRange, setPriceRange] = useState<[number, number] | null>(getInitialPriceRange);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  // 计算间夜数
  const nights = dateRange[1].diff(dateRange[0], 'day');

  // 获取酒店列表数据
  const fetchHotels = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // 构建筛选参数
      const params = new URLSearchParams();
      params.append('status', '1');  // 只获取已发布的酒店
      params.append('page', String(pageNum));
      params.append('pageSize', '10');
      
      if (keyword) {
        params.append('keyword', keyword);
      }
      
      // 添加价格筛选
      if (priceRange) {
        params.append('minPrice', String(priceRange[0]));
        params.append('maxPrice', String(priceRange[1]));
      }
      
      // 添加星级筛选
      if (selectedStars.length > 0) {
        params.append('starRating', selectedStars.join(','));
      }
      
      const res = await fetch(`/api/hotels?${params.toString()}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        const newHotels = json.data.map((h: any) => ({
          id: h.id,
          name: h.name,
          address: h.address,
          starRating: h.starRating,
          minPrice: h.minPrice,
          coverImage: h.coverImage,
          facilities: h.facilities || [],
        }));
        
        if (isRefresh || pageNum === 1) {
          setHotels(newHotels);
        } else {
          setHotels(prev => [...prev, ...newHotels]);
        }
        
        // 判断是否还有更多数据
        if (json.pagination) {
          setHasMore(pageNum < json.pagination.totalPages);
        } else {
          setHasMore(newHotels.length >= 10);
        }
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [keyword, priceRange, selectedStars, selectedFacilities]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    setPage(1);
    fetchHotels(1, true);
  }, [keyword, priceRange, selectedStars, selectedFacilities, fetchHotels]);

  // 加载更多
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHotels(nextPage);
    }
  };

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchHotels(1, true);
  };

  // 搜索按钮点击
  const handleSearch = () => {
    setPage(1);
    fetchHotels(1, true);
  };

  // 清除筛选
  const clearFilters = () => {
    setPriceRange(null);
    setSelectedStars([]);
    setSelectedFacilities([]);
    setKeyword('');
  };

  // 获取当前筛选数量
  const getFilterCount = () => {
    let count = 0;
    if (priceRange) count++;
    if (selectedStars.length > 0) count++;
    if (selectedFacilities.length > 0) count++;
    return count;
  };

  // 渲染筛选弹窗
  const renderFilterModal = () => (
    <Modal
      open={filterVisible}
      title={
        <div className="flex items-center justify-between">
          <span>筛选</span>
          <Button type="link" size="small" onClick={clearFilters}>
            清除全部
          </Button>
        </div>
      }
      footer={
        <div className="flex gap-2">
          <Button block onClick={() => setFilterVisible(false)}>
            取消
          </Button>
          <Button 
            type="primary" 
            block 
            onClick={() => {
              setFilterVisible(false);
              setPage(1);
              fetchHotels(1, true);
            }}
          >
            确定
          </Button>
        </div>
      }
      onCancel={() => setFilterVisible(false)}
      className="filter-modal"
    >
      <div className="space-y-6">
        {/* 价格筛选 */}
        <div>
          <div className="font-medium mb-3">价格</div>
          <Select
            value={getPriceSelectValue()}
            onChange={(val: string) => {
              if (val === 'all') {
                setPriceRange(null);
              } else if (val === '600+') {
                setPriceRange([600, 99999]);
              } else {
                const [min, max] = val.split('-').map(Number);
                setPriceRange([min, max]);
              }
            }}
            options={PRICE_RANGES}
            className="w-full"
          />
        </div>

        {/* 星级筛选 */}
        <div>
          <div className="font-medium mb-3">星级</div>
          <CheckboxGroup
            value={selectedStars}
            onChange={(vals: (string | number | readonly string[])[]) => setSelectedStars(vals as number[])}
            className="flex flex-wrap gap-2"
          >
            {STAR_OPTIONS.map((star) => (
              <Checkbox key={star.value} value={star.value}>
                {star.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* 设施筛选 */}
        <div>
          <div className="font-medium mb-3">设施</div>
          <CheckboxGroup
            value={selectedFacilities}
            onChange={(vals: (string | number | readonly string[])[]) => setSelectedFacilities(vals as string[])}
            className="flex flex-wrap gap-2"
          >
            {FACILITY_OPTIONS.map((facility) => (
              <Checkbox key={facility} value={facility}>
                {facility}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </div>
    </Modal>
  );

  // 渲染酒店卡片
  const renderHotelCard = (hotel: HotelItem) => (
    <Link href={`/hotels/${hotel.id}`} key={hotel.id}>
      <Card
        className="mb-3 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        bodyStyle={{ padding: '12px' }}
      >
        <div className="flex gap-3">
          {/* 酒店图片 */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
            <Image
              src={hotel.coverImage || '/hotel_img/hotel1.png'}
              alt={hotel.name}
              fill
              className="object-cover"
            />
          </div>
          
          {/* 酒店信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-base truncate flex-1">
                {hotel.name}
              </h3>
              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-red-500 font-bold text-lg">
                  ¥{hotel.minPrice}
                </span>
                <span className="text-xs text-gray-400">起</span>
              </div>
            </div>
            
            {/* 评分和星级 */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {Array.from({ length: hotel.starRating }, (_, i) => (
                  <StarFilled key={i} className="text-yellow-400 text-xs" />
                ))}
              </div>
              <Text type="secondary" className="text-xs">
                {hotel.starRating}星级
              </Text>
            </div>
            
            {/* 地址 */}
            <div className="flex items-center gap-1 mt-1">
              <EnvironmentOutlined className="text-gray-400 text-xs" />
              <Text type="secondary" className="text-xs truncate">
                {hotel.address}
              </Text>
            </div>
            
            {/* 设施标签 */}
            {hotel.facilities && hotel.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hotel.facilities.slice(0, 3).map((facility, idx) => (
                  <Tag key={idx} className="text-xs py-0 px-1">
                    {facility}
                  </Tag>
                ))}
                {hotel.facilities.length > 3 && (
                  <Text type="secondary" className="text-xs">
                    +{hotel.facilities.length - 3}
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={listRef}>
      {/* 顶部筛选头 */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        {/* 城市 + 日期行 */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {/* 城市选择 */}
            <div 
              className="flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-gray-50"
              onClick={() => {}}
            >
              <span className="font-medium text-base">{CITIES.find(c => c.value === city)?.label || '上海'}</span>
              <span className="text-gray-400">▼</span>
            </div>
            
            {/* 分割线 */}
            <div className="h-4 w-px bg-gray-200"></div>
            
            {/* 日期选择 */}
            <div 
              className="flex-1 flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-gray-50"
              onClick={() => {}}
            >
              <CalendarOutlined className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {dateRange[0].format('MM/DD')} - {dateRange[1].format('MM/DD')}
              </span>
              <Tag color="blue" className="ml-1 text-xs">
                {nights}晚
              </Tag>
            </div>
          </div>
          
          {/* 搜索框行 */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="搜索酒店名/位置/品牌"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
                className="rounded-full"
              />
            </div>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setFilterVisible(true)}
              className="relative"
            >
              筛选
              {getFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {getFilterCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* 快捷筛选标签 */}
        <div className="px-3 py-2 overflow-x-auto flex gap-2 border-b border-gray-100">
          <Tag 
            className={`cursor-pointer ${!priceRange ? 'bg-blue-50 border-blue-500' : ''}`}
            onClick={() => setPriceRange(null)}
          >
            价格不限
          </Tag>
          <Tag 
            className={`cursor-pointer ${priceRange?.[1] === 300 ? 'bg-blue-50 border-blue-500' : ''}`}
            onClick={() => setPriceRange([0, 300])}
          >
            ¥300以下
          </Tag>
          <Tag 
            className={`cursor-pointer ${priceRange?.[0] === 300 && priceRange?.[1] === 600 ? 'bg-blue-50 border-blue-500' : ''}`}
            onClick={() => setPriceRange([300, 600])}
          >
            ¥300-600
          </Tag>
          <Tag 
            className={`cursor-pointer ${priceRange?.[0] === 600 ? 'bg-blue-50 border-blue-500' : ''}`}
            onClick={() => setPriceRange([600, 99999])}
          >
            ¥600以上
          </Tag>
          {selectedStars.map(star => (
            <Tag 
              key={star} 
              closable 
              onClose={() => setSelectedStars(prev => prev.filter(s => s !== star))}
              className="bg-blue-50"
            >
              {star}星
            </Tag>
          ))}
        </div>
      </div>

      {/* 酒店列表 */}
      <div className="flex-1 px-3 py-2">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : hotels.length === 0 ? (
          <div className="py-20">
            <Empty description="暂无符合条件的酒店" />
          </div>
        ) : (
          <div className="pb-4">
            {/* 结果统计 */}
            <div className="mb-2 text-sm text-gray-500">
              为您找到 {hotels.length} 家酒店
            </div>
            
            {/* 酒店列表 */}
            {hotels.map(renderHotelCard)}
            
            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-4">
                <Button 
                  loading={loadingMore} 
                  onClick={loadMore}
                >
                  {loadingMore ? '加载中...' : '点击加载更多'}
                </Button>
              </div>
            )}
            
            {/* 无更多数据提示 */}
            {!hasMore && hotels.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                ─── 已加载全部 ───
              </div>
            )}
          </div>
        )}
      </div>

      {/* 筛选弹窗 */}
      {renderFilterModal()}
    </div>
  );
}
