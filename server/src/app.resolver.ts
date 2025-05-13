import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String) // Define return type for GraphQL schema
  hello(): string {
    return 'Hello from RMQ GraphQL API!';
  }
} 