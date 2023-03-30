import { ApolloService } from "moleculer-apollo-server";
import ApiGateway from "moleculer-web";
import compression from "compression";

export default {
	name: "api",
	settings: {
		path: "/",
		use: [compression()],

		routes: [
			/**
			 * Static route
			 */
			{
				path: "/",
				use: [
					// Serve static
					ApiGateway.serveStatic("./public"),
				],

				// Action aliases
				aliases: {},

				mappingPolicy: "restrict",
			},
			{
				path: "/jelastic",
				use: [
					// Serve static
					ApiGateway.serveStatic("./jelastic-manifests"),
				],

				// Action aliases
				aliases: {},

				mappingPolicy: "restrict",
			},
		],
	},
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
				mappingPolicy: "restrict",
			},

			// https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html
			serverOptions: {
				tracing: true,

				engine: {
					apiKey: process.env.APOLLO_ENGINE_KEY,
				},
			},
		}),
	],
};
