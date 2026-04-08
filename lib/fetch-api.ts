/* 统一的 API 请求封装 */

import { getClientAuthHeaders } from '@/lib/client-auth';

interface FetchApiOptions extends Omit<RequestInit, 'headers'> {
  /** 是否需要认证（默认 true） */
  auth?: boolean;
}

interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
}

/**
 * 封装 fetch，统一处理：
 * - 认证头注入
 * - JSON Content-Type（有 body 时）
 * - res.ok 检查
 * - JSON 解析与错误提取
 */
export async function fetchApi<T = any>(
  url: string,
  options: FetchApiOptions = {},
): Promise<ApiResult<T>> {
  const { auth = true, body, ...rest } = options;

  const headers: Record<string, string> = {};

  // 注入认证头
  if (auth) {
    Object.assign(headers, getClientAuthHeaders());
  }

  // JSON body 自动设置 Content-Type（FormData 不设，浏览器自动加 boundary）
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...rest, headers, body });

  // 尝试解析响应 JSON
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: json?.message || `请求失败 (${res.status})`,
    };
  }

  // 业务层 success 字段检查
  if (json && json.success === false) {
    return {
      ok: false,
      status: res.status,
      message: json.message || '操作失败',
    };
  }

  return {
    ok: true,
    status: res.status,
    data: json?.data ?? json,
    message: json?.message,
  };
}
