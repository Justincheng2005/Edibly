import { Router } from "express";
import { getStaticPreferenceList } from "../controllers/preferencesCont.js";
const router = Router();

router.get('/profile/usrid/preferences', getStaticPreferenceList);

export default router;