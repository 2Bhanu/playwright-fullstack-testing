
import { BaseApiClient } from "../BaseApiClient";
import { SimplifiedRequest } from "../SimplifiedRequest";

import { EndpointMap } from "@/api/endpoint";
import { Env } from "@/config/env";


/*
 * ReqresUserClient
 * ================
 *
 * Public reqres.in demo API. Each endpoint binds its path from
 * `EndpointMap.reqres.*` so renaming or cross-environment swaps
 * stay in one place.
 *
 * The default base URL is read from `Env.reqres.baseURL` and passed
 * directly to each `SimplifiedRequest` constructor. `BaseApiClient`
 * holds no URL state — base URL handling lives entirely in
 * `SimplifiedRequest`. Tests may override per call with
 * `.forURL(...)` on the chain.
 */
export class ReqresUserClient extends BaseApiClient {


    /*
     * List users — GET /api/users
     */
    readonly listUsersEndPoint =
        new SimplifiedRequest(
            this.request,
            EndpointMap.resolve('reqres.listUsers'),
            Env.baseURL
        );
}
