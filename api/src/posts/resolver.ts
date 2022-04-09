import { Args, Ctx, Mutation, ObjectType, PubSub, PubSubEngine, Query, Resolver, Root, Subscription } from "type-graphql";
import { Context } from "../utils/context";
import { Post } from "../entities/Post";
import { Paginated, PaginationArgs } from "../utils/paginated";
import { PostArgs } from "./args";
import { QueryOrder } from "@mikro-orm/core";
import { upload } from "../utils/s3";
import { FileUpload } from "graphql-upload";

@ObjectType()
export class PostsResponse extends Paginated(Post) {}

@Resolver(Post)
export class PostsResolver {

  @Query(() => PostsResponse)
  public async getPosts(@Ctx() ctx: Context, @Args() { offset, limit }: PaginationArgs): Promise<PostsResponse> {
    const [posts, count] = await ctx.em.findAndCount(Post, {}, {
      limit,
      offset,
      orderBy: { created: QueryOrder.DESC },
    });

    return {
      data: posts,
      count: count
    };
  }  

  @Mutation(() => Post)
  public async createPost(@Ctx() { em }: Context, @PubSub() pubSub: PubSubEngine, @Args() { audio }: PostArgs) {
    const post = new Post();

    const file = await (audio as unknown as Promise<FileUpload>);

    const uri = await upload(file, post.id);

    post.url = uri;

    await em.persistAndFlush(post);

    pubSub.publish("new-post", post);

    return post;
  }

  @Subscription(() => Post, { topics: "new-post" })
  public newPost(@Root() post: Post): Post {
    return { ...post, created: new Date(post.created) };
  }
}
