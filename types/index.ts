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
  latitude: number | null;
  longitude: number | null;
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

// C端酒店列表项（列表页/首页展示用）
export interface HotelListItem {
  id: number;
  name: string;
  address: string;
  starRating: number;
  minPrice: number;
  coverImage: string | null;
  facilities: string[];
  latitude: number | null;
  longitude: number | null;
  createdAt?: string;
}

// 管理端酒店表格行
export type HotelTableRow = Pick<Hotel,
  'id' | 'name' | 'address' | 'starRating' | 'minPrice' | 'coverImage' | 'status' | 'rejectReason' | 'createdAt' | 'updatedAt'
>;

// 预定表单数据
export interface BookingFormData {
  roomId: number;
  hotelId: number;
  guestName: string;
  guestPhone: string;
  checkIn: string;  // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
}

// 预定记录
export interface Booking {
  id: number;
  orderNo: string;
  roomId: number;
  hotelId: number;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: number;  // 0=待确认 1=已确认 2=已取消 3=已完成
  createdAt: string;
}

export const BOOKING_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待确认', color: 'processing' },
  1: { label: '已确认', color: 'success' },
  2: { label: '已取消', color: 'default' },
  3: { label: '已完成', color: 'success' },
};
