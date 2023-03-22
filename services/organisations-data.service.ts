import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}
export default {
	name: "organisations-data",
	mixins: [DbService],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {},
	model: {
		name: "organisation",
		define: {
			name: Sequelize.STRING,
			slug: Sequelize.STRING,
			uuid: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			}
		},
		options: {
			indexes: [{ unique: true, fields: ["slug"] }],
			// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
		},
	},
};
