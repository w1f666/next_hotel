'use client';

import 'antd-mobile/es/global';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Spin, Empty
} from 'antd';
import { CalendarPicker } from 'antd-mobile';
import { unstableSetRender } from 'antd-mobile';
import { createRoot, type Root } from 'react-dom/client';
import { 
  EnvironmentOutlined, SearchOutlined, 
  FilterOutlined, CloseOutlined, 
  CalendarOutlined, FireFilled, LeftOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HotelListItem } from '@/types';
import HotelCard from '../components/HotelCard';
import FilterModal from '../components/FilterModal';

dayjs.locale('zh-cn');

// --- React 19 兼容性补丁 ---
unstableSetRender((node: React.ReactNode, container: Element | DocumentFragment) => {
  const root: Root = createRoot(container as HTMLElement);
  root.render(node);
  return async () => {
    root.unmount();
  };
});

// ==================== 常量数据 ====================
const CITIES = [
  { value: 'all', label: '全部'},
  { value: 'shanghai', label: '上海' },
  { value: 'beijing', label: '北京' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'chengdu', label: '成都' },
  { value: 'xian', label: '西安' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
];

// ==================== 主页面组件 ====================
function HotelListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ===== 列表数据 & 分页（cursor 只在回调中读写，无需 state） =====
  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<number | null>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // ===== 筛选条件 =====
  const [filterVisible, setFilterVisible] = useState(false);
  const [city, setCity] = useState(searchParams.get('city'));
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    searchParams.get('checkIn') ? dayjs(searchParams.get('checkIn')) : dayjs(),
    searchParams.get('checkOut') ? dayjs(searchParams.get('checkOut')) : dayjs().add(1, 'day')
  ]);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(() => {
    const p = searchParams.get('price');
    if (!p || p === 'all') return null;
    if (p === '600+') return [600, 99999];
    const [min, max] = p.split('-').map(Number);
    return [min, max];
  });
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  // ===== UI 状态 =====
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // ===== 关键词防抖 =====
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);
  
  // ===== 派生值 =====
  const nights = dateRange[1].diff(dateRange[0], 'day');
  const filterCount = (priceRange ? 1 : 0) + (selectedStars.length > 0 ? 1 : 0) + (selectedFacilities.length > 0 ? 1 : 0);

  // ===== URL 同步 =====
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    if (city) params.set('city', city);
    params.set('checkIn', dateRange[0].format('YYYY-MM-DD'));
    params.set('checkOut', dateRange[1].format('YYYY-MM-DD'));
    if (priceRange) {
      params.set('price', priceRange[1] >= 99999 ? '600+' : `${priceRange[0]}-${priceRange[1]}`);
    }
    if (selectedStars.length > 0) params.set('stars', selectedStars.join(','));
    if (selectedFacilities.length > 0) params.set('facilities', selectedFacilities.join(','));
    const qs = params.toString();
    router.replace(`/hotels/list${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedKeyword, city, dateRange, priceRange, selectedStars, selectedFacilities, router]);

  // 点击外部关闭城市选择器
  useEffect(() => {
    if (!cityPickerVisible) return;
    const handler = (e: MouseEvent) => {
      if (cityPickerRef.current && !cityPickerRef.current.contains(e.target as Node)) {
        setCityPickerVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cityPickerVisible]);

  // ===== 数据请求（不需要 useCallback，通过 ref 给滚动回调使用） =====
  const fetchHotels = async (isLoadMore: boolean) => {
    // 新的筛选请求时取消上一次未完成的请求
    if (!isLoadMore) {
      abortControllerRef.current?.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!isLoadMore) {
        setLoading(true);
        cursorRef.current = null;
        hasMoreRef.current = true;
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams({ status: '1', pageSize: '10' });
      params.set('cursor', isLoadMore && cursorRef.current ? String(cursorRef.current) : '');
      if (debouncedKeyword) params.set('keyword', debouncedKeyword);
      if (priceRange) {
        params.set('minPrice', String(priceRange[0]));
        params.set('maxPrice', String(priceRange[1]));
      }
      if (selectedStars.length > 0) params.set('starRating', selectedStars.join(','));
      if (selectedFacilities.length > 0) params.set('facilities', selectedFacilities.join(','));
      const cityLabel = CITIES.find(c => c.value === city)?.label;
      if (cityLabel) params.set('city', cityLabel);
      
      const res = await fetch(`/api/hotels?${params}`, { signal: controller.signal });
      if (!res.ok) return;
      const json = await res.json();
      
      if (json.success && json.data) {
        const newHotels: HotelListItem[] = json.data.map((h: any) => ({
          id: h.id, name: h.name, address: h.address, starRating: h.starRating,
          minPrice: h.minPrice, coverImage: h.coverImage,
          facilities: h.facilities || [], latitude: h.latitude ?? null,
          longitude: h.longitude ?? null, createdAt: h.createdAt,
        }));
        
        if (isLoadMore) {
          // 追加：去重合并，防止异步竞态导致的重复数据
          setHotels(prev => {
            const ids = new Set(prev.map(h => h.id));
            return [...prev, ...newHotels.filter(h => !ids.has(h.id))];
          });
        } else {
          setHotels(newHotels);
        }
        
        cursorRef.current = json.nextCursor ?? null;
        hasMoreRef.current = json.hasMore ?? false;
        setHasMore(json.hasMore ?? false);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('获取酒店列表失败:', error);
    } finally {
      if (controller.signal.aborted) return;
      setLoading(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };
  
  // 始终指向最新 fetchHotels（避免滚动回调中的闭包陷阱）
  const fetchRef = useRef(fetchHotels);
  fetchRef.current = fetchHotels;

  // 筛选变化 → 重新加载
  useEffect(() => {
    fetchRef.current(false);
  }, [debouncedKeyword, priceRange, selectedStars, selectedFacilities, city]);

  // 组件卸载时取消未完成的请求
  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  // ===== 虚拟滚动 =====
  const virtualizer = useVirtualizer({
    count: hotels.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 310,
    overscan: 3,
  });

  // 滚动到底部时加载更多
  useEffect(() => {
    if (loading) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        fetchRef.current(true);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // 清除筛选
  const clearFilters = () => {
    setPriceRange(null);
    setSelectedStars([]);
    setSelectedFacilities([]);
    setKeyword('');
  };

  return (
      <div className="h-screen flex flex-col bg-[#f4f4f2]">
      {/* ====== 顶部搜索栏 —— 深色高级感 ====== */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e1e32] to-[#252538] sticky top-0 z-40 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex-shrink-0">
        {/* 返回首页 + 城市 + 日期 */}
        <div className="px-4 pt-3.5 pb-1">
          <div className="flex items-center gap-2.5">
            {/* 返回首页 */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 cursor-pointer active:bg-white/20 transition-all flex-shrink-0"
              onClick={() => router.push('/hotels')}
            >
              <LeftOutlined className="text-white text-xs" />
            </div>
            {/* 城市选择器 */}
            <div className="relative" ref={cityPickerRef}>
              <div 
                className="flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-white/10 border border-white/10 active:bg-white/20 transition-all"
                onClick={() => setCityPickerVisible(!cityPickerVisible)}
              >
                <EnvironmentOutlined className="text-white/50 text-xs" />
                <span className="font-semibold text-sm text-white tracking-wide">
                  {CITIES.find(c => c.value === city)?.label || '上海'}
                </span>
                <span className="text-white/40 text-[9px] ml-0.5">▼</span>
              </div>
              {cityPickerVisible && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
                  <div className="grid grid-cols-3 gap-2">
                    {CITIES.map(c => (
                      <div
                        key={c.value}
                        className={`text-center text-sm py-1.5 px-2 rounded-lg cursor-pointer transition-all ${
                          city === c.value
                            ? 'bg-[#1a1a2e] text-white font-medium'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                        onClick={() => { setCity(c.value); setCityPickerVisible(false); }}
                      >
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 日期选择器 */}
            <div 
              className="flex-1 flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-xl bg-white/10 border border-white/10 active:bg-white/20 transition-all"
              onClick={() => setDatePickerOpen(true)}
            >
              <CalendarOutlined className="text-white/50 text-xs" />
              <span className="text-[13px] font-medium text-white/90">
                {dateRange[0].format('M月D日')} — {dateRange[1].format('M月D日')}
              </span>
              <span className="text-[10px] text-white/80 font-bold bg-white/15 px-1.5 py-0.5 rounded-md ml-auto">
                {nights}晚
              </span>
            </div>
          </div>
        </div>

        {/* 移动端日期选择器（全屏弹出，不会溢出） */}
        <CalendarPicker
          visible={datePickerOpen}
          selectionMode="range"
          value={[dateRange[0].toDate(), dateRange[1].toDate()]}
          onClose={() => setDatePickerOpen(false)}
          onMaskClick={() => setDatePickerOpen(false)}
          min={new Date()}
          onConfirm={(val) => {
            if (val && Array.isArray(val) && val[0] && val[1]) {
              setDateRange([dayjs(val[0]), dayjs(val[1])]);
              setDatePickerOpen(false);
            }
          }}
        />
          
        {/* 搜索框 */}
        <div className="px-4 mt-2.5 flex items-center gap-2.5">
          <div className="flex-1 flex items-center bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            <SearchOutlined className="text-gray-400 text-[15px] mr-2.5" />
            <input
              placeholder="搜索酒店名称、位置或品牌"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setDebouncedKeyword(keyword)}
              className="flex-1 text-[13px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {keyword && (
              <div 
                className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer active:bg-gray-300 ml-1" 
                onClick={() => setKeyword('')}
              >
                <CloseOutlined className="text-gray-500 text-[8px]" />
              </div>
            )}
          </div>
          <div
            className="relative w-11 h-11 flex items-center justify-center bg-white/15 border border-white/20 rounded-2xl cursor-pointer active:bg-white/25 transition-all backdrop-blur-sm"
            onClick={() => setFilterVisible(true)}
          >
            <FilterOutlined className="text-white text-[15px]" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold border-2 border-[#1a1a2e] shadow-sm">
                {filterCount}
              </span>
            )}
          </div>
        </div>
      </div>
        
      {/* ====== 快捷筛选横条 ====== */}
      <div className="bg-white px-4 py-3 overflow-x-auto flex gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] [&::-webkit-scrollbar]:hidden">
        {[
          { label: '推荐', active: !priceRange && selectedStars.length === 0, 
            onClick: () => { setPriceRange(null); setSelectedStars([]); } },
          { label: '¥300以下', active: priceRange?.[1] === 300, 
            onClick: () => setPriceRange([0, 300]) },
          { label: '¥300-600', active: priceRange?.[0] === 300 && priceRange?.[1] === 600, 
            onClick: () => setPriceRange([300, 600]) },
          { label: '¥600+', active: priceRange?.[0] === 600, 
            onClick: () => setPriceRange([600, 99999]) },
        ].map((tag) => (
          <div 
            key={tag.label}
            className={`flex-shrink-0 cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
              tag.active 
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e] shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 active:bg-gray-100'
            }`}
            onClick={tag.onClick}
          >
            {tag.label}
          </div>
        ))}
        {selectedStars.map(star => (
          <div 
            key={star} 
            className="flex-shrink-0 cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 active:bg-amber-100"
            onClick={() => setSelectedStars(prev => prev.filter(s => s !== star))}
          >
            {star}星 <CloseOutlined className="text-[7px] opacity-60" />
          </div>
        ))}
        {selectedFacilities.slice(0, 2).map(f => (
          <div 
            key={f} 
            className="flex-shrink-0 cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium bg-stone-50 text-stone-600 border border-stone-200 flex items-center gap-1 active:bg-stone-100"
            onClick={() => setSelectedFacilities(prev => prev.filter(x => x !== f))}
          >
            {f} <CloseOutlined className="text-[7px] opacity-60" />
          </div>
        ))}
        {selectedFacilities.length > 2 && (
          <div className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium bg-stone-50 text-stone-600 border border-stone-200">
            +{selectedFacilities.length - 2}
          </div>
        )}
      </div>

      {/* ====== 酒店列表区域 (虚拟滚动) ====== */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="px-4 pt-4 pb-2">
        {loading ? (
          /* 骨架屏加载态 */
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[20px] overflow-hidden shadow-sm animate-pulse">
                <div className="w-full h-[180px] bg-gray-200" />
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-gray-100 rounded w-12" />
                    <div className="h-5 bg-gray-100 rounded w-12" />
                    <div className="h-5 bg-gray-100 rounded w-12" />
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <div className="h-3 bg-gray-100 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="py-20 bg-white rounded-[20px] mt-2 shadow-sm">
            <Empty 
              description={
                <div className="space-y-3 mt-2">
                  <p className="text-gray-400 text-sm">没有找到符合条件的酒店</p>
                  <button 
                    onClick={clearFilters}
                    className="text-sm font-medium text-white bg-[#1a1a2e] rounded-full px-5 py-2 active:bg-[#2a2a3e] transition-colors"
                  >
                    清除筛选
                  </button>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          </div>
        ) : (
          <div className="pb-4">
            {/* 结果统计 */}
            <div className="mb-3 flex items-center gap-2 px-0.5">
              <FireFilled className="text-orange-500 text-xs" />
              <span className="text-[13px] text-gray-600">
                精选 <span className="font-bold text-gray-900">{hotels.length}</span> 家优质酒店
              </span>
            </div>
            
            {/* 虚拟滚动酒店卡片列表 */}
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={hotels[virtualRow.index].id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <HotelCard hotel={hotels[virtualRow.index]} />
                </div>
              ))}
            </div>
            
            {/* 加载更多状态 */}
            <div className="py-4">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2.5 py-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span className="text-gray-400 text-xs">探索更多好酒店...</span>
                </div>
              )}
            </div>
            
            {/* 无更多数据 */}
            {!hasMore && hotels.length > 0 && (
              <div className="text-center py-6 flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
                <span className="text-gray-400 text-[11px] tracking-wider">已展示全部</span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* 筛选弹窗 */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        priceRange={priceRange}
        selectedStars={selectedStars}
        selectedFacilities={selectedFacilities}
        onConfirm={(filters) => {
          setPriceRange(filters.priceRange);
          setSelectedStars(filters.selectedStars);
          setSelectedFacilities(filters.selectedFacilities);
          setFilterVisible(false);
        }}
      />
    </div>
  );
}

export default function HotelListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spin size="large" /></div>}>
      <HotelListContent />
    </Suspense>
  );
}
