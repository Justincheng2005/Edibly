import { Builder, By, until } from 'selenium-webdriver';
import { fileURLToPath } from 'url';
import path from 'path';

async function startScraper() {
    console.log("Starting Smith College dining scraper");

    let driver;

    try {
        // Initialize the WebDriver
        driver = await new Builder().forBrowser('chrome').build();

        // Navigate to the Smith College Dining website
        await driver.get('https://cbweb.smith.edu/NetNutrition/1#');
        console.log("Opened Smith College dining page");

        // Wait a bit to ensure the page is loading
        await driver.sleep(5000);

        // Log the current URL to verify we're on the right page
        const currentUrl = await driver.getCurrentUrl();
        console.log(`Current URL: ${currentUrl}`);

        // Print a message so user knows the browser will stay open
        console.log("Browser is open and will remain open. Press Ctrl+C to exit.");

        // Wait for user to manually terminate by keeping the process alive
        return new Promise(() => { }); // This keeps the process running without resolving

    } catch (error) {
        console.error("Error in scraper:", error);
        if (driver) {
            try {
                await driver.quit();
            } catch (quitError) {
                console.error("Error quitting driver:", quitError);
            }
        }
    }
}

// Self-invoking function for direct execution
const __filename = fileURLToPath(import.meta.url);
if (__filename === path.resolve(process.argv[1])) {
    startScraper().catch(err => {
        console.error("Unhandled error:", err);
    });
}

export { startScraper }; 