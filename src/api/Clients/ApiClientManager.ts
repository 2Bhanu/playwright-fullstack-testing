import type { APIRequestContext } from '@playwright/test';

import { AuthClient } from './AuthClient';
import { BaseApiClient } from './BaseApiClient';
import { AdminClient } from './example/AdminClient';
import { UserClient } from './example/UserClient';

/*
 * Describes a CLIENT CLASS.
 *
 * The constructor is deliberately public in this type because
 * ApiClientManager is the component responsible for constructing
 * clients.
 *
 * If BaseApiClient has a protected constructor, the actual client
 * classes can still be instantiated by the manager.
 */
export type ClientClass<
    T extends BaseApiClient = BaseApiClient
> =
    (new (
        request: APIRequestContext
    ) => T)
    & {
        setup?: (
            request: APIRequestContext
        ) => Promise<void>;

        cleanup?: (
            request: APIRequestContext
        ) => Promise<void>;
    };


/*
 * Extract the INSTANCE type from a class without requiring
 * the constructor itself to be public.
 *
 * For example:
 *
 *     ClientInstance<typeof UserClient>
 *
 * becomes:
 *
 *     UserClient
 */
type ClientInstance<T> =
    T extends { prototype: infer I }
        ? I
        : never;


export class ApiClientManager {

    /*
     * ============================================================
     * CLIENT REGISTRY
     * ============================================================
     *
     * The key becomes the fixture name.
     *
     * The value is the client CLASS.
     */
    static readonly clients = {
        authClient: AuthClient,
        userClient: UserClient,
        adminClient: AdminClient,
    } as const;


    constructor(
        private readonly request: APIRequestContext
    ) {}


    /*
     * ============================================================
     * CREATE
     * ============================================================
     */
    async create<T extends ClientClass>(
        ClientClass: T
    ): Promise<ClientInstance<T>> {

        const setup = ClientClass.setup;

        if (setup) {
            await setup(this.request);
        }

        return new ClientClass(
            this.request
        ) as ClientInstance<T>;
    }


    /*
     * ============================================================
     * CLEANUP
     * ============================================================
     */
    async cleanup<T extends ClientClass>(
        ClientClass: T
    ): Promise<void> {

        const cleanup = ClientClass.cleanup;

        if (cleanup) {
            await cleanup(this.request);
        }
    }
}


/*
 * ================================================================
 * PLAYWRIGHT API CLIENT FIXTURES
 * ================================================================
 *
 * Converts:
 *
 *     {
 *         userClient: typeof UserClient,
 *         adminClient: typeof AdminClient
 *     }
 *
 * into:
 *
 *     {
 *         userClient: UserClient,
 *         adminClient: AdminClient
 *     }
 */
export type ApiClientFixtures = {
    [K in keyof typeof ApiClientManager.clients]:
        ClientInstance<
            typeof ApiClientManager.clients[K]
        >;
};