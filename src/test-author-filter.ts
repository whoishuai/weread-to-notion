/**
 * 作者过滤功能测试脚本
 */

import dotenv from "dotenv";
import { getBrowserCookie } from "./utils/cookie";
import {
  refreshSession,
  getBookshelfBooks,
  getNotebookBooks,
} from "./api/weread/services";
import { enhanceBookMetadata } from "./core/formatter";
import { loadLibraryConfig } from "./api/notion/config-service";
import { filterBooksByConfig, showFilterStats } from "./core/book-filter";

// 加载环境变量
dotenv.config({ path: ".env" });

async function testAuthorFilter() {
  try {
    console.log("=== 作者过滤功能测试 ===");

    // 获取环境变量
    const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
    const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;

    if (!NOTION_API_KEY) {
      console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
      return;
    }

    if (!CONFIG_DATABASE_ID) {
      console.error("错误: 缺少 CONFIG_DATABASE_ID 环境变量");
      return;
    }

    console.log(`配置数据库ID: ${CONFIG_DATABASE_ID}`);

    // 1. 获取微信读书数据
    let cookie = getBrowserCookie();
    console.log("成功加载Cookie");

    // 刷新会话
    cookie = await refreshSession(cookie);
    console.log("会话已刷新");

    // 2. 获取书籍数据
    const shelfBooks = await getBookshelfBooks(cookie);
    const notebookBooks = await getNotebookBooks(cookie);
    const allBooks = await enhanceBookMetadata(
      cookie,
      shelfBooks,
      notebookBooks
    );

    console.log("\n=== 书架中的所有作者 ===");
    const authors = new Set<string>();
    allBooks.forEach((book) => {
      const author = book.author || "未知作者";
      authors.add(author);
    });

    console.log("发现的作者列表:");
    Array.from(authors)
      .sort()
      .forEach((author) => {
        const count = allBooks.filter(
          (book) => (book.author || "未知作者") === author
        ).length;
        console.log(`  - ${author}: ${count} 本书`);
      });

    // 3. 加载配置
    console.log("\n=== 加载配置 ===");
    const config = await loadLibraryConfig(NOTION_API_KEY, CONFIG_DATABASE_ID);

    // 4. 测试过滤
    console.log("\n=== 测试过滤效果 ===");
    const filteredBooks = filterBooksByConfig(allBooks, config);
    showFilterStats(allBooks, filteredBooks, config);

    console.log("\n=== 过滤后的书籍列表 ===");
    filteredBooks.forEach((book, index) => {
      console.log(
        `${index + 1}. 《${book.title}》 - 作者: ${
          book.author || "未知作者"
        } - 状态: ${book.finishReadingStatus}`
      );
    });

    console.log("\n=== 测试完成 ===");
  } catch (error: any) {
    console.error("测试失败:", error.message);
  }
}

// 运行测试
testAuthorFilter().catch((error) => {
  console.error("测试执行失败:", error);
});
