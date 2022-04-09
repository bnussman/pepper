import { GraphQLUpload, Upload } from "graphql-upload";
import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class PostArgs {
  @Field(() => GraphQLUpload)
  audio!: Upload;
}
