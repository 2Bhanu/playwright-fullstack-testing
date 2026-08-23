
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
 * The default `forURL` is read from `Env.reqresBaseHost`. Tests
 * may override per call with `.forURL(...)` on the chain.
 */
export class ReqresUserClient extends BaseApiClient {

    constructor(
        request: import('@playwright/test').APIRequestContext
    ) {
        super(request, {
            forURL: Env.reqresBaseHost
        });
    }


    /*
     * List users — GET /api/users
     */
    readonly listUsersEndPoint =
        new SimplifiedRequest(
            this.request,
            EndpointMap.resolve('reqres.listUsers'),
            this.defaultForURL
        );
}
