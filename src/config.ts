import {Schema} from "koishi";

export interface Config {
  groups: string[];
  host: string;
  port: number;
  protocol: 'raw' | 'ssh';
  queryport: number;
  user: string;
  password: string;
  nickname: string;
}

export const Config: Schema<Config> = Schema.object({
  groups: Schema.array(Schema.string())
    .description("监听TS通知的群")
    .default([]),
  host: Schema.string().description("服务器IP").default("localhost"),
  port: Schema.number().description("服务器端口").default(9987),
  protocol: Schema.union(['raw', 'ssh']).description("链接协议,如果你不知道这是什么，最好别动他").default('raw'),
  queryport: Schema.number().description("ServerQuery端口").default(10011),
  user: Schema.string().description("ServerQuery用户名").default(""),
  password: Schema.string().description("ServerQuery密码").default(""),
  nickname: Schema.string().description("机器人昵称").default("TSBot"),
});
