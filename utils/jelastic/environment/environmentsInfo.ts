import _ from "lodash";
import { GLOBAL_APPID, SESSION } from "../constants";
import request from "../request";
import type { EnvironmentStatus } from "./statusToText";
import statusToText from "./statusToText";

export type EnvironmentsInfoRequest = {};

export type EnvironmentsInfoResponse = {
  status: EnvironmentStatus;
  envName: string;
  displayName: string;
};
export type EnvironmentsInfoFun = (
  params?: EnvironmentsInfoRequest,
) => Promise<EnvironmentsInfoResponse[]>;
const environmentsInfo: EnvironmentsInfoFun = async () => {
  const body = {
    appid: GLOBAL_APPID,
    session: SESSION,
  };

  try {
    const response = await request.post("/environment/control/rest/getbasicenvsinfo", body);
    return _.sortBy<EnvironmentsInfoResponse>(
      response.data.infos.map((i: any) => {
        const status = statusToText(_.get(i, "env.status"));
        const displayName = _.get(i, "env.displayName");
        const envName = _.get(i, "env.envName");
        if (status === "down") {
          return { status, displayName, envName } as EnvironmentsInfoResponse;
        }
        return {
          status,
          envName,
          displayName,
        } as EnvironmentsInfoResponse;
      }),
      "status",
    );
  } catch (e) {
    const { message } = e;
    if (`${message}`.startsWith("errors.")) {
      // Jelastic is not available, try later
      throw new Error("errors.infra.not_availabale");
    }
    throw new Error("errors.infra.unexpected");
  }
};
export default environmentsInfo;
