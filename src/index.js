import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';
import path from 'path';

import { userResolvers } from './graphql/resolvers/user.resolver';
import {authMiddleware} from "./graphql/middleware/permission.middleware";

async function startServer() {
    const app = express();

    // Load schema
    const schema = loadSchemaSync(path.join(__dirname, './graphql/schemas/**/*.graphql'), {
        loaders: [new GraphQLFileLoader()]
    });

    // Add resolvers
    const schemaWithResolvers = addResolversToSchema({
        schema,
        resolvers: {
            Query: {
                ...userResolvers.Query
            },
            Mutation: {
                ...userResolvers.Mutation
            }
        }
    });

    // Apollo Server setup
    const server = new ApolloServer({
        schema: schemaWithResolvers,
        context: ({ req }) => ({
            token: req.headers.authorization?.replace('Bearer ', ''),
        }),
        // Add global middleware
        plugins: [{
            requestDidStart: authMiddleware
        }]
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer().catch(console.error);