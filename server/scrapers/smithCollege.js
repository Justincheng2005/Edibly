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

        // Wait for the page to load
        await driver.sleep(1000);

        // Click on Chapin Hall
        try {
            const chapinLink = await driver.findElement(By.css('.cbo_nn_unitImageLink[onclick*="unitsSelectUnit(1)"]'));
            await chapinLink.click();
            console.log("Clicked on Chapin Hall");

            // Wait for content to load after clicking
            await driver.sleep(1000);

            // Click on Breakfast menu
            try {
                const breakfastLink = await driver.findElement(By.css('.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596205)"]'));
                await breakfastLink.click();
                console.log("Clicked on Breakfast menu");

                // Wait for breakfast menu to load
                await driver.sleep(1000);

                // Find all food items
                const foodItems = await driver.findElements(By.css('.cbo_nn_itemHover'));
                console.log(`Found ${foodItems.length} food items`);

                // Process each food item
                for (const item of foodItems) {
                    // Get the food name
                    const foodName = await item.getText();
                    console.log(`Food item: ${foodName}`);

                    // Hover over the item to show nutrition details
                    const actions = driver.actions();
                    await actions.move({ origin: item }).perform();
                    console.log(`Hovering over ${foodName} to get nutrition info`);

                    // Wait for nutrition panel to appear
                    await driver.sleep(1000);
                }

            } catch (breakfastError) {
                console.error("Error clicking on Breakfast menu:", breakfastError);
            }
        } catch (clickError) {
            console.error("Error clicking on Chapin Hall:", clickError);
        }

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