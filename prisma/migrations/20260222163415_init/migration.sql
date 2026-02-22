-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '唯一主键',
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(需要bcrypt加密)',
    `role` VARCHAR(191) NOT NULL DEFAULT 'merchant' COMMENT '角色：merchant(商户), admin(管理员)',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updatedAt` DATETIME(3) NOT NULL COMMENT '更新时间',

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='用户角色表';

-- CreateTable
CREATE TABLE `hotels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '唯一主键',
    `merchantId` INTEGER NOT NULL COMMENT '关联的商户ID',
    `name` VARCHAR(191) NOT NULL COMMENT '酒店名称(中/英显示)',
    `address` VARCHAR(191) NOT NULL COMMENT '酒店地址',
    `starRating` INTEGER NOT NULL DEFAULT 3 COMMENT '酒店星级 (1-5)',
    `minPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '起步价格(用于列表页快速展示与筛选)',
    `openingTime` DATE NULL COMMENT '开业时间 (YYYY-MM-DD)',
    `facilities` JSON NULL COMMENT '设施标签 (如: ["免费停车", "健身房", "接机"])',
    `coverImage` VARCHAR(191) NULL COMMENT '酒店封面图路径',
    `gallery` JSON NULL COMMENT '酒店图片图集',
    `status` INTEGER NOT NULL DEFAULT 0 COMMENT '0:待审核, 1:已发布, 2:审核拒绝, 3:已下线(软删除)',
    `rejectReason` VARCHAR(191) NULL COMMENT '审核不通过的原因',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '录入时间',
    `updatedAt` DATETIME(3) NOT NULL COMMENT '最后修改时间',

    INDEX `hotels_merchantId_idx`(`merchantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='酒店基础信息表';

-- CreateTable
CREATE TABLE `hotel_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '房型主键',
    `hotelId` INTEGER NOT NULL COMMENT '所属酒店ID',
    `roomName` VARCHAR(191) NOT NULL COMMENT '房型名称 (如：经典双床房)',
    `bedInfo` VARCHAR(191) NULL COMMENT '床型信息 (如：2张1.2米单人床)',
    `capacity` INTEGER NOT NULL DEFAULT 2 COMMENT '可住人数',
    `hasBreakfast` BOOLEAN NOT NULL DEFAULT false COMMENT '是否含早',
    `price` DECIMAL(10, 2) NOT NULL COMMENT '当前售价',
    `stock` INTEGER NOT NULL DEFAULT 10 COMMENT '每日库存 (为高阶加分项预留)',
    `cancelPolicy` VARCHAR(191) NULL DEFAULT '免费取消' COMMENT '取消政策 (如: 免费取消, 不可取消)',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updatedAt` DATETIME(3) NOT NULL COMMENT '更新时间',

    INDEX `hotel_rooms_hotelId_idx`(`hotelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='酒店房型与价格表';
