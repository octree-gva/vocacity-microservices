import { VocaError } from "../types";

export type CreateError = (code: VocaError["code"], message:VocaError["message"]) => VocaError
export const createError: CreateError = (code, message) => ({code, message})
export const create404 = createError.bind(undefined, 404)
export const create400 = createError.bind(undefined, 400)

export default createError;