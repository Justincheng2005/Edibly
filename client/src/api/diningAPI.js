const API_BASE_URL = 'http://localhost:3000'; //backend running on port 3000

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
export const fetchStaticPreferencesList = () => {
    return fetch(`${API_BASE_URL}/profile/preferences`) //problem??
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) {
                console.error('Response not OK:', res.statusText);
                throw new Error(`Server responded with ${res.status}`);
            }
            return res.json();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};

export const updatePreferencesList = (userId, preferenceIds, token) => {
    return fetch(`${API_BASE_URL}/profile/preferences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferenceIds })
    })
        .then(response => {
            const contentType = response.headers.get('content-type');

            // Handle HTML error responses
            if (contentType && contentType.includes('text/html')) {
                return response.text().then(html => {
                    const errorMatch = html.match(/<pre>Error: (.*?)<br>/);
                    const errorMessage = errorMatch ? errorMatch[1] : 'Backend processing error';
                    throw new Error(`Backend Error: ${errorMessage}`);
                });
            }

            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error('Detailed error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to backend server. Please check:\n1. Backend is running\n2. Correct port (3000)');
            }
            throw error;
        });
};
export const updateAllergiesList = (userId, allergyIds, token) => {
    return fetch(`${API_BASE_URL}/profilee/allergies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ allergyIds })
    })
        .then(response => {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('text/html')) {
                return response.text().then(html => {
                    const errorMatch = html.match(/<pre>Error: (.*?)<br>/);
                    const errorMessage = errorMatch ? errorMatch[1] : 'Backend processing error';
                    throw new Error(`Backend Error: ${errorMessage}`);
                });
            }

            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error('Detailed error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to backend server. Please check:\n1. Backend is running\n2. Correct port (3000)');
            }
            throw error;
        });
};

export const fetchStaticAllergiesList = () => {
    return fetch(`${API_BASE_URL}/profilee/allergies`) //problem??
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) {
                console.error('Response not OK:', res.statusText);
                throw new Error(`Server responded with ${res.status}`);
            }
            return res.json();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};

export const fetchMenuItemsByDiningHallId = async (diningHallId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/meals/dining/${diningHallId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch menu items for dining hall ID ${diningHallId}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching menu items for dining hall ID ${diningHallId}:`, error);
        throw error;
    }
};