'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tabs, Button, Picker, CalendarPicker, Toast } from 'antd-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useRouter } from 'next/navigation';

dayjs.locale('zh-cn');

const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getNextDay = (date: Date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
};

const formatDate = (date: Date) => {
  if (!date) return '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const getNights = (start: Date, end: Date) => {
  if (!start || !end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
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

const CITIES = [
    { value: 'shanghai', label: '上海' },
    { value: 'beijing', label: '北京' },
    { value: 'hangzhou', label: '杭州' },
    { value: 'chengdu', label: '成都' },
    { value: 'xian', label: '西安' },
    { value: 'guangzhou', label: '广州' },
    { value: 'shenzhen', label: '深圳' },
];

const PRICE_COLUMNS = [[
    { label: '价格星级不限', value: 'all' },
    { label: '¥150以下', value: '0-150' },
    { label: '¥150-300', value: '150-300' },
    { label: '¥300-450', value: '300-450' },
    { label: '¥450-600', value: '450-600' },
    { label: '¥600以上', value: '600+' },
]];

export default function SearchSection() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('domestic');
    const [city, setCity] = useState('shanghai');
    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const cityPickerRef = useRef<HTMLDivElement>(null);
    const [keyword, setKeyword] = useState('');
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [minDate, setMinDate] = useState<Date | null>(null);
    const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
    const [priceFilter, setPriceFilter] = useState<string>('all');
    const [pricePickerVisible, setPricePickerVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    const nights = dateRange ? getNights(dateRange[0], dateRange[1]) : 0;

    useEffect(() => {
        const today = getToday();
        setMinDate(today);
        setDateRange([today, getNextDay(today)]);
        setMounted(true);
    }, []);

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

    const handleSearch = () => {
        if (!dateRange) {
            Toast.show({ content: '日期初始化中，请稍后重试' });
            return;
        }

        const params = new URLSearchParams();
        if (keyword) params.set('keyword', keyword);
        if (city) params.set('city', city);
        params.set('checkIn', dayjs(dateRange[0]).format('YYYY-MM-DD'));
        params.set('checkOut', dayjs(dateRange[1]).format('YYYY-MM-DD'));
        params.set('nights', String(nights));
        params.set('type', activeTab);
        if (priceFilter && priceFilter !== 'all') params.set('price', priceFilter);
        const queryString = params.toString();
        router.push(`/hotels/list${queryString ? `?${queryString}` : ''}`);
    };

    if (!mounted) {
        return (
            <div className="relative px-4 -mt-10 sm:-mt-12 max-w-2xl mx-auto w-full z-20">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/40 h-[420px] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="relative px-4 -mt-10 sm:-mt-12 max-w-2xl mx-auto w-full z-20">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/40 overflow-hidden">
                <div className="[&_.adm-tabs-content]:hidden mb-2">
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        {tabsItems.map(t => <Tabs.Tab title={t.label} key={t.key} />)}
                    </Tabs>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-2">
                        <div className="relative flex-shrink-0" ref={cityPickerRef}>
                            <div
                                className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => setCityPickerVisible(!cityPickerVisible)}
                            >
                                <span className="text-xl font-bold">
                                    {CITIES.find(c => c.value === city)?.label || '选择城市'}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                                <span className="text-gray-400 text-[9px] ml-0.5">▼</span>
                            </div>
                            {cityPickerVisible && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg p-3 z-50 min-w-[220px] city-picker-dropdown">
                                    <div className="grid grid-cols-3 gap-2">
                                        {CITIES.map(c => (
                                            <div
                                                key={c.value}
                                                className={`text-center text-sm py-2 px-2 rounded-lg cursor-pointer transition-all ${
                                                    city === c.value
                                                        ? 'bg-blue-500 text-white font-medium shadow-sm'
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
                        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
                        <input
                            placeholder="位置 / 品牌 / 酒店"
                            className="flex-grow text-lg outline-none bg-transparent min-w-0 h-8"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-blue-500 cursor-pointer flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                    </div>

                    <div
                        className="border-b border-gray-100 pb-3 cursor-pointer active:bg-gray-50 transition-colors rounded-lg"
                        onClick={() => setCalendarVisible(true)}
                    >
                        <div className="flex items-end gap-2 py-2">
                            <span className="text-base font-bold text-gray-900">
                                {dateRange ? formatDate(dateRange[0]) : '--'}
                            </span>
                            <span className="text-xs text-gray-500 mb-0.5">入住</span>
                            <span className="text-xs text-gray-300 mx-1">|</span>
                            <span className="text-base font-bold text-gray-900">
                                {dateRange ? formatDate(dateRange[1]) : '--'}
                            </span>
                            <span className="text-xs text-gray-500 mb-0.5">离店</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-400">
                                {dateRange
                                    ? `${formatDate(dateRange[0])} 入住 - ${formatDate(dateRange[1])} 离店`
                                    : '请选择入住和离店日期'}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">共{nights}晚</span>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 pb-3 cursor-pointer" onClick={() => setPricePickerVisible(true)}>
                        <div className="flex items-center justify-between py-2">
                            <span className={`text-lg ${priceFilter === 'all' ? 'text-gray-400' : 'text-gray-900'}`}>
                                {PRICE_COLUMNS[0].find(p => p.value === priceFilter)?.label || '价格 / 星级'}
                            </span>
                            <span className="text-gray-400 text-xs">▼</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {quickTags.map((tag) => (
                            <span
                                key={tag}
                                className="bg-gray-100 rounded-md px-3 py-1 cursor-pointer hover:bg-gray-200 text-gray-600 transition-all text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="pt-4">
                        <Button
                            color="primary"
                            size="large"
                            block
                            style={{ height: 56, fontSize: 20, fontWeight: 'bold', borderRadius: 12, background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}
                            className="shadow-lg shadow-blue-200"
                            onClick={handleSearch}
                        >
                            <svg className="w-5 h-5 mr-2 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                            查询
                        </Button>
                    </div>
                </div>
            </div>

            <CalendarPicker
                selectionMode="range"
                visible={calendarVisible}
                value={dateRange ?? undefined}
                min={minDate ?? undefined}
                onChange={(val: [Date, Date] | null) => {
                    if (val) setDateRange(val);
                }}
                onConfirm={(val: [Date, Date] | null) => {
                    if (!val) return;
                    setCalendarVisible(false);
                    Toast.show({ content: `已选择 ${getNights(val[0], val[1])} 晚` });
                }}
                onClose={() => setCalendarVisible(false)}
            />

            <Picker
                columns={PRICE_COLUMNS}
                visible={pricePickerVisible}
                onClose={() => setPricePickerVisible(false)}
                onConfirm={(val) => setPriceFilter(val[0] as string)}
                value={[priceFilter]}
            />
        </div>
    );
}
