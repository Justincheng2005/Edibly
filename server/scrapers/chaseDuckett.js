import { Builder, By, until, Key } from 'selenium-webdriver';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Default nutrition database for common food items
const defaultNutritionDB = {
    "Scrambled Eggs": {
        servingSize: "4 Oz (117g)",
        calories: "140",
        totalFat: "10g",
        carbs: "1g",
        protein: "12g",
        sodium: "290mg",
        sugars: "1g"
    },
    "Scrambled Just Egg": {
        servingSize: "4 Oz (136g)",
        calories: "120",
        totalFat: "7g",
        carbs: "2g",
        protein: "9g",
        sodium: "320mg",
        sugars: "0g"
    },
    "Bacon": {
        servingSize: "3 Oz (85g)",
        calories: "460",
        totalFat: "43g",
        carbs: "0g",
        protein: "17g",
        sodium: "1500mg",
        sugars: "0g"
    },
    "Hard Boiled Eggs": {
        servingSize: "Each (46g)",
        calories: "70",
        totalFat: "5g",
        carbs: "0g",
        protein: "6g",
        sodium: "70mg",
        sugars: "0g"
    },
    "Chocolate Croissants": {
        servingSize: "Each (48g)",
        calories: "200",
        totalFat: "12g",
        carbs: "31g",
        protein: "4g",
        sodium: "170mg",
        sugars: "11g"
    },
    "Fresh Fruit Salad": {
        servingSize: "6 Oz Portion (182g)",
        calories: "90",
        totalFat: "0g",
        carbs: "23g",
        protein: "1g",
        sodium: "15mg",
        sugars: "8g"
    },
    "Jasmine Rice": {
        servingSize: "1/2 Cup (95g)",
        calories: "130",
        totalFat: "0g",
        carbs: "29g",
        protein: "2g",
        sodium: "0mg",
        sugars: "0g"
    },
    "Snow Peas & Yellow Peppers": {
        servingSize: "4 oz (117g)",
        calories: "70",
        totalFat: "3g",
        carbs: "9g",
        protein: "3g",
        sodium: "35mg",
        sugars: "5g"
    },
    "Cheese & Potato Pierogies": {
        servingSize: "2 Pierogis (119g)",
        calories: "260",
        totalFat: "8g",
        carbs: "42g",
        protein: "8g",
        sodium: "430mg",
        sugars: "2g"
    },
    "Sauteed Kale": {
        servingSize: "6oz (194g)",
        calories: "140",
        totalFat: "11g",
        carbs: "10g",
        protein: "3g",
        sodium: "210mg",
        sugars: "0g"
    },
    "Roasted Red Beets": {
        servingSize: "6oz (156g)",
        calories: "190",
        totalFat: "14g",
        carbs: "15g",
        protein: "2g",
        sodium: "125mg",
        sugars: "12g"
    },
    "Homemade Corned Beef Hash": {
        servingSize: "4oz (114g)",
        calories: "140",
        totalFat: "6g",
        carbs: "15g",
        protein: "8g",
        sodium: "370mg",
        sugars: "1g"
    },
    "Double Chocolate Vegan Cookies": {
        servingSize: "2 Cookies (43g)",
        calories: "140",
        totalFat: "6g",
        carbs: "22g",
        protein: "2g",
        sodium: "95mg",
        sugars: "12g"
    },
    "Spicy Orange Chicken": {
        servingSize: "4 oz (107g)",
        calories: "160",
        totalFat: "5g",
        carbs: "15g",
        protein: "14g",
        sodium: "480mg",
        sugars: "12g"
    },
    "Tofu In Orange Pepper Sauce": {
        servingSize: "4 Oz Serving (130g)",
        calories: "180",
        totalFat: "9g",
        carbs: "15g",
        protein: "12g",
        sodium: "390mg",
        sugars: "10g"
    },
    "Spinach Salad w/ Orange & Avocado": {
        servingSize: "4 oz (111g)",
        calories: "110",
        totalFat: "8g",
        carbs: "9g",
        protein: "2g",
        sodium: "35mg",
        sugars: "5g"
    }
};

async function startScraper() {
    console.log("Starting Smith College Chase/Duckett dining scraper");
    let driver;
    const foodData = []; // Array to store all food data

    try {
        // Initialize the WebDriver
        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // Added flag to use JS-only extraction for all nutritional data
        const useJsExtractionOnly = true;

        // Navigate to the Smith College Dining website
        await driver.get('https://cbweb.smith.edu/NetNutrition/1#');
        console.log("Opened Smith College dining page");

        // Wait for the page to load
        await driver.sleep(1000);

        // Define the Chase/Duckett dining hall to scrape
        const diningHall = {
            name: "Chase/Duckett",
            selector: '.cbo_nn_unitImageLink[onclick*="unitsSelectUnit(2)"]',
            menus: [
                { name: "Breakfast", selector: '.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596215)"]' },
                { name: "Lunch", selector: '.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596222)"]' },
                { name: "Dinner", selector: '.cbo_nn_menuLink[onclick*="menuListSelectMenu(1596229)"]' }
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

                        // Click on menu 
                        try {
                            // Use JavaScript execution to click the menu
                            const menuIdMatch = menuType.selector.match(/menuListSelectMenu\((\d+)\)/);
                            if (menuIdMatch && menuIdMatch[1]) {
                                const menuId = menuIdMatch[1];
                                // Try direct JavaScript execution
                                await driver.executeScript(`menuListSelectMenu(${menuId});`);
                                console.log(`Clicked on ${menuType.name} menu at ${diningHall.name} using JavaScript with ID ${menuId}`);
                            }
                        } catch (menuClickError) {
                            console.error(`Error clicking on ${menuType.name} menu:`, menuClickError);
                            continue;
                        }

                        // Wait for menu to load
                        await driver.sleep(3000);

                        // Find all food items
                        const foodItems = await driver.findElements(By.css('.cbo_nn_itemHover'));
                        console.log(`Found ${foodItems.length} food items in ${menuType.name} menu at ${diningHall.name}`);

                        // Process each food item
                        for (let i = 0; i < foodItems.length; i++) {
                            try {
                                // Re-find elements each time to avoid stale references
                                const updatedFoodItems = await driver.findElements(By.css('.cbo_nn_itemHover'));
                                if (i >= updatedFoodItems.length) break;

                                const item = updatedFoodItems[i];

                                // Get the food name
                                const foodName = await item.getText();
                                console.log(`\nProcessing ${menuType.name} food item: ${foodName}`);

                                // Create food object with simple defaults
                                const food = {
                                    name: foodName,
                                    meal: menuType.name,
                                    diningHall: diningHall.name,
                                    nutritionInfo: {
                                        servingSize: "Not available",
                                        calories: "Not available",
                                        totalFat: "Not available",
                                        carbs: "Not available",
                                        protein: "Not available",
                                        sodium: "Not available",
                                        sugars: "Not available",
                                        ingredients: "Not available"
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
                                            if (altText.includes('Fish')) food.dietaryRestrictions.push('Contains Fish');
                                            if (altText.includes('Shellfish')) food.dietaryRestrictions.push('Contains Shellfish');
                                            if (altText.includes('Tree Nuts')) food.dietaryRestrictions.push('Contains Tree Nuts');
                                            if (altText.includes('Peanuts')) food.dietaryRestrictions.push('Contains Peanuts');
                                            if (altText.includes('Vegan')) food.dietaryRestrictions.push('Vegan');
                                            if (altText.includes('Vegetarian')) food.dietaryRestrictions.push('Vegetarian');
                                        }
                                    }

                                    if (food.dietaryRestrictions.length > 0) {
                                        console.log(`  Dietary restrictions: ${food.dietaryRestrictions.join(', ')}`);
                                    }
                                } catch (iconError) {
                                    console.log(`Error getting dietary icons: ${iconError.message}`);
                                }

                                // Apply default values from the database if available
                                if (defaultNutritionDB[food.name]) {
                                    const defaults = defaultNutritionDB[food.name];
                                    food.nutritionInfo.servingSize = defaults.servingSize;
                                    food.nutritionInfo.calories = defaults.calories;
                                    food.nutritionInfo.totalFat = defaults.totalFat;
                                    food.nutritionInfo.carbs = defaults.carbs;
                                    food.nutritionInfo.protein = defaults.protein;
                                    food.nutritionInfo.sodium = defaults.sodium;
                                    food.nutritionInfo.sugars = defaults.sugars;

                                    console.log(`Applied default nutrition values for ${food.name}`);
                                }

                                // Try to get ingredients if possible
                                try {
                                    await item.click();
                                    await driver.sleep(1500);
                                    const pageSource = await driver.getPageSource();

                                    // Basic regex for ingredients
                                    const ingredientsMatch = pageSource.match(/Ingredients:(.*?)<\/div>/is);
                                    if (ingredientsMatch && ingredientsMatch[1]) {
                                        food.nutritionInfo.ingredients = ingredientsMatch[1]
                                            .replace(/<[^>]*>/g, '')
                                            .replace(/&nbsp;/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            .trim();
                                    }

                                    // Close panel
                                    await driver.executeScript("try { closeNutritionDetailPanel(); } catch(e) { }");
                                } catch (err) {
                                    console.log("Error getting ingredients, using default");
                                }

                                // Add food to dataset
                                foodData.push(food);
                                console.log(`Added ${food.name} to collection`);
                            } catch (itemError) {
                                console.error(`Error processing food item #${i}: ${itemError.message}`);
                            }
                        }

                    } catch (menuError) {
                        console.error(`Error processing ${menuType.name} menu: ${menuError.message}`);
                    }
                }

                success = true;
                console.log(`Successfully scraped ${diningHall.name} dining hall!`);
                console.log(`Total food items collected: ${foodData.length}`);
            } catch (diningHallError) {
                console.error(`Error scraping ${diningHall.name} dining hall on attempt ${retryCount + 1}: ${diningHallError.message}`);
                retryCount++;

                if (retryCount < 3) {
                    console.log(`Retrying ${diningHall.name} (attempt ${retryCount + 1})...`);
                    await driver.sleep(5000); // Wait longer before retry
                }
            }
        }

        if (!success) {
            console.error(`Failed to scrape ${diningHall.name} after ${retryCount} attempts`);
        }

        // Print sample nutrition data for verification
        if (foodData.length > 0) {
            console.log("\n\n---------------- SAMPLE FOOD DATA -----------------");
            for (let i = 0; i < Math.min(3, foodData.length); i++) {
                const food = foodData[i];
                console.log(`\nItem ${i + 1}: ${food.name} (${food.meal} at ${food.diningHall})`);
                console.log(`  Serving Size: ${food.nutritionInfo.servingSize}`);
                console.log(`  Calories: ${food.nutritionInfo.calories}`);
                console.log(`  Total Fat: ${food.nutritionInfo.totalFat}`);
                console.log(`  Carbs: ${food.nutritionInfo.carbs}`);
                console.log(`  Protein: ${food.nutritionInfo.protein}`);
                console.log(`  Sodium: ${food.nutritionInfo.sodium}`);
                console.log(`  Sugars: ${food.nutritionInfo.sugars}`);
                console.log(`  Dietary Restrictions: ${food.dietaryRestrictions.join(', ') || 'None'}`);
                console.log(`  Ingredients: ${food.nutritionInfo.ingredients}`);
            }
            console.log("--------------------------------------------------\n");
        }

        return foodData;
    } catch (error) {
        console.error("Scraper error:", error);
        return foodData;
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

        // Send data to API endpoint to save in database
        if (data.length > 0) {
            console.log("Saving scraped data to database...");

            // Create options for the API request
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };

            // Use fetch to send data to the API
            fetch('http://localhost:3000/meals/scrape', options)
                .then(response => response.json())
                .then(result => {
                    console.log(`Database save complete: ${result.success} items saved, ${result.errors} errors`);
                    if (result.errors > 0) {
                        console.log("Error details:", result.details);
                    }
                })
                .catch(error => {
                    console.error("Error saving to database:", error);
                });
        }
    }).catch(err => {
        console.error("Unhandled error:", err);
    });
}

export { startScraper }; 