import path from 'path';
import { DataSource } from 'typeorm';
import { Post } from '../entities/Post';
import { Upvote } from '../entities/Upvote';
import { User } from '../entities/User';

const myDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'forum3',
  logging: true,
  migrations: [path.join(__dirname, './migrations/*')],
  entities: [Post, User, Upvote]
});

export default myDataSource;
