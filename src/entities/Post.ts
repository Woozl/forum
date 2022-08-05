import { Field, Int, ObjectType } from 'type-graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { Upvote } from './Upvote';
import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // [OptionalProps]?: 'updatedAt' | 'createdAt';

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number;

  @Field(() => Int, { nullable: true })
  voteStatus!: number | null;

  @OneToMany(() => Upvote, (upvote) => upvote.post)
  upvotes!: Upvote[];

  @Field()
  @Column()
  creatorId!: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}
