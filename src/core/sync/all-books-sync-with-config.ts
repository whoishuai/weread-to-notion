/**
 * 带配置过滤的批量同步所有书籍模块
 */

import { enhanceBookMetadata } from "../formatter";
import { syncBookContent } from "./book-sync";
import { saveSyncState } from "../../utils/file";
import { getNotebookBooks, getBookshelfBooks } from "../../api/weread/services";
import {
  checkBookExistsInNotion,
  writeBookToNotion,
} from "../../api/notion/services";
import {
  loadLibraryConfig,
  checkSyncConfigExists,
  createDefaultSyncConfig,
} from "../../api/notion/config-service";
import { filterBooksByConfig, showFilterStats } from "../book-filter";
import { LibraryConfig } from "../../config/types";

/**
 * 同步所有书籍到Notion（带配置过滤）
 */
export async function syncAllBooksWithConfig(
  apiKey: string,
  databaseId: string,
  cookie: string,
  useIncremental: boolean = true,
  configDatabaseId?: string
): Promise<void> {
  console.log(
    `\n=== 开始${useIncremental ? "增量" : "全量"}同步所有书籍（带配置过滤）===`
  );

  try {
    // 1. 加载同步配置
    let config: LibraryConfig = {
      enabledReadingStatus: ["已读", "在读", "未读"], // 默认同步所有状态
    };

    if (configDatabaseId) {
      // 检查配置是否存在，如果不存在则创建默认配置
      const configExists = await checkSyncConfigExists(
        apiKey,
        configDatabaseId
      );
      if (!configExists) {
        console.log("配置数据库中未找到同步配置，正在创建默认配置...");
        await createDefaultSyncConfig(apiKey, configDatabaseId);
      }

      // 加载配置
      config = await loadLibraryConfig(apiKey, configDatabaseId);
    } else {
      console.log("未提供配置数据库ID，使用默认配置（同步所有状态）");
    }

    // 2. 获取书架中的书籍
    const shelfBooks = await getBookshelfBooks(cookie);

    // 3. 获取笔记本中的书籍（有划线的书籍）
    const notebookBooks = await getNotebookBooks(cookie);

    // 4. 合并书籍元数据
    const allBooks = await enhanceBookMetadata(
      cookie,
      shelfBooks,
      notebookBooks
    );

    // 5. 根据配置过滤书籍
    const booksToSync = filterBooksByConfig(allBooks, config);

    // 6. 显示过滤统计信息
    showFilterStats(allBooks, booksToSync, config);

    console.log(`\n准备同步 ${booksToSync.length} 本书到Notion...`);

    // 同步结果统计
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // 遍历所有书籍并同步
    for (let i = 0; i < booksToSync.length; i++) {
      const book = booksToSync[i];
      console.log(
        `\n[${i + 1}/${booksToSync.length}] 同步《${book.title}》...`
      );

      // 检查书籍是否已存在于Notion
      const { exists, pageId: existingPageId } = await checkBookExistsInNotion(
        apiKey,
        databaseId,
        book.title,
        book.author
      );

      let finalPageId: string;

      if (exists && existingPageId) {
        console.log(`《${book.title}》已存在于Notion，将更新现有记录`);
        finalPageId = existingPageId;
      } else {
        // 写入书籍元数据到Notion
        const writeResult = await writeBookToNotion(apiKey, databaseId, book);

        if (!writeResult.success || !writeResult.pageId) {
          failCount++;
          console.log(`《${book.title}》同步失败`);
          continue; // 跳过此书继续处理下一本
        }
        finalPageId = writeResult.pageId;
      }

      // 同步书籍内容
      const syncContentResult = await syncBookContent(
        apiKey,
        databaseId,
        cookie,
        book.bookId,
        finalPageId,
        book,
        useIncremental
      );

      // 检查是否有真正的更新
      const hasUpdates = syncContentResult.hasUpdate || !useIncremental;

      if (!hasUpdates) {
        console.log(`《${book.title}》没有检测到新内容，跳过同步`);
        skippedCount++;
        continue; // 跳过此书继续处理下一本
      }

      // 保存同步状态
      if (useIncremental) {
        const syncState = {
          bookId: book.bookId,
          lastSyncTime: Date.now(),
          highlightsSynckey: syncContentResult.highlightsSynckey,
          thoughtsSynckey: syncContentResult.thoughtsSynckey,
        };
        saveSyncState(syncState);
        console.log(
          `已保存同步状态，highlightsSynckey: ${syncContentResult.highlightsSynckey}, thoughtsSynckey: ${syncContentResult.thoughtsSynckey}`
        );
      }

      if (syncContentResult.success) {
        console.log(`《${book.title}》同步成功`);
        successCount++;
      } else {
        console.log(`《${book.title}》基本信息同步成功，但内容同步失败`);
        failCount++;
      }

      // 添加延迟，避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n=== 同步完成 ===");
    console.log(
      `成功: ${successCount} 本，失败: ${failCount} 本，跳过(无更新): ${skippedCount} 本`
    );
  } catch (error: any) {
    console.error("同步过程中发生错误:", error.message);
  }
}
