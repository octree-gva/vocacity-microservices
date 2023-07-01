import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type {
  Deployment,
  ParkAction,
  ParkActionJob,
  ServiceDefinition,
  SetLabelsAction,
  VaultSetAction,
} from "../types";
import { create400, createSuccess } from "../utils/createResponse";
import { compileChart, random } from "../utils/deployments";
import jelastic from "../utils/jelastic";
import serializeJob from "../utils/serializeJob";

/**
 * Park instances from an infrastructure chart.
 * This service is accountable to:
 * - ask vault to save secrets (vault.set)
 * - insert vault's secrets in the infrastructure chart
 * - deploy the chart
 * - dispatch when an environment is parked.
 *
 * A park is an instance that is linked to no Organisation (for now).
 *
 */
const DecidimService: ServiceDefinition<
  {
    _park: ParkActionJob;
  },
  [typeof BullMqMixin]
> = {
  name: "decidim",
  settings: {
    bullmq: {
      client: process.env.BULL_REDIS_URL,
    },
  },
  mixins: [BullMqMixin],
  events: {
    "decidim.created": {
      params: {
        deployment: "object",
        appId: "string"
      },
      handler(ctx) {
        const {deployment: _deployment, appId} = ctx.params;
        const deployment: Deployment = _deployment;
        
          console.log("Payload:", ctx.params);
          console.log("Sender:", ctx.nodeID);
          console.log("Metadata:", ctx.meta);
          console.log("The called event name:", ctx.eventName);
          /**
           * The instance infrastructure is ready, we need now to advertise
           * all services to be able to react to the successful deployment.
           */
          ctx.broker.broadcast("deployment.created", { deployment, appId });

      }
    }
  },

  actions: {
    // park: {
    //   params: {
    //     template: "string",
    //   },
    //   async handler(ctx) {
    //     if (!this.localQueue || this.queue === true) {
    //       throw new Error("internal error");
    //     }
    //     const envName = random(23);
    //     ctx.meta.serviceName = `${ctx.service?.name}`;
    //     const job = await this.localQueue(
    //       ctx,
    //       "_park",
    //       {
    //         template: ctx.params.template,
    //         aud: "service",
    //         envName,
    //       },
    //       { priority: 10 },
    //     );
    //     return createSuccess(await serializeJob(job));
    //   },
    // },
    _park: {
      queue: true,
      params: {
        template: "string",
        aud: "string",
        envName: "string",
      },
      async handler(ctx) {
        let chart;
        const updateProgress =
          (ctx.locals.job as Job)?.updateProgress.bind(ctx.locals.job) ||
          (async (n) => Promise.resolve(n));
        try {
          chart = await compileChart("jelastic/decidim/v026/deploy.json");
        } catch (e) {
          const { message } = e;
          console.log(e);
          if (`${message}`.startsWith("errors.")) {
            throw new Error(message);
          }
          throw new Error("errors.deployments.template_error");
        }
        await updateProgress(1);
        const envName = random(23);
        const responseVault = await ctx.call<VaultSetAction["returns"], VaultSetAction["params"]>(
          "vault.set",
          {
            bucket: "__parked",
            key: envName,
            secrets: chart.variables,
          },
        );
        if (responseVault.code > 300) {
          throw new Error("errors.deployments.vault_error");
        }
        await updateProgress(5);
        console.log(chart.compiled);
        // Run deployment with compiled template
        try {
          await jelastic.install({
            jps: chart.compiled,
            displayName: "parked instance",
            envName,
            envGroups: "parked",
            skipNodeEmails: true,
            region: "",
          });
        } catch (e) {
          // pass, jelastic on install is sometime quiet touchy
        }
        try {
          await updateProgress(90);
          await ctx.call<SetLabelsAction["returns"], SetLabelsAction["params"]>("env-labels.set", {
            envName,
            labels: {
              "voca.parked": "true",
              "voca.product": "decidim",
              "voca.url": "http://wait-for-it.voca.city",
              "traefik.enabled": "true",
              "traefik.http.routers.decidim.rule": `Host(\`${envName}.voca.city\`)`,
              "traefik.http.services.decidim.loadbalancer.server": `http://wait-for-it.voca.city`,
            },
          });
          await updateProgress(100);
        } catch (e) {
          // If we can't set the labels, the instance probably is not parked
          return create400(e);
        }
        return createSuccess(await serializeJob(ctx.locals.job));
      },
    },
  },
};
export default DecidimService;
