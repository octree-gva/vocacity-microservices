import _ from 'lodash';
import axios, {
  AxiosResponse,
  AxiosError
} from 'axios';
if (!process.env.VAULT_ADDR) throw new Error('VAULT_ADDR env is missing');
if (!process.env.VAULT_USER) throw new Error('VAULT_USER env is missing');
if (!process.env.VAULT_PASSWORD)
  throw new Error('VAULT_PASSWORD env is missing');

export type VaultResponse = {
  error?: string;
  auth?: { client_token?: string };
  data?: { data?: any; metadata?: any };
};

const axiosInstance = axios.create({
  baseURL: `${process.env.VAULT_ADDR}/v1`,
  headers: {
    Accept: 'application/json'
  },
  timeout: 1200,
  params: {}
});

const responseInterceptor = (response: AxiosResponse<any>) => {
  const { status, data } = response;
  if (status >= 200 && status <= 300) {
    if (data.error) {
      throw Error(JSON.stringify(data?.error || `Error status ${status}`));
    }
    return { ...data, error: null };
  }
  throw new AxiosError(
    JSON.stringify(data?.error || `Error status ${status}`),
    '500',
    response.config,
    null,
    response
  );
};

axiosInstance.interceptors.request.use(undefined, function (error: any) {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(responseInterceptor, function (error: any) {
  return Promise.reject(error);
});

export default axiosInstance;
