import { Router } from 'express';
import {
    getAllDiningLocations,
    getDiningLocationsByCollege
} from '../controllers/diningCont.js';


const router = Router();

router.get('/', getAllDiningLocations);
router.get('/school/:college', getDiningLocationsByCollege);

// router.post('/', async (req, res) => {   
//     try {
//       const { data, error } = await supabase
//         .from('dining_halls')
//         .select('*');
      
//       if (error) throw error;
//       res.json(data);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });
  
// router.post('/:id', async (req, res) => {
// try {
//     const { data, error } = await supabase
//     .from('dining-halls')    //I hope that's the right route info
//     .select('*')
//     .eq('id', req.params.id)
//     .single();
    
//     if (error) throw error;
//     res.json(data);
// } catch (err) {
//     res.status(500).json({ error: err.message });
// }
// });

//SCALABLE
//<Route diningHallRoute = "dining-halls/:hallName" element = {<DiningHallPage />}    />
export default router;