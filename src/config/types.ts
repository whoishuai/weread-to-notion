/**
 * 全局类型定义
 */

/**
 * 读书状态枚举
 */
export enum ReadStatus {
  NO = "未读完",
  YES = "已读完",
}

/**
 * 同步状态接口
 */
export interface SyncState {
  bookId: string;
  lastSyncTime: number;
  highlightsSynckey: string;
  thoughtsSynckey: string;
}

/**
 * 划线数据格式化后返回类型
 */
export interface HighlightsResponse {
  highlights: any[];
  bookInfo: any;
  synckey: string;
  hasUpdate: boolean;
}

/**
 * 想法数据格式化后返回类型
 */
export interface ThoughtsResponse {
  thoughts: any[];
  synckey: string;
  hasUpdate: boolean;
}

/**
 * 书籍内容同步结果类型
 */
export interface BookContentSyncResult {
  success: boolean;
  highlightsSynckey: string;
  thoughtsSynckey: string;
  hasUpdate: boolean;
  highlights: any[];
  thoughts: any[];
}

/**
 * Notion内容块类型
 */
export type NotionBlockType = "highlights" | "thoughts";

/**
 * 图书馆配置数据库相关类型
 */
export interface LibraryConfig {
  enabledReadingStatus: string[]; // 启用的阅读状态
  enabledAuthors: string[]; // 启用的作者列表
  syncMode?: "全量" | "增量"; // 新增：同步模式
  organizeByChapter?: "是" | "否"; // 新增：按章节划线
}

/**
 * 配置数据库查询结果
 */
export interface ConfigDatabaseResponse {
  object: string;
  results: ConfigDatabasePage[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * 配置数据库页面
 */
export interface ConfigDatabasePage {
  object: string;
  id: string;
  properties: {
    名称: {
      title: Array<{
        text: {
          content: string;
        };
      }>;
    };
    阅读状态: {
      multi_select: Array<{
        name: string;
      }>;
    };
    作者: {
      multi_select: Array<{
        name: string;
      }>;
    };
    "全量/增量"?: {
      select: { name: string };
    };
    按章节划线?: {
      select: { name: string };
    };
  };
}
