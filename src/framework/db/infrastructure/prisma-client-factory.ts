import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";


/*
 * ================================================================
 * PRISMA CLIENT FACTORY
 * ================================================================
 *
 * Single seam where another ORM (Mongoose, Dynamoose, ...) would
 * slot in. The DBClient above and the repositories below all
 * depend on the *shape* returned by this function, not on Prisma
 * directly — except through the escape hatch `DBClient.raw`.
 *
 * Prisma 7 changed how clients are constructed: instead of
 * `datasources.db.url`, you pass a driver adapter. For PostgreSQL
 * the official adapter is `@prisma/adapter-pg`, which wraps a
 * `pg` connection pool.
 *
 * The factory takes a fully-resolved URL string. Callers are
 * responsible for any URL mutation (SSH tunneling rewrites the
 * host:port in DATABASE_URL via the local listener).
 *
 * `log` levels are silenced here; the framework's logger is
 * already wired through `AsyncLocalStorage` and would otherwise
 * duplicate output.
 */
export function createPrismaClient(
    url: string
): PrismaClient {

    const adapter = new PrismaPg({
        connectionString: url,
    });

    return new PrismaClient({
        adapter,
        log: [
            {
                emit: "event",
                level: "error",
            },
        ],
    });
}
