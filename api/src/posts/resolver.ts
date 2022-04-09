import { Arg, Args, Authorized, Ctx, Mutation, ObjectType, PubSub, PubSubEngine, Query, Resolver, Root, Subscription } from "type-graphql";
import { Context } from "../utils/context";
import { Post } from "../entities/Post";
import { Paginated, PaginationArgs } from "../utils/paginated";
import { PostArgs } from "./args";
import { QueryOrder } from "@mikro-orm/core";

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
  public async createPost(@Ctx() { em }: Context, @PubSub() pubSub: PubSubEngine, @Args() args: PostArgs) {
    const post = new Post({});

    await em.persistAndFlush(post);

    pubSub.publish("create-post", post);

    return post;
  }

  @Subscription(() => Post, { topics: "create-post" })
  public addPost(@Root() post: Post): Post {
    return post;
  }
}
