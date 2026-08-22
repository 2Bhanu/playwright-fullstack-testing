import {
    APIRequestContext,
    APIResponse,
} from '@playwright/test';

import {
    AuthHandler,
    type AuthSpec,
} from './AuthHandler';


/**
 * Fluent request builder.
 *
 * Each endpoint on a BaseApiClient subclass is a `SimplifiedRequest`
 * instance bound to a base path. The chain methods mutate state and
 * return `this`; the terminal methods (`post`, `get`, `put`, `patch`,
 * `delete`) issue the call and return Playwright's raw `APIResponse`.
 *
 * Usage:
 *
 *     const response = await userClient.loginEndPoint
 *         .withAuth(AuthHandler.bearer(token))
 *         .withPayload(myUser)
 *         .post();
 *
 *     expect(response.status()).toBe(201);
 *     const body = await response.json();
 *
 * The chain is single-use: terminal methods consume the chain state
 * and the same SimplifiedRequest instance can be reused, but each
 * terminal call snapshots the current state at call time.
 */
export class SimplifiedRequest {

    private headers: Record<string, string> = {};
    private params: Record<string, string> = {};
    private payload: unknown = undefined;
    private authHandler?: AuthSpec;
    private ignoreHTTPSErrors: boolean = false;

    constructor(
        private readonly request: APIRequestContext,
        private readonly basePath: string
    ) {}


    /*
     * ============================================================
     * CHAIN MUTATORS — return this
     * ============================================================
     */

    /**
     * Apply an auth strategy to this request only.
     *
     * Mutates only this chain's state; does not affect sibling
     * endpoints or subsequent calls on this endpoint.
     */
    withAuth(
        auth: AuthSpec
    ): this {
        this.authHandler = auth;
        return this;
    }

    withHeader(
        name: string,
        value: string
    ): this {
        this.headers[name] = value;
        return this;
    }

    withHeaders(
        headers: Record<string, string>
    ): this {
        this.headers = {
            ...this.headers,
            ...headers
        };
        return this;
    }

    withParam(
        name: string,
        value: string
    ): this {
        this.params[name] = value;
        return this;
    }

    withParams(
        params: Record<string, string>
    ): this {
        this.params = {
            ...this.params,
            ...params
        };
        return this;
    }

    withPayload(
        body: unknown
    ): this {
        this.payload = body;
        return this;
    }

    /**
     * Tell Playwright to ignore HTTPS errors for this request.
     *
     * Useful against self-signed certs in test environments.
     */
    relaxHTTPValidation(): this {
        this.ignoreHTTPSErrors = true;
        return this;
    }


    /*
     * ============================================================
     * TERMINALS — return Playwright's APIResponse
     * ============================================================
     */

    async post(): Promise<APIResponse> {
        return this.send('POST');
    }

    async get(): Promise<APIResponse> {
        return this.send('GET');
    }

    async put(): Promise<APIResponse> {
        return this.send('PUT');
    }

    async patch(): Promise<APIResponse> {
        return this.send('PATCH');
    }

    async delete(): Promise<APIResponse> {
        return this.send('DELETE');
    }


    /*
     * ============================================================
     * INTERNAL
     * ============================================================
     */

    private async send(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    ): Promise<APIResponse> {

        const headers = await this.resolveHeaders();
        const params = this.params;

        const options: Parameters<APIRequestContext['fetch']>[1] = {
            method,
            headers,
            params,
            ignoreHTTPSErrors: this.ignoreHTTPSErrors
        };

        if (method !== 'GET' && method !== 'DELETE') {
            options.data = this.payload;
        }

        return this.request.fetch(
            this.basePath,
            options
        );
    }

    private async resolveHeaders(): Promise<Record<string, string>> {

        let headers = {
            ...this.headers
        };

        if (this.authHandler) {
            headers = await AuthHandler.apply(
                headers,
                this.authHandler
            );
        }

        return headers;
    }
}
