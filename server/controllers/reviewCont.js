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
                    userid: userId,
                    title: reviewData.title,
                    text: reviewData.text,
                    rating: reviewData.rating,
                    diningid: reviewData.diningId,
                }
            ])
            .select();

        if (error) throw error;

        const { error: updateError } = await supabase
            .rpc('increment_dining_rating', {
                did: reviewData.diningId,
                new_rating: reviewData.rating
            });

        if (updateError) throw updateError;

        console.log(data[0]);
        return data[0];
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
}

export const updateReview = async (reviewId, reviewData) => {
    try {
      // Step 1: Get the original review
      const { data: original, error: fetchError } = await supabase
        .from("reviews")
        .select("rating, diningid")
        .eq("reviewid", reviewId)
        .single();
  
      if (fetchError || !original) throw fetchError || new Error("Review not found");
  
      // Step 2: Update the review
      const { data, error } = await supabase
        .from("reviews")
        .update(reviewData)
        .eq("reviewid", reviewId);
  
      if (error) throw error;
  
      // Step 3: If the rating has changed, adjust the sumrating accordingly
      const ratingChanged = original.rating !== reviewData.rating;
      const diningChanged = original.diningid !== reviewData.diningId;
  
      if (ratingChanged || diningChanged) {
        // Remove old rating from old dining hall
        const { error: decrementError } = await supabase.rpc("decrement_dining_rating", {
          did: original.diningid,
          removed_rating: original.rating
        });
        if (decrementError) throw decrementError;
  
        // Add new rating to new dining hall
        const { error: incrementError } = await supabase.rpc("increment_dining_rating", {
          did: reviewData.diningId,
          new_rating: reviewData.rating
        });
        if (incrementError) throw incrementError;
      }
  
      return data;
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  };
  

export const deleteReview = async (userId, reviewId) => {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .delete()
            .eq("reviewid", reviewId)
            .eq("userid", userId)
            .select("rating, diningid");
        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error("No review found to delete");
        }

        const deletedReview = data[0];

        const { error: updateError } = await supabase.rpc('decrement_dining_rating', {
            did: deletedReview.diningid,
            removed_rating: deletedReview.rating
          });
      
          if (updateError) throw updateError;
    

        return deletedReview;
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
}