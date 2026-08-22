import { BaseApiClient } from "../BaseApiClient";


export class AdminClient extends BaseApiClient {

    async createAdmin(admin: object) {
        return this.request.post('/admins', {
            data: admin,
        });
    }
}