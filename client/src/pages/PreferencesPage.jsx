import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./PreferencesPage.css";
import React,{useState, useEffect} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchStaticPreferencesList } from "../api/diningAPI";

const PreferencesPage = () => {
    const [selectedPref, setSelectedPref] = useState([]);
    const [dietList,setDietList] = useState([]);
    const [loading,setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handlePref = (event) =>{
        const value = event.target.value;
        setSelectedPref((prev)=>{
            return prev.includes(value) ? prev.filter(e => e != value) : [...prev,value]
        });
    };
    //const dietList = ['a','b', 'c'];
    const {userId} = useAuth0();
   
    useEffect(() =>{
        //add front-end function
        console.log("Auth0 user:", userId);
        console.log("Auth0 user:", userId?.sub);
        if (userId?.sub) {
            fetchStaticPreferencesList(userId.sub)
            .then((data) => {
                setDietList(data)
                setError(null)
            })
            .catch((error) => {
                setError("Failed to find preferences for this user");
                console.error(error);
            })
            .finally(() => setLoading(false));
        }
    }, [userId,userId?.sub]);  // dependent on user.sub
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
                    {dietList.map(e=>(
                        <label key = {e}>
                            <input
                                type = "checkbox"
                                value = {e}
                                onChange={handlePref}
                                checked = {selectedPref.includes(e)}
                            />
                            {e}
                        </label>
                    ))}

                </div>
                <div className="selected-preferences card-style"> 
                    <h3>Selected:</h3>
                    <ul>
                        {selectedPref.map(e => (
                            <li key = {e}> {e}</li>
                        ))}
                    </ul>
                    <Link to="/profile" className="apbutton">
                        Confirm
                    </Link>
                </div>
            </div>
        </div>
    );
}
export default PreferencesPage