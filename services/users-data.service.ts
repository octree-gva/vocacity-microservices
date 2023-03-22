import * as bcrypt from "bcrypt";
import type { Context } from "moleculer";
import DbService from "moleculer-db";
import type SequelizeDbAdapter from "moleculer-db-adapter-sequelize";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";

const saltRounds = 12;

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}
export default {
	name: "users-data",
	mixins: [DbService],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {
		async login(ctx: Context<{ email: string; password: string }>) {
			const adapter = (this as any).adapter as SequelizeDbAdapter;
			const match: any = await adapter.findOne({ where: { email: ctx.params.email } });
			if (await bcrypt.compare(ctx.params.password, match.password)) {
				return { id: `${match.id}`, email: match.email };
			}
			return undefined;
		},
		async register(ctx: Context<{ email: string; password: string }>) {
			const adapter = (this as any).adapter as SequelizeDbAdapter;
			const salt = await bcrypt.genSalt(saltRounds);
			const hashed = await bcrypt.hash(ctx.params.password, salt);
			return adapter.insert({ email: ctx.params.email, password: `${hashed}` });
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
			uuid: {
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
