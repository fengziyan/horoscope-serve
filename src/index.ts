/*
 * @Author: CGB 1760326146@qq.com
 * @Date: 2025-03-26 15:40:50
 * @LastEditors: CGB 1760326146@qq.com
 * @LastEditTime: 2025-03-26 16:26:38
 * @FilePath: \src\horoscope.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; 
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; 
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; 

// 星座运势接口，描述星座运势的数据结构
interface horoscopeType {
  success: true;
  data: {
    type: string;
    name: string;
    title: string;
    time: string;
    todo: {
      yi: string;
      ji: string;
    };
    fortune: {
      all: number;
      love: number;
      work: number;
      money: number;
      health: number;
    };
    shortcomment: string;
    fortunetext: {
      all: string;
      love: string;
      work: string;
      money: string;
      health: string;
    };
    luckynumber: string;
    luckycolor: string;
    luckyconstellation: string;
    index: {
      all: string;
      love: string;
      work: string;
      money: string;
      health: string;
    };
  };
}

// 定义常量
const NWS_API_BASE = "https://api.vvhan.com/api/horoscope"; 

// 创建服务器实例
const server = new McpServer({
  name: "horoscope-fortune", // 设置服务名称
  version: "1.0.0", // 设置服务版本号
  capabilities: {
    resources: {}, // 不包含任何资源
  },
});

/**
 * 向星座 API 发送请求并返回数据
 * @param url API 请求地址
 * @returns 返回类型为 T 的响应数据，如果请求失败则返回 null
 */
async function horoscopeRequest<T>(url: string): Promise<T | null> {
  // 设置请求头
  const headers = {
    Accept: "application/json",
  };

  try {
    // 发送 HTTP 请求
    const response = await fetch(url, { headers });
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 解析响应 JSON 并返回
    return (await response.json()) as T;
  } catch (error) {
    // 记录错误并返回 null
    console.error("Error making horoscope request:", error);
    return null;
  }
}

/**
 * 格式化星座运势数据
 * @param data 星座运势数据
 * @returns 格式化后的星座运势字符串
 */
function formatHoroscope(data: horoscopeType) {
  const { data: horoscopeData } = data;
  return `
${horoscopeData.title}${horoscopeData.time}运势

▎ 整体运势 ${horoscopeData.index.all}
${horoscopeData.fortunetext.all}

▎ 爱情运势 ${horoscopeData.index.love}
${horoscopeData.fortunetext.love}

▎ 事业运势 ${horoscopeData.index.work}
${horoscopeData.fortunetext.work}

▎ 财运运势 ${horoscopeData.index.money}
${horoscopeData.fortunetext.money}

▎ 健康运势 ${horoscopeData.index.health}
${horoscopeData.fortunetext.health}

▎ 今日宜忌
宜：${horoscopeData.todo.yi}
忌：${horoscopeData.todo.ji}

▎ 幸运指数
幸运数字：${horoscopeData.luckynumber}
幸运颜色：${horoscopeData.luckycolor}
速配星座：${horoscopeData.luckyconstellation}

${horoscopeData.shortcomment}
`.trim();
}

/**
 * 验证星座类型是否有效
 * @param type 星座类型
 * @returns 如果星座类型有效则返回 true，否则返回 false
 */
function isValidType(type: string): boolean {
  return ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"].includes(type);
}

/**
 * 获取星座运势
 * @param type 星座类型
 * @param time 时间类型
 * @returns 星座运势数据
 */
server.tool(
  "get_horoscope", // 工具名称，从 "get-horoscope" 更改为 "get_horoscope"
  "Get your horoscope",
  {
    // 定义参数及其验证规则
    type: z
      .string()
      .describe(
        "Constellation type: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces"
      ),
    time: z.string().describe("Time type: today, nextday, week, month"),
  },
  async ({ type, time }) => {
    if (!isValidType(type)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid story type: ${type}. Must be one of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces`
      );
    }
    const url = `${NWS_API_BASE}?type=${type.toLowerCase()}&time=${time}`;
    const response = await horoscopeRequest<horoscopeType>(url);

    if (!response?.success) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to get horoscope data ${type} ${time} ${response}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: formatHoroscope(response),
        },
      ],
    };
  }
);

/**
 * 主函数：初始化并启动 MCP 服务器
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("horoscope MCP Server running on stdio");
}

// 执行主函数并捕获可能出现的错误
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
