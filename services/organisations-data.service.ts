import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import type SequelizeDbAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import { v4 as uuid } from "uuid";
import type { Organization, ServiceDefinition } from "../types";
import { UserPermission } from "../types";
import { create500, createSuccess } from "../utils/createResponse";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}
/**
 * in an ideal world, we would use uuidv4 to define ids.
 * BUT jelastic infrastructure have a limitation in 23 chars
 * for ids, so we need to define a custom function that will:
 * - ensure first char is a letter
 * - ensure the slug will always be 22 chars
 *
 * @param str whatever text
 */
const toSlug = (str: string | number) => {
	let temp = `${str}`.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

	if (temp[0] < "a" || temp[0] > "z") {
		temp = `w${temp}`;
	}
	while (temp.length < 20) {
		temp += `${+new Date()}`;
	}
	return temp.substring(0, 22);
};
const OrganizationsDataService: ServiceDefinition<{
	create: { name: string };
}, [typeof DbService]> = {
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
