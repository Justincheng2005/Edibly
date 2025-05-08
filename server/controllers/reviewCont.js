import supabase from '../db/supabaseClient.js';

export const getReviews = async (diningId) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("diningid", diningId);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw error;
    }
}

export const getReviewById = async (reviewId) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("reviewid", reviewId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error fetching review:", error);
        throw error;
    }
}
export const createReview = async (userId, reviewData) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .insert([
                {
                    user_id: userId,
                    title: reviewData.title,
                    text: reviewData.text,
                    rating: reviewData.rating,
                    diningid: reviewData.diningId,
                }
            ]);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
}

export const updateReview = async (reviewId, reviewData) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .update(reviewData)
            .eq("reviewid", reviewId);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error updating review:", error);
        throw error;
    }
}

export const deleteReview = async (userId, reviewId) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .delete()
            .eq("reviewid", reviewId)
            .eq("user_id", userId);
        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
}