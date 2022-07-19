import { Field, InputType } from 'type-graphql';

@InputType()
export class UserInputData {
  @Field()
  username!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;
}
