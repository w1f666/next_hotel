'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { 
  App, Spin, Empty
} from 'antd';
import { 
  EnvironmentOutlined, SearchOutlined, 
  FilterOutlined, CloseOutlined, 
  CalendarOutlined, FireFilled
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useSearchParams, useRouter } from 'next/navigation';
import type { HotelListItem } from '@/types';
import HotelCard from '../components/HotelCard';
import FilterModal, { PRICE_RANGES } from '../components/FilterModal';

dayjs.locale('zh-cn');

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

// ==================== 主页面组件 ====================
function HotelListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { message } = App.useApp();
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 状态管理 - 游标分页
  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 使用 ref 存储 cursor，避免在 useCallback 依赖中导致闭包问题
  const cursorRef = useRef<number | null>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  
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
  
  const [priceRange, setPriceRange] = useState<[number, number] | null>(getInitialPriceRange);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  // 防抖后的搜索关键词（用于实际请求）
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 关键词防抖
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keyword]);
  
  // 计算间夜数
  const nights = dateRange[1].diff(dateRange[0], 'day');

  // ===== URL 同步：筛选条件变化时更新 URL =====
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    if (city) params.set('city', city);
    params.set('checkIn', dateRange[0].format('YYYY-MM-DD'));
    params.set('checkOut', dateRange[1].format('YYYY-MM-DD'));
    if (priceRange) {
      if (priceRange[1] >= 99999) {
        params.set('price', '600+');
      } else {
        params.set('price', `${priceRange[0]}-${priceRange[1]}`);
      }
    }
    if (selectedStars.length > 0) params.set('stars', selectedStars.join(','));
    if (selectedFacilities.length > 0) params.set('facilities', selectedFacilities.join(','));
    const qs = params.toString();
    router.replace(`/hotels/list${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedKeyword, city, dateRange, priceRange, selectedStars, selectedFacilities, router]);

  // 城市点击提示
  const handleCityClick = () => {
    message.info('暂无其他城市酒店数据，当前默认展示全部酒店');
  };

  // 日期点击提示
  const handleDateClick = () => {
    message.info('日期筛选暂未接入后端，当前默认展示全部酒店');
  };

  // 获取酒店列表数据 - 使用游标分页
  // 使用 ref 存储当前游标值，避免闭包问题
  const fetchHotels = useCallback(async (isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        // 重置时也重置 ref
        cursorRef.current = null;
        hasMoreRef.current = true;
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      
      // 构建筛选参数 - 使用游标分页
      const params = new URLSearchParams();
      params.append('status', '1');  // 只获取已发布的酒店
      params.append('pageSize', '10');
      
      // 始终传递 cursor 参数来启用游标分页
      // 首次加载传 null，加载更多传实际的 cursor 值
      if (isLoadMore && cursorRef.current) {
        params.append('cursor', String(cursorRef.current));
      } else if (!isLoadMore) {
        // 首次加载，传递空字符串表示 cursor=null
        params.append('cursor', '');
      }
      
      if (debouncedKeyword) {
        params.append('keyword', debouncedKeyword);
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
      
      // 添加设施筛选
      if (selectedFacilities.length > 0) {
        params.append('facilities', selectedFacilities.join(','));
      }
      
      const res = await fetch(`/api/hotels?${params.toString()}`);
      if (!res.ok) {
        console.error('获取酒店列表失败');
        return;
      }
      const json = await res.json();
      
      if (json.success && json.data) {
        const newHotels: HotelListItem[] = json.data.map((h: any) => ({
          id: h.id,
          name: h.name,
          address: h.address,
          starRating: h.starRating,
          minPrice: h.minPrice,
          coverImage: h.coverImage,
          facilities: h.facilities || [],
          createdAt: h.createdAt,
        }));
/*为防止异步操作异常，导致反复取得同一页数据
使用哈希去重避免bug*/
        if (isLoadMore) {
          setHotels(prev => {
            const existingIds = new Set(prev.map(h => h.id));
            const uniqueNew = newHotels.filter(h => !existingIds.has(h.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setHotels(newHotels);
        }
        
        // 从响应中获取游标信息  
        const nextCursor = json.nextCursor !== undefined ? json.nextCursor : null;
        const more = json.hasMore !== undefined ? json.hasMore : false;
        
        // 更新 state 和 ref
        setCursor(nextCursor);
        setHasMore(more);
        cursorRef.current = nextCursor;
        hasMoreRef.current = more;
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedKeyword, priceRange, selectedStars, selectedFacilities]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchHotels(false);
  }, [debouncedKeyword, priceRange, selectedStars, selectedFacilities]);

  // 使用 IntersectionObserver 实现触底自动加载
  // 依赖 loading 和 fetchHotels：
  //   - loading: 首次加载完成后才有 trigger 元素
  //   - fetchHotels: 筛选条件变化时重新绑定
  useEffect(() => {
    if (loading) return; // trigger 元素还不在 DOM 中

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (!loadMoreTrigger) return;
    
    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // 创建新的 observer，回调内部使用 ref 避免闭包问题
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // 当触发器进入视口，且没有正在加载，且还有更多数据时，触发加载
        if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          fetchHotels(true);
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '200px' // 提前 200px 触发加载，更流畅
      }
    );
    
    observerRef.current.observe(loadMoreTrigger);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, fetchHotels]); // 不依赖 loadingMore/hotels.length，避免重复重建 observer

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    setCursor(null);
    setHasMore(true);
    fetchHotels(false);
  };

  // 搜索按钮点击
  const handleSearch = () => {
    setCursor(null);
    setHasMore(true);
    fetchHotels(false);
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

  // 打开筛选弹窗
  const openFilterModal = () => {
    setFilterVisible(true);
  };

  // 筛选确认回调
  const handleFilterConfirm = (filters: {
    priceRange: [number, number] | null;
    selectedStars: number[];
    selectedFacilities: string[];
  }) => {
    setPriceRange(filters.priceRange);
    setSelectedStars(filters.selectedStars);
    setSelectedFacilities(filters.selectedFacilities);
    setFilterVisible(false);
  };

  return (
      <div className="min-h-screen bg-[#f4f4f2] flex flex-col" ref={listRef}>
      {/* ====== 顶部搜索栏 —— 深色高级感 ====== */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e1e32] to-[#252538] sticky top-0 z-40 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        {/* 城市 + 日期 */}
        <div className="px-4 pt-3.5 pb-1">
          <div className="flex items-center gap-2.5">
            {/* 城市 */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-white/10 border border-white/10 active:bg-white/20 transition-all"
              onClick={handleCityClick}
            >
              <EnvironmentOutlined className="text-white/50 text-xs" />
              <span className="font-semibold text-sm text-white tracking-wide">
                {CITIES.find(c => c.value === city)?.label || '上海'}
              </span>
              <span className="text-white/40 text-[9px] ml-0.5">▼</span>
            </div>
            
            {/* 日期 */}
            <div 
              className="flex-1 flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-xl bg-white/10 border border-white/10 active:bg-white/20 transition-all"
              onClick={handleDateClick}
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
          
        {/* 搜索框 */}
        <div className="px-4 mt-2.5 flex items-center gap-2.5">
          <div className="flex-1 flex items-center bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            <SearchOutlined className="text-gray-400 text-[15px] mr-2.5" />
            <input
              placeholder="搜索酒店名称、位置或品牌"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            onClick={openFilterModal}
          >
            <FilterOutlined className="text-white text-[15px]" />
            {getFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold border-2 border-[#1a1a2e] shadow-sm">
                {getFilterCount()}
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

      {/* ====== 酒店列表区域 ====== */}
      <div className="flex-1 px-4 pt-4 pb-2">
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
            
            {/* 酒店卡片列表 */}
            {hotels.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
            
            {/* 触底加载触发器 */}
            <div id="load-more-trigger" className="py-4">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2.5 py-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span className="text-gray-400 text-xs">探索更多好酒店...</span>
                </div>
              )}
              {/*在触底加载区域空出一点高度，
              方便 IntersectionObserver 
              能够检测到滑动到页面底部的信号。*/}
              {!loadingMore && hasMore && (
                <div className="h-2"></div>
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

      {/* 筛选弹窗 */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        priceRange={priceRange}
        selectedStars={selectedStars}
        selectedFacilities={selectedFacilities}
        onConfirm={handleFilterConfirm}
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
