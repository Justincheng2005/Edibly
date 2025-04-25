import supabase from '../db/supabaseClient.js';

export const getStaticPreferenceList = (req, res) =>{
    //const usrId = req.params.usrid;
    //const usrId = req.auth0.usrid;
    supabase.from('preferences')
        .select('*')
        //.eq('userId', userId)
        .then(({data,error}) => {
            if(error){
                return res.status(500).json({error: error.message});
            }res.json(data);
        })
        .catch((error) => {
            console.error('Unexpected error:', error);
            res.status(500).json({error: 'Internal server error'});
        });
};

// export const getStaticPreferenceList = (req, res) =>{
//     const usrId = req.params.usrid;
//      if (!usrId){return res.status(400).json({error: 'User ID is required'})}
//     supabase.from('preferences')
//         .select('*')
//         .eq('userId', userId)
//         .then(({data,error}) => {
//             if(error){
//                 return res.status(500).json({error: error.message});
//             }res.json(data);
//         })
//         .catch((error) => {
//             console.error('Unexpected error:', error);
//             res.status(500).json({error: 'Internal server error'});
//         });
// };