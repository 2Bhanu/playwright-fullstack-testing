import { ApiRequest } from "./requests";

import { User } from "@/framework/fixtures/api/types-guards";

export interface CreateUserQuery {

    notify?: boolean;
}

export type CreateUserRequest =
    ApiRequest<
        User,
        CreateUserQuery
    >;

export class UserApi {

    async createUser(
        request: CreateUserRequest
    ) {

        console.log(
            "POST /users"
        );

        console.log(
            "Payload",
            request.payload
        );

        console.log(
            "Query",
            request.query
        );

        return {

            status: 201,

            body: request.payload
        };
    }
}