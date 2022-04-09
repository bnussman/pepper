import React from 'react';
import { client } from './utils/apollo';
import { ApolloProvider } from '@apollo/client';
import { NativeBaseProvider } from 'native-base';
import { Feed } from './Feed';

export default function App() {
    return (
        <NativeBaseProvider>
            <ApolloProvider client={client}>
                <Feed />
            </ApolloProvider>
        </NativeBaseProvider>
    );
}

