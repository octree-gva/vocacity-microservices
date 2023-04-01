import {
	ServiceDefinition,
	DeployAction,VaultSetAction
} from "../types";
import {
	create400,
	createSuccess,
} from "../utils/createResponse";
import type {Job} from 'bullmq'
import { existsSync, readFileSync } from 'fs'
import BullMqMixin from 'moleculer-bullmq'
import _ from 'lodash'
import path from 'path'
import { randomBytes } from 'crypto';
import jelastic from "../utils/jelastic";
import serializeJob from "../utils/serializeJob";
class VaultBuilder {
  private attributes: {};
  
  constructor(){
    this.attributes = {}
  }

  get secrets(){
    return {...this.attributes};
  }
  
  gen(key: string, length = 128){
    if(!_.has(this.attributes, key)){
      _.set(this.attributes, key, VaultBuilder.random(length))
    }
    return _.get(this.attributes, key);
  }
  /**
   * generate a platform-friendly password with: 
   * - always a letter in first position
   * - no special chars hards to decode
   * 
   * @param length password length
   * @returns 
   */
  static random(length: number) {
    const randomFirst = _.sample([
      'a','b','c',
      'd','e','f',
      'g','h','i',
      'j','k','l',
      'm','n','o',
      'p','q','r',
      's','t','u',
      'v','w','x',
      'y','z'
    ])
    return `${randomFirst}${randomBytes(Math.ceil((length+4) / 2)).toString('hex')}`.slice(0, length);
  }
}

const compileChart = (templatePath: string, settings= {}) =>{
  const relativeTemplatePath = path.join(`./infra/charts/`, `${templatePath}.tpl`);
  if(!existsSync(relativeTemplatePath)) throw new Error(`Template not found`);
  const chartString = readFileSync(relativeTemplatePath).toString();
  const vault = new VaultBuilder()
  const compiled = _.template(chartString, {interpolate: /{{([\s\S]+?)}}/g, imports: {vault}})
  return {compiled: compiled({
    appName: process.env.APP_NAME,
    appHost: process.env.APP_HOST,
    ...settings
  }), variables: vault.secrets};
}

const DeploymentsServices: ServiceDefinition<{
	deploy: DeployAction;
	"async.deploy": DeployAction;
}> = {
	name: "deployments",
  settings: {
    bullmq: {
      client: process.env.BULL_REDIS_URL
    }
  },
  mixins: [BullMqMixin],
	actions: {
    "async.deploy": {
      async handler(ctx){
        if(!this.localQueue) throw new Error("internal error")
        const job = await this.localQueue(ctx, 'deploy', { template: ctx.params.template }, { priority: 10 })
        return createSuccess(serializeJob(job))
      }
    },
    deploy:{
      queue: true,
      params: {
        "template": "string"
      },
      async handler(ctx) {
        let chart;
        let updateProgress = (ctx.locals.job as Job)?.updateProgress.bind(ctx.locals.job) || (async (n) => Promise.resolve(n))
        try{
          chart = compileChart(ctx.params.template)
        }catch(e) {
          return create400("errors.deployments.template_error", e.message)
        }
        await updateProgress(1);
        const responseVault = await ctx.call<{code: number}, VaultSetAction>("vault.set", {
          bucket: "organization_id" ,
          key: "envName",
          secrets: chart.variables
        })
        if(responseVault.code > 300){
          return create400("errors.deployments.vault_error")
        }
        await updateProgress(5);

        // Run deployment with compiled template
        await jelastic.install({
          jps: chart.compiled,
          displayName: "parked instance",
          envName: VaultBuilder.random(23),
          envGroups: "parked",
          skipNodeEmails: true,
          region: ""
        });
        await updateProgress(90);
        return createSuccess(serializeJob(ctx.locals.job))
      }
    }
  },
};
export default DeploymentsServices;
