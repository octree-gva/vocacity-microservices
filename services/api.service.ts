import compression from "compression";
import { Context } from "moleculer";
import { ApolloService, Request } from "moleculer-apollo-server";
import ApiGateway from "moleculer-web";
import AuthorizeMixin, { AuthMixin } from "../mixins/authorize.mixin";
import { ContextLocals, ContextMeta } from "../types";

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
        path: "/services",
        aliases: {
          dns: "dns.routing",
        },
      },
    ],
  },
  methods: {
    // Second thing
    async authorize(
      ctx: Context<{}, ContextMeta, ContextLocals>,
      route: any,
      req: any,
      res: Response,
    ) {
      const methods = this as unknown as AuthMixin["methods"];
      const { token: parsedToken } = await methods.parseBearer(ctx, route, req);
      ctx.meta = ctx.meta || {};
      ctx.meta.isUserSignedIn = !!parsedToken.active;
      if (ctx.meta.isUserSignedIn) {
        ctx.meta.user = parsedToken.sub;
        ctx.meta.permissions = parsedToken.aud;
      }
      console.log(ctx.meta);
    },
  },
  mixins: [
    AuthorizeMixin,
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
        authorization: true,
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
