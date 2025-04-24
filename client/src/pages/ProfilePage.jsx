import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./ProfilePage.css"
import React, {useEffect} from "react";
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

    useEffect(() => {
        const syncUser = async () => {
          try {
            const token = await getAccessTokenSilently();
            const res = await axios.get("http://localhost:3000/users/user", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("User synced:", res.data);
          } catch (err) {
            console.error("User sync failed:", err);
          }
        };
    
        if (isAuthenticated) {
          syncUser();
        }
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
                            <li>Tree Nuts</li>
                            <li>Legumes</li>
                        </ul>
                        <Link to="/profile/usrid/allergies" className="apbutton">
                            Update Allergies
                        </Link>
                        </div>

                        <div className="preferences-container card-style">
                            <h2 className="preferences-title">Preferences</h2>
                            <ul className="list-of-preferences">
                                <li>Halal</li>
                                <li>Vegeterian</li>
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