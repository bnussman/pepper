import { ApolloClient, InMemoryCache, split } from "@apollo/client";
import { createClient, ClientOptions, Client } from 'graphql-ws';
import { getMainDefinition } from "@apollo/client/utilities";
import { print } from 'graphql';
import { createUploadLink } from 'apollo-upload-client';
import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from '@apollo/client/core';

// const host = "192.168.1.98";

// const url = __DEV__ ? `http://${host}:3001/graphql` : 'https://api.pepper.nussman.us/graphql' ;
// const wsUrl = __DEV__  ? `ws://${host}:3001/subscriptions` : 'wss://api.pepper.nussman.us/subscriptions';

const url = 'https://pepper.nussman.us/graphql' ;
const wsUrl = 'wss://pepper.nussman.us/subscriptions';

class WebSocketLink extends ApolloLink {
  private client: Client;

  constructor(options: ClientOptions) {
    super();
    this.client = createClient(options);
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      );
    });
  }
}

const wsLink = new WebSocketLink({
  url: wsUrl,
  lazy: false,
  retryAttempts: Infinity,
  isFatalConnectionProblem: () => false,
});

const httpLink = createUploadLink({
  uri: url,
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
);

const cache = new InMemoryCache();

export const client = new ApolloClient({
  link: ApolloLink.from([
    splitLink,
    httpLink
  ]),
  cache
});
