import { PrismaClient } from '@prisma/client';

// 定义一个实例化 PrismaClient 的函数
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// 扩展 Node.js 的全局对象类型，防止 TS 报错
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// 核心逻辑：如果有现成的就用现成的，没有就新建一个
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// 如果是在开发环境，就把实例挂载到全局对象上，防止热更新重复创建连接池
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}