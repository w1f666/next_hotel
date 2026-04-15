# 易宿酒店预订平台

一个基于 Next.js 16 App Router 构建的全栈酒店预订与管理系统，覆盖移动端用户浏览预订、商户酒店发布管理、管理员审核运营三条核心业务链路。

项目不是简单的酒店列表展示，而是完整串起了搜索、筛选、详情、预订、酒店发布、审核流转、图片上传、权限控制和缓存刷新。

## 项目亮点

- 双端一体：移动端 C 端负责搜酒店和下单，PC 端负责商户工作台与管理员审核后台
- 业务闭环完整：从酒店录入、提交审核、审核通过、前台展示，到游客下单预订，链路闭合
- 搜索体验完善：支持关键词、城市、日期、价格区间、星级、设施等组合筛选
- 面向真实数据量：列表页支持游标分页、无限滚动和虚拟滚动，适合较大酒店数据集
- 后台可运营：商户可持续维护酒店和房型，管理员可审核、拒绝并反馈原因
- 安全措施到位：JWT、HttpOnly Cookie、CSRF 校验、登录限流、图片魔术字节校验均已落地
- 缓存策略明确：读写分层，查询按场景缓存，写操作后主动刷新相关页面与缓存标签

## 核心能力

### 1. 移动端用户预订体验

- 酒店首页支持城市切换、关键词搜索、入住离店日期选择、价格筛选
- 酒店列表页支持多条件筛选与 URL 参数驱动查询状态
- 列表采用无限滚动加载，减少传统分页跳转成本
- 酒店详情页展示封面图、相册、酒店基础信息、设施、房型、取消政策等内容
- 游客可直接下单，无需登录即可提交入住人姓名、手机号、入住日期和离店日期
- 下单时服务端自动校验日期、手机号、酒店发布状态、房型归属关系，并计算间夜数与总价

### 2. 商户工作台

- 商户可创建酒店、编辑酒店、删除酒店
- 支持录入酒店基础信息、开业时间、星级、设施、封面图和相册
- 支持动态维护房型列表，包括房型名称、床型、人数、早餐、价格、库存、取消政策、房型图片
- 图片上传支持封面图单传、相册多传、房型图片上传
- 酒店编辑后会重新进入审核流，避免已发布数据被绕过审核直接生效
- 工作台围绕当前商户隔离数据，防止越权修改其他商户的酒店

### 3. 管理员审核后台

- 管理员可以查看全部酒店及其审核状态
- 支持审核通过、拒绝酒店，并记录拒绝原因
- 后台包含待审核、已发布、已拒绝等状态管理能力
- 管理端页面基于 Ant Design 表格和统计组件构建，适合运营审查场景

### 4. 预订与订单能力

- 订单号按日期加随机串生成，便于区分与追踪
- 订单数据记录入住人、手机号、入住离店时间、间夜数、总价、状态
- 订单状态支持待确认、已确认、已取消、已完成
- 只允许预订已审核发布的酒店房型

## 技术亮点

### 1. 基于 Next.js 16 的现代全栈实现

- 使用 Next.js 16.1.6 + React 19 + TypeScript 5
- 采用 App Router 组织移动端、后台端、API Route 和服务端逻辑
- 启用 `cacheComponents`，结合 `use cache`、`cacheTag`、`cacheLife` 做按场景缓存
- 酒店详情页支持 `generateMetadata` 和静态参数生成，兼顾首屏体验与 SEO 基础能力

### 2. 读写分层与缓存失效设计

- 查询逻辑集中在 `lib/actions/hotel.queries.ts`
- 写操作和数据库变更集中在 `lib/actions/hotel.write.ts`
- Server Actions 集中在 `lib/actions/hotel.mutations.ts`
- 缓存刷新集中在 `lib/actions/hotel.revalidation.ts`
- 发布酒店、商户酒店列表、酒店详情使用缓存
- 搜索筛选和分页查询刻意不缓存，避免高基数参数组合导致低命中和复杂失效
- 酒店新增、更新、删除、审核后会同步刷新 `/hotels`、`/hotels/list`、`/hotels/[id]`、`/admin/workspace`、`/admin/hotels`

### 3. 面向交互性能的列表设计

- 前台酒店列表支持游标分页
- 客户端使用 `useSWRInfinite` 驱动滚动加载
- 引入 `@tanstack/react-virtual` 处理长列表渲染性能
- 相比传统 offset 分页，更适合移动端连续浏览场景

### 4. 安全与权限控制

- JWT 登录态写入 HttpOnly Cookie
- 登录态有效期 24 小时
- 写操作引入 CSRF 双提交校验：Cookie `csrf_token` + 请求头 `X-CSRF-Token`
- 登录接口带内存级限流，避免短时间暴力尝试
- 商户侧更新、删除酒店时做 IDOR 校验，只允许操作自己的酒店
- 根路径与受保护路由通过 `proxy.ts` 做统一重定向和鉴权拦截
- 响应头中配置了 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy` 等安全头

### 5. 图片上传链路更接近生产约束

- 支持 JPG、PNG、GIF、WebP
- 单文件最大 5MB，单次批量最多 10 张
- 不只校验 MIME，还校验文件魔术字节，避免伪造扩展名上传
- 上传文件使用时间戳加随机串命名，降低重名冲突
- 文件存放在 `public/uploads/`，前端可直接访问

### 6. 双端 UI 技术栈组合

- 移动端使用 Ant Design Mobile 5
- 后台端使用 Ant Design 6
- 样式层使用 Tailwind CSS 4
- 针对 React 19 与 Ant Design Mobile 的渲染兼容问题，已补充 `unstableSetRender` 兼容处理

## 业务流程

### 酒店发布与审核

```text
商户创建酒店
    -> 状态为待审核
    -> 管理员审核
         -> 通过：酒店发布，前台可见
         -> 拒绝：记录拒绝原因，商户修改后重新提交
```

### 用户预订

```text
用户选择酒店和房型
    -> 选择入住/离店日期
    -> 填写入住人和手机号
    -> 服务端校验并计算总价
    -> 生成订单并返回预订结果
```

## 数据模型

### User

- `username`：唯一账号
- `password`：bcrypt 哈希密码
- `role`：`merchant` / `admin`

### Hotel

- `merchantId`：所属商户
- `name` / `address` / `starRating` / `openingTime`
- `minPrice`：酒店起价
- `facilities`：JSON 设施集合
- `coverImage` / `gallery`：封面与相册
- `status`：`0` 待审核 / `1` 已发布 / `2` 未通过
- `rejectReason`：拒绝原因
- `latitude` / `longitude`：预留地理信息能力

### HotelRoom

- `roomName` / `bedInfo` / `capacity`
- `hasBreakfast` / `price` / `stock`
- `cancelPolicy` / `imageUrl`

### Booking

- `orderNo`：唯一订单号
- `guestName` / `guestPhone`
- `checkIn` / `checkOut` / `nights`
- `totalPrice`
- `status`：`0` 待确认 / `1` 已确认 / `2` 已取消 / `3` 已完成

## 项目结构

```text
app/
    (client)/
        (with-tabbar)/hotels/          移动端首页与列表页
        (no-tabbar)/hotels/[id]/       酒店详情页
    admin/
        auth/                          登录注册
        hotels/                        管理员审核后台
        workspace/                     商户工作台
    api/
        auth/                          登录、注册、登出
        hotels/                        酒店查询与写操作接口
        bookings/                      游客预订接口
        upload/                        图片上传接口
lib/
    actions/                         查询、写入、Server Actions、缓存刷新
    auth.ts                          JWT、CSRF、限流、密码校验
    upload.ts                        客户端上传封装
prisma/
    schema.prisma                    数据模型
    seed.ts                          初始化演示数据
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16.1.6 (App Router) |
| 前端 | React 19 + TypeScript 5 |
| 移动端 UI | Ant Design Mobile 5 |
| 后台 UI | Ant Design 6 |
| 样式 | Tailwind CSS 4 |
| 数据请求 | SWR 2.4 |
| 列表性能 | @tanstack/react-virtual |
| 数据库 | MySQL 8 + Prisma ORM 6 |
| 认证 | JWT + HttpOnly Cookie + bcrypt |
| 包管理 | pnpm |

## API 概览

### 认证

```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### 酒店

```bash
GET    /api/hotels
POST   /api/hotels
GET    /api/hotels/:id
PUT    /api/hotels/:id
DELETE /api/hotels/:id
```

支持的典型查询参数：

- `published=true`
- `cursor` + `pageSize`
- `page` + `pageSize`
- `status`
- `keyword`
- `city`
- `minPrice` / `maxPrice`
- `starRating`
- `facilities`

### 审核与上传

```bash
POST /api/admin/hotels/:id/review
POST /api/upload
PUT  /api/upload
POST /api/bookings
```

## 本地启动

### 1. 环境要求

- Node.js 18+
- MySQL 8+
- pnpm 8+

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

在项目根目录创建 `.env`：

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"
JWT_SECRET="your-jwt-secret-key"
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
pnpm db:seed
```

### 5. 启动开发环境

```bash
pnpm dev
```

默认访问入口：

- 移动端：`http://localhost:3000/hotels`
- 后台端：`http://localhost:3000/admin`
- 根路径 `/` 会根据设备自动重定向到移动端或后台端

## 演示账号

执行 `pnpm db:seed` 后会生成以下演示账号：

| 角色 | 账号 | 密码 |
|------|------|------|
| 商户 | `merchant01` | `123456` |
| 管理员 | `admin01` | `123456` |

说明：

- 这两个账号来自种子数据，仅用于本地演示
- 当前注册接口对新密码有更严格要求：至少 8 位，且必须同时包含字母和数字

## 脚本命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm db:seed
```

## 当前实现说明

- 前台公开酒店页目前仍以客户端请求 `/api` 数据为主，后续还可以继续向 RSC 化收敛
- 上传文件当前存放于本地 `public/uploads/`，生产环境建议替换为对象存储
- 项目已包含较完整的酒店、房型、订单模型，适合作为酒店预订类全栈项目作品集示例
