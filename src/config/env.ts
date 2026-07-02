import * as dotenv from "dotenv";

dotenv.config();

export function getEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Required environment variable '${name}' is missing.`
        );
    }

    return value;
}
export const Env = {
    fsrBaseHost: getEnv("FSR_BASE_HOST"),
    adminUsername: getEnv("ADMIN_USERNAME"),
    adminPassword: getEnv("ADMIN_PASSWORD"),
} as const;