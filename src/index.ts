import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { MyContext } from './types';
const { createClient } = require('redis');

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  let redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  app.set('trust proxy', !__prod__);

  app.use(
    session({
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      name: 'qid',
      secret: 'be3708ed-a7d3-41d5-b7be-5b5afbff99da',
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        // sameSite: true, // csrf
        // secure: __prod__ // https only

        // to get it to work with Apollo GraphQL Studio
        sameSite: 'none',
        secure: true
      }
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: [
        'https://studio.apollographql.com',
        'http://localhost:4000/graphql',
        'https://localhost:3000'
      ],
      credentials: true
    }
  });

  app.listen(4000, () => {
    console.log('[Server] Started listening on localhost:4000');
  });
};

main();
