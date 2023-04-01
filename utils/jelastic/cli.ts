import * as jpsService from './jps';
import { InstallRequest } from './jps/install';

export type InstallParams = Pick<
  InstallRequest,
  'jps' | 'envName' | 'displayName' | 'envGroups' | 'skipNodeEmails' | 'region'
>;

export interface JelasticClientInterface {
  install: (params: InstallParams) => Promise<void>;
}

class JelasticClient implements JelasticClientInterface {
  async install(params: InstallParams) {
    await jpsService.install(params);
  }
}

export default new JelasticClient();
