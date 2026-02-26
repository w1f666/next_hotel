# 易宿酒店预订平台

一个基于 Next.js 16 构建的全栈酒店预订与管理系统，支持移动端 C 端用户浏览预订和 PC 端商户/管理员后台管理。

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16.1.6 (App Router) |
| **前端** | React 19 + TypeScript 5 |
| **UI 组件** | Ant Design 6 (PC端) / Ant Design Mobile 5 (移动端) |
| **样式** | Tailwind CSS 4 |
| **数据库** | MySQL + Prisma ORM 6.19 |
| **认证** | JWT + bcrypt |
| **包管理** | pnpm |

## 项目结构

```
├── app/                          # Next.js App Router 目录
│   ├── (client)/                 # 移动端 C 端页面组
│   │   ├── (with-tabbar)/        # 带底部导航栏的页面
│   │   │   ├── hotels/           # 酒店首页（搜索入口）
│   │   │   └── hotels/list/      # 酒店列表（筛选+无限滚动）
│   │   └── (no-tabbar)/          # 无底部导航栏的页面
│   │       └── hotels/[id]/      # 酒店详情页
│   ├── admin/                    # PC 端后台管理
│   │   ├── auth/                 # 登录/注册页
│   │   ├── hotels/               # 管理员-酒店审核管理
│   │   └── workspace/            # 商户-工作台
│   │       ├── publish/          # 新建酒店
│   │       └── [id]/edit/        # 编辑酒店
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证接口 (登录/注册)
│   │   ├── hotels/               # 酒店 CRUD 接口
│   │   └── upload/               # 图片上传接口
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式
├── lib/                          # 工具库
│   ├── actions/                  # Server Actions
│   │   └── hotel.actions.ts      # 酒店业务逻辑
│   ├── prisma.ts                 # Prisma 客户端
│   ├── AntdRegistry.tsx          # Ant Design SSR 支持
│   └── utils.ts                  # 通用工具函数
├── prisma/                       # 数据库
│   ├── schema.prisma             # 数据模型定义
│   ├── seed.ts                   # 种子数据
│   └── migrations/               # 数据库迁移
├── types/                        # TypeScript 类型定义
│   ├── index.ts                  # 业务类型
│   └── api.ts                    # API 响应类型
└── public/                       # 静态资源
    ├── hotel_img/                # 酒店图片
    └── uploads/                  # 用户上传图片
```

## 核心功能

### 移动端 (C 端用户)

- **酒店搜索首页** - 关键词搜索、日期选择、快捷标签
- **酒店列表页** - 多维度筛选（价格/星级/设施）、游标分页无限滚动
- **酒店详情页** - 轮播图、酒店信息、日期选择、房型列表

### PC 端 (商户/管理员)

- **用户认证** - 商户/管理员登录注册（账号格式：`merchant01`/`admin01`，密码：6位数字）
- **商户工作台** - 酒店列表管理、新建/编辑酒店、图片上传
- **管理员审核** - 酒店审核（通过/拒绝）、状态管理

### 设备自适应

通过 Middleware 检测 User-Agent，自动重定向：
- 移动端访问 `/` → `/hotels`
- PC 端访问 `/` → `/admin`

## 数据模型

### User (用户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| username | String | 账号（唯一） |
| password | String | 密码（bcrypt 加密） |
| role | String | 角色：`merchant` / `admin` |

### Hotel (酒店)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| merchantId | Int | 商户 ID |
| name | String | 酒店名称 |
| address | String | 地址 |
| starRating | Int | 星级 (2-5) |
| minPrice | Decimal | 起步价 |
| facilities | Json | 设施列表 |
| coverImage | String | 封面图 URL |
| gallery | Json | 相册图片数组 |
| status | Int | 状态：0=待审核, 1=已发布, 2=未通过 |
| rejectReason | String | 拒绝原因 |

### HotelRoom (房型)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| hotelId | Int | 酒店 ID |
| roomName | String | 房型名称 |
| bedInfo | String | 床型信息 |
| capacity | Int | 入住人数 |
| hasBreakfast | Boolean | 是否含早 |
| price | Decimal | 价格 |
| stock | Int | 库存 |
| cancelPolicy | String | 取消政策 |
| imageUrl | String | 房型图片 |

## API 接口

### 认证接口

```
POST /api/auth/login      # 登录
POST /api/auth/register   # 注册
```

### 酒店接口

```
GET  /api/hotels                # 获取酒店列表
     ?published=true            # C端-已发布酒店
     ?merchantId=1              # 商户的酒店
     ?cursor=&pageSize=10       # 游标分页（无限滚动）
     ?page=1&pageSize=10        # 传统分页
     ?status=0&keyword=上海     # 筛选条件
     ?minPrice=100&maxPrice=500 # 价格筛选
     ?starRating=4,5            # 星级筛选
     ?facilities=免费WiFi,游泳池 # 设施筛选

POST /api/hotels                # 创建酒店

GET  /api/hotels/:id            # 获取酒店详情（含房型）
PUT  /api/hotels/:id            # 更新酒店
DELETE /api/hotels/:id          # 删除酒店
```

### 上传接口

```
POST /api/upload    # 单文件上传
PUT  /api/upload    # 多文件批量上传
```

## 快速开始

### 1. 环境准备

- Node.js 18+
- MySQL 8.0+
- pnpm 8+

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"
JWT_SECRET="your-jwt-secret-key"
```

### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev

# 填充种子数据
pnpm db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问：
- 移动端：http://localhost:3000/hotels
- PC 端：http://localhost:3000/admin

### 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 商户 | merchant01 | 123456 |
| 管理员 | admin01 | 123456 |

## 脚本命令

```bash
pnpm dev        # 启动开发服务器
pnpm build      # 生产环境构建
pnpm start      # 启动生产服务器
pnpm lint       # 代码检查
pnpm db:seed    # 填充种子数据
```

## 业务流程

### 酒店发布流程

```
商户录入酒店 → 待审核(status=0) → 管理员审核
                                    ├── 通过 → 已发布(status=1) → C端可见
                                    └── 拒绝 → 未通过(status=2) → 商户修改后重新提交
```

### 酒店编辑流程

```
商户编辑已发布酒店 → 状态重置为待审核(status=0) → 重新进入审核流程
```

## 特色功能

1. **游标分页** - 支持移动端无限滚动加载，性能优于传统 offset 分页
2. **多维度筛选** - 价格区间、星级、设施等多条件组合筛选
3. **图片上传** - 支持封面图、相册、房型图片的单/批量上传
4. **设备自适应** - 根据 User-Agent 自动重定向到对应端
5. **React 19 兼容** - Ant Design Mobile 适配 React 19 渲染器
