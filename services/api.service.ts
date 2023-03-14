"use strict";

const ApiGateway 	= require("moleculer-web");
const { ApolloService } = require("moleculer-apollo-server");

module.exports = {
    name: "api",

    mixins: [
        // Gateway
        ApiGateway,

        // GraphQL Apollo Server
        ApolloService({

            // Global GraphQL typeDefs
            typeDefs: ``,

            // Global resolvers
            resolvers: {},

            // API Gateway route options
            routeOptions: {
                path: "/graphql",
                cors: true,
                mappingPolicy: "restrict"
            },

            // https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
            serverOptions: {
                tracing: true,

                engine: {
                    apiKey: process.env.APOLLO_ENGINE_KEY
                }
            }
        })
    ]
};
