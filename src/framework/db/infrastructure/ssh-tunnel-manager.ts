import { readFileSync } from "node:fs";
import { createServer, Server } from "node:net";

import { Client, ConnectConfig } from "ssh2";

import { SshTunnelConfig } from "@/config/env";


/*
 * ================================================================
 * SSH TUNNEL MANAGER
 * ================================================================
 *
 * Programmatically forwards a local TCP port to a remote host via
 * an SSH connection. Lives outside the framework's DB abstraction
 * so Prisma (or any future ORM) just sees a localhost URL — it
 * never knows the tunnel exists.
 *
 * Lifecycle:
 *
 *     tunnel.connect()   — opens SSH connection + local listener
 *     tunnel.disconnect() — closes the local listener
 *
 * When `config` is undefined OR `config.enabled` is false the
 * manager is a no-op: `connect()` and `disconnect()` resolve
 * immediately. This keeps the framework usable against directly
 * reachable databases without conditional plumbing at the call
 * site.
 *
 * Auth:
 *
 *   - Private key (preferred): set SSH_TUNNEL_PRIVATE_KEY_PATH
 *   - Password (fallback): set SSH_TUNNEL_PASSWORD
 *   - At least one must be present when SSH_TUNNEL_ENABLED=true
 */
export class SshTunnelManager {

    private server?: Server;

    constructor(
        private readonly config?: SshTunnelConfig
    ) {}


    /*
     * ============================================================
     * LIFECYCLE
     * ============================================================
     */

    async connect(): Promise<void> {

        if (!this.config?.enabled) {
            // No-op — direct DB connection, no tunnel needed.
            return;
        }

        const conn = new Client();

        await new Promise<void>((resolve, reject) => {

            conn.on("ready", () => {

                /*
                 * Local TCP listener — every incoming connection
                 * is forwarded through the SSH tunnel to
                 * remoteHost:remotePort.
                 */
                this.server = createServer((local) => {

                    conn.forwardOut(
                        local.remoteAddress ?? "127.0.0.1",
                        local.remotePort ?? 0,
                        this.config!.remoteHost,
                        this.config!.remotePort,
                        (err, stream) => {

                            if (err) {
                                local.destroy(err);
                                return;
                            }

                            local.pipe(stream).pipe(local);
                        }
                    );

                });

                this.server.on("error", reject);

                this.server.listen(
                    this.config!.localPort,
                    () => resolve()
                );
            });

            conn.on("error", reject);

            conn.connect(this.buildSshOptions());
        });
    }

    async disconnect(): Promise<void> {

        return new Promise<void>((resolve) => {

            if (!this.server) {
                resolve();
                return;
            }

            this.server.close(() => resolve());
            this.server = undefined;
        });
    }


    /*
     * ============================================================
     * INTERNAL
     * ============================================================
     */

    private buildSshOptions(): ConnectConfig {

        if (!this.config) {
            // Defensive — connect() short-circuits when config is
            // missing, so this should never be reached.
            throw new Error(
                "SshTunnelManager: cannot build options without config."
            );
        }

        const options: ConnectConfig = {
            host: this.config.host,
            port: this.config.port,
            username: this.config.username,
        };

        if (this.config.privateKeyPath) {

            options.privateKey = readFileSync(
                this.config.privateKeyPath
            );

        } else if (this.config.password) {

            options.password = this.config.password;

        } else {

            throw new Error(
                "SshTunnelManager: SSH_TUNNEL_ENABLED=true requires " +
                "either SSH_TUNNEL_PRIVATE_KEY_PATH or " +
                "SSH_TUNNEL_PASSWORD."
            );
        }

        return options;
    }
}
