import { cleanEnv, str, num } from "envalid";

export const env = cleanEnv(process.env, {
    PORT: num(),
    JWT_SECRET: str(),
    SUPABASE_URL: str(),
    SUPABASE_SERVICE_ROLE_KEY: str()
});