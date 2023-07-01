import type { VerifyOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { ParsedJWT } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "changeMe";
const JWT_AUD_SEP = "|";
export type SignFun = (
  sub: string,
  scopes: string[],
  data?: Record<string, string>,
  issuer?: string,
  expiresInMinutes?: number,
) => string;
export const sign: SignFun = (sub, aud, data, issuer = "", expiresInMinutes = 60) => {
  const effectiveScopes = aud.length > 0 ? aud : ["public"];
  return jwt.sign(
    {
      sub,
      aud: effectiveScopes.join(JWT_AUD_SEP),
      iss: issuer,
      data: JSON.stringify(data),
    },
    JWT_SECRET,
    { expiresIn: expiresInMinutes * 60 },
  );
};

export type ParseFun = (jwt: string, expectedIssuer?: string) => ParsedJWT;
export const parse: ParseFun = (jwtString, expectedIssuer) => {
  const options: VerifyOptions = {};
  if (expectedIssuer) {
    options.issuer = expectedIssuer;
  }
  try {
    const payload = jwt.verify(jwtString, JWT_SECRET, options);
    if (typeof payload === "string") {
      throw new Error("Not expected type");
    }
    const jwtPayload = payload as jwt.JwtPayload;
    const data = JSON.parse(`${jwtPayload.data || "{}"}`);
    if (!data.email) {
      data.email = jwtPayload.sub;
    }
    return {
      active: true,
      data,
      aud: `${jwtPayload.aud}`.split(JWT_AUD_SEP),
      sub: `${jwtPayload.sub}`,
    } as ParsedJWT;
  } catch (e) {
    return { active: false, data: { email: "" }, aud: [], sub: "" };
  }
};
