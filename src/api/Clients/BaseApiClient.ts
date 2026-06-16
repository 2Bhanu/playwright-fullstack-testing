import { APIRequestContext } from "@playwright/test";

export abstract class BaseApiClient {
    private headers: Record<string, string> = {};

    constructor(
        protected readonly request: APIRequestContext
    ) {}

    setHeader(
        name: string,
        value: string
    ): this {
        this.headers[name] = value;
        return this;
    }

    setAuthToken(
        token: string
    ): this {
        this.headers.Authorization =
            `Bearer ${token}`;

        return this;
    }

    protected getHeaders() {
        return this.headers;
    }
}