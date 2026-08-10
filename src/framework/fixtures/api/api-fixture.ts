import {
    test as base,
} from '@playwright/test';

import { ApiClientManager } from '@/api/Clients/ApiClientManager';

type ApiFixtures = {
    apiClientManager: ApiClientManager;
};

export const test_api =
    base.extend<ApiFixtures>({
        apiClientManager: async (
            { request },
            use
        ) => {

            const manager =
                new ApiClientManager(
                    request
                );

            await use(manager);
        },
    });