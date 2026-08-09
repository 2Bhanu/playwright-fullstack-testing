import {
    test as base,
    expect,
} from '@playwright/test';

import { ApiClientManager } from '@/api/Clients/ApiClientManager';

type ApiFixtures = {
    apiClientManager: ApiClientManager;
};

export const test =
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