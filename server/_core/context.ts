import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { upsertUser, getUserByOpenId } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    const authorization = opts.req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (token && ENV.supabaseJwtSecret) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.supabaseJwtSecret), { algorithms: ["HS256"] });
        if (typeof payload.sub === "string") {
          const email = typeof payload.email === "string" ? payload.email : null;
          const name = typeof payload.user_metadata === "object" && payload.user_metadata && "full_name" in payload.user_metadata
            ? String(payload.user_metadata.full_name)
            : email;
          await upsertUser({ openId: payload.sub, email, name, loginMethod: "supabase-email", lastSignedIn: new Date() });
          user = (await getUserByOpenId(payload.sub)) ?? null;
        }
      } catch (error) {
        console.warn("[Auth] Supabase token rejected", error instanceof Error ? error.message : error);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
