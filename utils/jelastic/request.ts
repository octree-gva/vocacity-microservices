import _ from "lodash";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { GLOBAL_APPID, SESSION } from "./constants";

if (!process.env.JELASTIC_ENDPOINT) throw new Error("JELASTIC_ENDPOINT env is missing");
if (!process.env.JELASTIC_TOKEN) throw new Error("JELASTIC_TOKEN env is missing");
if (!process.env.JELASTIC_ROOT_ENVGROUP) throw new Error("JELASTIC_ROOT_ENVGROUP env is missing");

const axiosInstance = axios.create({
	baseURL: `${process.env.JELASTIC_ENDPOINT}/1.0`,
	timeout: 3600000,
	params: {},
});

export const requestInterceptor = (config: InternalAxiosRequestConfig<any>) => {
	if (config.method === "get") {
		_.set(config, "params.appid", config?.params?.appid || GLOBAL_APPID);
		_.set(config, "params.session", SESSION);
	} else {
		_.set(config, "headers.Accept", "application/x-www-form-urlencoded");
		_.set(config, "headers.Content-Type", "application/x-www-form-urlencoded");
	}
	return config as InternalAxiosRequestConfig<any>;
};

export const responseInterceptor = (response: AxiosResponse<any>) => {
	const { status, data } = response;
	if (status >= 200 && status <= 300) {
		if (data.error) {
			console.log("ERROR", {
				dataKeys: Object.keys(data),
				errorKeys: Object.keys(data.error || {}),
			});
			throw Error(JSON.stringify(data?.error || `Error status ${status}`));
		}
		return { ...response, error: null };
	}
	throw new AxiosError(
		JSON.stringify(data?.error || `Error status ${status}`),
		"500",
		response.config,
		null,
		response,
	);
};

export const requestErrorInterceptor = function (error: any) {
	return Promise.reject(error);
};
export const responseErrorInterceptor = function (error: any) {
	return Promise.reject(error);
};

axiosInstance.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
axiosInstance.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export default axiosInstance;
