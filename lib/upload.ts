/* 文件上传工具函数 */

import { getClientAuthHeaders } from '@/lib/client-auth';

interface UploadResult {
  success: boolean;
  url?: string;
  urls?: string[];
  message?: string;
}

/**
 * 上传单个文件
 */
export async function uploadSingleFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: getClientAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    return { success: false, message: errJson?.message || '上传失败' };
  }

  const json = await res.json();
  if (json.success) {
    return { success: true, url: json.data.url };
  }
  return { success: false, message: json.message || '上传失败' };
}

/**
 * 批量上传多个文件
 */
export async function uploadMultipleFiles(files: File[]): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch('/api/upload', {
    method: 'PUT',
    headers: getClientAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    return { success: false, message: errJson?.message || '上传失败' };
  }

  const json = await res.json();
  if (json.success && json.data) {
    const urls = json.data.map((item: any) => item.url);
    return { success: true, urls };
  }
  return { success: false, message: json.message || '上传失败' };
}
