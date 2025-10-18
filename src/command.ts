import { Context, Logger } from "koishi";
import { TeamSpeak, ClientType, TeamSpeakChannel } from "ts3-nodejs-library";

export function registerCommands(ctx: Context, instance: TeamSpeak, logger: Logger) {
  ctx
    .command("ts", "谁在ts上?")
    .alias("谁在ts")
    .action(async ( ) => {
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

        // 发送消息到 TeamSpeak
        const tsMessage = "当前在线用户列表已发送到 Koishi。";
        await instance.sendTextMessage("0", 3, tsMessage);

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
}
