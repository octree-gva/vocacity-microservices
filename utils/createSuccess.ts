import type { VocaResponse } from "../types";

export type CreteSuccessFun = (payload?: any) => VocaResponse;
const createSuccess: CreteSuccessFun = (payload = {}) => ({ code: 200, ...payload });
export default createSuccess;
