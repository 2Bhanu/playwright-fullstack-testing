import type { PrismaClient } from "@prisma/client";

import type { DatabaseConfig } from "@/config/env";


/*
 * ================================================================
 * DBClient
 * ================================================================
 *
 * Layer 1 of the DB abstraction. Wraps a Prisma client and adds
 * database-level operations: connect/disconnect, schema switch,
 * table introspection, raw query escape hatch.
 *
 * Repositories (layer 2) take a DBClient, not a PrismaClient,
 * so the ORM is replaceable from one place: this file + the
 * factory in infrastructure/.
 *
 * DBClient is intentionally NOT a Playwright fixture — it is
 * plain infrastructure. The fixture in `core/db-fixture.ts`
 * handles the worker-scoped lifecycle (connect on worker start,
 * disconnect on worker end).
 */
export class DBClient {

    constructor(
        private readonly prisma: PrismaClient,
        private readonly config: DatabaseConfig
    ) {}


    /*
     * ============================================================
     * LIFECYCLE
     * ============================================================
     */

    /**
     * Verify the connection to the database.
     *
     * Prisma connects lazily on first query, but tests benefit
     * from a fail-fast here: a bad URL / unreachable host should
     * throw at worker startup, not at the first `db.users.*`
     * call inside a test body.
     */
    async connect(): Promise<void> {
        await this.prisma.$connect();
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }


    /*
     * ============================================================
     * DATABASE-LEVEL OPERATIONS
     * ============================================================
     *
     * These exist so tests and the framework can inspect / shape
     * the database without reaching into Prisma directly.
     */

    /**
     * Switch the active schema (PostgreSQL).
     *
     * Equivalent to `SET search_path TO "<schema>"`. Subsequent
     * queries on this client (and on repositories constructed
     * from it) target the named schema.
     */
    async useSchema(schema: string): Promise<void> {
        await this.prisma.$executeRawUnsafe(
            `SET search_path TO "${schema}"`
        );
    }

    /**
     * List tables in the public schema.
     *
     * Postgres-specific. Returns table names as plain strings.
     * For schema/owner introspection, use `db.raw` directly.
     */
    async listTables(): Promise<string[]> {

        const rows = await this.prisma.$queryRaw<
            { table_name: string }[]
        >`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;

        return rows.map((r) => r.table_name);
    }


    /*
     * ============================================================
     * ESCAPE HATCH
     * ============================================================
     */

    /**
     * The underlying ORM client.
     *
     * Exposed for advanced queries that don't fit the
     * DBClient/repository surface — raw aggregations, transactions
     * (`db.raw.$transaction(...)`), or one-off inspections during
     * a test. Use sparingly; the rule "no raw SQL in tests" still
     * applies to typical cases.
     */
    get raw(): PrismaClient {
        return this.prisma;
    }


    /*
     * ============================================================
     * CONFIG ACCESS
     * ============================================================
     */

    get databaseUrl(): string {
        return this.config.url;
    }
}
