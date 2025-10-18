import {Context, Logger,} from "koishi";
import {
  TeamSpeak,
  QueryProtocol,
  ClientConnectEvent,
  ClientType
} from "ts3-nodejs-library";

import {Config} from "./config";
import {registerCommands} from "./command";

export const inject = [ 'database' ]
export * from "./config";
export * from "./command";
export const name = "teamspeak";

export function apply(ctx: Context, config: Config) {

  const logger = new Logger("teamspeak");
  let ts: TeamSpeak | null;


  const joinListener = (e: ClientConnectEvent) => {
    if (e.client.type === ClientType.ServerQuery) return;
    const group=[...config.groups]
    logger.debug(config.groups)
    logger.info(`${e.client.nickname} 进入了TS.`);
    ctx.broadcast(group,`${e.client.nickname} 进入了TS.`)
  };

  const closeListener = async () => {
    logger.info("连接中断...");
    try {
      await ts.reconnect(-1, 1000);
      logger.info("重连成功!");
    } catch (error) {
      logger.error("重连失败:", error);
    }
  };

  const TextMessageListener = (e: any) => {
    if (e.invoker.type === ClientType.ServerQuery) {
      logger.info(e.msg)
    }else{
      logger.debug(config.groups)
      logger.info(`${e.invoker.nickname} 在TS说: ${e.msg}`);
      const group=[...config.groups]
      ctx.broadcast(group,`${e.invoker.nickname} 在TS说: ${e.msg}`)
    }
  }


  ctx.on("ready", async () => {
    try {
      ts = await TeamSpeak.connect({
        host: config.host,
        serverport: config.port,
        protocol: config.protocol === "raw" ? QueryProtocol.RAW : config.protocol === "ssh" ? QueryProtocol.SSH : null,
        queryport: config.queryport,
        username: config.user,
        password: config.password,
        nickname: config.nickname,
      });

      logger.info("已连接到teamspeak服务器.");

      ts.on("ready", async () => {
        try {
          const clients = await ts.clientList({client_type: 0})
          clients.forEach(client => {
            logger.info("发送消息", client.nickname)
            client.message("Hello!")
          })
        } catch (e) {
          console.log("出现错误!")
          console.error(e)
        }
      })

      ts.on("clientconnect", joinListener);
      ts.on("close", closeListener);
      ts.on("textmessage", TextMessageListener);

    } catch (error) {
      logger.error("连接到teamspeak服务器出错", error);
    }
    registerCommands(ctx, ts, logger);
  });

  ctx.on("dispose", () => {
    if (!ts) return;
    ts.removeAllListeners();
    ts.quit().catch(error => logger.error("退出TeamSpeak连接时出错:", error));
  });
}
