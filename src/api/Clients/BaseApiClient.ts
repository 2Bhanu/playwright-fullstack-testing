import { APIRequestContext } from "@playwright/test";

export abstract class BaseApiClient {
    public constructor(
        protected readonly request: APIRequestContext
    ) {}
}