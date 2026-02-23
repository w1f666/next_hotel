'use client';
import React, { useState } from 'react';
import { Swiper, ImageViewer, Image } from 'antd-mobile';

export default function HotelBanner({ images }: { images: string[] }) {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <div className="relative w-full h-56 bg-gray-200">
        <Swiper loop autoplay>
          {images.map((img, index) => (
            <Swiper.Item key={index}>
              <div 
                className="w-full h-56 cursor-pointer"
                onClick={() => setVisible(true)}
              >
                <Image 
                  src={img} 
                  alt={`banner-${index}`} 
                  fit='cover'
                  width='100%'
                  height='100%'
                  className="block"
                />
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
        
        {/* 页码指示器 */}
        <div className="absolute bottom-6 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full z-10 pointer-events-none">
          查看相册 {images.length}
        </div>
      </div>

      <ImageViewer.Multi
        images={images}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
}