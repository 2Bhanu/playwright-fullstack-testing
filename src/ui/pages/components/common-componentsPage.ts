import { Page } from '@playwright/test';

import { BasePage } from '../base/base-page';

export default class CommonComponentsPage extends BasePage {
 constructor(page: Page) {
        super(page);
    }   
}