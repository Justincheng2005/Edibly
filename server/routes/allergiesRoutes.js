import { Router } from "express";
import { getStaticAllergyList, updateAllergiesListToDB } from "../controllers/allergiesCont.js";
// import { expressjwt as ejwt } from "express-jwt";
// import jwksRsa from "jwks-rsa";
import { checkJwt } from "./userRoutes.js";
import supabase from "../db/supabaseClient.js";

const router = Router();

router.get('/allergies', (req,res) => {
    getStaticAllergyList()
        .then(e => {
            console.log('Data:', e);
            res.json(e);
        })
        .catch(error => {
            console.error('Error fetching allergies:', error);
            res.status(500).json({ error: 'Failed to fetch allergies'}); 
        })
});

router.post("/allergies", checkJwt, async (req, res) => {
    try {
        const auth0Id = req.auth.sub;
        const { allergyIds } = req.body;

        if (!auth0Id) {
            return res.status(401).json({ error: "Unauthorized: Missing auth0Id" });
        }

        if (!allergyIds) {
            return res.status(400).json({ error: "allergyIds is required" });
        }

        const { data: existingUser, error: findError } = await supabase
            .from("users")
            .select("userid")
            .eq("auth0_id", auth0Id)
            .single();

        if (findError) {
            console.error("Supabase error:", findError);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (!existingUser) {
            return res.status(404).json({ error: "Associated user not found" });
        }

        console.log("Updating preferences for:", existingUser.userid);
        console.log("Preferences to save:", allergyIds);

        await updateAllergiesListToDB(existingUser.userid, allergyIds);

        return res.json({ success: true });
    } catch (error) {
        console.error("Route handler error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


export default router;