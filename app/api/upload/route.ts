import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 定义上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // 目录可能已存在，忽略错误
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '没有文件上传' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '不支持的图片格式' },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: '图片大小不能超过5MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 获取文件扩展名
    const ext = path.extname(file.name);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}${ext}`;

    // 确保目录存在
    await ensureUploadDir();

    // 写入文件
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);

    // 返回本地路径（相对于public目录）
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: filename,
        originalName: file.name,
        size: file.size,
      }
    });

  } catch (error) {
    console.error('上传文件错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 处理多文件上传
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有文件上传' },
        { status: 400 }
      );
    }

    const uploadedFiles: any[] = [];

    // 确保目录存在
    await ensureUploadDir();

    for (const file of files) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        continue;
      }

      // 验证文件大小
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        continue;
      }

      // 生成唯一文件名
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${randomStr}${ext}`;

      // 写入文件
      const filePath = path.join(UPLOAD_DIR, filename);
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        url: `/uploads/${filename}`,
        filename: filename,
        originalName: file.name,
        size: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('上传文件错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
