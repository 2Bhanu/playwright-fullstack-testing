import * as dotenv from "dotenv";

dotenv.config();


/*
 * ================================================================
 * ENV ACCESSORS
 * ================================================================
 *
 * `getEnv(name)` throws on a missing value — use for fields the
 * app cannot run without. `getEnvOptional(name)` returns
 * `undefined` when missing — use only when the caller knows the
 * absence is acceptable.
 */
export function getEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Required environment variable '${name}' is missing.`
        );
    }

    return value;
}

export function getEnvOptional(
    name: string
): string | undefined {
    return process.env[name];
}


/*
 * ================================================================
 * ENV SHAPE — documentation / contract
 * ================================================================
 *
 * `EnvType` describes the family of fields an environment MAY
 * carry. It is intentionally not used as the annotation on the
 * `Env` constant — see below for why.
 */
export type EnvType = {
    baseURL: string;
    username?: string;
    password?: string;
    api_key?: string;
};


/*
 * ================================================================
 * ENV REGISTRY
 * ================================================================
 *
 * Each entry reads its values via `getEnv` / `getEnvOptional` at
 * module-load time. Throwing here means the test process fails
 * fast on a missing required var, with the missing name in the
 * error message — far better than a confusing 401 in the middle
 * of a test run.
 *
 * The annotation uses the indexed type `Record<K, EnvType>` with
 * `as const` — `as const` narrows each entry to its actual
 * literal shape, so `Env.reqres.api_key` is typed `string` (not
 * `string | undefined`), and `Env.reqres.username` is a compile
 * error because reqres does not declare one. The `EnvType`
 * annotation keeps every entry constrained to the family shape
 * so a future env without `baseURL` fails at module load.
 */
const Envs = {

    fsr: {
        baseURL: getEnv("FSR_BASE_HOST"),
        username: getEnv("FSR_BASE_USERNAME"),
        password: getEnv("FSR_BASE_PASSWORD"),
    },

    reqres: {
        baseURL: getEnv("REQRES_BASE_HOST"),
        api_key: getEnv("REQRES_API_KEY"),
    },

} as const satisfies Record<string, EnvType>;

export const Env = Envs.reqres;
