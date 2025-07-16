/**
 * 微信读书 → Notion 同步工具 主程序
 */

import dotenv from "dotenv";
import { parseArgs } from "./core/cli";
import { syncSingleBook } from "./core/sync/book-sync";
import { syncAllBooks } from "./core/sync/all-books-sync";
import { syncAllBooksWithConfig } from "./core/sync/all-books-sync-with-config";
import { getBrowserCookie } from "./utils/cookie";
import { refreshSession } from "./api/weread/services";
import { checkAndMigrateIfNeeded } from "./core/migration";

// 环境变量文件路径
const ENV_FILE_PATH = ".env";

// 加载环境变量
dotenv.config({ path: ENV_FILE_PATH });

/**
 * 主函数：根据命令行参数执行相应的同步操作
 */
async function main() {
  try {
    console.log("=== 微信读书 → Notion 同步开始 ===");

    // 获取环境变量
    const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
    const DATABASE_ID = process.env.DATABASE_ID;
    const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;

    // 验证必要的环境变量
    if (!NOTION_API_KEY) {
      console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
      return;
    }

    if (!DATABASE_ID) {
      console.error("错误: 缺少 DATABASE_ID 环境变量");
      return;
    }

    // 解析命令行参数
    const { bookId, syncAll, fullSync: cliFullSync } = parseArgs();
    let fullSync = cliFullSync;

    // 检查数据库版本并执行必要的迁移
    try {
      const needsMigration = await checkAndMigrateIfNeeded(
        NOTION_API_KEY,
        DATABASE_ID
      );

      // 如果需要迁移，强制使用全量同步模式
      if (needsMigration) {
        console.log("检测到数据库版本变更，将强制使用全量同步模式");
        fullSync = true;
      }
    } catch (error: any) {
      console.error(`数据库版本检查失败: ${error.message}`);
      console.log("将继续使用原定同步模式");
    }

    console.log(`同步模式: ${fullSync ? "全量" : "增量"}`);

    // 获取微信读书Cookie
    let cookie = getBrowserCookie();
    console.log("成功加载Cookie");

    // 刷新会话
    cookie = await refreshSession(cookie);
    console.log("会话已刷新");

    if (syncAll) {
      // 同步所有书籍
      if (CONFIG_DATABASE_ID) {
        console.log("检测到配置数据库ID，将使用配置过滤同步");
        // 加载配置，决定 useIncremental
        const { loadLibraryConfig } = await import(
          "./api/notion/config-service"
        );
        const config = await loadLibraryConfig(
          NOTION_API_KEY,
          CONFIG_DATABASE_ID
        );
        let useIncremental = config.syncMode !== "全量";
        // 命令行 --full-sync 优先级更高
        if (cliFullSync) useIncremental = false;
        await syncAllBooksWithConfig(
          NOTION_API_KEY,
          DATABASE_ID,
          cookie,
          useIncremental,
          CONFIG_DATABASE_ID
        );
      } else {
        console.log("未配置CONFIG_DATABASE_ID，使用默认同步（所有书籍）");
        await syncAllBooks(NOTION_API_KEY, DATABASE_ID, cookie, !fullSync);
      }
    } else if (bookId) {
      // 同步单本书籍
      let organizeByChapter = false;
      if (CONFIG_DATABASE_ID) {
        const { loadLibraryConfig } = await import(
          "./api/notion/config-service"
        );
        const config = await loadLibraryConfig(
          NOTION_API_KEY,
          CONFIG_DATABASE_ID
        );
        organizeByChapter = config.organizeByChapter === "是";
      }
      await syncSingleBook(
        NOTION_API_KEY,
        DATABASE_ID,
        cookie,
        bookId,
        !fullSync,
        organizeByChapter
      );
    } else {
      console.log(
        "请指定要同步的书籍ID (--bookId=xxx) 或使用 --all 同步所有书籍"
      );
      console.log("添加 --full-sync 或 -f 参数可进行全量同步（而非增量）");
    }

    console.log("\n=== 同步完成 ===");
  } catch (error: any) {
    console.error("同步过程中发生错误:", error.message);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("程序执行失败:", error);
});
