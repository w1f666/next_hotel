/* 后端交互类型 —— API 请求与响应 */

// 通用 API 响应
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

// 登录响应
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}
