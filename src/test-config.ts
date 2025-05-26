/**
 * 配置功能测试脚本
 */

import dotenv from "dotenv";
import {
  loadLibraryConfig,
  checkSyncConfigExists,
  createDefaultSyncConfig,
} from "./api/notion/config-service";

// 加载环境变量
dotenv.config({ path: ".env" });

async function testConfig() {
  try {
    console.log("=== 配置功能测试 ===");

    // 获取环境变量
    const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
    const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;

    if (!NOTION_API_KEY) {
      console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
      return;
    }

    if (!CONFIG_DATABASE_ID) {
      console.error("错误: 缺少 CONFIG_DATABASE_ID 环境变量");
      console.log("请在 .env 文件中设置 CONFIG_DATABASE_ID");
      return;
    }

    console.log(`配置数据库ID: ${CONFIG_DATABASE_ID}`);

    // 1. 检查配置是否存在
    console.log("\n1. 检查同步配置是否存在...");
    const configExists = await checkSyncConfigExists(
      NOTION_API_KEY,
      CONFIG_DATABASE_ID
    );
    console.log(`配置存在: ${configExists}`);

    // 2. 如果不存在，创建默认配置
    if (!configExists) {
      console.log("\n2. 创建默认同步配置...");
      const created = await createDefaultSyncConfig(
        NOTION_API_KEY,
        CONFIG_DATABASE_ID
      );
      console.log(`配置创建结果: ${created}`);
    }

    // 3. 加载配置
    console.log("\n3. 加载配置...");
    const config = await loadLibraryConfig(NOTION_API_KEY, CONFIG_DATABASE_ID);
    console.log("当前配置:", config);

    console.log("\n=== 测试完成 ===");
    console.log(
      "如果一切正常，您可以在Notion配置数据库中修改'同步配置'页面的'阅读状态'字段来控制同步规则"
    );
  } catch (error: any) {
    console.error("测试失败:", error.message);
  }
}

// 运行测试
testConfig().catch((error) => {
  console.error("测试执行失败:", error);
});
