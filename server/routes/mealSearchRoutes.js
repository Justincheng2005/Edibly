import { Router } from "express";
import { getSearchedMeals } from "../controllers/mealSearchCont.js";

const router = Router();

router.get('/', async(req, res) => {
    try{
        const {mealQuery} = req.query;
        if(!mealQuery){return res.status(400).json({error: 'Search query is missing'})};
        const results = await getSearchedMeals(mealQuery);
        res.json({results});
    }catch(error){
        res.status(500).json({error: error.message});
    }
});

export default router;