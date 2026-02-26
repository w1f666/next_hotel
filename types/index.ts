/* 类型集线器 —— 导出聚合类型 */

export interface HotelRoom {
  id?: number;
  hotelId?: number;
  roomName: string;
  bedInfo: string;
  capacity: number;
  hasBreakfast: boolean;
  price: number;
  stock: number;
  cancelPolicy: string;
  imageUrl?: string;
}

export interface Hotel {
  id: number;
  merchantId: number;
  name: string;
  address: string;
  starRating: number;
  minPrice: number;
  openingTime: string | null;
  facilities: string[];
  coverImage: string | null;
  gallery: string[];
  status: number; // 0=待审核, 1=已通过, 2=已拒绝
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelWithRooms extends Hotel {
  rooms: HotelRoom[];
}

// 酒店表单提交数据
export interface HotelFormData {
  name: string;
  address: string;
  starRating: number;
  openingTime?: string | null;
  facilities?: string[];
  coverImage?: string;
  gallery?: string[];
  rooms: Omit<HotelRoom, 'id' | 'hotelId'>[];
}

// 酒店状态枚举
export const HOTEL_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待审核', color: 'processing' },
  1: { label: '已发布', color: 'success' },
  2: { label: '未通过', color: 'error' },
  3: { label: '已下线', color: 'default' },
};

// 星级选项
export const STAR_RATING_OPTIONS = [
  { value: 2, label: '⭐⭐ 经济型' },
  { value: 3, label: '⭐⭐⭐ 舒适型' },
  { value: 4, label: '⭐⭐⭐⭐ 高档型' },
  { value: 5, label: '⭐⭐⭐⭐⭐ 豪华型' },
];

// 设施选项
export const FACILITY_OPTIONS = [
  '免费WiFi', '免费停车', '健身房', '游泳池', '餐厅',
  '会议室', '行政酒廊', '洗衣服务', '礼宾服务', '机器人服务',
  '空调', '电梯', '无烟楼层', '残障通道', 'SPA',
  '商务中心', '儿童乐园', '行李寄存', '24小时前台', '接机服务',
];

// 取消政策选项
export const CANCEL_POLICY_OPTIONS = [
  '免费取消',
  '入住前1天免费取消',
  '入住前3天免费取消',
  '不可取消',
];
