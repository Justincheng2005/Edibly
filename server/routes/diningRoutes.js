import { Router } from 'express';
<<<<<<< HEAD
import supabase from './db/supabaseClient.js';
// import{
//     //functions,
// } from './controllers/diningCont.js';
=======
import {
    getAllDiningLocations,
    getDiningLocationsByCollege
} from '../controllers/diningCont.js';
>>>>>>> c0460f6b82d8b77b3737d1e94e287f78b23af0ca


const router = Router();

router.get('/', getAllDiningLocations);
router.get('/school/:college', getDiningLocationsByCollege);

router.post('/', async (req, res) => {   
    try {
      const { data, error } = await supabase
        .from('dining_halls')
        .select('*');
      
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
router.post('/:id', async (req, res) => {
try {
    const { data, error } = await supabase
    .from('dining-halls')    //I hope that's the right route info
    .select('*')
    .eq('id', req.params.id)
    .single();
    
    if (error) throw error;
    res.json(data);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

//SCALABLE
//<Route diningHallRoute = "dining-halls/:hallName" element = {<DiningHallPage />}    />
export default router;