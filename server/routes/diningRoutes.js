import { Router } from 'express';
import {
    getAllDiningLocations,
    getDiningLocationsByCollege
} from '../controllers/diningCont.js';


const router = Router();

router.get('/', getAllDiningLocations);
router.get('/school/:college', getDiningLocationsByCollege);

export default router;