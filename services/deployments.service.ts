import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import type { SerializedJob, ServiceDefinition, APP_IDS, Organization, Deployment } from "../types";
import BullMqMixin from "moleculer-bullmq";
import createSuccess from "../utils/createSuccess";
import serializeJob from "../utils/serializeJob";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
	throw new Error("Error: env DATABASE_URL is not defined.");
}

const DeploymentsData: ServiceDefinition<{
	deploy: {
		params: {
			deploySettings: Record<string, string>,
			appId: APP_IDS
		},
		returns: SerializedJob
	},
	_deploy: {
		params: {
			deploySettings: Record<string, string>,
			appId: APP_IDS
		},
		returns: SerializedJob
	}
}, [typeof BullMqMixin, typeof DbService]> = {
	name: "deployments",
	mixins: [DbService, BullMqMixin],
	adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
	actions: {
		deploy:{
			params:{
				appId: "string",
				deploySettings: ""
			},
			async handler(ctx) {
				if (!this.localQueue || this.queue === true) {
					throw new Error("internal error");
				}
				ctx.meta.serviceName = `${ctx.service?.name}`;
				const job = await this.localQueue(
					ctx,
					"_deploy",
					{ ...ctx.params },
					{ priority: 10 },
				);
				return createSuccess(await serializeJob(job));
			}
		},
		_deploy:{
			queue: true,
			params:{
				appId: "string",
				deploySettings: ""
			},
			async handler(ctx) {
				if (!this.localQueue || this.queue === true) {
					throw new Error("internal error");
				}

				ctx.meta.serviceName = `${ctx.service?.name}`;
				const match = ctx.broker.services.find((i) => i.name == ctx.params.appId)
				if(!match)
					throw new Error(`${ctx.params.appId} is unavailable.`);
				
					
				return createSuccess(await serializeJob(ctx.locals.job));
			}
		}
	},
	model: {
		name: "deployments",
		define: {
			organisation_id: Sequelize.UUID,
			creator_id: Sequelize.UUID,
			env_name: Sequelize.STRING,
			app_id: Sequelize.STRING,
		},
		options: {
			indexes: [{ unique: true, fields: ["env_name"] }],
		},
	},
};
export default DeploymentsData;
