import type { Job } from "bullmq";
import _ from "lodash";
import BullMqMixin from "moleculer-bullmq";
import type { ParkAction, ServiceDefinition, SetLabelsAction, VaultSetAction } from "../types";
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
const ParkService: ServiceDefinition<{
	park: ParkAction;
	_park: ParkAction;
}, [typeof BullMqMixin]> = {
	name: "parks",
	settings: {
		bullmq: {
			client: process.env.BULL_REDIS_URL,
		},
	},
	mixins: [BullMqMixin],
	actions: {
		park: {
			params: {
				template: "string",
			},
			async handler(ctx) {
				if (!this.localQueue || this.queue === true) {
					throw new Error("internal error");
				}
				ctx.meta.serviceName = `${ctx.service?.name}`;
				const job = await this.localQueue(
					ctx,
					"_park",
					{ template: ctx.params.template },
					{ priority: 10 },
				);
				return createSuccess(await serializeJob(job));
			},
		},
		_park: {
			queue: true,
			params: {
				template: "string",
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
				const responseVault = await ctx.call<{ code: number }, VaultSetAction>(
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
					await ctx.call<{}, SetLabelsAction>("env-labels.set", {
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
export default ParkService;
