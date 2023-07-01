import { GLOBAL_APPID, SESSION } from "../constants";
import request from "../request";

export type SetLabelsRequest = {
  envName: string;
  labels: Record<string, string>;
};
export type SetLabelsResponse = {};

export type SetLabelsFun = (params: SetLabelsRequest) => Promise<SetLabelsResponse>;
const setLabels: SetLabelsFun = async ({ envName, labels }) => {
  const body = {
    appid: GLOBAL_APPID,
    session: SESSION,
    envName,
    properties: JSON.stringify(labels),
  };

  try {
    const response = await request.post("environment/control/rest/applyenvproperty", body);
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
