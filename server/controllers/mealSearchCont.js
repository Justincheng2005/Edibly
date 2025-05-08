import supabase from "../db/supabaseClient.js";

export const getSearchedMeals = async (mealQuery) => {
    try{
        const {data, error} = await supabase
            .from('meals')
            .select('*')  //Might change later!!!!!!!!!!!!!!!!!!!!
            .or(`name.ilike.%${mealQuery}%, ingredients.ilike.%${mealQuery}%, macros.ilike.%${mealQuery}%, description.ilike.%${mealQuery}%`)
            .limit(50);

            if(error) throw error;
            return data;
    }catch(error){
        console.log('Database search Error:', error);
        throw error;
    }    
};