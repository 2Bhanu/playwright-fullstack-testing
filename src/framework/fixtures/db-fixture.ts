import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import {
    createPrismaClient,
} from "../db/infrastructure/prisma-client-factory";
import {
    SshTunnelManager,
} from "../db/infrastructure/ssh-tunnel-manager";
import { UserRepository } from "../db/repositories/user-repository";

import { DBClient } from "../db/core/db-client";

import {
    DbConfig,
    SshTunnelConfigEnv,
} from "@/config/env";


/*
 * ================================================================
 * DB FIXTURE
 * ================================================================
 *
 * Wires the DB layer into Playwright.
 *
 * Lifecycle (worker-scoped):
 *
 *   Worker starts
 *     └─► SSH tunnel connects (if enabled in Env)
 *     └─► Prisma client created, pointed at DATABASE_URL
 *     └─► DBClient.connect() verifies reachability
 *
 *   Test runs (any number)
 *     └─► `db` and `dbClient` fixtures resolved per-test
 *         from the shared worker-scoped Prisma client
 *
 *   Worker ends
 *     └─► DBClient.disconnect()
 *     └─► SSH tunnel disconnect()
 *
 * Two fixture entries are exposed to tests:
 *
 *   dbClient — the standalone DBClient (layer 1)
 *              Use for connection-level ops:
 *              `await dbClient.listTables()`,
 *              `await dbClient.useSchema('public')`.
 *
 *   db       — pre-built table clients (layer 2)
 *              Use for CRUD on named entities:
 *              `await db.users.findByEmail(...)`.
 *
 * The `client` field on `db` is the raw Prisma escape hatch.
 */
type DbFixtures = {
    dbClient: DBClient;
    db: {
        users: UserRepository;
        client: PrismaClient;
    };
};

type WorkerFixtures = {
    dbContext: { dbClient: DBClient };
};

export const test_db = base.extend<DbFixtures, WorkerFixtures>({

    /*
     * ============================================================
     * WORKER-SCOPED: SSH tunnel + Prisma client + DBClient
     * ============================================================
     */
    dbContext: [
        async ({}, use) => {

            const tunnel = new SshTunnelManager(
                SshTunnelConfigEnv
            );
            await tunnel.connect();

            if (!DbConfig) {
                await tunnel.disconnect();
                throw new Error(
                    "DB fixture requested but DATABASE_URL is not " +
                    "set. Add DATABASE_URL to your .env to use " +
                    "the DB layer."
                );
            }

            const prisma = createPrismaClient(DbConfig.url);
            const dbClient = new DBClient(prisma, DbConfig);

            try {

                await dbClient.connect();
                await use({ dbClient });

            } finally {

                await dbClient.disconnect();
                await tunnel.disconnect();
            }
        },
        { scope: "worker" },
    ],


    /*
     * ============================================================
     * TEST-SCOPED: DBClient passthrough
     * ============================================================
     */
    dbClient: async ({ dbContext }, use) => {
        await use(dbContext.dbClient);
    },


    /*
     * ============================================================
     * TEST-SCOPED: pre-built table clients
     * ============================================================
     *
     * Add a new repository by:
     *   1. Creating the repository class
     *   2. Importing it above
     *   3. Adding `<name>: new <RepoClass>(dbContext.dbClient)`
     *      to the object below
     *   4. Extending the `db` fixture type at the top of this file
     */
    db: async ({ dbContext }, use) => {

        const dbClient = dbContext.dbClient;

        await use({
            users: new UserRepository(dbClient),
            client: dbClient.raw,
        });
    },
});
