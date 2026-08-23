import { APIRequestContext } from "@playwright/test";


/*
 * Options passed to every BaseApiClient constructor.
 *
 * `forURL` is the default base URL the client will use when an
 * endpoint's chain does not call `.forURL(...)` to override it.
 * Per-chain overrides take precedence; when neither is set, the
 * request fires against the request context's configured baseURL.
 *
 * Subclasses typically read a host from `Env` and pass it here,
 * keeping the env-singleton as the single source of truth:
 *
 *     super(request, { forURL: Env.reqresBaseHost })
 */
export interface BaseApiClientOptions {
    forURL?: string;
}


/**
 * Base class for business-domain API clients.
 *
 * Subclasses declare their endpoints as `SimplifiedRequest` fields,
 * each bound to a base path. The constructor wires Playwright's
 * request context into the base so subclasses can simply write
 *
 *     readonly listUsersEndPoint = new SimplifiedRequest(
 *         this.request, '/api/users'
 *     );
 *
 * and tests can chain fluently from there.
 *
 * Per-request auth lives on `SimplifiedRequest.withAuth(...)` —
 * there is intentionally no client-level auth here. Tests wire
 * auth per chain so each endpoint call is explicit and stateless.
 *
 * The optional `forURL` option sets the default base URL for every
 * endpoint on this client. Tests can override per-call with
 * `.forURL(...)` on the chain:
 *
 *     await reqresUserClient.listUsersEndPoint
 *         .forURL('https://staging.reqres.in')
 *         .get();
 */
export abstract class BaseApiClient {

    protected readonly defaultForURL: string | undefined;

    constructor(
        protected readonly request: APIRequestContext,
        options?: BaseApiClientOptions
    ) {
        this.defaultForURL = options?.forURL;
    }
}
