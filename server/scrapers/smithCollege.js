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

                                // Extract nutrition information using multiple regex patterns for robustness

                                // Serving Size - try different patterns
                                let servingSizePatterns = [
                                    /Serving Size:&nbsp;([^<]+)/i,
                                    /Serving Size:<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Serving Size"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of servingSizePatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.servingSize = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Serving Size: ${food.nutritionInfo.servingSize}`);
                                        break;
                                    }
                                }

                                // Calories - try different patterns
                                let caloriesPatterns = [
                                    /Calories<\/span>&nbsp;&nbsp;<span[^>]*>(\d+)<\/span>/i,
                                    /Calories"[^>]*>(\d+)/i,
                                    /Calories:[^>]*>(\d+)/i,
                                    /Calories<\/span><span[^>]*>(\d+)/i
                                ];

                                for (const pattern of caloriesPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.calories = match[1];
                                        console.log(`  Calories: ${food.nutritionInfo.calories}`);
                                        break;
                                    }
                                }

                                // Total Fat - try different patterns
                                let fatPatterns = [
                                    /Total Fat<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i,
                                    /Total Fat<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Total Fat"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of fatPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.totalFat = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Total Fat: ${food.nutritionInfo.totalFat}`);
                                        break;
                                    }
                                }

                                // Total Carbohydrate - try different patterns
                                let carbPatterns = [
                                    /Total Carbohydrate<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i,
                                    /Total Carbohydrate<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Total Carbohydrate"[^>]*>([^<]+)/i,
                                    /Carbohydrates"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of carbPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.carbs = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Total Carbs: ${food.nutritionInfo.carbs}`);
                                        break;
                                    }
                                }

                                // Protein - try different patterns
                                let proteinPatterns = [
                                    /Protein<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i,
                                    /Protein<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Protein"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of proteinPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.protein = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Protein: ${food.nutritionInfo.protein}`);
                                        break;
                                    }
                                }

                                // Sodium - try different patterns
                                let sodiumPatterns = [
                                    /Sodium<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i,
                                    /Sodium<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Sodium"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of sodiumPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.sodium = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Sodium: ${food.nutritionInfo.sodium}`);
                                        break;
                                    }
                                }

                                // Sugars - try different patterns
                                let sugarsPatterns = [
                                    /Sugars<\/span><\/td><td><span[^>]*>&nbsp;([^<]+)<\/span>/i,
                                    /Sugars<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Sugars"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of sugarsPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.sugars = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Sugars: ${food.nutritionInfo.sugars}`);
                                        break;
                                    }
                                }

                                // Ingredients - try different patterns
                                let ingredientsPatterns = [
                                    /class="cbo_nn_LabelIngredients">([^<]+)<\/span>/i,
                                    /Ingredients:<\/span>[^<]*<span[^>]*>([^<]+)/i,
                                    /Ingredients"[^>]*>([^<]+)/i
                                ];

                                for (const pattern of ingredientsPatterns) {
                                    const match = pageSource.match(pattern);
                                    if (match && match[1]) {
                                        food.nutritionInfo.ingredients = match[1].replace(/&nbsp;/g, ' ').trim();
                                        console.log(`  Ingredients: ${food.nutritionInfo.ingredients}`);
                                        break;
                                    }
                                }

                                // Fallback to JavaScript for any missing nutrition data
                                if (!food.nutritionInfo.servingSize || !food.nutritionInfo.calories ||
                                    !food.nutritionInfo.totalFat || !food.nutritionInfo.carbs ||
                                    !food.nutritionInfo.protein || !food.nutritionInfo.sodium) {

                                    console.log("Using JavaScript fallback to extract nutrition data");

                                    try {
                                        const jsExtractedData = await driver.executeScript(`
                                            const data = {};
                                            
                                            // Serving Size
                                            const servingSizeEl = document.querySelector('.cbo_nn_LabelServingSize');
                                            if (servingSizeEl) {
                                                data.servingSize = servingSizeEl.textContent.replace('Serving Size:', '').trim();
                                            }
                                            
                                            // Calories
                                            const caloriesEl = document.querySelector('[aria-label="Calories"], .cbo_nn_LabelCalories');
                                            if (caloriesEl) {
                                                const calorieValue = caloriesEl.textContent.match(/(\\d+)/);
                                                if (calorieValue) {
                                                    data.calories = calorieValue[0];
                                                }
                                            }
                                            
                                            // Create a map of labels to find
                                            const nutritionMap = {
                                                'Total Fat': 'totalFat',
                                                'Total Carbohydrate': 'carbs',
                                                'Protein': 'protein',
                                                'Sodium': 'sodium',
                                                'Sugars': 'sugars'
                                            };
                                            
                                            // Try to find all nutrition rows
                                            const rows = document.querySelectorAll('.cbo_nn_NutritionRow, .cbo_nn_LabelDetailTable tr');
                                            
                                            for (const row of rows) {
                                                // Get all text in the row
                                                const rowText = row.textContent.trim();
                                                
                                                // Check against our nutrition map
                                                for (const [label, dataKey] of Object.entries(nutritionMap)) {
                                                    if (rowText.includes(label)) {
                                                        // Extract the value (assuming format is "Label: Value")
                                                        const valueMatch = rowText.match(new RegExp(label + '\\s*[:\\s]\\s*([\\d\\.]+\\s*[a-zA-Z%]+)'));
                                                        if (valueMatch && valueMatch[1]) {
                                                            data[dataKey] = valueMatch[1].trim();
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            // Get ingredients
                                            const ingredientsEl = document.querySelector('.cbo_nn_LabelIngredients');
                                            if (ingredientsEl) {
                                                data.ingredients = ingredientsEl.textContent.trim();
                                            }
                                            
                                            return data;
                                        `);

                                        // Update missing values from JavaScript extraction
                                        if (jsExtractedData) {
                                            if (!food.nutritionInfo.servingSize && jsExtractedData.servingSize) {
                                                food.nutritionInfo.servingSize = jsExtractedData.servingSize;
                                                console.log(`  Serving Size (JS): ${food.nutritionInfo.servingSize}`);
                                            }

                                            if (!food.nutritionInfo.calories && jsExtractedData.calories) {
                                                food.nutritionInfo.calories = jsExtractedData.calories;
                                                console.log(`  Calories (JS): ${food.nutritionInfo.calories}`);
                                            }

                                            if (!food.nutritionInfo.totalFat && jsExtractedData.totalFat) {
                                                food.nutritionInfo.totalFat = jsExtractedData.totalFat;
                                                console.log(`  Total Fat (JS): ${food.nutritionInfo.totalFat}`);
                                            }

                                            if (!food.nutritionInfo.carbs && jsExtractedData.carbs) {
                                                food.nutritionInfo.carbs = jsExtractedData.carbs;
                                                console.log(`  Total Carbs (JS): ${food.nutritionInfo.carbs}`);
                                            }

                                            if (!food.nutritionInfo.protein && jsExtractedData.protein) {
                                                food.nutritionInfo.protein = jsExtractedData.protein;
                                                console.log(`  Protein (JS): ${food.nutritionInfo.protein}`);
                                            }

                                            if (!food.nutritionInfo.sodium && jsExtractedData.sodium) {
                                                food.nutritionInfo.sodium = jsExtractedData.sodium;
                                                console.log(`  Sodium (JS): ${food.nutritionInfo.sodium}`);
                                            }

                                            if (!food.nutritionInfo.sugars && jsExtractedData.sugars) {
                                                food.nutritionInfo.sugars = jsExtractedData.sugars;
                                                console.log(`  Sugars (JS): ${food.nutritionInfo.sugars}`);
                                            }

                                            if (!food.nutritionInfo.ingredients && jsExtractedData.ingredients) {
                                                food.nutritionInfo.ingredients = jsExtractedData.ingredients;
                                                console.log(`  Ingredients (JS): ${food.nutritionInfo.ingredients}`);
                                            }
                                        }
                                    } catch (jsError) {
                                        console.log(`JavaScript extraction error: ${jsError.message}`);
                                    }
                                }

                                // Fill in any remaining missing values with placeholders
                                if (!food.nutritionInfo.servingSize) food.nutritionInfo.servingSize = "Not available";
                                if (!food.nutritionInfo.calories) food.nutritionInfo.calories = "Not available";
                                if (!food.nutritionInfo.totalFat) food.nutritionInfo.totalFat = "Not available";
                                if (!food.nutritionInfo.carbs) food.nutritionInfo.carbs = "Not available";
                                if (!food.nutritionInfo.protein) food.nutritionInfo.protein = "Not available";
                                if (!food.nutritionInfo.sodium) food.nutritionInfo.sodium = "Not available";
                                if (!food.nutritionInfo.sugars) food.nutritionInfo.sugars = "Not available";
                                if (!food.nutritionInfo.ingredients) food.nutritionInfo.ingredients = "Not available";

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