import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./ProfilePage.css"

const ProfilePage = () => {
    return (
        <div>
            <div className="profile-page-container">
                <MainHeader/>
                <Navbar/>
                <div className="about-profile-container card-style" style={{ padding: "20px" }}>
                    <h2 className="profile-title">Profile</h2>
                    <button className="apbutton">Logout</button>
                    <ul className="profile-info">
                        <li>Username: John Donut</li>
                        <li>E-mail: lol@bruh</li>
                        <li>Reviews: 47</li>
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
            </div>
        </div>
    );
}

export default ProfilePage