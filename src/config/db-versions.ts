/**
 * 数据库版本控制文件
 * 在每次更改Notion数据库结构时更新此文件
 * 理论上只更改CURRENT_DB_VERSION后就可以进行全量同步
 */

// 当前数据库版本号，更改数据库结构时递增
export const CURRENT_DB_VERSION = 2;

// 数据库版本变更历史记录
export const DB_MIGRATIONS = {
  1: "初始版本 - 包含阅读状态、开始阅读、完成阅读、阅读总时长和阅读进度字段",
};

// 数据库必要字段列表（用于检测数据库是否包含必要字段）
export const REQUIRED_DB_PROPERTIES = [
  "书名",
  "作者",
  "阅读状态",
  "开始阅读",
  "完成阅读",
  "阅读总时长",
  "阅读进度",
];
