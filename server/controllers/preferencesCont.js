import { error } from 'selenium-webdriver';
import supabase from '../db/supabaseClient.js';

console.log('Supabase instance:', supabase);
supabase.from('preferences').select('*')
    .then(console.log)
    .catch(console.error);

export const getStaticPreferenceList = () =>{
    return supabase.from('preferences')
    .select('preferenceid, preferencename')
    .then(({ data, error }) => {
        if (error) throw error;
        return data;
    });
};

export const updatePreferencesListToDB = (usrid, preferenceIdList) => {
    return supabase.from('userpreferences')
        .delete()
        .eq('userid', usrid)
        .then(({ error: deleteError }) => {
            if (deleteError) throw deleteError;
            // if (preferenceIds.length === 0) {
            //     return { success: true };
            // }

            if (!preferenceIdList || preferenceIdList.length === 0) {
                return { success: true };
            }
            const preferencesToInsert = preferenceIdList.map(prefid => ({
                userid: usrid,
                preferenceid: prefid
        }));
        
        return supabase.from('userpreferences')
            .insert(preferencesToInsert)
            .then(({ error: insertError }) => {
                if (insertError) {
                    console.error('Insert error:', insertError);
                    throw insertError;}
                return { success: true };
            });
        })
        .catch(error => {
            console.error('Error in updatePreferencesListToDB:', error);
            throw error;
        });    
};

// export const getStaticPreferenceList = (req, res) =>{
//     const usrId = req.params.usrid;
//    // const usrId = req.auth.sub;
//     console.log('Starting preferences fetch for user:', usrId);

//     supabase.from('users')
//         .select('userid')
//         .eq('auth0_id', usrId)
//         .single()
//         .then(({data:user,error:errorUser}) => {
//             if(errorUser){
//                 console.error('Error finding user:', errorUser);
//                 return res.status(500).json({error: 'User not Found'});
//             }
//             console.log('User found:', user);
            
//             return supabase.from('preferences')
//                 .select('preferencename');
//         })
//         .then(({data:preferences, error:errorPref}) => {
//             if (errorPref) {
//                 console.error('Error fetching preferences:', errorPref);
//                 return res.status(500).json({error: 'Failure to find the preferences table.'})
//             }
//             console.log('Preferences found:', preferences);
            
//             if (!preferences || preferences.length === 0) {
//                 console.log('No preferences found in database');
//                 return res.json([]);
//             }
            
//             const preferencesList = preferences.map( e=> e.preferencename);
//             console.log('Returning preferences list:', preferencesList);
//             res.json(preferencesList);
//         })
//         .catch((error) => {
//             console.error('Unexpected error in preferences controller:', error);
//             res.status(500).json({error: 'Internal server error'});
//         });
// };
