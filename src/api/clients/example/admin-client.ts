import { BaseApiClient } from "../base-api-client";
import { SimplifiedRequest } from "../simplified-request";


export class AdminClient extends BaseApiClient {

    readonly createAdminEndPoint =
        new SimplifiedRequest(
            this.request,
            '/admins'
        );

    readonly getAdminEndPoint =
        new SimplifiedRequest(
            this.request,
            '/admins'
        );
}
