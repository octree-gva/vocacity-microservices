import jwt from "jsonwebtoken";
import type { Context } from "moleculer";
import { UserRegistrationAction, VocaError } from "../types";
import { create400, create404 } from "../utils/createError";

type User = {
	uuid: string;
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};

type UserPermission = {
	user_uuid: string;
	organisation_uuid: string;
	permissions: string
}


export default {
	name: "user-permission",
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
			async handler(ctx: Context<UserRegistrationAction>) {
				if(ctx.params.password !== ctx.params.passwordConfirmation){
					return create400("user_permissions.errors.passwords_dont_match")
				}
				const user: User = await ctx.call("users-data.register", {
					email: ctx.params.email,
					password: `${ctx.params.password}`,
				});
				if (!user) {
					return create404("user_permissions.errors.not_found")
				}
				// Get permissions: 
				const permissions: UserPermission[] = await ctx.call("user-permissions-data.find", {
					query: {
						user_uuid: user.uuid
					}
				});

				const jws = jwt.sign(
					{
						sub: user.uuid,
						scope: permissions.reduce(function(acc, next){
							const {permissions: permCsv} = next
							return acc.concat(permCsv.split(",").filter(Boolean).map((p) => `${next.organisation_uuid}.${p.trim()}`))
						}, [] as string[]),
						data: {
							email: user.email,
						},
					},
					process.env.JWT_SECRET || "changeMe",
					{ expiresIn: 60 * 60 },
				);
				return { jwt: jws };
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
			async handler(ctx: Context<never>) {
				// TODO handle Bearer token.
			},
		},
		login: {
			params: {
				email: "string",
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
			async handler(ctx: Context<UserRegistrationAction>) {
				const auth: User | undefined = await ctx.call("users-data.login", {
					email: ctx.params.email,
					password: ctx.params.password,
				});
				if (!auth) {
					return { jwt: "", user: undefined };
				}
				// Get the permission 
				const jws = jwt.sign(
					{
						sub: auth.uuid,
						scope: [],
						data: {
							email: auth.email,
						},
					},
					process.env.JWT_SECRET || "changeMe",
				);
				return { jwt: jws };
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
			async handler(ctx: Context<UserRegistrationAction>) {
				return true;
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
			handler(ctx: Context<UserRegistrationAction>) {
				return true;
			},
		},
	},
};
