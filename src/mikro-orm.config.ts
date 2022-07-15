import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    glob: '!(*.d).{js,ts}'
  },
  entities: [Post],
  dbName: 'forum',
  user: 'postgres',
  password: 'postgres',
  type: 'postgresql',
  allowGlobalContext: true,
  debug: !__prod__
} as Parameters<typeof MikroORM.init>[0];