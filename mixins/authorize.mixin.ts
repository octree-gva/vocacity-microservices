import type { IncomingMessage } from "http";
import type {
  CheckIsAuthenticatedAction,
  CheckUserAction,
  CheckUserRoleAction,
  IntrospectAction,
  IntrospectBearerAction,
  ParsedJWT,
  ServiceTokenAction,
  ServicePolicies,
  ContextLocals,
  ContextMeta,
  VocaResponse,
} from "../types";
import createError from "../utils/createError";
import { sign } from "../utils/jwt";
import { Context, ServiceSchema } from "moleculer";
import _ from "lodash";
type ServiceAllowedMethod = (
  ctx: Context<any, ContextMeta, ContextLocals>,
  policies: ServicePolicies,
) => Promise<boolean>;
export type AuthMixin = Partial<ServiceSchema> & {
  methods: {
    serviceToken: ServiceTokenAction;
    authorizeService: ServiceAllowedMethod;
    checkUser: CheckUserAction;
    checkIsAuthenticated: CheckIsAuthenticatedAction;
    checkUserRole: CheckUserRoleAction;
    parseBearer: IntrospectBearerAction;
  };
};
const authorizeMixin: AuthMixin = {
  methods: {
    async serviceToken(ctx) {
      if (!ctx.service?.fullName) return { token: "" };
      return { token: sign(`${ctx.service?.fullName}`, ["_service"], {}, "voca", 1) };
    },
    async authorizeService(ctx, allowedServices) {
      // Parse the token
      const parsedToken: ParsedJWT = await ctx.call<
        VocaResponse<IntrospectAction["returns"]>,
        IntrospectAction["params"]
      >("user-permissions.introspect", { token: `${ctx.meta.bearer}` });
      if (!parsedToken.active) throw new Error("errors.auth.forbidden");
      if (!allowedServices) throw new Error("errors.auth.forbidden");
      return allowedServices.some((value) => ctx.service?.fullName);
    },
    async checkUser(ctx, route, request) {
      await Promise.all([
        this.parseBearer(ctx, route, request),
        this.checkIsAuthenticated(ctx, route, request),
        this.checkUserRole(ctx, route, request),
      ]);
    },
    async checkIsAuthenticated(ctx) {
      if (!ctx.meta.user) {
        throw createError(401, "errors.auth.authenticated");
      }
    },
    async checkUserRole(ctx) {
      if (!ctx?.action?.role || ctx.action.role === "public") {
        return;
      }
      const roles = ctx.meta.permissions || [];
      if (!roles.includes(ctx.action.role)) {
        throw createError(403, "errors.auth.forbidden");
      }
    },
    async parseBearer(ctx, _route, request) {
      let token;
      const req = request as IncomingMessage;
      const authorization = _.get(req, "headers.authorization", req.headers["authorization"]) || "";
      if (authorization) {
        const type = authorization.split(" ")[0];
        if (type === "Token" || type === "Bearer") {
          token = authorization.split(" ")[1];
        } else {
          throw new Error("Internal Error: Wrong token type.");
        }
      }
      const { code, ...parsedToken } = await ctx.call<
        VocaResponse<IntrospectAction["returns"]>,
        IntrospectAction["params"]
      >("user-permissions.introspect", { token: `${token}` });
      return { token: parsedToken };
    },
  },
};

export default authorizeMixin;
