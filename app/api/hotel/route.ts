import { NextRequest, NextResponse } from 'next/server';

export interface Room {
  id: string;
  name: string;
  tags: string[];
  price: number;
  currency: string;
  imageUrl: string;
  size: string;
  bed: string;
}

export interface HotelDetailResponse {
  id: string;
  name: string;
  rating: number;
  address: string;
  tags: string[];
  images: string[];
  openYear: string;
  rooms: Room[];
}

// 模拟数据库数据
const MOCK_DB: HotelDetailResponse = {
  id: "1",
  name: "上海陆家嘴禧玥酒店",
  rating: 4.8,
  address: "上海浦东新区浦明路1111号",
  tags: ["免费停车", "健身房", "免费WIFI", "近地铁", "机器人服务"],
  openYear: "2020",
  images: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
  ],
  rooms: [
    {
      id: "r2",
      name: "豪华大床房",
      tags: ["含早", "免费取消"],
      price: 1200,
      currency: "¥",
      size: "50㎡",
      bed: "1张2米特大床",
      imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80"
    },
    {
      id: "r1",
      name: "经典双床房",
      tags: ["含早", "立即确认"],
      price: 936,
      currency: "¥",
      size: "40㎡",
      bed: "2张1.2米单人床",
      imageUrl: "https://img95.699pic.com/photo/60056/6212.jpg_wh860.jpg"
    },
    {
      id: "r3",
      name: "行政套房",
      tags: ["行政礼遇", "全景落地窗", "浴缸"],
      price: 2500,
      currency: "¥",
      size: "80㎡",
      bed: "1张2米特大床",
      imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80"
    }
  ]
};

/**
 * 获取酒店详情（供客户端组件直接调用）
 */
export const getHotelDetail = (id: string): Promise<HotelDetailResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!id) {
        reject(new Error("Invalid ID"));
        return;
      }
      const sortedRooms = [...MOCK_DB.rooms].sort((a, b) => a.price - b.price);
      resolve({ ...MOCK_DB, id, rooms: sortedRooms });
    }, 500);
  });
};

/**
 * GET /api/hotel?id=xxx — 获取酒店详情（模拟数据）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '1';

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 房型价格从低到高排序
  const sortedRooms = [...MOCK_DB.rooms].sort((a, b) => a.price - b.price);

  const response = {
    ...MOCK_DB,
    id,
    rooms: sortedRooms,
  };

  return NextResponse.json(response);
}
