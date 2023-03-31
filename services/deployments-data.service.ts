import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import { ServiceDefinition } from "../types";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}

const DeploymentsData : ServiceDefinition<{}> = {
	name: "deployments-data",
	mixins: [DbService],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {},
	model: {
		name: "deployments",
		define: {
			organisation_id: Sequelize.UUID,
			creator_id: Sequelize.UUID,
			env_name: Sequelize.STRING,
		},
		options: {
			indexes: [{ unique: true, fields: ["env_name"] }],
		},
	},
};
export default DeploymentsData;