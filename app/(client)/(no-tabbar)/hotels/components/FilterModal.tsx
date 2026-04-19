'use client';

import { useState } from 'react';
import { Button, Modal, InputNumber, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { STAR_RATING_OPTIONS, FACILITY_OPTIONS } from '@/types';

export const PRICE_RANGES = [
  { label: '不限', value: 'all' },
  { label: '¥300以下', value: '0-300' },
  { label: '¥300-600', value: '300-600' },
  { label: '¥600以上', value: '600+' },
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  priceRange: [number, number] | null;
  selectedStars: number[];
  selectedFacilities: string[];
  onConfirm: (filters: {
    priceRange: [number, number] | null;
    selectedStars: number[];
    selectedFacilities: string[];
  }) => void;
}

export default function FilterModal({
  visible,
  onClose,
  priceRange,
  selectedStars,
  selectedFacilities,
  onConfirm,
}: FilterModalProps) {
  // 弹窗临时状态 — 打开时从 props 复制，确认后写回
  const [tempPriceRange, setTempPriceRange] = useState<[number, number] | null>(null);
  const [tempStars, setTempStars] = useState<number[]>([]);
  const [tempFacilities, setTempFacilities] = useState<string[]>([]);
  const [tempCustomMin, setTempCustomMin] = useState<number | undefined>(undefined);
  const [tempCustomMax, setTempCustomMax] = useState<number | undefined>(undefined);

  // 打开弹窗时同步临时状态
  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      setTempPriceRange(priceRange);
      setTempStars([...selectedStars]);
      setTempFacilities([...selectedFacilities]);
      if (priceRange) {
        setTempCustomMin(priceRange[0] || undefined);
        setTempCustomMax(priceRange[1] >= 99999 ? undefined : priceRange[1]);
      } else {
        setTempCustomMin(undefined);
        setTempCustomMax(undefined);
      }
    }
  };

  const getTempPriceSelectValue = (): string => {
    if (!tempPriceRange) return 'all';
    if (tempPriceRange[1] >= 99999) return '600+';
    return `${tempPriceRange[0]}-${tempPriceRange[1]}`;
  };

  const getTempFilterCount = () => {
    let count = 0;
    if (tempPriceRange) count++;
    if (tempStars.length > 0) count++;
    if (tempFacilities.length > 0) count++;
    return count;
  };

  const handleReset = () => {
    setTempPriceRange(null);
    setTempStars([]);
    setTempFacilities([]);
    setTempCustomMin(undefined);
    setTempCustomMax(undefined);
  };

  return (
    <ConfigProvider locale={zhCN} theme={{ cssVar: { prefix: 'antd', key: 'app' }, token: { colorPrimary: '#0066FF', borderRadius: 8 } }}>
    <Modal
      open={visible}
      title={null}
      footer={null}
      onCancel={onClose}
      className="filter-modal"
      centered
      closable={false}
      styles={{ body: { padding: 0 } }}
      afterOpenChange={handleAfterOpenChange}
    >
      {/* 自定义头部 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-lg font-bold text-gray-900">筛选条件</h3>
        <button onClick={handleReset} className="text-sm text-gray-400 active:text-gray-600">
          重置
        </button>
      </div>

      <div className="px-5 pb-4 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* 价格筛选 */}
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2.5">💰 价格区间</div>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((range) => {
              const isActive = getTempPriceSelectValue() === range.value;
              return (
                <div
                  key={range.value}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1a1a2e] text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                  onClick={() => {
                    if (range.value === 'all') {
                      setTempPriceRange(null);
                      setTempCustomMin(undefined);
                      setTempCustomMax(undefined);
                    } else if (range.value === '600+') {
                      setTempPriceRange([600, 99999]);
                      setTempCustomMin(600);
                      setTempCustomMax(undefined);
                    } else {
                      const [min, max] = range.value.split('-').map(Number);
                      setTempPriceRange([min, max]);
                      setTempCustomMin(min);
                      setTempCustomMax(max);
                    }
                  }}
                >
                  {range.label}
                </div>
              );
            })}
          </div>
          {/* 自定义价格输入 */}
          <div className="flex items-center gap-2 mt-3">
            <InputNumber
              min={0}
              max={99999}
              placeholder="最低价"
              value={tempCustomMin}
              onChange={(v) => {
                setTempCustomMin(v ?? undefined);
                const min = v ?? 0;
                const max = tempCustomMax ?? 99999;
                if (min === 0 && max === 99999) {
                  setTempPriceRange(null);
                } else {
                  setTempPriceRange([min, max]);
                }
              }}
              className="flex-1"
              prefix="¥"
              size="small"
            />
            <span className="text-gray-400 text-xs">—</span>
            <InputNumber
              min={0}
              max={99999}
              placeholder="最高价"
              value={tempCustomMax}
              onChange={(v) => {
                setTempCustomMax(v ?? undefined);
                const min = tempCustomMin ?? 0;
                const max = v ?? 99999;
                if (min === 0 && max === 99999) {
                  setTempPriceRange(null);
                } else {
                  setTempPriceRange([min, max]);
                }
              }}
              className="flex-1"
              prefix="¥"
              size="small"
            />
          </div>
        </div>

        {/* 星级筛选 */}
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2.5">⭐ 酒店星级</div>
          <div className="flex flex-wrap gap-2">
            {STAR_RATING_OPTIONS.map((star) => {
              const isActive = tempStars.includes(star.value);
              return (
                <div
                  key={star.value}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                  onClick={() => {
                    setTempStars(prev =>
                      prev.includes(star.value)
                        ? prev.filter(s => s !== star.value)
                        : [...prev, star.value]
                    );
                  }}
                >
                  {star.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* 设施筛选 */}
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2.5">🏨 配套设施</div>
          <div className="flex flex-wrap gap-2">
            {FACILITY_OPTIONS.map((facility) => {
              const isActive = tempFacilities.includes(facility);
              return (
                <div
                  key={facility}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-stone-700 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                  onClick={() => {
                    setTempFacilities(prev =>
                      prev.includes(facility)
                        ? prev.filter(f => f !== facility)
                        : [...prev, facility]
                    );
                  }}
                >
                  {facility}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
        <Button size="large" className="flex-1 rounded-xl h-11 font-medium" onClick={onClose}>
          取消
        </Button>
        <Button
          type="primary"
          size="large"
          className="flex-1 rounded-xl h-11 bg-[#1a1a2e] hover:bg-[#2a2a3e] border-none font-medium"
          onClick={() => {
            onConfirm({
              priceRange: tempPriceRange,
              selectedStars: tempStars,
              selectedFacilities: tempFacilities,
            });
          }}
        >
          查看 {getTempFilterCount() > 0 ? `(${getTempFilterCount()}项筛选)` : '结果'}
        </Button>
      </div>
    </Modal>
    </ConfigProvider>
  );
}
