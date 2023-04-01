import request from '../request';
import { GLOBAL_APPID, SESSION } from '../constants';

export type InstallRequest = {
  jps: string;
  settings?: string;
  envGroups?: string;
  logsPath?: string;
  envName?: string;
  displayName?: string;
  skipNodeEmails?: boolean;
  region?: string;
  ownerUid?: number;
  loggerName?: string;
  writeOutputTasks?: boolean;
  nodeGroup?: string;
};

export type InstallResponse = {
  action?: string;
  appid?: string;
  data?: any;
  error?: string;
  message?: string;
  reason?: string;
  response?: object;
  result?: number;
  startPage?: string;
  successText?: string;
  type?: string;
  uniqueName?: string;
};

export type InstallFn = (params: InstallRequest) => Promise<InstallResponse>;
const install: InstallFn = async ({
  jps,
  envName,
  displayName = 'unnamed',
  envGroups = 'public',
  settings={},
  skipNodeEmails = true,
  logsPath = undefined,
  region = undefined,
  loggerName = 'jps_install',
  writeOutputTasks = undefined,
  nodeGroup = undefined

}) => {
  const body = {
    envName,
    jps,
    displayName,
    envGroups: process.env.JELASTIC_ROOT_ENVGROUP + '/' + envGroups,
    settings,
    skipNodeEmails,
    region,
    logsPath,
    loggerName,
    writeOutputTasks,
    nodeGroup,
    appid: GLOBAL_APPID,
    session: SESSION
  };

  try{
    const response = await request.post('/marketplace/jps/rest/install', body);
    return response.data;
  }catch(e){
    console.error(e)
    throw new Error("Error installing jelastic manifest")
  }
};
export default install;
