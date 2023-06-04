import * as bcrypt from "bcrypt";
import DbService from "moleculer-db";
import type SequelizeDbAdapter from "moleculer-db-adapter-sequelize";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import type { ServiceDefinition, User } from "../types";
import { create400, create404, createSuccess } from "../utils/createResponse";
import AuthorizeMixin, { AuthMixin } from "../mixins/authorize.mixin";

const SALT_ROUND = 12;
const ALLOWED_CALLERS = ["user-permissions"];
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}
const UserDataService: ServiceDefinition<{
	register: { email: string; password: string };
	login: { email: string; password: string };
	resetPassword: { id: string; password: string };
}> = {
	name: "users-data",
	mixins: [DbService, AuthorizeMixin],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {
		login: {
			params: {
				email: { type: "email" },
				password: { type: "string", min: 4 },
			},
			async handler(ctx) {
				const authMethods = this as unknown as AuthMixin["methods"];
				await authMethods.authorizeService(ctx, ALLOWED_CALLERS);

				const adapter = (this as any).adapter as SequelizeDbAdapter;
				const match = (await adapter.findOne({
					where: { email: `${ctx.params.email}` },
				})) as unknown;
				if (!match) {
					return create404(`users-data.errors.not_found`);
				}
				const currentUser = match as Record<string, string>;
				if (await bcrypt.compare(`${ctx.params.password}`, `${currentUser.password}`)) {
					return createSuccess({
						id: `${currentUser.id}`,
						email: currentUser.email,
					} as User);
				}
				return create404(`users-data.errors.not_found`);
			},
		},
		resetPassword: {
			params: {
				id: { type: "string", min: 4 },
				password: { type: "string", min: 4 },
			},
			async handler(ctx) {
				const authMethods = this as unknown as AuthMixin["methods"];
				await authMethods.authorizeService(ctx, ALLOWED_CALLERS);

				const adapter = (this as any).adapter as SequelizeDbAdapter;
				const match = (await adapter.findOne({
					where: { id: `${ctx.params.id}` },
				})) as User;
				if (!match) {
					return create404(`users-data.errors.not_found`, `${ctx.params.id} not found`);
				}
				const salt = await bcrypt.genSalt(SALT_ROUND);
				const hashed = await bcrypt.hash(ctx.params.password, salt);
				await adapter.updateMany({ id: match.id }, { password: `${hashed}` });
				return createSuccess();
			},
		},
		register: {
			params: {
				email: { type: "email" },
				password: { type: "string", min: 4 },
			},
			async handler(ctx) {
				const authMethods = this as unknown as AuthMixin["methods"];
				await authMethods.authorizeService(ctx, ALLOWED_CALLERS);

				const adapter = (this as any).adapter as SequelizeDbAdapter;
				const salt = await bcrypt.genSalt(SALT_ROUND);
				const hashed = await bcrypt.hash(ctx.params.password, salt);

				try {
					const user = (await adapter.insert({
						email: ctx.params.email,
						password: `${hashed}`,
					})) as unknown as { dataValues: any };
					return createSuccess({
						id: user?.dataValues.id,
						email: user?.dataValues.email,
					} as User);
				} catch (e) {
					const errors = e?.errors || [];
					if (errors.length > 0) {
						return create400(
							"users-data.error",
							errors.map((e: any) => `${e.type}`.replaceAll(" ", "_")).join(","),
						);
					}
					return create400("users-data.error");
				}
			},
		},
	},
	model: {
		name: "user",
		define: {
			email: Sequelize.STRING,
			reset_password_token: Sequelize.STRING,
			password: Sequelize.TEXT,
			firstName: Sequelize.STRING,
			lastName: Sequelize.STRING,
			sub: Sequelize.STRING,
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
		},
		options: {
			indexes: [{ unique: true, fields: ["email"] }],
			// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
		},
	},
};
export default UserDataService;
