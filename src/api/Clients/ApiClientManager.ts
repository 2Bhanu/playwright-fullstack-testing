import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { UserClient } from './example/UserClient';
import { AdminClient } from './example/AdminClient';


type ClientClass<T extends BaseApiClient = BaseApiClient> =
    (new (request: APIRequestContext) => T) & {
        setup?: (request: APIRequestContext) => Promise<void>;
        cleanup?: (request: APIRequestContext) => Promise<void>;
    };

export class ApiClientManager {

    /*
     * The API client registry.
     *
     * This is deliberately explicit.
     * Adding a new client means registering it here.
     */
    static readonly clients = {
        userClient: UserClient,
        adminClient: AdminClient,
    } as const;

    constructor(
        private readonly request: APIRequestContext
    ) {}

    async create<T extends ClientClass>(
        ClientClass: T
    ): Promise<InstanceType<T>> {

        /*
         * Client-specific setup is handled by the manager.
         * The fixture does not need to know whether setup exists.
         */
        const setup = ClientClass.setup;

if (setup) {
    await setup(this.request);
}

        return new ClientClass(
            this.request
        ) as InstanceType<T>;
    }

    async cleanup<T extends ClientClass>(
        ClientClass: T
    ): Promise<void> {

        /*
         * Client-specific cleanup is also handled here.
         */
        const cleanup = ClientClass.cleanup;

if (cleanup) {
    await cleanup(this.request);
}
    }
}