import { DBClient } from "../core/db-client";


/*
 * ================================================================
 * UserRepository — sample / template
 * ================================================================
 *
 * Layer 2 of the DB abstraction. Wraps `DBClient.raw.user.*`
 * with domain-meaningful methods so tests don't import Prisma.
 *
 * Constructor takes a `DBClient`, not a `PrismaClient` — when
 * swapping Prisma for another ORM, this is the only file (per
 * entity) that needs to change.
 *
 * No business validation here. Repositories expose what the
 * database supports, exactly as the API Request Object layer
 * does for HTTP endpoints.
 *
 * The `User` shape matches `prisma/schema.prisma`. Add new
 * entities by:
 *
 *   1. Adding a model to `prisma/schema.prisma`
 *   2. Running `npx prisma generate`
 *   3. Creating a sibling repository file here
 *   4. Pre-building it in `core/db-fixture.ts`
 */
export class UserRepository {

    constructor(
        private readonly db: DBClient
    ) {}


    /*
     * ============================================================
     * READ
     * ============================================================
     */

    findById(id: string) {
        return this.db.raw.user.findUnique({
            where: { id },
        });
    }

    findByEmail(email: string) {
        return this.db.raw.user.findUnique({
            where: { email },
        });
    }


    /*
     * ============================================================
     * WRITE
     * ============================================================
     */

    create(data: {
        name: string;
        email: string;
        status?: "ACTIVE" | "DISABLED";
    }) {
        return this.db.raw.user.create({ data });
    }

    updateStatus(
        id: string,
        status: "ACTIVE" | "DISABLED"
    ) {
        return this.db.raw.user.update({
            where: { id },
            data: { status },
        });
    }

    delete(id: string) {
        return this.db.raw.user.delete({
            where: { id },
        });
    }
}
