import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { POST_LIMIT_CAP } from '../constants';
import { truncate } from '../utils/truncate';
import { Upvote } from '../entities/Upvote';

@InputType()
class PostInput {
  @Field()
  text!: string;

  @Field()
  title!: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts!: Post[];

  @Field()
  hasMore!: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(
    @Root() root: Post,
    @Arg('clipLength', { defaultValue: 180 }) clipLength: number
  ) {
    return truncate(root.text, clipLength, true);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    const checkedValue = value < 0 ? -1 : 1; // point is always +-1

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    // if the user has voted before and they are changing their vote
    if (upvote && upvote.value !== checkedValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        UPDATE upvote
        SET value = $1
        WHERE "postId" = $2 AND "userId" = $3;
        `,
          [checkedValue, postId, userId]
        );

        await tm.query(
          `
        UPDATE post
        SET points = points + $1
        WHERE id = $2;
        `,
          [2 * checkedValue, postId]
        );
      });
    }

    // has never voted before
    else if (!upvote) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        INSERT INTO upvote ("userId", "postId", value)
        VALUES ($1, $2, $3);
        `,
          [userId, postId, checkedValue]
        );

        await tm.query(
          `
        UPDATE post
        SET points = points + $1
        WHERE id = $2;
        `,
          [checkedValue, postId]
        );
      });
    }

    return true;
  }

  // get all posts
  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(limit, POST_LIMIT_CAP);
    const realLimitPlusOne = realLimit + 1;

    const { userId } = req.session;

    const sqlParameters: any[] = [realLimitPlusOne];
    if (userId) sqlParameters.push(userId);

    let cursorParamIndex = 3;
    if (cursor) {
      sqlParameters.push(new Date(parseInt(cursor)));
      cursorParamIndex = sqlParameters.length;
    }

    const posts = await getConnection().query(
      `
        SELECT
          p.*,
          json_build_object(
            'username', u.username,
            'id', u.id,
            'email', u.email,
            'createdAt', u."createdAt",
            'updatedAt', u."updatedAt"
            ) creator,
        ${
          userId
            ? '(SELECT value FROM upvote WHERE "userId" = $2 and "postId" = p.id) "voteStatus"'
            : 'NULL as "voteStatus"'
        }
        FROM post p

        INNER JOIN public.user u ON u.id = p."creatorId"
        ${cursor ? `WHERE p."createdAt" < $${cursorParamIndex}` : ''}
        ORDER BY p."createdAt" DESC
        LIMIT $1
      `,
      sqlParameters
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id }, relations: ['creator'] });
  }

  // create post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId
    }).save();
  }

  // update post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });

    if (!post) return null;

    if (typeof title !== 'undefined') {
      await Post.update({ id }, { title });
    }

    return post;
  }

  // delete post
  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    try {
      await Post.delete({ id });
    } catch {
      return false;
    }
    return true;
  }
}
