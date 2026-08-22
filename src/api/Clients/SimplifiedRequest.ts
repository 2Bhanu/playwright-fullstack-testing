import {
    APIRequestContext,
    APIResponse,
} from '@playwright/test';


/*
 * ================================================================
 * AUTH TYPES
 * ================================================================
 *
 * The auth kind is a single string tag. Credentials are passed in
 * already-resolved — tests obtain them from `AuthClient.getBearerToken()`
 * etc. before chaining `withAuth(...)`. The credentials shape is
 * constrained to match the kind at call time.
 */
export type AuthType =
    | 'bearer'
    | 'basic'
    | 'apiKey';

export type AuthCredentials =
    | {
        kind: 'bearer';
        token: string;
    }
    | {
        kind: 'basic';
        username: string;
        password: string;
    }
    | {
        kind: 'apiKey';
        key: string;
        headerName?: string;
    };


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
 *     const token = await authClient.getBearerToken();
 *
 *     const response = await userClient.loginEndPoint
 *         .withAuth('bearer', token)
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
    private authType?: AuthType;
    private authCredentials?: AuthCredentials;
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
     * endpoints or subsequent calls on this endpoint. Credentials
     * are passed in already-resolved — obtain them from
     * `AuthClient.getBearerToken()` / `getBasicAuth()` / `getApiKey()`.
     */
    withAuth(
        authType: AuthType,
        credentials: AuthCredentials
    ): this {
        this.authType = authType;
        this.authCredentials = credentials;
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

        const headers = this.buildHeaders();
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

    /**
     * Project the chain's auth state (if any) onto the headers bag.
     *
     * The kind is stored separately from credentials so a kind-cred
     * mismatch is caught here rather than at the call site.
     */
    private buildHeaders(): Record<string, string> {

        const headers = {
            ...this.headers
        };

        if (
            !this.authType
            || !this.authCredentials
            || this.authCredentials.kind !== this.authType
        ) {
            return headers;
        }

        switch (this.authType) {

        case 'bearer': {
            const { token } =
                this.authCredentials as Extract<
                    AuthCredentials,
                    { kind: 'bearer' }
                >;
            return {
                ...headers,
                Authorization: `Bearer ${token}`
            };
        }

        case 'basic': {
            const { username, password } =
                this.authCredentials as Extract<
                    AuthCredentials,
                    { kind: 'basic' }
                >;
            const encoded =
                Buffer.from(
                    `${username}:${password}`
                ).toString('base64');
            return {
                ...headers,
                Authorization: `Basic ${encoded}`
            };
        }

        case 'apiKey': {
            const { key, headerName } =
                this.authCredentials as Extract<
                    AuthCredentials,
                    { kind: 'apiKey' }
                >;
            return {
                ...headers,
                [headerName ?? 'X-API-Key']: key
            };
        }
        }
    }
}
