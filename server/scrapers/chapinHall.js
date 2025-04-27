import { Builder, By, until, Key } from 'selenium-webdriver';
import { fileURLToPath } from 'url';
import path from 'path';

async function startScraper() {
    console.log("Starting Smith College Chapin Hall dining scraper");
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

        // Define the Chapin Hall dining hall to scrape
        const diningHall = {
            name: "Chapin Hall",
            selector: '.cbo_nn_unitImageLink[onclick*="unitsSelectUnit(1)"]',
            menus: [
                { name: "Breakfast", selector: '.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596205)"]' },
                { name: "Lunch", selector: '.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596210)"]' }
            ]
        };

        console.log(`\nProcessing ${diningHall.name} dining hall`);
        let retryCount = 0;
        let success = false;

        // Try up to 3 times to scrape this dining hall
        while (retryCount < 3 && !success) {
            try {
                // Navigate to main page first to ensure we're in the right state
                await driver.get('https://cbweb.smith.edu/NetNutrition/1#');
                await driver.sleep(3000); // Increased wait time

                // Click on dining hall
                const diningHallLink = await driver.findElement(By.css(diningHall.selector));
                await diningHallLink.click();
                console.log(`Clicked on ${diningHall.name}`);
                await driver.sleep(3000); // Increased wait time

                // Process each menu for this dining hall
                for (const menuType of diningHall.menus) {
                    try {
                        console.log(`\nProcessing ${menuType.name} menu at ${diningHall.name}`);

                        // Click on menu (Breakfast, Lunch, or Dinner)
                        try {
                            // Print available menu links for debugging
                            const allMenuLinks = await driver.findElements(By.css('.cbo_nn_menuLink'));
                            console.log(`Found ${allMenuLinks.length} menu links`);

                            let foundMenu = false;
                            for (let i = 0; i < allMenuLinks.length; i++) {
                                const menuText = await allMenuLinks[i].getText();
                                const menuOnclick = await allMenuLinks[i].getAttribute('onclick');
                                console.log(`Menu ${i + 1}: ${menuText} (${menuOnclick})`);

                                // If this is the menu we're looking for, click it directly
                                if (menuText.toUpperCase() === menuType.name.toUpperCase() &&
                                    menuOnclick.includes(menuType.selector.match(/menuListSelectMenu\((\d+)\)/)[1])) {
                                    console.log(`Found exact match for ${diningHall.name} ${menuType.name} menu: ${menuOnclick}`);
                                    await allMenuLinks[i].click();
                                    console.log(`Clicked on ${menuType.name} menu at ${diningHall.name}`);
                                    foundMenu = true;
                                    break;
                                }
                            }

                            if (!foundMenu) {
                                // Try to find by selector or use JavaScript click
                                try {
                                    const menuLink = await driver.findElement(By.css(menuType.selector));
                                    await menuLink.click();
                                    console.log(`Clicked on ${menuType.name} menu at ${diningHall.name} using CSS selector`);
                                } catch (cssError) {
                                    console.log(`Could not find menu by CSS selector: ${cssError.message}`);

                                    // Extract the menu ID from the selector
                                    const menuIdMatch = menuType.selector.match(/menuListSelectMenu\((\d+)\)/);
                                    if (menuIdMatch && menuIdMatch[1]) {
                                        const menuId = menuIdMatch[1];
                                        // Try direct JavaScript execution
                                        await driver.executeScript(`menuListSelectMenu(${menuId});`);
                                        console.log(`Clicked on ${menuType.name} menu at ${diningHall.name} using JavaScript with ID ${menuId}`);
                                    } else {
                                        throw new Error(`Could not extract menu ID from selector: ${menuType.selector}`);
                                    }
                                }
                            }
                        } catch (menuClickError) {
                            console.error(`Error clicking on ${menuType.name} menu:`, menuClickError);
                            // Continue to next menu if we can't click this one
                            continue;
                        }

                        // Wait for menu to load
                        await driver.sleep(3000); // Increased wait time

                        // Get all food category headers to identify sections
                        const categoryHeaders = await driver.findElements(By.css('.cbo_nn_menuCategory'));
                        console.log(`Found ${categoryHeaders.length} food categories`);

                        for (const header of categoryHeaders) {
                            const categoryName = await header.getText();
                            console.log(`Processing category: ${categoryName}`);
                        }

                        // Find all food items
                        const foodItems = await driver.findElements(By.css('.cbo_nn_itemHover'));
                        console.log(`Found ${foodItems.length} food items in ${menuType.name} menu at ${diningHall.name}`);

                        // Log the items found
                        let itemTexts = [];
                        for (const item of foodItems) {
                            const itemText = await item.getText();
                            itemTexts.push(itemText);
                        }

                        console.log(`No specific expected items for this menu. Found ${itemTexts.length} items:`);
                        console.log(`Items found: ${itemTexts.join(', ')}`);

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
                                console.log(`\nProcessing ${menuType.name} food item: ${foodName}`);

                                // Create food object
                                const food = {
                                    name: foodName,
                                    meal: menuType.name,
                                    diningHall: diningHall.name,
                                    nutritionInfo: {
                                        servingSize: "",
                                        calories: "",
                                        totalFat: "",
                                        carbs: "",
                                        protein: "",
                                        sodium: "",
                                        sugars: "",
                                        ingredients: ""
                                    },
                                    dietaryRestrictions: []
                                };

                                // Check for dietary restriction icons
                                try {
                                    const itemRow = await item.findElement(By.xpath('./..'));
                                    const icons = await itemRow.findElements(By.css('img'));

                                    for (const icon of icons) {
                                        const altText = await icon.getAttribute('alt');
                                        if (altText) {
                                            if (altText.includes('Eggs')) food.dietaryRestrictions.push('Contains Eggs');
                                            if (altText.includes('Milk')) food.dietaryRestrictions.push('Contains Milk');
                                            if (altText.includes('Soy')) food.dietaryRestrictions.push('Contains Soy');
                                            if (altText.includes('Wheat')) food.dietaryRestrictions.push('Contains Wheat');
                                        }
                                    }

                                    if (food.dietaryRestrictions.length > 0) {
                                        console.log(`  Dietary restrictions: ${food.dietaryRestrictions.join(', ')}`);
                                    }
                                } catch (iconError) {
                                    console.log(`Error getting dietary icons: ${iconError.message}`);
                                }

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
                                            /Serving Size"[^>]*>([^<]+)/i,
                                            /class="cbo_nn_LabelServingSize">Serving Size:([^<]+)<\/span>/i
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
                                            /Calories<\/span><span[^>]*>(\d+)/i,
                                            /class="cbo_nn_LabelCalories">Calories.*?(\d+)/i
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
                                            /Total Fat"[^>]*>([^<]+)/i,
                                            /Total Fat.*?([0-9.]+g)/i
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
                                            /Carbohydrates"[^>]*>([^<]+)/i,
                                            /Total Carbohydrate.*?([0-9.]+g)/i
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
                                            /Protein"[^>]*>([^<]+)/i,
                                            /Protein.*?([0-9.]+g)/i
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
                                            /Sodium"[^>]*>([^<]+)/i,
                                            /Sodium.*?([0-9.]+mg)/i
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
                                            /Sugars"[^>]*>([^<]+)/i,
                                            /Sugars.*?([0-9.]+g)/i
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
                                            /Ingredients"[^>]*>([^<]+)/i,
                                            /class="cbo_nn_LabelIngredients">Ingredients:([^<]+)<\/span>/i
                                        ];

                                        for (const pattern of ingredientsPatterns) {
                                            const match = pageSource.match(pattern);
                                            if (match && match[1]) {
                                                food.nutritionInfo.ingredients = match[1].replace(/&nbsp;/g, ' ').trim();
                                                console.log(`  Ingredients: ${food.nutritionInfo.ingredients}`);
                                                break;
                                            }
                                        }

                                        // Also try the direct element approach as backup
                                        try {
                                            if (!food.nutritionInfo.servingSize) {
                                                const servingSizeElement = await driver.findElement(By.css('.cbo_nn_LabelServingSize'));
                                                if (servingSizeElement) {
                                                    const servingSizeText = await servingSizeElement.getText();
                                                    if (servingSizeText) {
                                                        food.nutritionInfo.servingSize = servingSizeText.replace('Serving Size:', '').trim();
                                                        console.log(`  Serving Size (direct): ${food.nutritionInfo.servingSize}`);
                                                    }
                                                }
                                            }

                                            if (!food.nutritionInfo.calories) {
                                                const caloriesElement = await driver.findElement(By.css('.cbo_nn_LabelCalories'));
                                                if (caloriesElement) {
                                                    const caloriesText = await caloriesElement.getText();
                                                    const caloriesMatch = caloriesText.match(/(\d+)/);
                                                    if (caloriesMatch && caloriesMatch[1]) {
                                                        food.nutritionInfo.calories = caloriesMatch[1];
                                                        console.log(`  Calories (direct): ${food.nutritionInfo.calories}`);
                                                    }
                                                }
                                            }
                                        } catch (directError) {
                                            console.log(`Could not get nutrition directly: ${directError.message}`);
                                        }

                                        // Use JavaScript to extract all nutrition data as a fallback
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
                                                        data.ingredients = ingredientsEl.textContent.replace('Ingredients:', '').trim();
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
                            }
                        }

                        // Mark as success if we processed the items
                        if (foodData.length > 0) {
                            success = true;
                        }

                    } catch (menuError) {
                        console.error(`Error processing ${menuType.name} menu:`, menuError);
                    }
                }

            } catch (diningHallError) {
                console.error(`Attempt ${retryCount + 1} failed for ${diningHall.name} dining hall:`, diningHallError);
                retryCount++;

                // Wait before retrying
                await driver.sleep(3000);
            }
        }

        // Log all collected data
        console.log("\nCollected Food Data:");
        console.log(JSON.stringify(foodData, null, 2));

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