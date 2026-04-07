import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateMagicBytes } from '@/lib/auth';

// 定义上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// MIME 类型 → 安全扩展名映射（同时作为允许的文件类型白名单）
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BATCH_FILES = 10;

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // 目录可能已存在
  }
}

async function processFile(file: File): Promise<{ url: string; filename: string; originalName: string; size: number } | null> {
  // 验证 MIME 类型
  if (!MIME_TO_EXT[file.type]) return null;

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 验证文件魔术字节
  if (!validateMagicBytes(buffer, file.type)) return null;

  const ext = MIME_TO_EXT[file.type];
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomStr}${ext}`;

  const filePath = path.join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
    originalName: file.name,
    size: file.size,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 鉴权由 middleware 完成，这里二次确认
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '没有文件上传' },
        { status: 400 }
      );
    }

    if (!MIME_TO_EXT[file.type]) {
      return NextResponse.json(
        { success: false, message: '不支持的图片格式' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: '图片大小不能超过5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 校验文件魔术字节
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, message: '文件内容与类型不匹配' },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type];
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}${ext}`;

    await ensureUploadDir();

    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename,
        originalName: file.name,
        size: file.size,
      }
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    return NextResponse.json(
      { success: false, message: '上传失败' },
      { status: 500 }
    );
  }
}

// 处理多文件上传
export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有文件上传' },
        { status: 400 }
      );
    }

    // 限制批量上传数量
    if (files.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        { success: false, message: `单次最多上传${MAX_BATCH_FILES}个文件` },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    const uploadedFiles: { url: string; filename: string; originalName: string; size: number }[] = [];

    for (const file of files) {
      const result = await processFile(file);
      if (result) {
        uploadedFiles.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    return NextResponse.json(
      { success: false, message: '上传失败' },
      { status: 500 }
    );
  }
}
