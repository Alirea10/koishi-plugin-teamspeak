import {Context, Logger} from "koishi";
import {
  TeamSpeak,
  QueryProtocol,
  ClientConnectEvent,
  ClientType,
  TeamSpeakChannel,
} from "ts3-nodejs-library";

import {Config} from "./config";

export * from "./config";

export const name = "teamspeak";

export function apply(ctx: Context, config: Config) {

  const logger = new Logger("teamspeak");
  const bot = ctx.bots[0];
  let instance: TeamSpeak | null;

  const joinListener = (e: ClientConnectEvent) => {
    if (e.client.type === ClientType.ServerQuery) return;

    config.groups.forEach((groupId) => {
      bot.sendMessage(groupId, `${e.client.nickname} 进入了TS.`);
    });
  };

  const closeListener = async () => {
    logger.info("连接中断...");
    try {
      await instance.reconnect(-1, 1000);
      logger.info("重连成功!");
    } catch (error) {
      logger.error("重连失败:", error);
    }
  };

  //命令注册
  ctx
    .command("ts", "谁在ts上?")
    .alias("谁在ts")
    .action(async ({session}) => {
      if (!instance) return;
      try {
        const clients = await instance.clientList({
          clientType: ClientType.Regular,
        });

        if (!clients.length) return "没有人.";

        const channelMap = new Map<TeamSpeakChannel, string[]>();
        for (const c of clients) {
          const channel = await instance.getChannelById(c.cid);

          channelMap.set(
            channel,
            (channelMap.get(channel) || []).concat([c.nickname])
          );
        }

        const channelArray = Array.from(channelMap.keys());
        channelArray.sort((a, b) => a.order - b.order);

        let message = "";
        for (const ch of channelArray) {
          message += `${ch.name}:\r\n`;
          message += "    " + (channelMap.get(ch) || []).join(", ") + "\r\n";
        }
        return message;
      } catch (error) {
        logger.error("获取客户端列表时出错:", error);
        return "获取客户端列表时出错，请查看日志了解更多信息。";
      }
    });

  ctx.on("ready", async () => {
    if (instance) return;

    try {
      instance = await TeamSpeak.connect({
        host: config.host,
        serverport: config.port,
        protocol: config.protocol === "raw" ? QueryProtocol.RAW : config.protocol === "ssh" ? QueryProtocol.SSH : null,
        queryport: config.queryport,
        username: config.user,
        password: config.password,
        nickname: config.nickname,
      });

      instance.on("clientconnect", joinListener);
      instance.on("close", closeListener);
      logger.info("已连接到teamspeak服务器.");
    } catch (error) {
      logger.error("连接到teamspeak服务器出错", error);
    }
  });

  ctx.on("dispose", () => {
    if (!instance) return;
    instance.removeAllListeners();
    instance.quit().catch(error => logger.error("退出TeamSpeak连接时出错:", error));
  });
}
