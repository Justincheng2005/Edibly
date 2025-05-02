import { Router } from "express";
import { getStaticPreferenceList, updatePreferencesListToDB } from "../controllers/preferencesCont.js";
// import { expressjwt as ejwt } from "express-jwt";
// import jwksRsa from "jwks-rsa";
import { checkJwt } from "./userRoutes.js";
import supabase from "../db/supabaseClient.js";

const router = Router();

router.get('/preferences', (req,res) => {
    getStaticPreferenceList()
        .then(e => {
            console.log('Data:', e);
            res.json(e);
        })
        .catch(error => {
            console.error('Error fetching preferences:', error);
            res.status(500).json({ error: 'Failed to fetch preferences'}); 
        })
});

router.post('/:usrid/preferences', checkJwt, (req, res) => {
    try {
        const auth0Id = req.auth.sub;
        const { preferenceIds } = req.body;

        if (!preferenceIds) {
            return res.status(400).json({ error: 'preferenceIds is required' });
        }

        // Verify this is the same user making the request
        if (auth0Id !== req.params.usrid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Add debug logging
        console.log('Updating preferences for:', auth0Id);
        console.log('Preferences to save:', preferenceIds);

        // Process the preferences
        updatePreferencesListToDB(auth0Id, preferenceIds)
            .then(() => res.json({ success: true }))
            .catch(error => {
                console.error('Database error:', error);
                res.status(500).json({ error: 'Database operation failed' });
            });
    } catch (error) {
        console.error('Route handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/*
router.post('/:usrid/preferences', checkJwt, (req, res) => {
    const auth0Id = req.auth.sub;
    const {preferenceIds} = req.body;
    // const preferenceIds = req.body.preferenceIds;
    if (!preferenceIds) {
        return res.status(400).json({ error: 'preferenceIds is required' });
    }
    supabase.from('users')
        .select('userid')
        .eq('auth0_id', auth0Id)
        .single()
        .then(({ data: user, error: userError }) => {
            if (userError) {
                console.error('User lookup error:', userError);
                throw userError;
            }
            if (!preferenceIds) {
                throw new Error('preferenceIds is required');
            }
            return updatePreferencesListToDB(user.userid, preferenceIds);
        })
        .then(() => res.json({success: true}))
        .catch(error => {
            console.error('Error saving preferences:', error);
            res.status(500).json({ 
                error: error.message || 'Failed to save preferences from POST.',
                details: error.details 
            });
    });    
});
*/

// router.get('/preferences', (req,res) => {
//     const auth0UserId = req.auth.sub;
//     const urlUserId = req.params.usrid;
  
//     if (auth0UserId !== urlUserId) {
//         return res.status(403).json({ error: 'Unauthorized' });
//     }
//     getStaticPreferenceList(req,res);

// });
// router.get('/:usrid/preferences', checkJwt, (req,res) => {
//     const auth0UserId = req.auth.sub;
//     const urlUserId = req.params.usrid;
  
//     if (auth0UserId !== urlUserId) {
//         return res.status(403).json({ error: 'Unauthorized' });
//     }
//     getStaticPreferenceList(req,res);

// });

export default router;