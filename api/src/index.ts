import "reflect-metadata";
import "dotenv/config";
import express from 'express';
import config from './mikro-orm.config';
import Redis from 'ioredis';
import { createServer } from 'http';
import { buildSchema } from "type-graphql";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from 'apollo-server-express';
import { ApolloError, ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ValidationError } from 'class-validator';
import { GraphQLError } from 'graphql';
import { RedisPubSub } from "graphql-redis-subscriptions";
import { WebSocketServer } from "ws";
import { graphqlUploadExpress } from "graphql-upload";
import { useServer } from 'graphql-ws/lib/use/ws';
import { REDIS_HOST, REDIS_PASSWORD } from "./utils/constants";

export function errorFormatter(error: GraphQLError) {
  if (error?.message === "Argument Validation Error") {
    const errors = error?.extensions?.exception?.validationErrors as ValidationError[];

    let output: { [key: string]: string[] } = {};

    for (const error of errors) {
      if (!error.constraints) continue;

      const items = Object.values<string>(error.constraints);

      output[error.property] = items;
    }

    return new ApolloError("Validation Error", undefined, output);
  }

  return error;
}

async function startApolloServer() {
  const app = express();

  app.use(graphqlUploadExpress());

  const httpServer = createServer(app);

  const orm = await MikroORM.init(config);

  const options: Redis.RedisOptions = {
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
    port: 6379,
  };

  const pubSub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options)
  });

  const schema = await buildSchema({
    resolvers: [__dirname + '/**/resolver.{ts,js}'],
    pubSub
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
  });

  const serverCleanup = useServer({
    schema,
  }, wsServer);

  const server = new ApolloServer({
    schema,
    context: () => ({ em: orm.em.fork() }),
    formatError: errorFormatter,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  server.applyMiddleware({ app });

  await new Promise<void>(resolve => httpServer.listen({ port: 3001 }, resolve));

  console.log(`🌶️  Pepper GraphQL API Server ready at \x1b[36mhttp://0.0.0.0:3001${server.graphqlPath}\x1b[0m`);
}

startApolloServer();
