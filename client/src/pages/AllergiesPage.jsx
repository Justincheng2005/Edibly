import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./AllergiesPage.css"
import React,{useState, useEffect} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchStaticAllergiesList } from "../api/diningAPI";

const AllergiesPage = () => {
    const [selectedAllerg, setSelectedAllerg] = useState([]);
    const [allergiesList, setAllergiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handleAllerg = (event) =>{
        const value = event.target.value;
        setSelectedAllerg((prev)=>{
            return prev.includes(value) ? prev.filter(e => e != value) : [...prev,value]
        });
    };
    const userId = useAuth0();
    // const allergiesList = ['a','b','c']
    useEffect(() =>{
        //add front-end function
        if(userId?.sub){
            fetchStaticAllergiesList(userId.sub)
                .then((data) => {
                    setAllergiesList(data);
                    setError(null);
                })
                .catch((error) => {
                    setError("Failed to find static list of allergies.");
                    console.error(error);
                })
                .finally(() => setLoading(false));
        }
    },[userId?.sub]);
    if (loading) return <div>Loading Static List of Allergies</div>
    if (error) return <div>Error: {error}</div>
    return (
        <div>
            <div className="allergies-page-container">
                <MainHeader/>
                <Navbar/>
                <h1 style={{color:"#7a1727"}}>Allergies Page</h1>
                <h2 style={{ color: "#7a1727" }}>Choose Your Allergies</h2>
                <div className = "checkbox-group" >
                    {allergiesList.map(e=>(
                        <label key = {e}>
                            <input
                                type = "checkbox"
                                value = {e}
                                onChange={handleAllerg}
                                checked = {selectedAllerg.includes(e)}
                            />
                            {e}
                        </label>
                    ))}

                </div>
                <div className="selected-allergies card-style"> 
                    <h3>Selected:</h3>
                    <ul>
                        {selectedAllerg.map(e => (
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
export default AllergiesPage