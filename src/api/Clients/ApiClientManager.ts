import { APIRequestContext } from '@playwright/test';

import { BaseApiClient } from './BaseApiClient';

type ApiClientConstructor<
    T extends BaseApiClient
> = new (
    request: APIRequestContext
) => T;

export class ApiClientManager {
    constructor(
        private readonly request: APIRequestContext
    ) {}

    get<T extends BaseApiClient>(
        ClientClass: ApiClientConstructor<T>
    ): T {
        return new ClientClass(
            this.request
        );
    }
}