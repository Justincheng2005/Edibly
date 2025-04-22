import { Builder, By, until } from 'selenium-webdriver';

async function startScraper() {
    // Launch Chrome browser
    let driver = await new Builder().forBrowser('chrome').build();

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

        const breakfast = await driver.wait(
            until.elementLocated(By.xpath("//strong[text()='Breakfast']/ancestor::a")),
            10000
        );
        await breakfast.click();
        console.log("Clicked on Breakfast");

        // Scrape the information
        const menuItems = await scraperInfo(driver);
        console.log(`Scraped ${menuItems.length} menu items`);

        return menuItems;
    } catch (error) {
        console.error("Error:", error);
        return [];
    } finally {
        await driver.quit(); // Close the browser
    }
}

//code for scrapping info
async function scraperInfo(driver) {
    const results = [];

    //click first food item
    const firstTile = await driver.wait(
        until.elementLocated(By.css("a.food-link")),
        10000
    );
    await firstTile.click();

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
                }
            } else {
                // If we can't find the next button at all
                hasNextItem = false;
                console.log("No Next button found. Ending scrape.");
            }
        } catch (navigationError) {
            console.error("Error navigating to next item:", navigationError);
            hasNextItem = false; // Stop the loop if we encounter an error
        }
    }

    console.log(`Finished scraping a total of ${itemCount} items.`);
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
