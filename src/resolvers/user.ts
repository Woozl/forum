import { User } from '../entities/User';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from 'type-graphql';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}

@ObjectType()
class FieldError {
  @Field()
  field!: string;

  @Field()
  message!: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) return null;

    return await em.findOne(User, { id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2)
      return {
        errors: [
          {
            field: 'username',
            message: 'Username must be 3 characters or greater.'
          }
        ]
      };

    if (options.password.length <= 2)
      return {
        errors: [
          {
            field: 'password',
            message: 'Password must be 3 characters or greater.'
          }
        ]
      };

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword
    });

    try {
      await em.persistAndFlush(user);
    } catch (e: any) {
      if (e.code === '23505')
        return {
          errors: [{ field: 'username', message: 'Username already exists.' }]
        };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (user === null) {
      return {
        errors: [{ field: 'username', message: "That username doesn't exist." }]
      };
    }

    const isValid = await argon2.verify(user.password, options.password);
    if (!isValid) {
      return {
        errors: [{ field: 'password', message: 'Password is incorrect.' }]
      };
    }

    req.session.userId = user.id;

    return { user };
  }
}
