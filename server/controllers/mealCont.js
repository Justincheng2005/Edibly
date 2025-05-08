import supabase from '../db/supabaseClient.js';

/**
 * Inserts scraped meal data into the database
 * @param {Array} scrapedData - Array of food items from the scraper
 * @returns {Promise} - Promise that resolves with the results
 */
export const insertScrapedMeals = async (scrapedData) => {
    console.log(`Processing ${scrapedData.length} scraped meal items`);
    const results = {
        success: 0,
        errors: 0,
        details: []
    };

    // Process each food item
    for (const foodItem of scrapedData) {
        try {
            // 1. Get dining location ID
            const diningName = foodItem.diningHall;
            let { data: diningLocation, error: diningError } = await supabase
                .from('dininglocations')
                .select('diningid')
                .eq('name', diningName)
                .maybeSingle();

            if (diningError) throw new Error(`Dining location error: ${diningError.message}`);

            if (!diningLocation) {
                console.log(`Dining location "${diningName}" not found, skipping meal: ${foodItem.name}`);
                results.errors++;
                results.details.push({
                    meal: foodItem.name,
                    error: `Dining location "${diningName}" not found`
                });
                continue;
            }

            // 2. Insert or update meal
            const mealData = {
                name: foodItem.name,
                diningid: diningLocation.diningid,
                description: foodItem.description || '',
                ingredients: foodItem.nutritionInfo.ingredients || '',
                // Store nutrition info as JSON in macros field
                macros: JSON.stringify({
                    "Serving Size": foodItem.nutritionInfo.servingSize,
                    Calories: foodItem.nutritionInfo.calories,
                    "Total Fat": foodItem.nutritionInfo.totalFat,
                    "Saturated Fat": foodItem.nutritionInfo.saturatedFat || '',
                    "Tran Fat": foodItem.nutritionInfo.transFat || '',
                    Cholesterol: foodItem.nutritionInfo.cholesterol || '',
                    "Total Carbohydrates": foodItem.nutritionInfo.carbs,
                    "Dietary Fiber": foodItem.nutritionInfo.fiber,
                    "Total Sugars": foodItem.nutritionInfo.sugars,
                    "Added Sugars": foodItem.nutritionInfo.addedSugars || '',
                    Protein: foodItem.nutritionInfo.protein,
                    Sodium: foodItem.nutritionInfo.sodium,
                })
            };

            // Upsert the meal (insert if not exists, update if exists)
            const { data: meal, error: mealError } = await supabase
                .from('meals')
                .upsert(mealData, {
                    returning: 'minimal'
                });

            if (mealError) throw new Error(`Meal insert error: ${mealError.message}`);

            // 3. Process dietary restrictions (allergens and preferences)
            if (foodItem.dietaryRestrictions && foodItem.dietaryRestrictions.length > 0) {
                await processDietaryRestrictions(foodItem.name, diningLocation.diningid, foodItem.dietaryRestrictions);
            }

            results.success++;
        } catch (error) {
            console.error(`Error processing meal "${foodItem.name}":`, error.message);
            results.errors++;
            results.details.push({
                meal: foodItem.name,
                error: error.message
            });
        }
    }

    console.log(`Processed ${scrapedData.length} items: ${results.success} successful, ${results.errors} errors`);
    return results;
};

/**
 * Process dietary restrictions (allergens and preferences)
 * @param {string} mealName - Name of the meal
 * @param {number} diningId - ID of the dining location
 * @param {Array} restrictions - Array of dietary restriction strings
 */
async function processDietaryRestrictions(mealName, diningId, restrictions) {
    // Get meal ID first
    const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('mealid')
        .eq('name', mealName)
        .eq('diningid', diningId)
        .maybeSingle();

    if (mealError || !mealData) {
        console.error(`Could not find mealid for "${mealName}": ${mealError?.message || 'Not found'}`);
        return;
    }

    const mealId = mealData.mealid;

    // Map of restriction strings to their type (allergy or preference)
    const ValentineRestrictionMap = {
        'Contains Eggs': { type: 'allergy', name: 'Eggs' },
        'Contains Milk': { type: 'allergy', name: 'Milk' },
        'Contains Soy': { type: 'allergy', name: 'Soy' },
        'Contains Wheat': { type: 'allergy', name: 'Wheat' },
        'Contains Gluten': { type: 'allergy', name: 'Gluten' },
        'Contains Fish': { type: 'allergy', name: 'Fish' },
        'Contains Shellfish': { type: 'allergy', name: 'Shellfish' },
        'Contains Tree Nuts': { type: 'allergy', name: 'Tree Nuts' },
        'Contains Peanuts': { type: 'allergy', name: 'Peanuts' },
        'Contains Corn': { type: 'allergy', name: 'Corn' },
        'Contains Sesame': { type: 'allergy', name: 'Sesame' },
        'Vegan': { type: 'preference', name: 'Vegan' },
        'Vegetarian': { type: 'preference', name: 'Vegetarian' },
        'Halal': { type: 'preference', name: 'Halal' },
        'Local': { type: 'preference', name: 'Local' },
        'Whole Grain': { type: 'preference', name: 'Whole Grain' }
    };
    const mtHolyokeMap = {
        'Eggs': { type: 'allergy', name: 'Eggs' },
        'Milk': { type: 'allergy', name: 'Milk' },
        'Soy': { type: 'allergy', name: 'Soy' },
        'Wheat': { type: 'allergy', name: 'Wheat' },
        'Gluten': { type: 'allergy', name: 'Gluten' },
        'Fish': { type: 'allergy', name: 'Fish' },
        'Shellfish': { type: 'allergy', name: 'Shellfish' },
        'Tree/Nuts': { type: 'allergy', name: 'Tree Nuts' },
        'Peanuts': { type: 'allergy', name: 'Peanuts' },
        'Corn': { type: 'allergy', name: 'Corn' },
        'Sesame': { type: 'allergy', name: 'Sesame' },
        'Vegan': { type: 'preference', name: 'Vegan' },
        'Vegetarian': { type: 'preference', name: 'Vegetarian' },
        'Halal': { type: 'preference', name: 'Halal' },
        'Local': { type: 'preference', name: 'Local' },
        'Whole Grain': { type: 'preference', name: 'Whole Grain' }
    };

    for (const restriction of restrictions) {
        let mappedRestriction = ValentineRestrictionMap[restriction];
        if (diningId === 6) {
            mappedRestriction = mtHolyokeMap[restriction];
        }
        else{
            mappedRestriction = ValentineRestrictionMap[restriction];
        }

        // Skip if we don't recognize this restriction
        if (!mappedRestriction) {
            console.log(`Unknown dietary restriction: "${restriction}"`);
            continue;
        }

        if (mappedRestriction.type === 'allergy') {
            await processAllergy(mealId, mappedRestriction.name);
        } else if (mappedRestriction.type === 'preference') {
            await processPreference(mealId, mappedRestriction.name);
        }
    }
}

/**
 * Process an allergy for a meal
 * @param {number} mealId - ID of the meal
 * @param {string} allergyName - Name of the allergy
 */
async function processAllergy(mealId, allergyName) {
    try {
        // Get allergy ID
        const { data: allergyData, error: allergyError } = await supabase
            .from('allergies')
            .select('allergyid')
            .eq('allergyname', allergyName)
            .maybeSingle();

        if (allergyError) throw new Error(`Allergy lookup error: ${allergyError.message}`);

        if (!allergyData) {
            console.log(`Allergy "${allergyName}" not found in database, skipping`);
            return;
        }

        // Link meal and allergy
        const { error: linkError } = await supabase
            .from('mealallergies')
            .upsert({
                mealid: mealId,
                allergyid: allergyData.allergyid
            }, {
                returning: 'minimal'
            });

        if (linkError) throw new Error(`Meal-allergy link error: ${linkError.message}`);
    } catch (error) {
        console.error(`Error processing allergy "${allergyName}" for meal ${mealId}:`, error.message);
    }
}

/**
 * Process a preference for a meal
 * @param {number} mealId - ID of the meal
 * @param {string} preferenceName - Name of the preference
 */
async function processPreference(mealId, preferenceName) {
    try {
        // Get preference ID
        const { data: preferenceData, error: preferenceError } = await supabase
            .from('preferences')
            .select('preferenceid')
            .eq('preferencename', preferenceName)
            .maybeSingle();

        if (preferenceError) throw new Error(`Preference lookup error: ${preferenceError.message}`);

        if (!preferenceData) {
            console.log(`Preference "${preferenceName}" not found in database, skipping`);
            return;
        }

        // Link meal and preference
        const { error: linkError } = await supabase
            .from('mealpreferences')
            .upsert({
                mealid: mealId,
                preferenceid: preferenceData.preferenceid
            }, {
                returning: 'minimal'
            });

        if (linkError) throw new Error(`Meal-preference link error: ${linkError.message}`);
    } catch (error) {
        console.error(`Error processing preference "${preferenceName}" for meal ${mealId}:`, error.message);
    }
}

/**
 * Get all meals for a specific dining hall
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getMealsByDiningHallId = async (req, res) => {
    try {
        const { diningId } = req.params;

        // Convert to integer to ensure proper comparison
        const diningHallId = parseInt(diningId, 10);

        if (isNaN(diningHallId)) {
            return res.status(400).json({ error: 'Invalid dining hall ID format' });
        }

        // Get meals for this dining hall
        const { data: meals, error } = await supabase
            .from('meals')
            .select('*')
            .eq('diningid', diningHallId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(meals);
    } catch (err) {
        console.error('Error getting meals by dining hall ID:', err);
        return res.status(500).json({ error: err.message });
    }
};
