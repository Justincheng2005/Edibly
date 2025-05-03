import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import "./PreferencesPage.css";
import React,{useState, useEffect} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchStaticAllergiesList, updateAllergiesList } from "../api/diningAPI";

//FIXL: Asking to login to many times, actually clicking the login button
const AllergiesPage = () => {
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
                fetchStaticAllergiesList()
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
            fetchStaticAllergiesList()
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
        fetchStaticAllergiesList()
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
            return updateAllergiesList(user.sub, selectedPref, token);
        })
        .then(response => {
            console.log('Save successful, response:', response);
            // Optional: Refresh preferences here if needed
            return fetchStaticAllergiesList();
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
    if (loading) return <div>Loading Static List of Allergies...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
        <div>
            <div className="preferences-page-container">
                <MainHeader/>
                <Navbar/>
                <h1 style={{color:"#7a1727"}}>Allergies Page</h1>
                <h2 style={{ color: "#7a1727" }}>Choose Your Allergies</h2>
                <div className = "checkbox-group" >
                    {dietPrefList.map(e=>(
                        <div key = {e.allergyid}>
                            <input
                                type = "checkbox"
                                id = {`pref-${e.allergyid}`}
                                checked = {selectedPref.includes(e.allergyid)}
                                onChange={() => handlePrefToggle(e.allergyid)}
                            />
                            <label htmlFor={`pref-${e.allergyid}`}>
                                {e.allergyname}
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
                    Save Allergies
                </button>
            </div>
        </div>
    );
}
export default AllergiesPage