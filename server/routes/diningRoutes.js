import { Router } from 'express';
import supabase from './db/supabaseClient.js';
// import{
//     //functions,
// } from './controllers/diningCont.js';


const router = Router();

// router.get('/', doSomethingController as any)
// will return the result of your doSomethingController

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