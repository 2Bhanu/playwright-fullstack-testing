import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '../BaseApiClient';

export class UserClient extends BaseApiClient {

    static async setup(request: APIRequestContext) {
        console.log('UserClient setup');

        // Example:
        // create test tenant
        // authenticate
        // seed required data
    }

    static async cleanup(request: APIRequestContext) {
        console.log('UserClient cleanup');

        // Example:
        // delete test data
        // remove tenant
    }

    async login() {
        // actual client operation
    }

    async createUser(user: object) {
        return this.request.post('/users', {
            data: user,
        });
    }
}