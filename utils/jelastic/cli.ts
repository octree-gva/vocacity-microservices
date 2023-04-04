import * as jpsService from "./jps";
import * as envService from "./environment";
import { InstallRequest } from "./jps/install";
import { SetLabelsRequest } from "./environment/setLabels";

export type InstallParams = Pick<
	InstallRequest,
	"jps" | "envName" | "displayName" | "envGroups" | "skipNodeEmails" | "region"
>;

export interface JelasticClientInterface {
	install: (params: InstallParams) => Promise<void>;
}

class JelasticClient implements JelasticClientInterface {
	async install(params: InstallParams) {
		await jpsService.install(params);
	}
	async inspect() {
		return await envService.inspect();
	}	
  async setLabels(params: SetLabelsRequest) {
		return await envService.setLabels(params);
	}
}

export default new JelasticClient();
