import supabase from '../db/supabaseClient.js';

export const getAllDiningLocations = async (req, res) => {
    try {
        const { data, error } = await supabase.from('dininglocations').select('*');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const getDiningLocationsByCollege = async (req, res) => {
    try {
        const { college } = req.params;

        const { data, error } = await supabase
            .from('dininglocations')
            .select('*')
            .eq('school', college);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
