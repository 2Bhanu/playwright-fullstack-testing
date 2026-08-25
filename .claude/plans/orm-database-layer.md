# Plan: ORM-Based Database Access Layer

## Goal

Add a database access layer to the framework, mirroring the philosophy of the
existing API Request Object (ARO) layer. Tests call `db.users.findByEmail(...)`
and never see Prisma. SSH tunneling is handled by a separate infrastructure
layer; Prisma just connects to `localhost:<localPort>`.

The layer is wired into `fixture_aggregator` as a worker-scoped fixture so the
SSH connection, tunnel, and Prisma client are created once per worker rather
than once per test.

---

## Decisions confirmed with the user

| Question | Choice |
|---|---|
| Where does the layer live? | `src/framework/db/` |
| Sample repo included? | Yes — `UserRepository` + matching `schema.prisma` |
| Prisma + ssh2 install? | Yes — added to `package.json` and `npm install` runs |
| Config shape? | New `database` entry in `Env` singleton |
| Fixture surface? | Expose `dbClient` + pre-built table clients (`db.users`, `db.<name>`) |
| DBClient abstraction? | DBClient wraps PrismaClient; `dbClient.raw` is the escape hatch |
| Tunnel placement? | Tunnel lives outside DBClient — opened before DBClient is built |

---

## Two-layer model (key correction from v1 of this plan)

| Layer | Responsibility | Lifetime |
|---|---|---|
| **DB Client** | Connection lifecycle + database-level operations (`connect`/`disconnect`, `useSchema`, `listTables`, etc.). Wraps Prisma. Exposes `raw` as the escape hatch. | Worker-scoped (one per worker) |
| **Table Client / Repository** | CRUD on a specific entity. Takes a `DBClient` directly in its constructor — no manager in between. | Constructed per-test from the worker's DBClient |

Repositories don't need a registry. They are stateless wrappers, not
endpoint-style objects. The `ApiClientManager` registry pattern exists
because each `BaseApiClient` carries per-client auth + endpoint setup
state; repositories carry neither.

---

## Directory layout (new files only)

```
src/framework/db/
├── core/
│   ├── db-client.ts                 # DBClient class — wraps PrismaClient
│   └── db-fixture.ts                # worker-scoped Playwright fixture
├── repositories/
│   └── user-repository.ts           # sample UserRepository(dbClient)
└── infrastructure/
    ├── prisma-client-factory.ts     # builds the PrismaClient pointed at the tunneled URL
    └── ssh-tunnel-manager.ts        # programmatic ssh2 tunnel (no-op when disabled)

prisma/
└── schema.prisma                    # User model (sample)
```

Files modified (no architectural change):

- `package.json` — add `@prisma/client`, `prisma`, `ssh2`, `@types/ssh2`
- `src/config/env.ts` — add `database` + `sshTunnel` entries to `EnvType`
- `src/framework/fixtures/fixture_aggregator.ts` — `mergeTests(test_db, ...)`
- `.env.example` — document new variables (DB + SSH)
- `README.md` — short section documenting the new layer

---

## Configuration

Extend `EnvType` in `src/config/env.ts`:

```ts
export type DatabaseConfig = {
    url: string;                  // postgresql://user:pwd@localhost:15432/db
};

export type SshTunnelConfig = {
    enabled: boolean;
    host: string;
    port: number;
    username: string;             // key auth via SSH_PRIVATE_KEY_PATH (preferred)
    privateKeyPath?: string;
    password?: string;            // fallback
    localPort: number;            // e.g. 15432
    remoteHost: string;           // e.g. db.internal
    remotePort: number;           // e.g. 5432
};

export type EnvType = {
    baseURL: string;
    username?: string;
    password?: string;
    api_key?: string;
    database?: DatabaseConfig;    // optional — DB not required for every project
    sshTunnel?: SshTunnelConfig;
};
```

`Env` adds a matching `database` block. `getEnvOptional` is used throughout DB
config so existing `fsr`/`reqres` envs without DB fields keep working.

`.env.example` adds (commented out by default):

```
DATABASE_URL=postgresql://user:password@localhost:15432/mydb

SSH_TUNNEL_ENABLED=false
SSH_TUNNEL_HOST=
SSH_TUNNEL_PORT=22
SSH_TUNNEL_USERNAME=
SSH_TUNNEL_PRIVATE_KEY_PATH=
SSH_TUNNEL_PASSWORD=
SSH_TUNNEL_LOCAL_PORT=15432
SSH_TUNNEL_REMOTE_HOST=
SSH_TUNNEL_REMOTE_PORT=5432
```

`SSH_TUNNEL_ENABLED=false` keeps the framework usable when DB is directly
reachable.

---

## Layer 1 — DBClient

[src/framework/db/core/db-client.ts](src/framework/db/core/db-client.ts):

```ts
import type { PrismaClient } from '@prisma/client';

export class DBClient {

    constructor(
        private readonly prisma: PrismaClient,
        private readonly config: DatabaseConfig,
    ) {}

    /** Lifecycle */
    async connect(): Promise<void> {
        // verify the connection (lazy — Prisma connects on first query)
        await this.prisma.$connect();
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }

    /** Database-level operations */
    async useSchema(schema: string): Promise<void> {
        await this.prisma.$executeRawUnsafe(
            `SET search_path TO "${schema}"`
        );
    }

    async listTables(): Promise<string[]> {
        const rows = await this.prisma.$queryRaw<{ table_name: string }[]>`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        `;
        return rows.map(r => r.table_name);
    }

    /** Escape hatch — raw ORM client for advanced queries. */
    get raw(): PrismaClient {
        return this.prisma;
    }
}
```

DBClient owns the PrismaClient reference. Repositories take a DBClient (not a
PrismaClient), so when swapping Prisma for Mongoose later, only `db-client.ts`
and the repositories need updating.

---

## Layer 2 — Repository (sample)

[src/framework/db/repositories/user-repository.ts](src/framework/db/repositories/user-repository.ts):

```ts
import type { DBClient } from '../core/db-client';

export class UserRepository {

    constructor(private readonly db: DBClient) {}

    findById(id: string) {
        return this.db.raw.user.findUnique({ where: { id } });
    }

    findByEmail(email: string) {
        return this.db.raw.user.findUnique({ where: { email } });
    }

    create(data: { name: string; email: string; status: 'ACTIVE' | 'DISABLED' }) {
        return this.db.raw.user.create({ data });
    }

    delete(id: string) {
        return this.db.raw.user.delete({ where: { id } });
    }
}
```

No business validation here — repositories expose what the database supports,
exactly as the ARO does.

---

## Pre-built table clients

[src/framework/db/core/db-fixture.ts](src/framework/db/core/db-fixture.ts):

```ts
export const test_db = base.extend<{
    dbClient: DBClient;
    db: { users: UserRepository } & { client: PrismaClient };
}, {
    dbContext: { dbClient: DBClient };            // worker-scope
}>({

    dbContext: [
        async ({}, use) => {
            const tunnel = new SshTunnelManager(Env.sshTunnel);
            await tunnel.connect();

            const prisma = createPrismaClient(Env.database!.url);
            const dbClient = new DBClient(prisma, Env.database!);
            await dbClient.connect();

            try {
                await use({ dbClient });
            } finally {
                await dbClient.disconnect();
                await tunnel.disconnect();
            }
        },
        { scope: 'worker' },
    ],

    dbClient: async ({ dbContext }, use) => {
        await use(dbContext.dbClient);
    },

    db: async ({ dbClient }, use) => {
        await use({
            users: new UserRepository(dbClient),
            client: dbClient.raw,                  // escape hatch for advanced cases
        });
    },
});
```

Why three entries:

- `dbContext` (worker-scope) owns SSH tunnel + Prisma client lifecycle.
- `dbClient` (test-scope, free) — exposes the standalone DBClient for tests
  that want connection-level ops (`dbClient.listTables()` etc.).
- `db` (test-scope, free) — pre-built table clients (`db.users`). Stateless
  so per-test construction is cheap.

Tests destructure whichever they need.

---

## SSH tunnel manager

[src/framework/db/infrastructure/ssh-tunnel-manager.ts](src/framework/db/infrastructure/ssh-tunnel-manager.ts):

```ts
import { Client } from 'ssh2';
import { createServer } from 'node:net';

export class SshTunnelManager {

    private server?: import('node:net').Server;

    constructor(private readonly config?: SshTunnelConfig) {}

    async connect(): Promise<void> {
        if (!this.config?.enabled) return;          // no-op when disabled

        const conn = new Client();

        await new Promise<void>((resolve, reject) => {
            conn.on('ready', () => {
                this.server = createServer(local => {
                    conn.forwardOut(
                        local.remoteAddress,
                        local.remotePort,
                        this.config!.remoteHost,
                        this.config!.remotePort,
                        (err, stream) => {
                            if (err) return local.destroy(err);
                            local.pipe(stream).pipe(local);
                        }
                    );
                }).listen(this.config!.localPort, () => resolve());
            });
            conn.on('error', reject);
            conn.connect(this.buildSshOptions());
        });
    }

    async disconnect(): Promise<void> {
        this.server?.close();
    }

    private buildSshOptions(): Parameters<Client['connect']>[0] {
        // prefers private key, falls back to password
    }
}
```

Lives in `infrastructure/` so it is clearly separated from the framework
abstraction. Prisma never imports from this file; Prisma just sees a URL.

---

## Prisma client factory

[src/framework/db/infrastructure/prisma-client-factory.ts](src/framework/db/infrastructure/prisma-client-factory.ts):

```ts
import { PrismaClient } from '@prisma/client';

export function createPrismaClient(url: string): PrismaClient {
    return new PrismaClient({ datasources: { db: { url } } });
}
```

The factory is the single seam where another ORM would slot in.

---

## Prisma schema (sample)

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id     String   @id @default(cuid())
  name   String
  email  String   @unique
  status String   @default("ACTIVE")
}
```

`npx prisma generate` runs as part of the README setup notes.

---

## `fixture_aggregator` wiring

[src/framework/fixtures/fixture_aggregator.ts](src/framework/fixtures/fixture_aggregator.ts) — add `test_db` to the merge:

```ts
export const test = mergeTests(
  pageTest,
  apiTest,
  loggingTest,
  test_db,
);
```

DB is opt-in by virtue of the fixture: tests that don't destructure `db` or
`dbClient` pay no per-test cost (the worker-scope fixture still opens once per
worker; can be made lazy/optional later if needed).

---

## Usage (target shape)

```ts
import { test, expect } from '@/framework/fixtures/fixture_aggregator';

test('API updates user in DB', async ({ db, usersApi }) => {
    const user = await db.users.create({
        name: 'John',
        email: 'john@example.com',
        status: 'ACTIVE',
    });

    await usersApi.disable(user.id);

    const updated = await db.users.findById(user.id);
    expect(updated?.status).toBe('DISABLED');
});
```

For database-level inspection:

```ts
test('schema has expected tables', async ({ dbClient }) => {
    const tables = await dbClient.listTables();
    expect(tables).toContain('User');
});
```

Tests never see Prisma, never see the SSH tunnel, never see the connection
URL.

---

## Risks and how they're handled

| Risk | Mitigation |
|---|---|
| Prisma + ssh2 type installs break the build | Run `npm install` and `npx tsc --noEmit` before handing back; surface any errors. |
| Worker-scope fixture creates a connection for workers that don't need it | Document; can become opt-in via a second fixture flag later. |
| Repositories reach into `dbClient.raw` and bind themselves to Prisma | Acceptable for v1 — same shape as ARO tests reaching into the request body when needed. Switching ORMs means a one-pass repo rewrite. |

---

## Out of scope (explicitly)

- Real auth on the Prisma client (assumed open / network-isolated for v1).
- A `db.transaction(...)` helper — `dbClient.raw.$transaction` is the path;
  add later if a repo pattern emerges.
- Mocking the DB layer in tests — direct Prisma calls are fine in tests; the
  rule "no raw SQL" applies to the repository surface only.
- Generating Prisma client on `npm install` — left to README setup steps.
