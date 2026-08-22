import { APIRequestContext } from "@playwright/test";

export abstract class BaseApiClient {
    protected constructor(
        protected readonly request: APIRequestContext
    ) {}
}