import { Router } from "express";
import { getReviews, getReviewById, createReview, updateReview, deleteReview } from "../controllers/reviewCont.js";
import { checkJwt } from "./userRoutes.js";

const router = Router();

router.get("/:diningId", async (req, res) => {
    try {
        const { diningId } = req.params;
        const reviews = await getReviews(diningId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/review/:id", async (req, res) => {
    const { reviewId } = req.params;
    try {
        const review = await getReviewById(reviewId);
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }
        res.status(200).json(review);
    } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/", checkJwt, async (req, res) => {
    try {
        const auth0Id = req.auth.sub;
        const { reviewData } = req.body;

        if (!auth0Id) {
            return res.status(401).json({ error: "Unauthorized: Missing auth0Id" });
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

        console.log("Creaing review for:", existingUser.userid);

        await createReview(existingUser.userid, reviewData);
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error("Route handler error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/:reviewId", checkJwt, async (req, res) => {
    try {
        const auth0Id = req.auth.sub;
        const { reviewId } = req.params;
        const { reviewData } = req.body;

        if (!auth0Id) {
            return res.status(401).json({ error: "Unauthorized: Missing auth0Id" });
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

        console.log("Updating review for:", existingUser.userid);

        await updateReview(reviewId, reviewData);
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error("Route handler error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:reviewId", checkJwt, async (req, res) => {
    try {
        const auth0Id = req.auth.sub;
        const { reviewId } = req.params;

        if (!auth0Id) {
            return res.status(401).json({ error: "Unauthorized: Missing auth0Id" });
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

        console.log("Deleting review for:", existingUser.userid);

        await deleteReview(existingUser.userid, reviewId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Route handler error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


export default router;