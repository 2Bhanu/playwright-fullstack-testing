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
export type DatabaseConfig = {
    url: string;
};

export type SshTunnelConfig = {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    privateKeyPath?: string;
    password?: string;
    localPort: number;
    remoteHost: string;
    remotePort: number;
};

export type EnvType = {
    baseURL: string;
    username?: string;
    password?: string;
    api_key?: string;
    database?: DatabaseConfig;
    sshTunnel?: SshTunnelConfig;
};


/*
 * ================================================================
 * DB / SSH ENV BUILDERS
 * ================================================================
 *
 * Both builders use `getEnvOptional` so existing envs (without
 * DB or SSH config) keep working unchanged. Tests that need the
 * DB layer read these accessors; tests that don't are unaffected.
 *
 * `database` requires DATABASE_URL.
 * `sshTunnel` returns `undefined` unless SSH_TUNNEL_ENABLED=true.
 */
function buildDatabaseConfig(): DatabaseConfig | undefined {
    const url = getEnvOptional("DATABASE_URL");
    if (!url) return undefined;
    return { url };
}

function buildSshTunnelConfig(): SshTunnelConfig | undefined {
    const enabled =
        getEnvOptional("SSH_TUNNEL_ENABLED") === "true";

    if (!enabled) return undefined;

    /*
     * When the tunnel is enabled, every required field is
     * mandatory. Read them with `getEnv` so a missing field
     * fails fast at module load — much better than a tunnel
     * that silently binds the wrong port at test runtime.
     */
    return {
        enabled: true,
        host: getEnv("SSH_TUNNEL_HOST"),
        port: Number(getEnv("SSH_TUNNEL_PORT")),
        username: getEnv("SSH_TUNNEL_USERNAME"),
        privateKeyPath: getEnvOptional(
            "SSH_TUNNEL_PRIVATE_KEY_PATH"
        ),
        password: getEnvOptional("SSH_TUNNEL_PASSWORD"),
        localPort: Number(getEnv("SSH_TUNNEL_LOCAL_PORT")),
        remoteHost: getEnv("SSH_TUNNEL_REMOTE_HOST"),
        remotePort: Number(getEnv("SSH_TUNNEL_REMOTE_PORT")),
    };
}


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


/*
 * ================================================================
 * DB / SSH CONFIG EXPORTS
 * ================================================================
 *
 * Exposed as singletons next to `Env` so tests and the framework
 * have a single, consistent access pattern. Tests never read
 * `process.env` directly.
 */
export const DbConfig = buildDatabaseConfig();
export const SshTunnelConfigEnv = buildSshTunnelConfig();
