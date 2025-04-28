import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import "./PreferencesPage.css";
import React,{useState, useEffect} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchStaticPreferencesList, updatePreferencesList } from "../api/diningAPI";

//FIXL: Asking to login to many times, actually clicking the login button
const PreferencesPage = () => {
    const [dietPrefList,setDietPrefList] = useState([]);
    const [selectedPref, setSelectedPref] = useState([]);
    const [loading,setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // const handlePref = (event) =>{
    //     const value = event.target.value;
    //     setSelectedPref((prev)=>{
    //         return prev.includes(value) ? prev.filter(e => e != value) : [...prev,value]
    //     });
    // };
    
    // const {user, isAuthenticated, getAccessTokenSilently} = useAuth0();
    const {user, getAccessTokenSilently, isAuthenticated, loginWithRedirect} = useAuth0();
   
    useEffect(() => {
        if (!isAuthenticated) {
            loginWithRedirect({
                appState: { returnTo: window.location.pathname }
            }).then(() => {
                // After login, load preferences
                fetchStaticPreferencesList()
                    .then(data => {
                        if (!data || data.length === 0) {
                            throw new Error('No Preferences found in database');
                        }
                        setDietPrefList(data);
                        setLoading(false);
                    })
                    .catch(error => {
                        console.error('Full preferences load error:', error);
                        setError(error.message || 'Failed to load preferences');
                        setLoading(false);
                    });
            });
        } else {
            fetchStaticPreferencesList()
                .then(data => {
                    if (!data || data.length === 0) {
                        throw new Error('No Preferences found in database');
                    }
                    setDietPrefList(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Full preferences load error:', error);
                    setError(error.message || 'Failed to load preferences');
                    setLoading(false);
                });
        }
    }, [isAuthenticated, loginWithRedirect]);

        /*
        fetchStaticPreferencesList()
            .then(data => {
                if (!data || data.length === 0) {throw new Error('No Preferences found in database');}
                setDietPrefList(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Full preferences load error:', error);
                setError(error.message || 'Failed to load preferences');
                setLoading(false);
            });    
    }, []);     */
    //
    // Handle preference selection
  const handlePrefToggle = (preferenceId) => {
    setSelectedPref(prev => {
        return prev.includes(preferenceId) ? prev.filter(id => id !== preferenceId) : [...prev, preferenceId];
    });
  };

  // Save preferences
    const handlePrefUpdate = () => {
        if (selectedPref.length === 0) {
            alert('Please select at least one preference');
            return;
        }
        // if (!isAuthenticated) {
        //     loginWithRedirect({
        //         appState: { returnTo: window.location.pathname }
        //     }).then(() => {
        //         // After login, try again
        //         handlePrefUpdate();
        //     });
        //     return;
        // }
        setLoading(true);
        
        getAccessTokenSilently()
        .then(token => {
            console.log('Attempting to save preferences:', selectedPref);
            return updatePreferencesList(user.sub, selectedPref, token);
        })
        .then(response => {
            console.log('Save successful, response:', response);
            // Optional: Refresh preferences here if needed
            return fetchStaticPreferencesList();
        })
        .then(updatedPrefs => {
            console.log('Updated preferences:', updatedPrefs);
            navigate('/profile');
        })
        .catch(error => {
            console.error('Full save error:', error);
            alert(`Failed to save preferences: ${error.message}\n\nCheck console for details`);
        })
        .finally(() => {
            setLoading(false);
        });


        // setLoading(true);
        // getAccessTokenSilently()
        //     .then(token => {
        //         return updatePreferencesList(user.sub, selectedPref, token);
        //     })
        //     .then(() => {
        //         navigate('/profile');
        //     })
        //     .catch(error => {
        //         console.error('Error saving preferences:', error);
        //         alert('Failed to save preferences from handlePredUpdate().');
        //     })
        //     .finally(() =>{
        //         setLoading(false);
        //     });
    };

    //

    if(!isAuthenticated) return <div>You are currently not logged in. Please proceed to the login prompt.</div>
    if (loading) return <div>Loading Static List of Preferences...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
        <div>
            <div className="preferences-page-container">
                <MainHeader/>
                <Navbar/>
                <h1 style={{color:"#7a1727"}}>Preferences Page</h1>
                <h2 style={{ color: "#7a1727" }}>Choose Your Preferences</h2>
                <div className = "checkbox-group" >
                    {dietPrefList.map(e=>(
                        <div key = {e.preferenceid}>
                            <input
                                type = "checkbox"
                                id = {`pref-${e.preferenceid}`}
                                checked = {selectedPref.includes(e.preferenceid)}
                                onChange={() => handlePrefToggle(e.preferenceid)}
                            />
                            <label htmlFor={`pref-${e.preferenceid}`}>
                                {e.preferencename}
                            </label>
                        </div>
                    ))}
                </div>
                {/* <div className="selected-preferences card-style"> 
                    <h3>Selected:</h3>
                    <ul>
                        {selectedPref.map(e => (
                            <li key = {e}> {e}</li>
                        ))}
                    </ul>
                    <Link to="/profile" className="apbutton">
                        Confirm
                    </Link>
                </div> */}
                <button onClick={handlePrefUpdate} disabled={selectedPref.length === 0} className="apbutton">
                    Save Preferences
                </button>
            </div>
        </div>
    );
}
export default PreferencesPage