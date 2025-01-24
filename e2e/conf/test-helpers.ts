import { chromium, BrowserContext } from "playwright";
import { URL } from './configuration';

/**
 * Creates a browser context with MetaMask extension loaded
 * @returns {Promise<BrowserContext>} Configured browser context
 */
export async function createBrowserContext(): Promise<BrowserContext> {
    const extensionPath = require('path').join(__dirname, '../extension-source');
    const headless = process.env.E2E_CHROMIUM_HEADLESS === 'true';
    
    return await chromium.launchPersistentContext('', {
        headless,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`
        ]
    });
}

/**
 * Returns the appropriate test URL based on environment
 * @returns {string} Test environment URL
 */
export function getTestUrl(): string {
    return process.env.TEST_ENV === 'prod' ? URL.PROD : URL.DEV;
}
