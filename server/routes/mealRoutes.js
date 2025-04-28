import { Router } from 'express';
import { insertScrapedMeals } from '../controllers/mealCont.js';

const router = Router();

/**
 * POST /meals/scrape
 * Inserts scraped meal data into the database
 * Body: Array of scraped meal objects
 */
router.post('/scrape', async (req, res) => {
    try {
        const scrapedData = req.body;

        if (!Array.isArray(scrapedData)) {
            return res.status(400).json({
                error: 'Invalid data format. Expected an array of meal objects.'
            });
        }

        const results = await insertScrapedMeals(scrapedData);
        return res.status(200).json(results);
    } catch (error) {
        console.error('Error handling scraped meal data:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
