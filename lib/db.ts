import mysql from 'mysql2/promise';

// 创建连接池（仅读取环境变量，移除硬编码敏感信息）
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // 本地数据库默认host不变，作为兜底
  user: process.env.DB_USER || 'root', // MySQL默认用户名root，作为兜底
  password: process.env.DB_PASSWORD, // 敏感密码：仅从环境变量读取
  database: process.env.DB_NAME || 'hotel_db', // 创建的数据库名，作为兜底
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;