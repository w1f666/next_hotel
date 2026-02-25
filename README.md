## 项目总结：易宿酒店预订平台 (E-Hotel Next.js)

这是一个基于 **Next.js 16 (App Router)** 全栈开发的现代化酒店预订与管理平台，采用双端分离架构：

### 📁 项目结构

```
/xiecheng
├── app/
│   ├── (client)/                 # C端（移动端）
│   │   ├── (with-tabbar)/        # 带底部导航栏
│   │   │   ├── hotels/page.tsx  # 首页搜索
│   │   │   └── hotels/list/     # 酒店列表（筛选）
│   │   └── (no-tabbar)/         # 沉浸式页面
│   │       └── hotels/[id]/     # 酒店详情（含房型）
│   │
│   ├── admin/                    # B端（PC管理后台）
│   │   ├── auth/page.tsx        # 登录/注册
│   │   ├── hotels/page.tsx      # 审核管理（管理员）
│   │   └── workspace/           # 商户工作台
│   │       ├── page.tsx         # 酒店列表
│   │       ├── publish/         # 发布新酒店
│   │       └── [id]/edit/      # 编辑酒店
│   │
│   └── api/                      # 传统API路由
│       ├── auth/                 # 登录/注册（JWT）
│       ├── hotels/               # 酒店CRUD
│       ├── hotel/                # 酒店详情
│       └── upload/               # 图片上传
│
├── lib/
│   ├── actions/                  # Server Actions
│   │   ├── hotel.actions.ts      # 酒店增删改查
│   │   └── user.actions.ts       # 用户管理
│   ├── prisma.ts                 # Prisma单例
│   └── utils.ts                  # 工具函数
│
├── prisma/
│   ├── schema.prisma             # 数据库模型
│   └── seed.ts                   # 种子数据
│
└── types/
    ├── index.ts                  # 业务类型
    └── api.ts                    # API响应类型
```

### 🛠️ 技术栈

- **框架**: Next.js 16 + React 19
- **数据库**: MySQL + Prisma 6
- **UI**: Tailwind CSS (C端) + Ant Design (B端) + antd-mobile
- **鉴权**: JWT + bcryptjs
- **Server Actions**: 替代传统API进行CRUD

### 🗄️ 数据库设计

采用**纯逻辑外键**设计（无物理外键）：
- **users**: 商户/管理员账户
- **hotels**: 酒店基本信息（状态：待审核/已发布/已拒绝）
- **hotel_rooms**: 房型与价格

### 🔑 核心功能

**C端（/hotels）**：
- 首页酒店搜索（城市/日期/价格/星级）
- 酒店列表（筛选/分页）
- 酒店详情（含房型展示/日期选择）

**B端（/admin）**：
- 登录/注册（merchant/admin角色）
- 商户：发布/编辑/删除酒店
- 管理员：审核通过/拒绝酒店

### 🚀 启动方式

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
pnpm dev
```