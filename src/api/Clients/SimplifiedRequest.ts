
import { logger } from '@/framework/logging/logger';
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
 *     // basic:
 *     .withAuth('basic', { username, password })
 *
 *     // api key (optional custom header name):
 *     .withAuth('apiKey', key)
 *     .withAuth('apiKey', key, 'X-Custom-Key')
 *
 *     expect(response.status()).toBe(201);
 *     const body = await response.json();
 *
 * The chain is single-use: terminal methods consume the chain state
 * and the same SimplifiedRequest instance can be reused, but each
 * terminal call snapshots the current state at call time.
 *
 * Note: The actual token/ api key for the withAuth method should be obtained from the AuthClient or similar service, and not hardcoded in the test code. This ensures that the tests remain secure and maintainable.
 */
export class SimplifiedRequest {

    private headers: Record<string, string> = {};
    private params: Record<string, string> = {};
    private payload: unknown = undefined;
    private authType?: AuthType;
    private authCredentials?: AuthCredentials;
    private ignoreHTTPSErrors: boolean = false;
    private chainForURL?: string;

    constructor(
        private readonly request: APIRequestContext,
        private readonly basePath: string,
        private readonly defaultForURL?: string
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
     * endpoints or subsequent calls on this endpoint. The shape of
     * the credentials argument is constrained by the kind at compile
     * time, so the call site stays short:
     *
     *     .withAuth('bearer', token)
     *     .withAuth('basic', { username, password })
     *     .withAuth('apiKey', key)                  // uses X-API-Key
     *     .withAuth('apiKey', key, 'X-Custom-Key')  // custom header
     *
     * Obtain credentials from `AuthClient.getBearerToken()` /
     * `getBasicAuth()` / `getApiKey()`.
     */
    withAuth(
        kind: 'bearer',
        token: string
    ): this;
    withAuth(
        kind: 'basic',
        credentials: {
            username: string;
            password: string;
        }
    ): this;
    withAuth(
        kind: 'apiKey',
        key: string,
        headerName?: string
    ): this;
    withAuth(
        authType: AuthType,
        credentialsOrKey: string | {
            username: string;
            password: string;
        } | {
            key: string;
            headerName?: string;
        },
        headerName?: string
    ): this {
        this.authType = authType;

        switch (authType) {

        case 'bearer': {
            this.authCredentials = {
                kind: 'bearer',
                token: credentialsOrKey as string
            };
            break;
        }

        case 'basic': {
            const {
                username,
                password
            } = credentialsOrKey as {
                username: string;
                password: string;
            };
            this.authCredentials = {
                kind: 'basic',
                username,
                password
            };
            break;
        }

        case 'apiKey': {
            this.authCredentials = {
                kind: 'apiKey',
                key: credentialsOrKey as string,
                headerName
            };
            break;
        }
        }

        return this;
    }

    /**
     * Override the base URL for this request only.
     *
     * Resolved against `basePath` when the terminal method fires.
     * Falls back to the client-level default (set via
     * `BaseApiClient`'s `forURL` option) when omitted.
     *
     *     await reqresUserClient.listUsersEndPoint
     *         .forURL('https://staging.reqres.in')
     *         .get();
     */
    forURL(url: string): this {
        this.chainForURL = url;
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
            this.resolvePath(),
            options
        );
    }

    /**
     * Resolve `basePath` against the active base URL.
     *
     * Chain-level `.forURL(...)` wins; otherwise the client-level
     * default (set via `BaseApiClient`'s `forURL` option) is used.
     * If neither is set, the path is returned as-is and Playwright
     * resolves it against its own configured baseURL (if any).
     */
    private resolvePath(): string {

        const baseURL =
            this.chainForURL ?? this.defaultForURL;

        if (!baseURL) {
            return this.basePath;
        }

        const normalized = /^https?:\/\//i.test(baseURL)
            ? baseURL
            : `https://${baseURL}`;

        const url =new URL(
            this.basePath,
            normalized
        ).toString();
        logger.info(`Resolved request path: ${url}`);
        return url;
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
