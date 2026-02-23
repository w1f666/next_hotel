This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## index overview

e-hotel-next/
├── app/
│   ├── (client)/               # C端路由组
│   │   ├── hotels/             # 酒店模块主目录
│   │   │   ├── page.tsx        # 对应路由: /hotels (酒店列表页)
│   │   │   ├── loading.tsx     # 列表页的加载骨架屏
│   │   │   │
│   │   │   └── [id]/           # ⚠️ 注意这里：详情页文件夹嵌套在 hotels 里面！
│   │   │       └── page.tsx    # 对应路由: /hotels/123 (酒店详情页)
│   │   │
│   │   └── layout.tsx          # C端专属的布局 (包含底部导航栏等)
│   │
│   ├── admin/                # B端PC后台应用
│   │   ├── auth/             # 登录/注册 (已有)
│   │   ├── hotels/           # 后台酒店管理路由
│   │   │   ├── page.tsx      # 管理列表 (Table)
│   │   │   ├── create/       # 新建页面
│   │   │   └── [id]/         # 编辑页面
│   │   └── layout.tsx        # B端整体布局 (包含侧边栏、顶部导航)
│   │
│   ├── api/                  # API 路由 (供前端调用)
│   │   ├── auth/             # (已有)
│   │   ├── upload/           # 图片上传接口
│   │   └── hotels/           # 如果不用 Server Actions，可在此写 RESTful 接口
│   └── globals.css           # 全局样式 (Tailwind 引入)
│
├── components/               # 通用 React 组件
│   ├── client/               # 专用于移动端 C 端的组件
│   │   ├── filter/           # 筛选相关组件 (FilterTabs, Dropdown)
│   │   ├── hotel/            # 酒店相关 (HotelCard, SkeletonCard)
│   │   └── ui/               # 基础 UI (InfiniteScroll, PullToRefresh)
│   │
│   ├── admin/                # 专用于 PC 端的后台组件
│   │   ├── layout/           # Sidebar, AdminHeader
│   │   └── hotel/            # HotelForm, RoomTypeDynamicForm
│   │
│   └── shared/               # 多端共享组件 (如有)
│
├── lib/                      # 核心工具库
│   ├── db.ts                 # 数据库连接实例 (已有)
│   ├── actions/              # (推荐) Next.js Server Actions 目录 (处理表单提交、数据库 CRUD)
│   │   ├── hotel.actions.ts  # 酒店增删改查动作
│   │   └── user.actions.ts   
│   └── utils.ts              # 通用工具函数 (如类名合并 cn(), 日期格式化)
│
├── types/                    # TypeScript 类型定义
│   ├── index.ts              # 数据库模型对应的 TS Interface (如 Hotel, RoomType)
│   └── api.ts                # API 返回体类型定义
│
└── package.json              # (已有)


## Database

### 环境要求
- Node.js 18+
- MySQL 5.7+
- pnpm

### 配置
在 `.env` 文件中配置数据库连接：
```env
DATABASE_URL="mysql://root:123456@127.0.0.1:3306/hotel_db"
```

### 初始化数据库（全新环境）

```bash
# 1. 创建空数据库
mysql -u root -p123456 -e "CREATE DATABASE hotel_db;"

# 2. 安装依赖
pnpm install

# 3. 生成 Prisma Client
pnpm prisma generate

# 4. 创建迁移（仅生成 SQL，不执行）
pnpm prisma migrate dev --name init --create-only

# 5. [可选] 编辑迁移文件添加 COMMENT
# 编辑 prisma/migrations/xxx/migration.sql 添加注释

# 6. 执行迁移
pnpm prisma migrate dev

# 7. 填充种子数据（可选）
pnpm db:seed
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm prisma generate` | 生成 Prisma Client |
| `pnpm prisma db push` | 同步 schema 到数据库（开发环境） |
| `pnpm prisma migrate dev` | 创建并应用迁移（开发环境） |
| `pnpm prisma migrate deploy` | 应用迁移（生产环境） |
| `pnpm prisma studio` | 打开可视化数据库管理 |
| `pnpm db:seed` | 执行种子数据填充 |

### 添加 COMMENT（数据库注释）

Prisma 6.x 不直接支持 `@comment` 属性，需要手动编辑迁移 SQL 文件：

1. 创建迁移：`pnpm prisma migrate dev --name init --create-only`
2. 编辑 `prisma/migrations/xxx/migration.sql`，在 `CREATE TABLE` 语句中添加 `COMMENT`：
```sql
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '唯一主键',
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    ...
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='用户角色表';
```
3. 执行迁移：`pnpm prisma migrate dev`

### 数据库表结构

| 表名 | 说明 |
|------|------|
| users | 用户角色表 |
| hotels | 酒店基础信息表 |
| hotel_rooms | 酒店房型与价格表 |

### 种子数据

运行 `pnpm db:seed` 会创建以下测试数据：
- **用户**: merchant01 / 123456 (商户), admin01 / 123456 (管理员)
- **酒店**: 上海陆家嘴禧玥酒店、艺龙安悦酒店、上海静安瑞吉酒店
- **房型**: 高级大床房、江景双床房等

