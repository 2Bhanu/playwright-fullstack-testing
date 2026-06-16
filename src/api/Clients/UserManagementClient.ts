
import { BaseApiClient } from "./BaseApiClient";

import { CreateUser } from "@/schema/user";


export class UserManagementClient
    extends BaseApiClient {

    async createUser(
        payload: CreateUser
    ) {
        return this.request.post(
            '/api/users',
            {
                headers:
                    this.getHeaders(),
                data: payload,
            }
        );
    }
}