import _ from "lodash";
import { GLOBAL_APPID, SESSION } from "../constants";
import request from "../request";
import type { EnvironmentStatus } from "./statusToText";
import statusToText from "./statusToText";

export type EnvironmentDetailsParams = {
	withNodes?: boolean;
};

export type EnvironmentNodeInfo = {
	address: string;
	nodeGroup: string;
};

export type EnvironmentsDetails =
	| {
			status: Omit<EnvironmentStatus, "down">;
			envName: string;
			displayName: string;
			envGroups: string[];
			properties: Record<string, string>;
			nodes: EnvironmentNodeInfo[];
	  }
	| { status: "down"; envName: string; displayName: string; properties: Record<string, string> };

export type EnvironmentsDetailsFun = (
	params: EnvironmentDetailsParams,
) => Promise<EnvironmentsDetails[]>;

const environmentsDetails: EnvironmentsDetailsFun = async ({ withNodes = false }) => {
	const body = {
		appid: GLOBAL_APPID,
		session: SESSION,
		lazy: !withNodes,
	};

	try {
		const response = await request.post("/environment/control/rest/getenvs", body);
		return _.sortBy<EnvironmentsDetails>(
			response.data.infos.map((i: any) => {
				const status = statusToText(_.get(i, "env.status"));
				const displayName = _.get(i, "env.displayName");
				const envName = _.get(i, "env.envName");
				const properties = _.get(i, "env.properties", {});

				if (status === "down") {
					return { status, displayName, envName, properties };
				}
				return {
					status,
					envName,
					displayName,
					properties,
					envGroups: _.get(i, "envGroups", []),
					nodes: _.get(i, "nodes", []).map(
						(n: any) =>
							({
								address: _.get(n, "address"),
								nodeGroup: _.get(n, "nodeGroup"),
							} as EnvironmentNodeInfo),
					),
				};
			}),
			"status",
		);
	} catch (e) {
		const { message } = e;
		if (`${message}`.startsWith("errors.")) {
			// Jelastic is not available, try later
			throw new Error(message);
		}
		throw new Error("errors.infra.unexpected");
	}
};

export default environmentsDetails;
