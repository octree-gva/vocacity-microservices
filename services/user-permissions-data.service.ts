import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("Error: env DATABASE_URL is not defined.");
}

export default {
  name: "user-permissions-data",
  mixins: [DbService],
  adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
  actions: {},
  model: {
    name: "user-permission",
    define: {
      user_id: Sequelize.UUID,
      organisation_id: Sequelize.UUID,
      permissions: Sequelize.STRING,
    },
    options: {
      indexes: [{ unique: true, fields: ["user_id", "organisation_id"] }],
      // Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
    },
  },
};
