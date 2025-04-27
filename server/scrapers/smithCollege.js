import { Builder, By, until, Key } from 'selenium-webdriver';
import { fileURLToPath } from 'url';
import path from 'path';

async function startScraper() {
    console.log("Starting Smith College dining scraper");
    let driver;
    const foodData = []; // Array to store all food data

    try {
        // Initialize the WebDriver
        driver = await new Builder()
            .forBrowser('chrome')
            .build();

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
                for (let i = 0; i < foodItems.length; i++) {
                    try {
                        // Re-find elements each time to avoid stale references
                        const updatedFoodItems = await driver.findElements(By.css('.cbo_nn_itemHover'));
                        if (i >= updatedFoodItems.length) {
                            console.log(`Item index ${i} is out of bounds, breaking loop`);
                            break;
                        }

                        const item = updatedFoodItems[i];

                        // Get the food name
                        const foodName = await item.getText();
                        console.log(`\nProcessing food item: ${foodName}`);

                        // Create food object
                        const food = {
                            name: foodName,
                            nutritionInfo: {
                                servingSize: "",
                                calories: "",
                                totalFat: "",
                                carbs: "",
                                protein: "",
                                sodium: "",
                                sugars: "",
                                ingredients: ""
                            }
                        };

                        // Get onmouseover attribute to extract item ID
                        const onMouseOver = await item.getAttribute('onmouseover');
                        console.log(`onmouseover attribute: ${onMouseOver}`);

                        // Extract item ID
                        const idMatch = onMouseOver.match(/getItemNutritionLabel\((\d+)\)/);
                        if (idMatch && idMatch[1]) {
                            const itemId = idMatch[1];
                            console.log(`Item ID: ${itemId}`);

                            try {
                                // Close any open dialogs
                                await driver.executeScript("try { closeNutritionDetailPanel(); } catch(e) { console.log('No panel to close'); }");
                                console.log("Attempted to close any nutrition panels");

                                // Click on the item to show nutrition panel
                                await item.click();
                                console.log(`Clicked on item: ${foodName}`);

                                // Wait for panel to appear
                                await driver.sleep(1500);

                                // Get the page source which contains the nutrition panel HTML
                                const pageSource = await driver.getPageSource();

                                // Extract nutrition information using regex patterns

                                // Serving Size
                                const servingSizeRegex = /Serving Size:&nbsp;([^<]+)/i;
                                const servingSizeMatch = pageSource.match(servingSizeRegex);
                                if (servingSizeMatch && servingSizeMatch[1]) {
                                    food.nutritionInfo.servingSize = servingSizeMatch[1].replace(/&nbsp;/g, ' ').trim();
                                    console.log(`  Serving Size: ${food.nutritionInfo.servingSize}`);
                                }

                                // Calories - look for Calories followed by a number
                                const caloriesRegex = /Calories<\/span>&nbsp;&nbsp;<span[^>]*>(\d+)<\/span>/i;
                                const caloriesMatch = pageSource.match(caloriesRegex);
                                if (caloriesMatch && caloriesMatch[1]) {
                                    food.nutritionInfo.calories = caloriesMatch[1];
                                    console.log(`  Calories: ${food.nutritionInfo.calories}`);
                                }

                                // Total Fat
                                const fatRegex = /Total Fat<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i;
                                const fatMatch = pageSource.match(fatRegex);
                                if (fatMatch && fatMatch[1]) {
                                    food.nutritionInfo.totalFat = fatMatch[1];
                                    console.log(`  Total Fat: ${food.nutritionInfo.totalFat}`);
                                }

                                // Total Carbohydrate
                                const carbsRegex = /Total Carbohydrate<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i;
                                const carbsMatch = pageSource.match(carbsRegex);
                                if (carbsMatch && carbsMatch[1]) {
                                    food.nutritionInfo.carbs = carbsMatch[1];
                                    console.log(`  Total Carbs: ${food.nutritionInfo.carbs}`);
                                }

                                // Protein
                                const proteinRegex = /Protein<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i;
                                const proteinMatch = pageSource.match(proteinRegex);
                                if (proteinMatch && proteinMatch[1]) {
                                    food.nutritionInfo.protein = proteinMatch[1];
                                    console.log(`  Protein: ${food.nutritionInfo.protein}`);
                                }

                                // Sodium
                                const sodiumRegex = /Sodium<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i;
                                const sodiumMatch = pageSource.match(sodiumRegex);
                                if (sodiumMatch && sodiumMatch[1]) {
                                    food.nutritionInfo.sodium = sodiumMatch[1];
                                    console.log(`  Sodium: ${food.nutritionInfo.sodium}`);
                                }

                                // Sugars
                                const sugarsRegex = /Sugars<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i;
                                const sugarsMatch = pageSource.match(sugarsRegex);
                                if (sugarsMatch && sugarsMatch[1]) {
                                    food.nutritionInfo.sugars = sugarsMatch[1];
                                    console.log(`  Sugars: ${food.nutritionInfo.sugars}`);
                                }

                                // Ingredients - note the more detailed pattern from what we found
                                const ingredientsRegex = /class="cbo_nn_LabelIngredients">([^<]+)<\/span>/i;
                                const ingredientsMatch = pageSource.match(ingredientsRegex);
                                if (ingredientsMatch && ingredientsMatch[1]) {
                                    food.nutritionInfo.ingredients = ingredientsMatch[1].replace(/&nbsp;/g, ' ').trim();
                                    console.log(`  Ingredients: ${food.nutritionInfo.ingredients}`);
                                }

                                // Close the nutrition panel
                                try {
                                    const closeButtons = await driver.findElements(By.css("img[alt='Close']"));
                                    if (closeButtons.length > 0) {
                                        await closeButtons[0].click();
                                        console.log("Clicked Close button");
                                    } else {
                                        // Try escape key
                                        await driver.actions().sendKeys(Key.ESCAPE).perform();
                                        console.log("Pressed Escape key");
                                    }
                                } catch (closeError) {
                                    console.log(`Error closing panel: ${closeError.message}`);
                                    // Try JavaScript close as a backup
                                    try {
                                        await driver.executeScript("closeNutritionDetailPanel();");
                                        console.log("Closed panel with JavaScript");
                                    } catch (jsCloseError) {
                                        console.log(`JavaScript close error: ${jsCloseError.message}`);
                                    }
                                }

                                // Wait before proceeding to next item
                                await driver.sleep(1000);

                            } catch (itemProcessError) {
                                console.log(`Error processing item details: ${itemProcessError.message}`);
                            }
                        }

                        // Add food to dataset
                        foodData.push(food);

                    } catch (itemError) {
                        console.error(`Error processing item ${i}: ${itemError.message}`);
                        // Try to recover and continue
                        try {
                            await driver.navigate().refresh();
                            console.log("Refreshed page after error");
                            await driver.sleep(2000);

                            // Navigate back to breakfast menu
                            const chapinLink = await driver.findElement(By.css('.cbo_nn_unitImageLink[onclick*="unitsSelectUnit(1)"]'));
                            await chapinLink.click();
                            console.log("Clicked on Chapin Hall again");
                            await driver.sleep(1000);

                            const breakfastLink = await driver.findElement(By.css('.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596205)"]'));
                            await breakfastLink.click();
                            console.log("Clicked on Breakfast menu again");
                            await driver.sleep(1000);
                        } catch (recoveryError) {
                            console.log(`Recovery failed: ${recoveryError.message}`);
                        }
                    }
                }

                // Log all collected data
                console.log("\nCollected Food Data:");
                console.log(JSON.stringify(foodData, null, 2));

            } catch (breakfastError) {
                console.error("Error clicking on Breakfast menu:", breakfastError);
            }
        } catch (clickError) {
            console.error("Error clicking on Chapin Hall:", clickError);
        }

        // Log the current URL to verify we're on the right page
        const currentUrl = await driver.getCurrentUrl();
        console.log(`Current URL: ${currentUrl}`);

        return foodData; // Return the collected data
    } catch (error) {
        console.error("Error in scraper:", error);
        return foodData; // Return whatever data was collected before the error
    } finally {
        if (driver) {
            await driver.quit();
            console.log("WebDriver closed");
        }
    }
}

// Self-invoking function for direct execution
const __filename = fileURLToPath(import.meta.url);
if (__filename === path.resolve(process.argv[1])) {
    startScraper().then(data => {
        console.log("Scraping completed with", data.length, "items");
    }).catch(err => {
        console.error("Unhandled error:", err);
    });
}

export { startScraper }; 