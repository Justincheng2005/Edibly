import express from "express";
import { expressjwt as jwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import supabase from "../db/supabaseClient.js";

export const router = express.Router();

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

router.get("/user", checkJwt, async (req, res) => {
  const auth0_id = req.auth.sub;

  try {
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("userid")
      .eq("auth0_id", auth0_id)
      .single();

    if (findError && findError.code !== "PGRST116") throw findError;

    let userId;

    if (existingUser) {
      userId = existingUser.userid;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({auth0_id})
        .select("userid")
        .single();

      if (insertError) throw insertError;
      userId = newUser.userid;
    }

    res.json({ message: "Authenticated user", userId });
  } catch (err) {
    console.error("Supabase error:", err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/user/allergies", checkJwt, async (req, res) => {
  const auth0_id = req.auth.sub;

  try {
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("userid")
      .eq("auth0_id", auth0_id)
      .single();

    if (userError) throw userError;

    const {data:allergies, error:allergyError} = await supabase
    .from("userallergies")
    .select("allergies(allergyname)")
    .eq("userid", existingUser.userid)

    if (allergyError) throw allergyError;
    res.json({ allergies: allergies.map(a => a.allergies.allergyname) });
  } catch (err) {
    console.error("Error getting allergies:", err.message);
    res.status(500).json({ error: "Failed to fetch allergies" });
  }
});

router.get("/user/preferences", checkJwt, async (req, res) => {
  const auth0_id = req.auth.sub;

  try {
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("userid")
      .eq("auth0_id", auth0_id)
      .single();

    if (userError) throw userError;

    const {data:preferences, error:allergyError} = await supabase
    .from("userpreferences")
    .select("preferences(preferencename)")
    .eq("userid", existingUser.userid)

    if (allergyError) throw allergyError;
    res.json({ preferences: preferences.map(p => p.preferences.preferencename) });
  } catch (err) {
    console.error("Error getting preferences:", err.message);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

export default router;
