'use client';

import 'antd-mobile/es/global';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Empty } from 'antd';
import { CalendarPicker } from 'antd-mobile';
import { unstableSetRender } from 'antd-mobile';
import { createRoot, type Root } from 'react-dom/client';
import {
  EnvironmentOutlined, SearchOutlined,
  FilterOutlined, CloseOutlined,
  CalendarOutlined, FireFilled, LeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HotelListItem } from '@/types';
import HotelCard from '../../components/HotelCard';
import FilterModal from '../../components/FilterModal';

dayjs.locale('zh-cn');

// --- React 19 兼容性补丁 ---
unstableSetRender((node: React.ReactNode, container: Element | DocumentFragment) => {
  const root: Root = createRoot(container as HTMLElement);
  root.render(node);
  return async () => { root.unmount(); };
});

const CITIES = [
  { value: 'all', label: '全部' },
  { value: 'shanghai', label: '上海' },
  { value: 'beijing', label: '北京' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'chengdu', label: '成都' },
  { value: 'xian', label: '西安' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
];

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`请求失败: ${r.status}`);
    return r.json();
  });

interface HotelListClientProps {
  fallbackData?: any;
}

// ===== 从 URL 解析价格范围 =====
function parsePriceRange(price: string | null): [number, number] | null {
  if (!price || price === 'all') return null;
  if (price === '600+') return [600, 99999];
  const parts = price.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]];
  return null;
}

function encodePriceRange(range: [number, number] | null): string | null {
  if (!range) return null;
  return range[1] >= 99999 ? '600+' : `${range[0]}-${range[1]}`;
}

export default function HotelListClient({
  fallbackData,
}: HotelListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== URL 即是唯一事实来源 =====
  const city = searchParams.get('city') || null;
  const keyword = searchParams.get('keyword') || '';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const priceRange = parsePriceRange(searchParams.get('price'));
  const selectedStars = useMemo(() => {
    const s = searchParams.get('stars');
    return s ? s.split(',').map(Number).filter(n => !isNaN(n)) : [];
  }, [searchParams]);
  const selectedFacilities = useMemo(() => {
    const f = searchParams.get('facilities');
    return f ? f.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const dateRange = useMemo(() => [
    checkIn ? dayjs(checkIn) : dayjs(),
    checkOut ? dayjs(checkOut) : dayjs().add(1, 'day'),
  ] as const, [checkIn, checkOut]);

  // ===== 仅 UI 交互状态用 useState =====
  const [filterVisible, setFilterVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState(keyword);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 关键词防抖 → 更新 URL
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // 同步 URL keyword 到 input（浏览器前进/后退时）
    setKeywordInput(keyword);
  }, [keyword]);

  const updateKeywordInUrl = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrl({ keyword: value || null });
    }, 500);
  }, []); 

  // ===== URL 更新工具函数 =====
  const updateUrl = useCallback((overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(`/hotels/list${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  // ===== 派生值 =====
  const nights = dateRange[1].diff(dateRange[0], 'day');
  const filterCount = (priceRange ? 1 : 0) + (selectedStars.length > 0 ? 1 : 0) + (selectedFacilities.length > 0 ? 1 : 0);

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

  // ===== SWR Infinite — 游标分页 =====
  const buildParams = (cursor?: number | null) => {
    const params = new URLSearchParams({ status: '1', pageSize: '10' });
    // 始终传 cursor 参数（空串=首页），确保 API 走游标分页
    params.set('cursor', cursor != null ? String(cursor) : '');
    if (keyword) params.set('keyword', keyword);
    if (priceRange) {
      params.set('minPrice', String(priceRange[0]));
      params.set('maxPrice', String(priceRange[1]));
    }
    if (selectedStars.length > 0) params.set('starRating', selectedStars.join(','));
    if (selectedFacilities.length > 0) params.set('facilities', selectedFacilities.join(','));
    const cityLabel = CITIES.find(c => c.value === city)?.label;
    if (cityLabel) params.set('city', cityLabel);
    return params.toString();
  };

  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.hasMore) return null;
      const cursor = pageIndex === 0 ? null : previousPageData?.nextCursor;
      return `/api/hotels?${buildParams(cursor)}`;
    },
    fetcher,
    {
      revalidateFirstPage: false,
      fallbackData: fallbackData ? [fallbackData] : undefined,
    },
  );

  // URL 参数变化时自动重置分页（SWR key 已经变化了，只需确保size归位）
  const prevSearchRef = useRef(searchParams.toString());
  useEffect(() => {
    const current = searchParams.toString();
    if (prevSearchRef.current !== current) {
      prevSearchRef.current = current;
      setSize(1);
    }
  }, [searchParams, setSize]);

  // 派生数据
  const hotels: HotelListItem[] = data
    ? data.flatMap(page =>
        (page.data || []).map((h: any) => ({
          id: h.id, name: h.name, address: h.address, starRating: h.starRating,
          minPrice: h.minPrice, coverImage: h.coverImage,
          facilities: h.facilities || [], latitude: h.latitude ?? null,
          longitude: h.longitude ?? null, createdAt: h.createdAt,
        }))
      )
    : [];
  // 去重
  const uniqueHotels = Array.from(new Map(hotels.map(h => [h.id, h])).values());
  const hasMore = data ? data[data.length - 1]?.hasMore === true : false;
  const isLoadingMore = size > 1 && data && typeof data[size - 1] === 'undefined';

  // ===== 虚拟滚动 =====
  const virtualizer = useVirtualizer({
    count: uniqueHotels.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 310,
    overscan: 3,
  });

  // 滚动到底部时加载更多
  useEffect(() => {
    if (isLoading) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (isValidating || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setSize(s => s + 1);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isLoading, isValidating, hasMore, setSize]);

  const clearFilters = () => {
    updateUrl({ price: null, stars: null, facilities: null, keyword: null });
    setKeywordInput('');
  };

  return (
    <div className="h-screen flex flex-col bg-[#f4f4f2]">
      {/* ====== 顶部搜索栏 ====== */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e1e32] to-[#252538] sticky top-0 z-40 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex-shrink-0">
        <div className="px-4 pt-3.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 cursor-pointer active:bg-white/20 transition-all flex-shrink-0"
              onClick={() => router.push('/hotels')}
            >
              <LeftOutlined className="!text-white/80 text-sm" />
            </div>
            {/* 城市选择器 */}
            <div className="relative" ref={cityPickerRef}>
              <div
                className="flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-white/10 border border-white/10 active:bg-white/20 transition-all"
                onClick={() => setCityPickerVisible(!cityPickerVisible)}
              >
                <EnvironmentOutlined className="!text-white/80 text-sm" />
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
                        onClick={() => { updateUrl({ city: c.value }); setCityPickerVisible(false); }}
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
              <CalendarOutlined className="!text-white/80 text-sm" />
              <span className="text-[13px] font-medium text-white/90">
                {dateRange[0].format('M月D日')} — {dateRange[1].format('M月D日')}
              </span>
              <span className="text-[10px] text-white/80 font-bold bg-white/15 px-1.5 py-0.5 rounded-md ml-auto">
                {nights}晚
              </span>
            </div>
          </div>
        </div>

        <CalendarPicker
          visible={datePickerOpen}
          selectionMode="range"
          value={[dateRange[0].toDate(), dateRange[1].toDate()]}
          onClose={() => setDatePickerOpen(false)}
          onMaskClick={() => setDatePickerOpen(false)}
          min={new Date()}
          onConfirm={(val) => {
            if (val && Array.isArray(val) && val[0] && val[1]) {
              updateUrl({
                checkIn: dayjs(val[0]).format('YYYY-MM-DD'),
                checkOut: dayjs(val[1]).format('YYYY-MM-DD'),
              });
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
              value={keywordInput}
              onChange={(e) => { setKeywordInput(e.target.value); updateKeywordInUrl(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') updateUrl({ keyword: keywordInput || null }); }}
              className="flex-1 text-[13px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {keywordInput && (
              <div
                className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer active:bg-gray-300 ml-1"
                onClick={() => { setKeywordInput(''); updateUrl({ keyword: null }); }}
              >
                <CloseOutlined className="text-gray-500 text-[8px]" />
              </div>
            )}
          </div>
          <div
            className="relative w-11 h-11 flex items-center justify-center bg-white/15 border border-white/20 rounded-2xl cursor-pointer active:bg-white/25 transition-all backdrop-blur-sm"
            onClick={() => setFilterVisible(true)}
          >
            <FilterOutlined className="!text-white/80 text-base" />
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
            onClick: () => updateUrl({ price: null, stars: null }) },
          { label: '¥300以下', active: priceRange?.[1] === 300,
            onClick: () => updateUrl({ price: '0-300' }) },
          { label: '¥300-600', active: priceRange?.[0] === 300 && priceRange?.[1] === 600,
            onClick: () => updateUrl({ price: '300-600' }) },
          { label: '¥600+', active: priceRange?.[0] === 600,
            onClick: () => updateUrl({ price: '600+' }) },
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
            onClick={() => {
              const next = selectedStars.filter(s => s !== star);
              updateUrl({ stars: next.length > 0 ? next.join(',') : null });
            }}
          >
            {star}星 <CloseOutlined className="text-[7px] opacity-60" />
          </div>
        ))}
        {selectedFacilities.slice(0, 2).map(f => (
          <div
            key={f}
            className="flex-shrink-0 cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium bg-stone-50 text-stone-600 border border-stone-200 flex items-center gap-1 active:bg-stone-100"
            onClick={() => {
              const next = selectedFacilities.filter(x => x !== f);
              updateUrl({ facilities: next.length > 0 ? next.join(',') : null });
            }}
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
          {error ? (
            <div className="py-20 bg-white rounded-[20px] mt-2 shadow-sm">
              <Empty
                description={
                  <div className="space-y-3 mt-2">
                    <p className="text-gray-400 text-sm">加载失败，请稍后再试</p>
                    <button
                      onClick={() => setSize(1)}
                      className="text-sm font-medium text-white bg-[#1a1a2e] rounded-full px-5 py-2 active:bg-[#2a2a3e] transition-colors"
                    >
                      重试
                    </button>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : isLoading ? (
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
          ) : uniqueHotels.length === 0 ? (
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
              <div className="mb-3 flex items-center gap-2 px-0.5">
                <FireFilled className="text-orange-500 text-xs" />
                <span className="text-[13px] text-gray-600">
                  精选 <span className="font-bold text-gray-900">{uniqueHotels.length}</span> 家优质酒店
                </span>
              </div>

              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => (
                  <div
                    key={uniqueHotels[virtualRow.index].id}
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
                    <HotelCard hotel={uniqueHotels[virtualRow.index]} />
                  </div>
                ))}
              </div>

              <div className="py-4">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2.5 py-3">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span className="text-gray-400 text-xs">探索更多好酒店...</span>
                  </div>
                )}
              </div>

              {!hasMore && uniqueHotels.length > 0 && (
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

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        priceRange={priceRange}
        selectedStars={selectedStars}
        selectedFacilities={selectedFacilities}
        onConfirm={(filters) => {
          updateUrl({
            price: encodePriceRange(filters.priceRange),
            stars: filters.selectedStars.length > 0 ? filters.selectedStars.join(',') : null,
            facilities: filters.selectedFacilities.length > 0 ? filters.selectedFacilities.join(',') : null,
          });
          setFilterVisible(false);
        }}
      />
    </div>
  );
}
