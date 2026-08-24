import { APIRequestContext } from "@playwright/test";
import { SimplifiedRequest } from "./SimplifiedRequest";
import { Env } from "@/config/env";


/**
 * Base class for business-domain API clients.
 *
 * Subclasses declare their endpoints as `SimplifiedRequest` fields,
 * each bound to a base path. The constructor wires Playwright's
 * request context into the base so subclasses can simply write
 *
 *     readonly loginEndPoint = new SimplifiedRequest(
 *         this.request, '/login'
 *     );
 *
 * and tests can chain fluently from there.
 *
 * Per-request auth lives on `SimplifiedRequest.withAuth(...)` —
 * there is intentionally no client-level auth here. Tests wire
 * auth per chain so each endpoint call is explicit and stateless.
 *
 * Base URL handling is the `SimplifiedRequest`'s responsibility,
 * not this class's. Subclasses pass the desired default to each
 * `SimplifiedRequest` constructor directly:
 *
 *     readonly listUsersEndPoint = new SimplifiedRequest(
 *         this.request,
 *         EndpointMap.resolve('reqres.listUsers'),
 *         Env.reqres.baseURL
 *     );
 */
export abstract class BaseApiClient {
    private readonly baseURL = Env.baseURL;
    protected readonly simplifiedRequest: SimplifiedRequest;
    constructor(
        protected readonly request: APIRequestContext
    ) {
        this.simplifiedRequest = new SimplifiedRequest(this.request,this.baseURL);
    }

    //* provide a general purpose method to get a SimplifiedRequest instance with a specific baseURL, this can be useful if test involves hitting a 3rd party url that does not need a dedicated client.
    getSimplifiedRequest(baseURL: string): SimplifiedRequest {
        return new SimplifiedRequest(this.request, baseURL);
    }

}
