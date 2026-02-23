# 🏨 易宿酒店预订平台 (E-Hotel Next.js)

本项目是一个基于 **Next.js (App Router)** 全栈架构开发的现代化酒店预订与管理平台。项目分为 **C端（移动端酒店预订）** 与 **B端（PC端商户管理后台）** 两个核心模块，采用最新的前后端同构开发范式。

## 🏗️ 架构设计亮点

- **彻底解耦的数据库设计**：`schema.prisma` 中摒弃了传统的 `@relation` 物理外键约束，采用纯数字 ID 进行逻辑关联。提升了数据库读写性能，方便后期分表分库，完美符合大厂数据库设计规范。
- **零 API 路由 CRUD**：使用 Next.js 最新的 Server Actions (`lib/actions/*.ts`) 代替传统的 API Route 编写。前后端共享 TypeScript 类型，实现原生函数级的数据库调用，极大减少了样板代码。
- **完美的路由组隔离**：利用 `(with-tabbar)` 和 `(no-tabbar)` 路由组，巧妙解决了 Next.js 同级目录下文件夹命名的冲突问题，同时实现了 C端页面布局的无缝切换。

## ✨ 核心技术栈

- **框架**: Next.js (App Router) + React
- **数据库 ORM**: Prisma 6
- **数据库**: MySQL
- **样式与 UI**: Tailwind CSS (C端) + Ant Design (B端)
- **状态管理**: React 原生 Hooks + Antd Form (零 Redux，极致轻量)
- **鉴权机制**: JWT (JSON Web Token) + bcryptjs
- **API 通信**: Next.js Server Actions (无缝 CRUD) + 传统 Route API (鉴权)

## 📂 项目完整目录结构

项目采用了大厂推崇的“基于路由组的端隔离”与“Server Actions 业务收拢”架构：

```text
e-hotel-next/
├── app/                          # 🌐 Next.js App Router 核心路由目录
│   ├── layout.tsx                # 全局根布局 (HTML/Body/基础字体与 SEO)
│   ├── globals.css               # 全局样式 (Tailwind CSS 引入层)
│   │
│   ├── (client)/                 # 📱 C端 (移动端) 路由组 (对实际 URL 隐身)
│   │   ├── (with-tabbar)/        # 📥 分组 1：带底部导航栏
│   │   │   ├── layout.tsx        # C端基础布局 (引入 <BottomNav /> 底部菜单)
│   │   │   └── hotels/           
│   │   │       └── page.tsx      # C端酒店列表卡片页 (路由: /hotels)
│   │   │
│   │   └── (no-tabbar)/          # 📤 分组 2：沉浸式页面 (无底部导航栏)
│   │       ├── layout.tsx        # 纯净布局 (统一放置顶部返回导航条)
│   │       └── hotels/           
│   │           └── [id]/         
│   │               └── page.tsx  # C端酒店详情展示页 (路由: /hotels/123)
│   │
│   ├── admin/                    # 💻 B端 (PC管理后台) 路由组
│   │   ├── layout.tsx            # B端整体布局 (侧边栏 <Sidebar />、顶部 Header)
│   │   ├── auth/                 
│   │   │   └── page.tsx          # 👤 B端商户登录/注册界面
│   │   └── hotels/               
│   │       ├── page.tsx          # 后台酒店管理数据表格页 (路由: /admin/hotels)
│   │       ├── create/           
│   │       │   └── page.tsx      # 后台录入新酒店表单 (路由: /admin/hotels/create)
│   │       └── [id]/             
│   │           └── page.tsx      # 后台编辑现有酒店表单 (路由: /admin/hotels/123)
│   │
│   └── api/                      # 🔌 传统 API 路由目录
│       └── auth/                 # 鉴权相关接口 (颁发 JWT Token 专属)
│           ├── login/            
│           │   └── route.ts      # 🔑 登录验证 API
│           └── register/         
│               └── route.ts      # 📝 注册账号 API
│
├── components/                   # 🧩 React 业务与 UI 组件库
│   ├── client/                   # C 端专属 (如: HotelCard.tsx, MobileFilter.tsx)
│   ├── admin/                    # B 端专属 (如: AdminTable.tsx, RoomForm.tsx)
│   └── shared/                   # 公用基础组件 (如: Button.tsx, Modal.tsx)
│
├── lib/                          # 🛠️ 核心逻辑与工具函数
│   ├── prisma.ts                 # 🌟 PrismaClient 单例 (全项目的数据库总闸门)
│   ├── utils.ts                  # 通用函数 (如: cn 类名合并)
│   └── actions/                  # ⚡️ Server Actions (完美替代 CRUD API)
│       ├── hotel.actions.ts      # 酒店、房型的增删改查逻辑
│       └── user.actions.ts       # 后台用户管理的增删改查逻辑
│
├── prisma/                       # 🗄️ 数据库与 ORM 配置目录
│   ├── schema.prisma             # 表结构定义 (采用逻辑纯数字关联，无物理外键)
│   └── seed.ts                   # 种子数据脚本 (测试数据初始化)
│
├── types/                        # 🏷️ TypeScript 全局类型定义
│   ├── api.ts                    # 后端交互类型 (定义 ActionResponse, LoginResponse)
│   └── index.ts                  # 类型集线器与聚合类型定义
│
└── .env                          # 🔐 环境变量配置 

## 🚀 快速启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在根目录创建 `.env` 文件，并填入以下内容：

```plaintext
DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/hotel_db"
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. 初始化数据库与种子数据

```bash
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 访问入口

- **C端访问入口**: http://localhost:3000/hotels
- **B端管理入口**: http://localhost:3000/admin/auth
