import type { QueryFilters } from "moleculer-db";
import type {
	Action,
	IntrospectAction,
	IntrospectBearerAction,
	Organization,
	ServiceDefinition,
	ServiceResponse,
	User,
	UserLoginAction,
	UserPermission,
	UserRegistrationAction,
	UserResetPasswordAction,
	VocaError,
	VocaResponse,
} from "../types";
import {
	create400,
	createGraphql400,
	createGraphql404,
	createSuccess,
} from "../utils/createResponse";
import { parse, sign } from "../utils/jwt";
import AuthorizationMixin, { AuthMixin } from "../mixins/authorize.mixin";

const serializePermissions = (perms: UserPermission[]) =>
	perms.reduce((acc, next) => {
		const { permissions: permCsv } = next;
		return acc.concat(
			permCsv
				.split(",")
				.filter(Boolean)
				.map((p: string) => `${next.organisation_id}.${p.trim()}`),
		);
	}, [] as string[]);

const UserPermissionsService: ServiceDefinition<
	{
		register: UserRegistrationAction;
		login: UserLoginAction;
		profile: Action;
		sendResetPassword: {
			params: Omit<UserLoginAction["params"], "password">;
			returns: { ok: boolean };
		};
		resetPassword: UserResetPasswordAction;
		introspect: IntrospectAction;
	},
	[typeof AuthorizationMixin]
> = {
	name: "user-permissions",
	mixins: [AuthorizationMixin],
	settings: {
		graphql: {
			type: `
                """
                User Model
                """
                type UserPermission_User {
                  id: String!
                  email: String!
                  firstName: String!
                  lastName: String!
                }

                """
                Credential after a successfull authentication
                """			
                type UserPermission_AuthCredential {
										code: Int!
                    jwt: String!
                }

                """
                No Content type
                """
                type UserPermission_NoContent {
                  ok: Boolean!
                }
            `,
		},
	},
	actions: {
		introspect: {
			params: {
				token: "string",
			},
			async handler({ params }) {
				const tk = parse(params.token);
				if (tk.active) {
					return createSuccess(tk);
				}
				return create400();
			},
		},
		register: {
			params: {
				email: "string",
				password: "string",
				passwordConfirmation: "string",
			},
			graphql: {
				mutation: `
                  """
                    Register a new user
                  """
                  register(email: String!, password: String!, passwordConfirmation: String!): UserPermission_AuthCredential
                `,
			},
			handler: async (ctx) => {
				const { params } = ctx;
				const authMethods = this as unknown as AuthMixin["methods"];
				const { token: serviceToken } = await authMethods.serviceToken(ctx);
				if (params.password !== params.passwordConfirmation) {
					throw createGraphql400("user_permissions.errors.passwords_dont_match");
				}

				const user: ServiceResponse<User> = await ctx.call(
					"users-data.register",
					{
						email: params.email,
						password: `${params.password}`,
					},
					{ meta: { bearer: serviceToken } },
				);
				if (user.code > 300) {
					const error = user as unknown as VocaError;
					if (error.message === "unique_violation") {
						throw createGraphql400("user_permissions.errors.email_taken");
					}
					throw createGraphql400("user_permissions.errors.unknown");
				}
				// create self organisation, and attribute a permission
				const selfOrg = await ctx.call<Organization, Partial<Organization>>(
					"organisations-data.create",
					{ name: params.email },
				);
				await ctx.call<UserPermission, { entity: Partial<UserPermission> }>(
					"user-permissions-data.insert",
					{
						entity: {
							user_id: user.id,
							organisation_id: selfOrg.id,
							permissions: "admin",
						},
					},
				);

				// Get permissions:
				const permissions = await ctx.call<UserPermission[], QueryFilters>(
					"user-permissions-data.find",
					{
						query: {
							user_id: user.id,
						},
					},
				);
				const jws = sign(
					user.id,
					serializePermissions(permissions),
					{
						email: user.email,
					},
					"user-permissions",
				);
				return createSuccess({ jwt: jws });
			},
		},
		profile: {
			graphql: {
				query: `
                  """
                    Get profile details
                  """
                  profile: UserPermission_User
                `,
			},
			params: {},
			async handler() {
				// TODO handle Bearer token.
				return createSuccess();
			},
		},
		login: {
			params: {
				email: "email",
				password: "string",
			},
			graphql: {
				mutation: `
                  """
                    Log in a user by email/password
                  """
                  login(email: String!, password: String!): UserPermission_AuthCredential
                `,
			},
			async handler(ctx) {
				const authMethods = this as unknown as AuthMixin["methods"];
				const { token: serviceToken } = await authMethods.serviceToken(ctx);

				const { params } = ctx;
				const auth: User | undefined = await ctx.call(
					"users-data.login",
					{
						email: params.email,
						password: params.password,
					},
					{ meta: { bearer: serviceToken } },
				);
				if (!auth || !auth.id) {
					throw createGraphql404();
				}
				const permissions = await ctx.call<UserPermission[], QueryFilters>(
					"user-permissions-data.find",
					{
						query: {
							user_id: auth.id,
						},
					},
				);
				// Get the permission
				const jws = sign(
					auth.id,
					serializePermissions(permissions),
					{
						email: `${auth.email}`,
					},
					"user-permissions",
				);
				return createSuccess({ jwt: jws });
			},
		},
		sendResetPassword: {
			params: {
				email: "string",
			},
			graphql: {
				mutation: `
                  """
                    Send a reset password email
                  """
                  sendResetPassword(email: String!): UserPermission_NoContent
                `,
			},
			async handler(ctx) {
				const { params } = ctx;
				const authMethods = this as unknown as AuthMixin["methods"];
				const { token: serviceToken } = await authMethods.serviceToken(ctx);

				const matches: User[] = await ctx.call(
					"users-data.find",
					{
						query: {
							email: params.email,
						},
					},
					{ meta: { bearer: serviceToken } },
				);
				const [user] = matches;
				if (!user || !user.id) {
					return createSuccess({ ok: true });
				}
				const token = sign(`${user.id}`, ["reset_password"], {}, "user-permissions", 15);
				try {
					await ctx.call("mailer.send", {
						data: { token },
						to: `${user.email}`,
						template: "user-permissions/reset_password_instructions",
						language: "en",
					});
				} finally {
					return createSuccess({ ok: true });
				}
			},
		},
		resetPassword: {
			params: {
				newPassword: "string",
				token: "string",
			},
			graphql: {
				mutation: `
                  """
                    Update a password from a given token
                  """
                  resetPassword(newPassword: String!, token: String!): UserPermission_NoContent
                `,
			},
			async handler(ctx) {
				const { params } = ctx;
				const authMethods = this as unknown as AuthMixin["methods"];
				const { token: serviceToken } = await authMethods.serviceToken(ctx);

				const parsedToken = parse(params.token);
				if (!parsedToken.active) {
					throw createGraphql400("user-permissions.errors.invalid_token");
				}
				if (!parsedToken.aud.includes("reset_password")) {
					throw createGraphql400("user-permissions.errors.invalid_token");
				}
				const changedPassword: VocaResponse = await ctx.call(
					"users-data.resetPassword",
					{
						id: parsedToken.sub,
						password: params.newPassword,
					},
					{ meta: { bearer: serviceToken } },
				);
				if (changedPassword.code > 300) {
					throw createGraphql400("user-permissions.errors.invalid_token");
				}
				return createSuccess({ ok: true });
			},
		},
	},
};
export default UserPermissionsService;
