import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./ProfilePage.css"
import React, {useEffect, useState} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const ProfilePage = () => {
    const {
        loginWithRedirect,
        logout,
        isAuthenticated,
        getAccessTokenSilently,
        user,
    } = useAuth0();
    const [userAllergies, setUserAllergies] = useState([]);
    const [userPreferences, setUserPreferences] = useState([]);

    const syncUser = async (getAccessTokenSilently) => {
        try {
          const token = await getAccessTokenSilently();
          const res = await axios.get("http://localhost:3000/users/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("User synced:", res.data);
          return true
        } catch (err) {
          console.error("User sync failed:", err);
          return false
        }
    };

    const fetchUserAllergies = async (getAccessTokenSilently, setUserAllergies) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await axios.get("http://localhost:3000/users/user/allergies", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setUserAllergies(res.data.allergies)
          } catch (err) {
            console.error("Failed to fetch allergies:", err);
          }
    };
    const fetchUserPreferences = async (getAccessTokenSilently, setUserPreferences) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await axios.get("http://localhost:3000/users/user/preferences", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setUserPreferences(res.data.preferences)
          } catch (err) {
            console.error("Failed to fetch preferences:", err);
          }
    };

    useEffect(() => {
        const runAll = async () => {
          if (!isAuthenticated) return;
      
          await syncUser(getAccessTokenSilently); // optional depending on if you want to always sync
      
          fetchUserAllergies(getAccessTokenSilently, setUserAllergies);
          fetchUserPreferences(getAccessTokenSilently, setUserPreferences);
        };
      
        runAll();
      }, [isAuthenticated, getAccessTokenSilently]);

    return (
        <div>
            <div className="profile-page-container">
                <MainHeader/>
                <Navbar/>
                {!isAuthenticated ? (
                    <>
                        <div className="about-profile-container card-style" style={{ padding: "20px" }}>
                            <h2 className="profile-title">Profile</h2>
                            <button className="apbutton" onClick={loginWithRedirect}>Log In</button>
                            <ul className="profile-info">
                                <li>Please login to display personal information here</li>
                            </ul>
                        </div>

                        <div className="allergies-container card-style">
                            <h2 className="allergies-title">Allergies</h2>
                            <ul className="list-of-allergies">
                                <li>To store personal allergic information, please log in</li>
                            </ul>
                        </div>

                        <div className="preferences-container card-style">
                            <h2 className="preferences-title">Preferences</h2>
                            <ul className="list-of-preferences">
                            <li>To store personal dietary preferences, please log in</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="about-profile-container card-style" style={{ padding: "20px" }}>
                        <h2 className="profile-title">Profile</h2>
                        <button className="apbutton" onClick={() => logout({ returnTo: window.location.origin })}>Log Out</button>
                        <ul className="profile-info">
                            <li>Username: {user.nickname}</li>
                            <li>E-mail: {user.email}</li>
                            <li>Reviews: Coming soon</li>
                        </ul>
                        </div>

                        <div className="allergies-container card-style">
                        <h2 className="allergies-title">Allergies</h2>
                        <ul className="list-of-allergies">
                            {userAllergies.length > 0 ? (
                                userAllergies.map((allergy, index) => <li key={index}>{allergy}</li>)
                            ) : (
                                <li>No allergies specified</li>
                            )}
                        </ul>
                        <Link to="/profile/usrid/allergies" className="apbutton">
                            Update Allergies
                        </Link>
                        </div>

                        <div className="preferences-container card-style">
                            <h2 className="preferences-title">Preferences</h2>
                            <ul className="list-of-preferences">
                                {userPreferences.length > 0 ? (
                                    userPreferences.map((pref, index) => <li key={index}>{pref}</li>)
                                ) : (
                                    <li>No Preferences specified</li>
                                )}
                            </ul>
                            <Link to="/profile/usrid/preferences" className="apbutton">
                                Update Preferences
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfilePage