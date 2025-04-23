const API_BASE_URL = 'http://localhost:3000'; //backend should run on port 3000 for now.

export const fetchAllDiningLocations = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/diningLocations`);

        if (!response.ok) {
            throw new Error('Failed to fetch dining locations');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching dining locations:', error);
        throw error;
    }
};

export const fetchDiningLocationsBySchool = async (school) => {
    try {
        const response = await fetch(`${API_BASE_URL}/diningLocations/school/${encodeURIComponent(school)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch dining locations for ${school}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching dining locations for ${school}:`, error);
        throw error;
    }
}; 