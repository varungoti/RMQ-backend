'use client';

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';

// Function to create the Apollo Client instance
function createApolloClient() {
  return new ApolloClient({
    // Configure the link to your GraphQL API endpoint
    link: new HttpLink({
      // Replace with your actual backend GraphQL endpoint URL
      // Use environment variables for production builds
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql',
      // You can add headers here if needed (e.g., for authentication)
      // headers: { ... }
    }),
    // Use InMemoryCache for caching GraphQL data
    cache: new InMemoryCache(),
    // Optional: Connect to Apollo DevTools Extension in development
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
}

// Create a provider component that initializes the client
export function GraphQLProvider({ children }: { children: React.ReactNode }) {
  const client = createApolloClient();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
} 