import { Post } from '../entities/Post';
import { MyContext } from '../types';
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';

@Resolver()
export class PostResolver {
  // get all posts
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // create post
  @Mutation(() => Post)
  async createPost(
    @Arg('title') title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // update post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });

    if (!post) return null;

    if (typeof title !== undefined) {
      post.title = title;
      em.persistAndFlush(post);
    }

    return post;
  }

  // delete post
  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Post, { id });
    } catch {
      return false;
    }
    return true;
  }
}
