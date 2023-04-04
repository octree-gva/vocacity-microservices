import request from "../request";
import { GLOBAL_APPID, SESSION } from "../constants";
import _ from "lodash";

export type InspectRequest = {};

export type InstallResponse = {};
const statusToText = (status: number) => {
	return _.get(
		[
			"unknown",
			"running",
			"down",
			"launching",
			"sleep",
			"unknown",
			"creating",
			"cloning",
			"not_exists",
			"exporting",
			"migrating",
			"broken",
			"updating",
			"stopping",
			"going_to_sleep",
			"restoring",
		],
		status,
		"unknown",
	);
};
export type InspectFun = (params?: InspectRequest) => Promise<InstallResponse>;
const inspect: InspectFun = async () => {
	const body = {
		appid: GLOBAL_APPID,
		session: SESSION,
	};

	try {
		const response = await request.post("/environment/control/rest/getbasicenvsinfo", body);
		return response.data.infos.map((i: any) => {
			const status = statusToText(_.get(i, "env.status"));
			const displayName = _.get(i, "env.displayName");
      const envName = _.get(i, "env.envName")
			if (status === "down") return { status, displayName, envName};
			return {
				status,
				envName,
				envGroups: _.get(i, "env.envGroups"),
				displayName,
				attributes: _.get(i, "env.attributesJson"),
			};
		});
	} catch (e) {
		const { code } = e;
		if (code === "EHOSTUNREACH") {
			// Jelastic is not available, try later
			throw new Error("errors.infra.not_availabale");
		}
		throw new Error("errors.infra.unexpected");
	}
};
export default inspect;
