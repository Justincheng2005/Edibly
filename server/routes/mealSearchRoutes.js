import { Router } from "express";
import { getSearchedMeals } from "../controllers/mealSearchCont";

const router = express.Router();

router.get('/', async(req, res) => {
    try{
        const {mealQuery} = req.query;
        if(!mealQuery){return res.status(400).json({error: 'Search query is missing'})};
        const mealResults = await getSearchedMeals(mealQuery);
        res.json({mealResults});
    }catch(error){
        res.status(500).json({error: error.message});
    }
});

export default router;