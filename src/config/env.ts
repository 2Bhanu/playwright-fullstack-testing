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

/*
 * Optional env accessor — returns `undefined` when missing.
 * Use only for fields that have a sensible default OR where the
 * caller knows the absence is acceptable (e.g. default base hosts
 * that subclasses may override per call via `.forURL(...)`).
 */
export function getEnvOptional(
    name: string
): string | undefined {
    return process.env[name];
}

export const Env = {
    fsrBaseHost: getEnv("FSR_BASE_HOST"),
    adminUsername: getEnv("FSR_BASE_USERNAME"),
    adminPassword: getEnv("FSR_BASE_PASSWORD"),
    reqresAPIKey: getEnv("REQRES_API_KEY"),

    /*
     * Default base URLs. Used by `BaseApiClient` clients when they
     * declare a default `forURL` in their constructor; tests can
     * override per call with `.forURL(...)` on the chain.
     *
     * Optional so a client without a configured host falls through
     * to Playwright's request-context `baseURL` (or a path-only call).
     */
    reqresBaseHost: getEnvOptional("REQRES_BASE_HOST"),
} as const;
