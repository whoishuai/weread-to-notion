/**
 * 书籍过滤器
 * 根据配置过滤要同步的书籍
 */

import { LibraryConfig } from "../config/types";

/**
 * 根据阅读状态字符串映射状态类型
 */
function mapReadingStatusFromString(finishReadingStatus: string): string {
  if (finishReadingStatus?.includes("已读")) {
    return "已读";
  } else if (finishReadingStatus?.includes("在读")) {
    return "在读";
  } else {
    return "未读";
  }
}

/**
 * 根据配置过滤书籍列表
 */
export function filterBooksByConfig(
  books: any[],
  config: LibraryConfig
): any[] {
  console.log(`\n=== 开始过滤书籍 ===`);
  console.log(`总书籍数量: ${books.length}`);
  console.log(`启用的阅读状态: ${config.enabledReadingStatus.join(", ")}`);

  const filteredBooks = books.filter((book) => {
    const bookStatus = mapReadingStatusFromString(book.finishReadingStatus);

    // 检查该书的阅读状态是否在启用列表中
    const shouldSync = config.enabledReadingStatus.includes(bookStatus);

    if (!shouldSync) {
      console.log(`跳过书籍《${book.title}》- 状态: ${bookStatus}`);
    }

    return shouldSync;
  });

  console.log(`过滤后书籍数量: ${filteredBooks.length}`);
  console.log(`=== 书籍过滤完成 ===\n`);

  return filteredBooks;
}

/**
 * 显示过滤统计信息
 */
export function showFilterStats(
  allBooks: any[],
  filteredBooks: any[],
  config: LibraryConfig
): void {
  const stats = {
    总数: allBooks.length,
    已读: 0,
    在读: 0,
    未读: 0,
    同步数量: filteredBooks.length,
  };

  // 统计各状态书籍数量
  allBooks.forEach((book) => {
    const status = mapReadingStatusFromString(book.finishReadingStatus);
    if (status === "已读") stats.已读++;
    else if (status === "在读") stats.在读++;
    else stats.未读++;
  });

  console.log("\n=== 书籍同步统计 ===");
  console.log(`书架总书籍: ${stats.总数} 本`);
  console.log(`  - 已读: ${stats.已读} 本`);
  console.log(`  - 在读: ${stats.在读} 本`);
  console.log(`  - 未读: ${stats.未读} 本`);
  console.log(`配置的同步状态: ${config.enabledReadingStatus.join(", ")}`);
  console.log(`将要同步: ${stats.同步数量} 本书籍`);
  console.log("==================\n");
}
