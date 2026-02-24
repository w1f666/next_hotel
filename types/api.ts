/* 后端交互类型 —— API 请求与响应 */

/*
  1. Server Actions 通用返回体
  使用泛型 <T> 以便动态推导 data 的具体类型（比如 Hotel[] 或 User）
 */
export interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/*
  2. API如登录注册的返回体
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  role?: 'merchant' | 'admin';
  username?: string;
}

// 通用 API JSON 响应（用于 Route Handler）
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 分页信息
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
