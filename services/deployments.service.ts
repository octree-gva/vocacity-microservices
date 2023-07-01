import DbService from "moleculer-db";
import SqlAdapter from "moleculer-db-adapter-sequelize";
import Sequelize from "sequelize";
import type { SerializedJob, ServiceDefinition, APP_IDS, Organization, Deployment } from "../types";
import BullMqMixin from "moleculer-bullmq";
import createSuccess from "../utils/createSuccess";
import serializeJob from "../utils/serializeJob";
import { Job } from "bullmq";
import { random } from "../utils/deployments";
import createError, { create400 } from "../utils/createError";
import SequelizeDbAdapter from "moleculer-db-adapter-sequelize";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("Error: env DATABASE_URL is not defined.");
}

const DeploymentsData: ServiceDefinition<
  {
    deploy: {
      params: {
        /** Language, currency, specific SMTP etc. */
        deploySettings: Record<string, string>;
        /** What kind of service is it (decidim, or else) */
        appId: APP_IDS;
        /** Attached organization, will be checked on Bearer. */
        organizationId: string;
        /** Template Name, use "vanilla" for default one. */
        templateName: string;
      };
      returns: { appId: APP_IDS; envName: string };
    };
  },
  [typeof BullMqMixin, typeof DbService]
> = {
  name: "deployments",
  mixins: [DbService, BullMqMixin],
  adapter: new SqlAdapter(process.env.DATABASE_URL || "sqlite::memory"),
  settings: {
    bullmq: {
      client: process.env.BULL_REDIS_URL,
      worker: { concurrency: 1 },
    },
    graphql: {
      type: `
				"""
					Serialized Asyncronus Job
				"""
				type Deployments_Started {
					appId: String!
					envName: String
				}
			`,
    },
  },
  actions: {
    deploy: {
      params: {
        appId: "string",
        deploySettings: "object",
        organizationId: "string",
        templateName: "string"
      },
      graphql: {
        mutation: `
                  """
                    Deploy a new instance
                  """
                  deploy(appId: String!, deploySettings: Object!, organizationId: String!): Deployments_EnvName
                `,
      },
      async handler(ctx) {
        if (!(ctx.meta.permissions || []).includes(`${ctx.params.organizationId}.admin`))
          return createError(403, "errors.auth.forbidden");
        const { appId, organizationId, templateName, deploySettings } = ctx.params;
        const match = ctx.broker.services.find((i) => i.name == ctx.params.appId);
        if (!match) return create400();

        if (!this.localQueue || this.queue === true) {
          throw new Error("internal error");
        }

        ctx.meta.serviceName = `${ctx.service?.name}`;
        const envName = random(23);
        const adapter = this.adapter as SequelizeDbAdapter;
        let deployment: Deployment;
        const deploymentMatches = await adapter.find({
          query: {
            env_name: envName,
          },
        });
        if (deploymentMatches.length > 0) {
          return create400("errors.deployment.already_running");
        }
        const insertions = await adapter.insert({
          organization_id: organizationId,
          creator_id: ctx.meta.user,
          env_name: envName,
          app_id: appId,
          serialized_original_settings: JSON.stringify(deploySettings),
          template_name: templateName
        });
        deployment = insertions[0] as Deployment;
        ctx.broker.broadcast(`${appId}.created`, { deployment, appId });
        return createSuccess({ envName, appId });
      },
    },
  },
  model: {
    name: "deployments",
    define: {
      organisation_id: Sequelize.UUID,
      creator_id: Sequelize.UUID,
      env_name: Sequelize.STRING,
      app_id: Sequelize.STRING,
      serialized_original_settings: Sequelize.TEXT,
      template_name: Sequelize.STRING
    },
    options: {
      indexes: [{ unique: true, fields: ["env_name"] }],
    },
  },
};
export default DeploymentsData;
