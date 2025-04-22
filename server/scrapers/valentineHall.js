import { Builder, By, until } from 'selenium-webdriver';

async function startScraper() {
    // Launch Chrome browser
    let driver = await new Builder().forBrowser('chrome').build();
    let allResults = [];

    try {
        // Open the Valentine Hall menu page
        await driver.get('https://amherst.nutrislice.com/menu/valentine-hall');
        console.log("Opened Valentine Hall");
        //give consent
        const viewMenus = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(text(), 'View Menus')]")),
            10000
        );
        await viewMenus.click();
        console.log("Clicked View Menus");

        // Define all the meal types to scrape in order
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

        // Scrape each meal type in sequence
        for (const mealType of mealTypes) {
            console.log(`\n=== STARTING ${mealType.name.toUpperCase()} MENU SCRAPING ===`);

            try {
                // First close any open modals/popups if needed
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

                // Click on the meal type
                try {
                    const mealTypeLink = await driver.wait(
                        until.elementLocated(By.xpath(mealType.xpath)),
                        10000
                    );
                    await mealTypeLink.click();
                    console.log(`Clicked on ${mealType.name}`);
                    await driver.sleep(2000); // Wait for menu to load

                    // Check if there are food items available
                    const foodItems = await driver.findElements(By.css("a.food-link"));

                    if (foodItems.length > 0) {
                        // Scrape the meal items
                        const items = await scraperInfo(driver);
                        console.log(`Scraped ${items.length} ${mealType.name} items`);

                        // Add meal type to the results
                        const typedResults = items.map(item => ({
                            ...item,
                            mealType: mealType.name
                        }));

                        // Add to the overall results
                        allResults = [...allResults, ...typedResults];
                    } else {
                        // Additional check - sometimes there are foods but they're in a different format
                        try {
                            // Look for other possible food item selectors
                            const alternativeFoodItems = await driver.findElements(
                                By.css(".food-item, .menu-item, .station-item-wrapper, [data-food-id]")
                            );

                            if (alternativeFoodItems.length > 0) {
                                console.log(`Found ${alternativeFoodItems.length} alternative food items for ${mealType.name}`);

                                // Try to click on the first alternative item
                                await alternativeFoodItems[0].click();
                                console.log(`Clicked on alternative food item for ${mealType.name}`);
                                await driver.sleep(1000);

                                // Now continue with regular scraping
                                const items = await scraperInfo(driver);
                                console.log(`Scraped ${items.length} ${mealType.name} items using alternative approach`);

                                // Add meal type to the results
                                const typedResults = items.map(item => ({
                                    ...item,
                                    mealType: mealType.name
                                }));

                                // Add to the overall results
                                allResults = [...allResults, ...typedResults];
                            } else {
                                // Try one more approach - look for any clickable element that might lead to food items
                                try {
                                    // Check if there's a message on the page indicating no items
                                    const noItemsMessage = await driver.executeScript(`
                                        const noItemsEl = document.querySelector('.no-items, .empty-menu, .no-results');
                                        return noItemsEl ? noItemsEl.textContent.trim() : null;
                                    `);

                                    if (noItemsMessage) {
                                        console.log(`No items available for ${mealType.name}: "${noItemsMessage}"`);
                                    } else {
                                        console.log(`No standard food items found for ${mealType.name}, but no explicit 'no items' message either`);
                                    }

                                    // Add a placeholder entry so we know this section was checked
                                    allResults.push({
                                        name: "No Items Available",
                                        servingSize: "N/A",
                                        calories: "N/A",
                                        nutrition: {},
                                        dietaryInfo: { allergens: [], dietary: [] },
                                        ingredients: "N/A",
                                        mealType: mealType.name,
                                        isPlaceholder: true
                                    });

                                } catch (finalCheckErr) {
                                    console.log(`No food items found for ${mealType.name} after all checks`);
                                }
                            }
                        } catch (alternativeErr) {
                            console.log(`No food items found for ${mealType.name}`);

                            // Add a placeholder entry so we know this section was checked
                            allResults.push({
                                name: "No Items Available",
                                servingSize: "N/A",
                                calories: "N/A",
                                nutrition: {},
                                dietaryInfo: { allergens: [], dietary: [] },
                                ingredients: "N/A",
                                mealType: mealType.name,
                                isPlaceholder: true
                            });
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
        await driver.quit(); // Close the browser
    }
}

//code for scrapping info
async function scraperInfo(driver) {
    const results = [];

    try {
        //click first food item
        const firstTile = await driver.wait(
            until.elementLocated(By.css("a.food-link")),
            10000
        );
        await firstTile.click();
    } catch (noFoodItemsError) {
        console.log("No food items found to scrape");
        return results;
    }

    // Wait for a moment to make sure popup loads
    await driver.sleep(1000);

    let hasNextItem = true;
    let itemCount = 0;

    while (hasNextItem) {
        try {
            // Get the food name with multiple fallback approaches
            let name = "Unknown Item";

            try {
                // First approach: direct h3.name element
                const nameElement = await driver.findElement(By.css("h3.name"));
                name = await nameElement.getText();

                // If name is empty, try an alternative selector
                if (!name || name.trim() === "") {
                    throw new Error("Empty name, trying alternative approach");
                }
            } catch (nameErr) {
                try {
                    // Second approach: try getting from the modal title or header
                    const modalTitle = await driver.findElement(By.css(".modal-header h3, .popup-header h3, [role='dialog'] h3"));
                    name = await modalTitle.getText();

                    if (!name || name.trim() === "") {
                        throw new Error("Empty name from modal title");
                    }
                } catch (modalTitleErr) {
                    try {
                        // Third approach: try JavaScript execution to get the name
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

            // Take a screenshot of the modal for debugging purposes if name could not be determined
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

            // Get ingredients information
            let ingredients = "Not available";
            try {
                // Look for the ingredients section with h4 heading and then the p.ingredients content
                const ingredientsHeading = await driver.findElements(By.xpath("//h4[contains(text(), 'Ingredients')]"));
                if (ingredientsHeading.length > 0) {
                    // Find the ingredients paragraph that follows the heading
                    const ingredientsElem = await driver.findElement(By.css("p.ingredients"));
                    ingredients = await ingredientsElem.getText();
                }
            } catch (err) {
                // Try an alternative approach if the first one fails
                try {
                    const ingredientsSpan = await driver.findElement(By.css("p.ingredients span"));
                    ingredients = await ingredientsSpan.getText();
                } catch (e) {
                    // Silently continue
                }
            }

            // Get dietary info and allergens
            const dietaryInfo = {
                allergens: [],
                dietary: []
            };

            try {
                // Get all li elements with tooltip attributes (dietary icons)
                const dietaryIcons = await driver.findElements(
                    By.css("li[title]")
                );

                for (const icon of dietaryIcons) {
                    const tooltipText = await icon.getAttribute("title");

                    // Categorize based on content
                    if (tooltipText.includes("contains")) {
                        dietaryInfo.allergens.push(tooltipText);
                    } else {
                        dietaryInfo.dietary.push(tooltipText);
                    }
                }

                // Also look for vegetarian/vegan labels specifically
                const vegLabels = await driver.findElements(
                    By.css("div[labelledby]")
                );

                for (const label of vegLabels) {
                    const labelType = await label.getAttribute("labelledby");
                    if (labelType) {
                        // Get the actual text
                        const labelText = await driver.findElement(
                            By.css(`#${labelType}`)
                        ).getText();
                        dietaryInfo.dietary.push(labelText);
                    }
                }

            } catch (err) {
                // Silently continue
            }

            // Initialize nutrition variables
            let nutrition = {};
            let servingSize = "Not available";
            let calories = "Not available";

            // Try to get serving size
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
                    // Silently continue
                }
            }

            // Try to get calories
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
                    // Silently continue
                }
            }

            try {
                // MAIN NUTRIENTS (like Total Fat)
                try {
                    const mainRows = await driver.findElements(By.css("div.nutrition-row:not(.indented)"));

                    for (const row of mainRows) {
                        try {
                            // Get the label and value
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

                            // Only add if label is not empty
                            if (label && label.trim() !== "") {
                                nutrition[label] = {
                                    value: value,
                                    dailyValue: dailyValue,
                                    isSubcategory: false
                                };
                            }
                        } catch (rowErr) {
                            // Silently continue
                        }
                    }

                    // SUBCATEGORIES (like Saturated Fat)
                    const subRows = await driver.findElements(By.css("div.nutrition-row.indented, div.row-item.strong.indented"));

                    for (const row of subRows) {
                        try {
                            // Get the label and value
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

                            // Only add if label is not empty
                            if (label && label.trim() !== "") {
                                nutrition[label] = {
                                    value: value,
                                    dailyValue: dailyValue,
                                    isSubcategory: true
                                };
                            }
                        } catch (rowErr) {
                            // Silently continue
                        }
                    }
                } catch (nutrientRowsErr) {
                    // Silently continue
                }

                // Try an alternative approach specifically for Saturated Fat
                if (!nutrition["Saturated Fat"]) {
                    try {
                        const satFatElement = await driver.findElement(By.xpath("//span[contains(text(), 'Saturated Fat')]"));
                        const satFatValueElement = await satFatElement.findElement(By.xpath("following-sibling::span"));
                        const satFatValue = await satFatValueElement.getText();

                        let satFatDailyValue = "0%";
                        try {
                            // Find the daily value in the sibling div
                            const satFatDailyValueElement = await driver.findElement(
                                By.xpath("//span[contains(text(), 'Saturated Fat')]/ancestor::div[contains(@class, 'nutrition-row')]//div[contains(@class, 'daily-percent')]/span")
                            );
                            satFatDailyValue = await satFatDailyValueElement.getText();
                        } catch (dvErr) {
                            // Silently continue
                        }

                        nutrition["Saturated Fat"] = {
                            value: satFatValue,
                            dailyValue: satFatDailyValue,
                            isSubcategory: true
                        };
                    } catch (satFatErr) {
                        // Silently continue
                    }
                }

                // Try an alternative approach specifically for Dietary Fiber
                if (!nutrition["Dietary Fiber"]) {
                    try {
                        const fiberElement = await driver.findElement(By.xpath("//span[contains(text(), 'Dietary Fiber')]"));
                        const fiberValueElement = await fiberElement.findElement(By.xpath("following-sibling::span"));
                        const fiberValue = await fiberValueElement.getText();

                        let fiberDailyValue = "0%";
                        try {
                            // Find the daily value in the sibling div
                            const fiberDailyValueElement = await driver.findElement(
                                By.xpath("//span[contains(text(), 'Dietary Fiber')]/ancestor::div[contains(@class, 'nutrition-row')]//div[contains(@class, 'daily-percent')]/span")
                            );
                            fiberDailyValue = await fiberDailyValueElement.getText();
                        } catch (dvErr) {
                            // Silently continue
                        }

                        nutrition["Dietary Fiber"] = {
                            value: fiberValue,
                            dailyValue: fiberDailyValue,
                            isSubcategory: true
                        };
                    } catch (fiberErr) {
                        // Silently continue
                    }
                }

                // If we still don't have key nutrients, try using JavaScript execution
                const missingMainNutrients = !nutrition["Total Fat"] || !nutrition["Saturated Fat"] || !nutrition["Protein"];
                if (missingMainNutrients) {
                    try {
                        // Get all nutrition rows with JavaScript
                        const allNutrientData = await driver.executeScript(`
                            const result = {};
                            // Main nutrients
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
                                    
                                    // Only add if label is not empty
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

                        // Add any missing nutrients to our results
                        for (const [label, data] of Object.entries(allNutrientData)) {
                            if (!nutrition[label] && label && label.trim() !== "") {
                                nutrition[label] = data;
                            }
                        }
                    } catch (jsError) {
                        // Silently continue
                    }
                }

                // Remove any empty keys that might have been added
                for (const key in nutrition) {
                    if (key.trim() === "") {
                        delete nutrition[key];
                    }
                }
            } catch (nutritionError) {
                // Silently continue
            }

            // Save this item with all information
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

        // Try to navigate to the next item
        try {
            // Find the next button using the class shown in the HTML
            const nextButton = await driver.findElements(By.css("a.next"));

            if (nextButton.length > 0) {
                // Before clicking, check if the button is enabled (not disabled)
                const isDisabled = await nextButton[0].getAttribute("class").then(classes =>
                    classes.includes("disabled")
                );

                if (!isDisabled) {
                    // Click the next button
                    await nextButton[0].click();
                    console.log("Clicked Next button");

                    // Wait for the next item to load
                    await driver.sleep(1000);
                } else {
                    // Next button is disabled, so we're done
                    hasNextItem = false;
                    console.log("Next button is disabled. Ending scrape.");

                    // Close the modal by clicking the close button
                    try {
                        // Try to find the close button using the class from the HTML
                        const closeButton = await driver.findElement(By.css("a.modal-carousel-close"));
                        await closeButton.click();
                        console.log("Closed the modal using close button");
                    } catch (closeErr) {
                        // Try alternative selectors if the first one doesn't work
                        try {
                            const altCloseButton = await driver.findElement(By.css("a[class*='close'], button[class*='close'], .close-button"));
                            await altCloseButton.click();
                            console.log("Closed the modal using alternative close button");
                        } catch (altCloseErr) {
                            // As a last resort, try using JavaScript to click the close button
                            try {
                                await driver.executeScript(`
                                    // Try to find any close buttons by common attributes
                                    const closeElements = document.querySelectorAll("a[class*='close'], button[class*='close'], [aria-label='Close'], .close-button");
                                    if (closeElements.length > 0) {
                                        closeElements[0].click();
                                        return true;
                                    }
                                    
                                    // If that doesn't work, try to find by href containing "void"
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
                // If we can't find the next button at all
                hasNextItem = false;
                console.log("No Next button found. Ending scrape.");

                // Close the modal by clicking the close button
                try {
                    // Try to find the close button using the class from the HTML
                    const closeButton = await driver.findElement(By.css("a.modal-carousel-close"));
                    await closeButton.click();
                    console.log("Closed the modal using close button");
                } catch (closeErr) {
                    // Try alternative selectors if the first one doesn't work
                    try {
                        const altCloseButton = await driver.findElement(By.css("a[class*='close'], button[class*='close'], .close-button"));
                        await altCloseButton.click();
                        console.log("Closed the modal using alternative close button");
                    } catch (altCloseErr) {
                        // As a last resort, try using JavaScript to click the close button
                        try {
                            await driver.executeScript(`
                                // Try to find any close buttons by common attributes
                                const closeElements = document.querySelectorAll("a[class*='close'], button[class*='close'], [aria-label='Close'], .close-button");
                                if (closeElements.length > 0) {
                                    closeElements[0].click();
                                    return true;
                                }
                                
                                // If that doesn't work, try to find by href containing "void"
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
            hasNextItem = false; // Stop the loop if we encounter an error

            // Still try to close the modal
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

    // Add a sleep at the end to confirm everything worked
    console.log("Sleeping for a few seconds to let you confirm the scraping completed...");
    await driver.sleep(5000);
    console.log("Sleep complete, returning results.");

    return results;
}

// Start the scraper and export the results
startScraper().then(results => {
    console.log("Scraping completed");
    if (results.length > 0) {
        console.log(`Successfully scraped ${results.length} items`);
        // Log all the scraped data
        console.log("Scraped Data:");
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log("No items scraped");
    }
});
