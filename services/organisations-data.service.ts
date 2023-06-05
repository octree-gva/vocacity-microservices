import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import type SequelizeDbAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import { v4 as uuid } from "uuid";
import type { Organization, ServiceDefinition } from "../types";
import { create500, createSuccess } from "../utils/createResponse";
import { toSlug } from "./helpers/organization-data.helper";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}

const OrganizationsDataService: ServiceDefinition<
	{
		create: { params: { name: string }; returns: { id: string; name: string } };
	},
	[typeof DbService]
> = {
	name: "organisations-data",
	mixins: [DbService],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {
		create: {
			params: {
				name: { type: "string", min: 2 },
			},
			async handler(ctx) {
				const adapter = this.adapter as SequelizeDbAdapter;
				let slug = toSlug(uuid());
				// not 100% uniq, but good enough for now.
				while (true) {
					const result = await adapter.find({
						query: {
							id: slug,
						},
					});
					if (result.length == 0) {
						break;
					}
					slug = toSlug(uuid());
				}
				const match = (await adapter.insert({
					name: ctx.params.name,
					id: slug,
				})) as unknown as Organization;
				if (!match) {
					return create500(`organizations-data.errors.not_found`);
				}
				return createSuccess({
					id: match.id,
					name: match.name,
				} as Organization);
			},
		},
	},
	model: {
		name: "organisation",
		define: {
			name: Sequelize.STRING,
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
			},
		},
		options: {},
	},
};

export default OrganizationsDataService;
