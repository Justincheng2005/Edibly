import supabase from '../db/supabaseClient.js';

console.log('Supabase instance:', supabase);
supabase.from('allergies').select('*')
    .then(console.log)
    .catch(console.error);

export const getStaticAllergyList = () =>{
    return supabase.from('allergies')
    .select('allergyid, allergyname')
    .then(({ data, error }) => {
        if (error) throw error;
        return data;
    });
};

export const updateAllergiesListToDB = async (usrid, allergyIdList) => {
    try {
        const { error: deleteError } = await supabase
            .from("userallergies")
            .delete()
            .eq("userid", usrid);

        if (deleteError) throw deleteError;

        if (!allergyIdList || allergyIdList.length === 0) {
            return { success: true };
        }

        const allergiesToInsert = allergyIdList.map(allid => ({
            userid: usrid,
            allergyid: allid
        }));

        const { error: insertError } = await supabase
            .from("userallergies")
            .insert(allergiesToInsert);

        if (insertError) throw insertError;

        return { success: true };
    } catch (error) {
        console.error("Error in updateAllergiesListToDB:", error);
        return { success: false, error };
    }
};