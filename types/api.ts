/*后端交互类型 (定义 ActionResponse, LoginResponse)*/

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
    2.API如登录注册的返回体
    */
export interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    role?: 'merchant' | 'admin';
    username?: string;
}