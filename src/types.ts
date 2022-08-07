import { Request, Response } from 'express';
import Redis from 'ioredis';
import { createUserLoader } from './utils/createUserLoader';

declare module 'express-session' {
  export interface SessionData {
    userId: any;
  }
}

export type MyContext = {
  req: Request;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
};
