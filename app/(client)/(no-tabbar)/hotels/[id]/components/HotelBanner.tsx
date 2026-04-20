'use client';
import React, { useState, lazy, Suspense } from 'react';
import { Swiper } from 'antd-mobile';
import NextImage from 'next/image';

const ImageViewerLazy = lazy(() =>
  import('antd-mobile/es/components/image-viewer').then(mod => ({ default: mod.default.Multi }))
);

export default function HotelBanner({ images }: { images: string[] }) {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <div className="relative w-full h-56 bg-gray-200">
        {/* 首图静态渲染，SSR 即可见，Swiper 水合后覆盖 */}
        {images[0] && (
          <div className="absolute inset-0 z-0">
            <NextImage
              src={images[0]}
              alt="hotel-1"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="relative z-[1]">
          <Swiper loop autoplay>
            {images.map((img, idx) => (
              <Swiper.Item key={img}>
                <div 
                  className="relative w-full h-56 cursor-pointer"
                  onClick={() => setVisible(true)}
                >
                  <NextImage
                    src={img}
                    alt={`hotel-${idx + 1}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </Swiper.Item>
            ))}
          </Swiper>
        </div>
        
        {/* 页码指示器 */}
        <div className="absolute bottom-6 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full z-10 pointer-events-none">
          查看相册 {images.length}
        </div>
      </div>

      {visible && (
        <Suspense fallback={null}>
          <ImageViewerLazy
            images={images}
            visible={visible}
            onClose={() => setVisible(false)}
          />
        </Suspense>
      )}
    </>
  );
}