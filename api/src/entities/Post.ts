import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { v4 } from "uuid";

@ObjectType()
@Entity()
export class Post {
  constructor(values: Partial<Post>) {
    Object.assign(this, values);
  }

  @Field()
  @PrimaryKey()
  id: string = v4();

  @Field()
  @Property()
  url!: string;

  @Field()
  @Property()
  created!: Date;
}
