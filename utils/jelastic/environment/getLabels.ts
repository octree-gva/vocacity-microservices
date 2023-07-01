import _ from "lodash";
import { GLOBAL_APPID, SESSION } from "../constants";
import request from "../request";

export type GetLabelsRequest = {
  envName: string;
};
export type GetLabelsResponse = { properties: Record<string, string> };

export type GetLabelsFun = (params: GetLabelsRequest) => Promise<GetLabelsResponse>;
const getLabels: GetLabelsFun = async ({ envName }) => {
  const body = {
    appid: GLOBAL_APPID,
    session: SESSION,
    envName,
  };

  try {
    const response = await request.post<any, { data: GetLabelsResponse }>(
      "environment/control/rest/getenvproperty",
      body,
    );
    return response.data;
  } catch (e) {
    const { message } = e;
    if (`${message}`.startsWith(`errors.`)) {
      throw new Error(message);
    }
    throw new Error("errors.infra.unexpected");
  }
};
export default getLabels;
