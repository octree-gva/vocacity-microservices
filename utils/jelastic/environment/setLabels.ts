import request from "../request";
import { GLOBAL_APPID, SESSION } from "../constants";
import _ from "lodash";

export type SetLabelsRequest = {
    envName: string
};
export type SetLabelsResponse = {}

export type SetLabelsFun = (params: SetLabelsRequest) => Promise<SetLabelsResponse>;
const setLabels: SetLabelsFun = async ({envName}) => {
	const body = {
		appid: GLOBAL_APPID,
		session: SESSION,
        envName
	};

	try {
		const response = await request.post("environment/control/rest/addenvproperty", body);
        return response.data;
	} catch (e) {
		const { code } = e;
		if (code === "EHOSTUNREACH") {
			// Jelastic is not available, try later
			throw new Error("errors.infra.not_availabale");
		}
		throw new Error("errors.infra.unexpected");
	}
};
export default setLabels;

