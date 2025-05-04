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
export const fetchStaticPreferencesList = () => {
    return fetch(`${API_BASE_URL}/profile/preferences`) //problem??
        .then(res => {
            console.log('Response status:', res.status);
                if (!res.ok){
                    console.error('Response not OK:', res.statusText);
                    throw new Error(`Server responded with ${res.status}`);
                }
            return res.json();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
    //     .then(data => {
    //     console.log('Received data:', data);
    //     return data;
    // });
  };
  
// export const checkBackendConnection = () => {
//     return fetch(`${API_BASE_URL}/diningLocations`)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Backend responded but with error');
//             }
//             return true;
//         })
//         .catch(error => {
//             console.error('Backend connection test failed:', error);
//             throw new Error('Could not connect to backend server');
//         });
// };

export const updatePreferencesList = (userId, preferenceIds, token) => {
    return fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}/preferences`, {
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
  /*
  export const updatePreferencesList = (userId, preferenceIds, token) => {
    console.log('Making request to:', `${API_BASE_URL}/profile/${encodeURIComponent(userId)}/preferences`);
    return fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ preferenceIds })
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(errText => {
                let errorData;
                try{
                    errorData = errText ? JSON.parse(errText) : {};
                }catch(e){
                    errorData = {message: errText || `Unknown error!!: ${e}`};
                }
                console.error('Server error details:', errorData); // Log server error details
                throw new Error(errorData.message || `Server responded with status ${res.status}`);
            });
        }
            return res.json();
        })
        // .then(data => {
        //     console.log('Preferences updated successfully:', data);
        //     return data;
        // })
        .catch(error => {
            // if (error.message.includes('ENOTFOUND') || error.message.includes('Failed to fetch')) {
            //     throw new Error('Could not connect to the server. Please check your network connection and ensure the backend is running.');
            // }
            console.error('Network error:', error); 
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to the server. Please check: \n1. Backend is running \n2. Correct port (3000) \n3. No CORS issues');
            }  
            throw error;
        });
    //   if (!res.ok) throw new Error('Failed to save preferences');
    //   return res.json();
    // });
  };
*/


// export const fetchStaticPreferencesList = (usrid, token) => {
//     // const token = localStorage.getItem('access_token');
//         return fetch(`${API_BASE_URL}/profile/${encodeURIComponent(usrid)}/preferences`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         })
//         .then((res) => {
//             if (!res.ok) {
//                 console.error('API Response not OK:', res.status, res.statusText);
//                 throw new Error(`Network Response is invalid: ${res.status} ${res.statusText}`);
//             }
//             return res.json();
//         })
//         .then(data => {
//             console.log('Received preferences data:', data);
//             return data;
//         })
//         .catch((error) => {
//             console.error('Fetch Error in preferences API:', error);
//             throw error;
//         });
// };

export const fetchStaticAllergiesList = (usrid) => {
    return fetch(`${API_BASE_URL}/profile/${usrid}/allergies`)
        .then((res) => {
            if (!res.ok) {
                throw new Error('Network Response is invalid');
            }
            return res.json();
        })
        .catch((error) =>{
            console.error('Fetch Error:', error);
        })
}

export const fetchSearchMeals = async (mealQuery) => {
    try{
        const response = await fetch(`${API_BASE_URL}/meals/search?query=${encodeURIComponent(mealQuery)}`);
        if(!response.ok){
            throw new Error(await response.text());
        }
        return await response.json();
    }catch(error) {
        console.error('Search for meals failed:', error);
        throw error;
    }
};