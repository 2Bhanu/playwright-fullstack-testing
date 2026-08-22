import { BaseApiClient } from "../BaseApiClient";
import { SimplifiedRequest } from "../SimplifiedRequest";


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
