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
} from "../types";
import createError from "../utils/createError";
import { sign } from "../utils/jwt";
import { Context, ServiceSchema } from "moleculer";
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
			const parsedToken: ParsedJWT = await ctx.call<ParsedJWT, IntrospectAction>(
				"user-permissions.introspect",
				{ token: `${ctx.meta.bearer}` },
			);
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
			const roles = ctx.locals.roles || [];
			if (!roles.includes(ctx.action.role)) {
				throw createError(403, "errors.auth.forbidden");
			}
		},
		async parseBearer(ctx, _route, request) {
			let token;
			const req = request as IncomingMessage;
			if (req.headers.authorization) {
				const type = req.headers.authorization.split(" ")[0];
				if (type === "Token" || type === "Bearer") {
					token = req.headers.authorization.split(" ")[1];
				}
			}
			const parsedToken: ParsedJWT = await ctx.call<ParsedJWT, IntrospectAction>(
				"user-permissions.introspect",
				{ token: `${token}` },
			);
			ctx.locals.token = parsedToken;
			if (parsedToken.active) {
				ctx.meta = ctx?.meta || { user: undefined };
				ctx.meta.user = parsedToken.sub;
				ctx.locals.roles = parsedToken.aud;
			}
			return { token: parsedToken };
		},
	},
};

export default authorizeMixin;
