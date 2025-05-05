import { Builder, By, until } from 'selenium-webdriver';
import fetch from 'node-fetch';

async function startScraper() {
    let driver = await new Builder().forBrowser('chrome').build();
    let allResults = [];

    try {
        await driver.get('https://amherst.nutrislice.com/menu/valentine-hall');
        console.log("Opened Valentine Hall");

        const viewMenus = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(text(), 'View Menus')]")),
            10000
        );
        await viewMenus.click();
        console.log("Clicked View Menus");

        const mealTypes = [
            { name: "Breakfast", xpath: "//strong[text()='Breakfast']/ancestor::a" },
            { name: "Lunch", xpath: "//a[contains(., 'Lunch')]" },
            { name: "Dinner", xpath: "//a[contains(., 'Dinner')]" },
            { name: "Late Night", xpath: "//a[contains(., 'Late Night')]" },
            { name: "Salad Bar", xpath: "//a[contains(., 'Salad Bar')]" },
            { name: "Daily Deli & Bread Selection", xpath: "//a[contains(., 'Daily Deli & Bread Selection')]" },
            { name: "Yogurt & Granola Bar", xpath: "//a[contains(., 'Yogurt & Granola Bar')]" },
            { name: "Ice Cream Station", xpath: "//a[contains(., 'Ice Cream Station')]" }
        ];

        for (const mealType of mealTypes) {
            console.log(`\n=== STARTING ${mealType.name.toUpperCase()} MENU SCRAPING ===`);

            try {
                try {
                    const closeButtons = await driver.findElements(By.css("a[class*='close'], button[class*='close']"));
                    if (closeButtons.length > 0) {
                        await closeButtons[0].click();
                        console.log("Clicked close button to return to menu");
                        await driver.sleep(1000);
                    }
                } catch (closeErr) {
                    console.log("No close button found, assuming already at menu view");
                }

                try {
                    const mealTypeLink = await driver.wait(
                        until.elementLocated(By.xpath(mealType.xpath)),
                        10000
                    );
                    await mealTypeLink.click();
                    console.log(`Clicked on ${mealType.name}`);
                    await driver.sleep(2000);

                    const foodItems = await driver.findElements(By.css("a.food-link"));

                    if (foodItems.length > 0) {
                        const items = await scraperInfo(driver);
                        console.log(`Scraped ${items.length} ${mealType.name} items`);

                        // Transform the items to match the expected format for the database
                        const transformedItems = items.map(item => transformValentineData(item, mealType.name));

                        allResults = [...allResults, ...transformedItems];
                    } else {
                        try {
                            const alternativeFoodItems = await driver.findElements(
                                By.css(".food-item, .menu-item, .station-item-wrapper, [data-food-id]")
                            );

                            if (alternativeFoodItems.length > 0) {
                                console.log(`Found ${alternativeFoodItems.length} alternative food items for ${mealType.name}`);

                                await alternativeFoodItems[0].click();
                                console.log(`Clicked on alternative food item for ${mealType.name}`);
                                await driver.sleep(1000);

                                const items = await scraperInfo(driver);
                                console.log(`Scraped ${items.length} ${mealType.name} items using alternative approach`);

                                // Transform the items to match the expected format for the database
                                const transformedItems = items.map(item => transformValentineData(item, mealType.name));

                                allResults = [...allResults, ...transformedItems];
                            } else {
                                try {
                                    const noItemsMessage = await driver.executeScript(`
                                        const noItemsEl = document.querySelector('.no-items, .empty-menu, .no-results');
                                        return noItemsEl ? noItemsEl.textContent.trim() : null;
                                    `);

                                    if (noItemsMessage) {
                                        console.log(`No items available for ${mealType.name}: "${noItemsMessage}"`);
                                    } else {
                                        console.log(`No standard food items found for ${mealType.name}, but no explicit 'no items' message either`);
                                    }

                                    // No placeholder items will be added
                                    console.log(`Skipping ${mealType.name} as no items were found`);

                                } catch (finalCheckErr) {
                                    console.log(`No food items found for ${mealType.name} after all checks`);
                                }
                            }
                        } catch (alternativeErr) {
                            console.log(`No food items found for ${mealType.name}`);
                            // No placeholder items will be added
                            console.log(`Skipping ${mealType.name} as no items were found`);
                        }
                    }
                } catch (error) {
                    console.error(`Error navigating to ${mealType.name}:`, error);
                }
            } catch (mealError) {
                console.error(`Error scraping ${mealType.name} menu:`, mealError);
            }
        }

        return allResults;
    } catch (error) {
        console.error("Error:", error);
        return allResults;
    } finally {
        await driver.quit();
    }
}

// New function to transform Valentine Hall data to match the other scrapers' format
function transformValentineData(item, mealName) {
    // Create dietary restrictions array by combining allergens and dietary preferences
    const dietaryRestrictions = [];

    // Add allergens with "Contains" prefix
    if (item.dietaryInfo && item.dietaryInfo.allergens) {
        item.dietaryInfo.allergens.forEach(allergen => {
            if (allergen && !dietaryRestrictions.includes(allergen)) {
                dietaryRestrictions.push(allergen);
            }
        });
    }

    // Add dietary preferences directly
    if (item.dietaryInfo && item.dietaryInfo.dietary) {
        item.dietaryInfo.dietary.forEach(diet => {
            if (diet && !dietaryRestrictions.includes(diet)) {
                dietaryRestrictions.push(diet);
            }
        });
    }

    // Extract key nutrition values from the nutrition object
    let totalFat = "Not available";
    let carbs = "Not available";
    let protein = "Not available";
    let sodium = "Not available";
    let sugars = "Not available";

    if (item.nutrition) {
        if (item.nutrition["Total Fat"]) {
            totalFat = item.nutrition["Total Fat"].value || "Not available";
        }

        if (item.nutrition["Total Carbohydrate"] || item.nutrition["Carbohydrates"]) {
            carbs = (item.nutrition["Total Carbohydrate"]?.value ||
                item.nutrition["Carbohydrates"]?.value ||
                "Not available");
        }

        if (item.nutrition["Protein"]) {
            protein = item.nutrition["Protein"].value || "Not available";
        }

        if (item.nutrition["Sodium"]) {
            sodium = item.nutrition["Sodium"].value || "Not available";
        }

        if (item.nutrition["Sugars"]) {
            sugars = item.nutrition["Sugars"].value || "Not available";
        }
    }

    // Create transformed object that matches the expected structure
    return {
        name: item.name || "Unknown Item",
        meal: mealName,
        diningHall: "Valentine Hall",
        nutritionInfo: {
            servingSize: item.servingSize || "Not available",
            calories: item.calories || "Not available",
            totalFat: totalFat,
            carbs: carbs,
            protein: protein,
            sodium: sodium,
            sugars: sugars,
            ingredients: item.ingredients || "Not available"
        },
        dietaryRestrictions: dietaryRestrictions
    };
}

async function scraperInfo(driver) {
    const results = [];

    try {
        const firstTile = await driver.wait(
            until.elementLocated(By.css("a.food-link")),
            10000
        );
        await firstTile.click();
    } catch (noFoodItemsError) {
        console.log("No food items found to scrape");
        return results;
    }

    await driver.sleep(1000);

    let hasNextItem = true;
    let itemCount = 0;

    while (hasNextItem) {
        try {
            let name = "Unknown Item";

            try {
                const nameElement = await driver.findElement(By.css("h3.name"));
                name = await nameElement.getText();

                if (!name || name.trim() === "") {
                    throw new Error("Empty name, trying alternative approach");
                }
            } catch (nameErr) {
                try {
                    const modalTitle = await driver.findElement(By.css(".modal-header h3, .popup-header h3, [role='dialog'] h3"));
                    name = await modalTitle.getText();

                    if (!name || name.trim() === "") {
                        throw new Error("Empty name from modal title");
                    }
                } catch (modalTitleErr) {
                    try {
                        name = await driver.executeScript(`
                            const nameEl = document.querySelector('h3.name, .food-details h3, .food-title');
                            return nameEl ? nameEl.textContent.trim() : "Unknown Item";
                        `);

                        if (!name || name === "Unknown Item") {
                            console.log("Could not get name using JavaScript execution");
                        }
                    } catch (jsErr) {
                        console.error("All approaches to get name failed:", jsErr);
                    }
                }
            }

            itemCount++;
            console.log(`Scraping item #${itemCount}: ${name}`);

            if (name === "Unknown Item") {
                try {
                    console.log("Taking screenshot of problematic item...");
                    await driver.takeScreenshot().then(image => {
                        require('fs').writeFileSync(`problem-item-${itemCount}.png`, image, 'base64');
                    });
                } catch (screenshotErr) {
                    console.error("Could not take screenshot:", screenshotErr);
                }
            }

            let ingredients = "";
            try {
                const ingredientsHeading = await driver.findElements(By.xpath("//h4[contains(text(), 'Ingredients')]"));
                if (ingredientsHeading.length > 0) {
                    const ingredientsElem = await driver.findElement(By.css("p.ingredients"));
                    ingredients = await ingredientsElem.getText();
                }
            } catch (err) {
                try {
                    const ingredientsSpan = await driver.findElement(By.css("p.ingredients span"));
                    ingredients = await ingredientsSpan.getText();
                } catch (e) {
                    // Continue silently
                }
            }

            const dietaryInfo = {
                allergens: [],
                dietary: []
            };

            try {
                const dietaryIcons = await driver.findElements(
                    By.css("li[title]")
                );

                for (const icon of dietaryIcons) {
                    const tooltipText = await icon.getAttribute("title");

                    if (tooltipText && tooltipText.trim() !== "") {
                        if (tooltipText.includes("contains")) {
                            // Check if allergen is not already in the array to avoid duplicates
                            if (!dietaryInfo.allergens.includes(tooltipText)) {
                                dietaryInfo.allergens.push(tooltipText);
                            }
                        } else {
                            // Check if dietary info is not already in the array to avoid duplicates
                            if (!dietaryInfo.dietary.includes(tooltipText)) {
                                dietaryInfo.dietary.push(tooltipText);
                            }
                        }
                    }
                }

                const vegLabels = await driver.findElements(
                    By.css("div[labelledby]")
                );

                for (const label of vegLabels) {
                    const labelType = await label.getAttribute("labelledby");
                    if (labelType) {
                        const labelText = await driver.findElement(
                            By.css(`#${labelType}`)
                        ).getText();

                        // Only add non-empty dietary labels that aren't already in the array
                        if (labelText && labelText.trim() !== "" && !dietaryInfo.dietary.includes(labelText)) {
                            dietaryInfo.dietary.push(labelText);
                        }
                    }
                }

            } catch (err) {
                // Continue silently
            }

            let nutrition = {};
            let servingSize = "";
            let calories = "";

            try {
                const servingSizeElement = await driver.findElement(By.xpath("//div[contains(@class, 'nutrition-row')]//span[contains(text(), 'Serving Size')]/following-sibling::span"));
                if (servingSizeElement) {
                    servingSize = await servingSizeElement.getText();
                }
            } catch (err) {
                try {
                    const servingSizeRow = await driver.findElement(By.css("div.serving-size"));
                    servingSize = await servingSizeRow.getText();
                    servingSize = servingSize.replace("Serving Size", "").trim();
                } catch (innerErr) {
                    // Continue silently
                }
            }

            try {
                const caloriesElement = await driver.findElement(By.xpath("//div[contains(@class, 'nutrition-row')]//span[contains(text(), 'Calories')]/following-sibling::span"));
                if (caloriesElement) {
                    calories = await caloriesElement.getText();
                }
            } catch (err) {
                try {
                    const caloriesRow = await driver.findElement(By.css("div.calories-row"));
                    calories = await caloriesRow.getText();
                    calories = calories.replace("Calories", "").trim();
                } catch (innerErr) {
                    // Continue silently
                }
            }

            try {
                try {
                    const mainRows = await driver.findElements(By.css("div.nutrition-row:not(.indented)"));

                    for (const row of mainRows) {
                        try {
                            const labelElement = await row.findElement(By.css("div.nutrition-label span.bold"));
                            const valueElement = await row.findElement(By.css("div.nutrition-label span:not(.bold)"));

                            let dailyValue = "0%";
                            try {
                                const dailyValueElement = await row.findElement(By.css("div.daily-percent span"));
                                dailyValue = await dailyValueElement.getText();
                            } catch (dvErr) {
                                // Some nutrients don't have daily values
                            }

                            const label = await labelElement.getText();
                            const value = await valueElement.getText();

                            if (label && label.trim() !== "") {
                                nutrition[label] = {
                                    value: value,
                                    dailyValue: dailyValue,
                                    isSubcategory: false
                                };
                            }
                        } catch (rowErr) {
                            // Continue silently
                        }
                    }

                    const subRows = await driver.findElements(By.css("div.nutrition-row.indented, div.row-item.strong.indented"));

                    for (const row of subRows) {
                        try {
                            const labelElement = await row.findElement(By.css("div.nutrition-label span:first-of-type"));
                            const valueElement = await row.findElement(By.css("div.nutrition-label span:last-of-type"));

                            let dailyValue = "0%";
                            try {
                                const dailyValueElement = await row.findElement(By.css("div.daily-percent span"));
                                dailyValue = await dailyValueElement.getText();
                            } catch (dvErr) {
                                // Some nutrients don't have daily values
                            }

                            const label = await labelElement.getText();
                            const value = await valueElement.getText();

                            if (label && label.trim() !== "") {
                                nutrition[label] = {
                                    value: value,
                                    dailyValue: dailyValue,
                                    isSubcategory: true
                                };
                            }
                        } catch (rowErr) {
                            // Continue silently
                        }
                    }
                } catch (nutrientRowsErr) {
                    // Continue silently
                }

                if (!nutrition["Saturated Fat"]) {
                    try {
                        const satFatElement = await driver.findElement(By.xpath("//span[contains(text(), 'Saturated Fat')]"));
                        const satFatValueElement = await satFatElement.findElement(By.xpath("following-sibling::span"));
                        const satFatValue = await satFatValueElement.getText();

                        let satFatDailyValue = "0%";
                        try {
                            const satFatDailyValueElement = await driver.findElement(
                                By.xpath("//span[contains(text(), 'Saturated Fat')]/ancestor::div[contains(@class, 'nutrition-row')]//div[contains(@class, 'daily-percent')]/span")
                            );
                            satFatDailyValue = await satFatDailyValueElement.getText();
                        } catch (dvErr) {
                            // Continue silently
                        }

                        nutrition["Saturated Fat"] = {
                            value: satFatValue,
                            dailyValue: satFatDailyValue,
                            isSubcategory: true
                        };
                    } catch (satFatErr) {
                        // Continue silently
                    }
                }

                if (!nutrition["Dietary Fiber"]) {
                    try {
                        const fiberElement = await driver.findElement(By.xpath("//span[contains(text(), 'Dietary Fiber')]"));
                        const fiberValueElement = await fiberElement.findElement(By.xpath("following-sibling::span"));
                        const fiberValue = await fiberValueElement.getText();

                        let fiberDailyValue = "0%";
                        try {
                            const fiberDailyValueElement = await driver.findElement(
                                By.xpath("//span[contains(text(), 'Dietary Fiber')]/ancestor::div[contains(@class, 'nutrition-row')]//div[contains(@class, 'daily-percent')]/span")
                            );
                            fiberDailyValue = await fiberDailyValueElement.getText();
                        } catch (dvErr) {
                            // Continue silently
                        }

                        nutrition["Dietary Fiber"] = {
                            value: fiberValue,
                            dailyValue: fiberDailyValue,
                            isSubcategory: true
                        };
                    } catch (fiberErr) {
                        // Continue silently
                    }
                }

                const missingMainNutrients = !nutrition["Total Fat"] || !nutrition["Saturated Fat"] || !nutrition["Protein"];
                if (missingMainNutrients) {
                    try {
                        const allNutrientData = await driver.executeScript(`
                            const result = {};
                            document.querySelectorAll('div.nutrition-row, div.row-item.strong').forEach(row => {
                                try {
                                    const isSubcategory = row.classList.contains('indented');
                                    const label = row.querySelector('.nutrition-label span:first-of-type').textContent.trim();
                                    const value = row.querySelector('.nutrition-label span:last-of-type').textContent.trim();
                                    let dailyValue = "0%";
                                    
                                    const dailyValueEl = row.querySelector('.daily-percent span');
                                    if (dailyValueEl) {
                                        dailyValue = dailyValueEl.textContent.trim();
                                    }
                                    
                                    if (label && label !== "") {
                                        result[label] = {
                                            value: value,
                                            dailyValue: dailyValue,
                                            isSubcategory: isSubcategory
                                        };
                                    }
                                } catch (e) {
                                    // Skip this row if error
                                }
                            });
                            return result;
                        `);

                        for (const [label, data] of Object.entries(allNutrientData)) {
                            if (!nutrition[label] && label && label.trim() !== "") {
                                nutrition[label] = data;
                            }
                        }
                    } catch (jsError) {
                        // Continue silently
                    }
                }

                for (const key in nutrition) {
                    if (key.trim() === "") {
                        delete nutrition[key];
                    }
                }
            } catch (nutritionError) {
                // Continue silently
            }

            results.push({
                name,
                servingSize,
                calories,
                nutrition,
                dietaryInfo,
                ingredients
            });
        } catch (error) {
            console.error("Error scraping item:", error);
        }

        try {
            const nextButton = await driver.findElements(By.css("a.next"));

            if (nextButton.length > 0) {
                const isDisabled = await nextButton[0].getAttribute("class").then(classes =>
                    classes.includes("disabled")
                );

                if (!isDisabled) {
                    await nextButton[0].click();
                    console.log("Clicked Next button");
                    await driver.sleep(1000);
                } else {
                    hasNextItem = false;
                    console.log("Next button is disabled. Ending scrape.");

                    try {
                        const closeButton = await driver.findElement(By.css("a.modal-carousel-close"));
                        await closeButton.click();
                        console.log("Closed the modal using close button");
                    } catch (closeErr) {
                        try {
                            const altCloseButton = await driver.findElement(By.css("a[class*='close'], button[class*='close'], .close-button"));
                            await altCloseButton.click();
                            console.log("Closed the modal using alternative close button");
                        } catch (altCloseErr) {
                            try {
                                await driver.executeScript(`
                                    const closeElements = document.querySelectorAll("a[class*='close'], button[class*='close'], [aria-label='Close'], .close-button");
                                    if (closeElements.length > 0) {
                                        closeElements[0].click();
                                        return true;
                                    }
                                    
                                    const hrefCloseElements = document.querySelectorAll("a[href*='javascript:void']");
                                    if (hrefCloseElements.length > 0) {
                                        hrefCloseElements[0].click();
                                        return true;
                                    }
                                    
                                    return false;
                                `);
                                console.log("Attempted to close modal via JavaScript execution");
                            } catch (jsCloseErr) {
                                console.error("Could not close the modal:", jsCloseErr);
                            }
                        }
                    }
                }
            } else {
                hasNextItem = false;
                console.log("No Next button found. Ending scrape.");

                try {
                    const closeButton = await driver.findElement(By.css("a.modal-carousel-close"));
                    await closeButton.click();
                    console.log("Closed the modal using close button");
                } catch (closeErr) {
                    try {
                        const altCloseButton = await driver.findElement(By.css("a[class*='close'], button[class*='close'], .close-button"));
                        await altCloseButton.click();
                        console.log("Closed the modal using alternative close button");
                    } catch (altCloseErr) {
                        try {
                            await driver.executeScript(`
                                const closeElements = document.querySelectorAll("a[class*='close'], button[class*='close'], [aria-label='Close'], .close-button");
                                if (closeElements.length > 0) {
                                    closeElements[0].click();
                                    return true;
                                }
                                
                                const hrefCloseElements = document.querySelectorAll("a[href*='javascript:void']");
                                if (hrefCloseElements.length > 0) {
                                    hrefCloseElements[0].click();
                                    return true;
                                }
                                
                                return false;
                            `);
                            console.log("Attempted to close modal via JavaScript execution");
                        } catch (jsCloseErr) {
                            console.error("Could not close the modal:", jsCloseErr);
                        }
                    }
                }
            }
        } catch (navigationError) {
            console.error("Error navigating to next item:", navigationError);
            hasNextItem = false;

            try {
                const closeButton = await driver.findElement(By.css("a[class*='close']"));
                await closeButton.click();
                console.log("Closed the modal after error");
            } catch (finalCloseErr) {
                console.error("Could not close the modal after error");
            }
        }
    }

    console.log(`Finished scraping a total of ${itemCount} items.`);

    console.log("Sleeping for a few seconds to let you confirm the scraping completed...");
    await driver.sleep(5000);
    console.log("Sleep complete, returning results.");

    // Clean up dietary information arrays to remove duplicates and empty strings
    const cleanedResults = results.map(item => {
        // Make a copy of the item to avoid modifying the original
        const cleanedItem = { ...item };

        // Clean allergens array
        if (cleanedItem.dietaryInfo && cleanedItem.dietaryInfo.allergens) {
            cleanedItem.dietaryInfo.allergens = [...new Set(
                cleanedItem.dietaryInfo.allergens.filter(allergen => allergen && allergen.trim() !== "")
            )];
        }

        // Clean dietary array
        if (cleanedItem.dietaryInfo && cleanedItem.dietaryInfo.dietary) {
            cleanedItem.dietaryInfo.dietary = [...new Set(
                cleanedItem.dietaryInfo.dietary.filter(diet => diet && diet.trim() !== "")
            )];
        }

        return cleanedItem;
    });

    return cleanedResults;
}

startScraper().then(results => {
    console.log("Scraping completed");
    if (results.length > 0) {
        console.log(`Successfully scraped ${results.length} items`);

        // Save to database
        console.log("Saving scraped data to database...");

        // Create options for the API request
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
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
    } else {
        console.log("No items scraped");
    }
});
