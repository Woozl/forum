import 'reflect-metadata';
import { COOKIE_ID, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { MyContext } from './types';
import {
  ApolloServerPluginLandingPageProductionDefault,
  ApolloServerPluginLandingPageLocalDefault
} from 'apollo-server-core';
import Redis from 'ioredis';
import { createConnection } from 'typeorm';
import { User } from './entities/User';
import { Post } from './entities/Post';
import path from 'path';
import { Upvote } from './entities/Upvote';
import { createUserLoader } from './utils/createUserLoader';

const main = async () => {
  const conn = createConnection({
    type: 'postgres',
    database: 'forum2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, Upvote]
  });

  (await conn).runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  let redis = new Redis();

  // https://github.com/apollographql/apollo-server/issues/5775#issuecomment-936896592
  // Workaround to set cookie over insecure connection
  // Set 'x-forwarded-proto' header to 'https' in ApolloGraphQL
  app.set('trust proxy', !__prod__);

  app.use(
    session({
      store: new RedisStore({ client: redis, disableTouch: true }),
      name: COOKIE_ID,
      secret: 'be3708ed-a7d3-41d5-b7be-5b5afbff99da',
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        // sameSite: true, // csrf
        // secure: __prod__ // https only

        // to get it to work with Apollo GraphQL Studio
        sameSite: __prod__ ? 'strict' : 'lax',
        secure: __prod__
      }
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader()
    }),
    plugins: [
      // Install a landing page plugin based on NODE_ENV
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: 'my-graph-id@my-graph-variant',
            footer: false
          })
        : ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            footer: false
          })
    ]
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: ['https://studio.apollographql.com', 'http://localhost:3000'],
      credentials: true
    }
  });

  app.listen(4000, () => {
    console.log('[Server] Started listening on localhost:4000');
  });
};

main();
