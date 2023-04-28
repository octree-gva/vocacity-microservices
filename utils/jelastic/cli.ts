import _ from "lodash";
import * as envService from "./environment";
import type { EnvironmentsDetails } from "./environment/environmentsDetails";
import type { EnvironmentsInfoResponse } from "./environment/environmentsInfo";
import type { GetLabelsRequest } from "./environment/getLabels";
import type { SetLabelsRequest } from "./environment/setLabels";
import * as jpsService from "./jps";
import type { InstallRequest } from "./jps/install";

export type InstallParams = Pick<
	InstallRequest,
	"jps" | "envName" | "displayName" | "envGroups" | "skipNodeEmails" | "region"
>;
export interface JelasticClientInterface {
	install: (params: InstallParams) => Promise<void>;
	environmentsInfo: () => Promise<EnvironmentsInfoResponse[]>;
	environmentsDetails: () => Promise<EnvironmentsDetails[]>;
	setLabels: (params: SetLabelsRequest) => Promise<Record<string, string>>;
}

class JelasticClient implements JelasticClientInterface {
	async install(params: InstallParams) {
		await jpsService.install(params);
	}

	async environmentsInfo() {
		return envService.environmentsInfo();
	}

	async environmentsDetails() {
		return envService.environmentsDetails({ withNodes: false });
	}

	async environmentsNodesDetails() {
		return envService.environmentsDetails({ withNodes: true });
	}

	async setLabels(params: SetLabelsRequest) {
		return envService.setLabels(params);
	}

	async labels(params: GetLabelsRequest) {
		return ((await envService.getLabels(params)) || {})?.properties || {};
	}
}

export default new JelasticClient();
