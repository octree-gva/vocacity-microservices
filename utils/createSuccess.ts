import type { VocaResponse } from "../types";

export type CreateSuccessFunc = <T>(payload?: T) => VocaResponse<T>;
const createSuccess: CreateSuccessFunc = <T>(payload = {} as T) =>
  ({ code: 200, ...payload } as VocaResponse<T>);
export default createSuccess;
