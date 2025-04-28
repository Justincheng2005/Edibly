import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// const nutritionalField = {
//     value: String,
//     dailyValue: String,
//     isSubcategory: Boolean,
// }

// const foodItem = {
//     name: String,
//     description: String,
//     ingredients: String,
//     macros: {
//         servingCount:  Number,
//         servingSize: Number,
//         calories: Number,
//         totalFat: nutritionalField,
//         saturatedFat: nutritionalField,
//         transFat: nutritionalField,
//         cholesterol: nutritionalField,
//         sodium: nutritionalField,
//         totalCarbohydrates: nutritionalField,
//         dietaryFiber: nutritionalField,
//         sugars: nutritionalField,
//         protein: nutritionalField,
//     },
//     allergens: Array,
//     dietaryPreferences: Array,
// }

async function startScraper() {
    let allResults = {
        // date: "", maybe add in future if we want to store future days
        Breakfast: [],
        Lunch: [],
        Dinner: [],
    };
    //Chrome options
    // let options = new chrome.Options();
    // options.addArguments('--headless');

    let driver = await new Builder()
        .forBrowser('chrome')
        // .setChromeOptions(options)
        .build();

    try {
        const url = "https://menu.mtholyoke.edu/location.aspx"
        await driver.get(url);
        
        // const viewMenus = await driver.wait(
        //     until.elementLocated(By.xpath, "//a[contains(@href, 'station.aspx')]"),
        //     10000
        // );

        const Stations = [
            { name: "Classics", xpath: "//a[contains(@href, 'Classics')]" },
            { name: "Grill", xpath: "//a[contains(@href, 'Grill')]" },
            { name: "Global", xpath: "//a[contains(@href, 'Global')]" },
            { name: "Made to Order Breakfast", xpath: "//a[contains(@href, 'Made+to+Order+Breakfast')]" },
            { name: "Made to Order", xpath: "//a[contains(@href, 'Made+to+Order&')]" },
            { name: "Wok", xpath: "//a[contains(@href, 'Wok')]" },
            { name: "Baraka -Halal", xpath: "//a[contains(@href, 'Baraka')]" },
            { name: "Harvest/Deserts", xpath: "//a[contains(@href, 'Harvest')]" },
            { name: "L'Chaim -Kosher", xpath: "//a[contains(@href, 'L'Chaim')]" }
        ];

        for (const station of Stations) {
            console.log(`\n STARTING ${station.name.toUpperCase()} MENU SCRAPING`);

            console.log(driver.getCurrentUrl());
            try{
                const stationElement = await driver.wait(
                    until.elementLocated(By.xpath(station.xpath)),
                    10000
                );
                await stationElement.click();
                await driver.sleep(2000); 

                const foodItemUrls = {};

                const meals = ['Breakfast', 'Lunch', 'Dinner'];

                for (const meal of meals) {
                    const tabButton = await driver.findElement(By.xpath(`//a[@href='#${meal}']`));
                    const isActive = await tabButton.findElement(By.xpath('.//h6[contains(@class, "tab-hours")]')).getText();
                    if (isActive !== "Closed") {
                        await tabButton.click();
                        await driver.sleep(2000);


                        const mealDiv = await driver.findElement(By.xpath(`//div[@id='${meal}' and contains(@class, 'active')]`));
                        
                        // Find all food items (links that start with 'label')
                        const foodItems = await mealDiv.findElements(By.xpath(".//a[starts-with(@href, 'label')]"));

                        const foods = [];
                        
                        for (const foodItem of foodItems) {
                            const name = await foodItem.getText();
                            const url = await foodItem.getAttribute('href');
                        
                            foods.push({
                            name: name.trim(),
                            url: url.trim()
                            });
                        }
                        
                        foodItemUrls[meal] = foods;
                    }
                    else {
                        console.log(`${meal} is closed`);
                        foodItemUrls[meal] = [];
                    }
                }  
                try{
                    const items = await scrapeFoodItems(driver, foodItemUrls);
                    for (const meal in items) {
                        allResults[meal].push(...items[meal]);
                    }
                } catch (error) {
                    console.error("Error scraping food items:", error);
                }

                // Print the results for the current station
                console.log("All Results:", JSON.stringify(allResults, null, 2));
                
                // Go back to the station page
                await driver.get("https://menu.mtholyoke.edu/location.aspx");
                await driver.sleep(2000);

            } catch (error) {
                console.error("Error:", error);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        return results;
    } finally {
        await driver.quit();
    }
}



async function scrapeFoodItems(driver, foodItemUrls) {
    // This function will scrape the food items from the page
    let results = {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
    };
    for ( const meal in foodItemUrls) {
        for ( const foodItem of foodItemUrls[meal]) {
            await driver.get(foodItem.url);
            await driver.sleep(2000);
            try {
                const foodItemName = foodItem.name;
                console.log("Scraping Food Item:", foodItemName);
    
                //scrape ingredients
                const description = ""; //no description for Mount Holyoke
                const ingredients = await driver.findElement(By.xpath("//span[@class='labelingredientsvalue']")).getText();
                
                // Scrape macros 
                const macros = {};
    
                macros.servingSize = await driver.findElement(By.xpath("//td[@class='nutfactsservsize']/following-sibling::td")).getText();
                macros.calories = await driver.findElement(By.xpath("//td[@class='nutfactscaloriesval'] ")).getText();
                try{
                    // Find all left <td> elements (nutrient names + amounts)
                    const leftTds = await driver.findElements(By.xpath("//td[@align='left']/span[@class='nutfactstopnutrient']"));
    
                    for (let i = 0; i < leftTds.length; i++) {
                        try {
                            const leftSpan = leftTds[i];
    
                            const fullText = await leftSpan.getText();
    
                            // Clean the text and split into parts
                            const cleanedText = fullText.replace(/\s+/g, ' ').trim();
                            const lastSpaceIndex = cleanedText.lastIndexOf(' ');
    
                            let label = "";
                            let amount = "";
    
                            if (lastSpaceIndex !== -1) {
                            label = cleanedText.substring(0, lastSpaceIndex).trim();
                            amount = cleanedText.substring(lastSpaceIndex + 1).trim();
                            }
    
                            // Find the daily value
                            const rightTd = await driver.findElement(By.xpath(`(//td[@align='right']/span[@class='nutfactstopnutrient'])[${i+1}]`));
                            let dailyValue = await rightTd.getText();
    
                            // Save into the macros object
                            macros[label] = {
                                amount: amount || "",
                                dailyValue: dailyValue || ""
                            };
    
                        } catch (error) {
                            console.error("Error scraping nutrient:", error);
                        }
                    }
                } catch (error) {
                    console.error("Error scraping macros:", error);
                }
    
                //scrape allergens
                let allergens = [];
                try {
                    const allergensText = await driver.findElement(By.xpath("//span[class='labelallergensvalue']")).getText();
                    if (allergensText === "") {
                        console.log("No allergens found");
                    }
                    else{
                        allergens = allergensText.split(",").map(allergen => allergen.trim());
                    }
                } catch (error) {
                    if (error.name !== 'NoSuchElementError') {
                        console.error("Error getting allergens preferences:", error);
                    }
                }
    
                //scrape dietary preferences
                let dietaryPreferences = [];
                try {
                    const spanElement = await driver.findElement(By.xpath("//span[class='labelwebcodesvalue']"));
                    const imgElements = await spanElement.findElements(By.css('img'));
    
                    for ( let img of imgElements) {
                        dietaryPreferences.push(await img.getAttribute('alt'));
                    }
                } catch (error) {
                    if (error.name !== 'NoSuchElementError') {
                        console.error("Error getting dietary preferences:", error);
                    }
                }
                
                results[meal].push({
                    name: foodItemName,
                    description,
                    ingredients,
                    macros,
                    allergens,
                    dietaryPreferences
                });
    
            } catch (error) {
                console.error("Error accessing food item:", error);
            }
        }
    }
    
    return results;
}

startScraper().then(results => {
    console.log("Scraping completed");
    if (results.length > 0) {
        console.log(`Successfully scraped ${results.length} items`);
        console.log("Scraped Data:");
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log("No items scraped");
    }
});