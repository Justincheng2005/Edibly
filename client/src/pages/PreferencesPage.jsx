import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./PreferencesPage.css";
import React,{useState, useEffect} from "react";
import { fetchStaticPreferencesList } from "../api/diningAPI";

const PreferencesPage = () => {
    const [selectedPref, setSelectedPref] = useState([]);
    const handlePref = (event) =>{
        const value = event.target.value;
        setSelectedPref((prev)=>{
            return prev.includes(value) ? prev.filter(e => e != value) : [...prev,value]
        });
    };
    //const dietList = ['a','b', 'c'];
    //const {user} = use
    const dietList = fetchStaticPreferencesList()
    .then((data) => {
        data
    });
    useEffect(() =>{
        //add front-end function
    } )
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