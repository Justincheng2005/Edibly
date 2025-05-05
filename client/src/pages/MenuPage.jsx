import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMenuItemsByDiningHallId, fetchAllDiningLocations } from "../api/diningAPI";
import Navbar from "../components/Navbar";
import MainHeader from "../components/MainHeader";
import "./MenuPage.css";

const MenuPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [diningHall, setDiningHall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMenuData = async () => {
            try {
                setLoading(true);
                console.log("Fetching data for dining hall ID:", id);

                // Fetch dining hall info
                const diningHalls = await fetchAllDiningLocations();
                console.log("All dining halls:", diningHalls);

                // Find dining hall by diningid
                const currentDiningHall = diningHalls.find(hall => hall.diningid.toString() === id);
                console.log("Found dining hall:", currentDiningHall);

                if (!currentDiningHall) {
                    throw new Error("Dining hall not found");
                }

                setDiningHall(currentDiningHall);

                // Fetch menu items for this dining hall
                try {
                    const menuData = await fetchMenuItemsByDiningHallId(id);
                    console.log("Menu data:", menuData);
                    setMenuItems(menuData);
                } catch (menuError) {
                    // Just set empty menu items if there's an error fetching the menu
                    // This will display our "no menu data available" message
                    setMenuItems([]);
                    console.error("Error loading menu items:", menuError);
                }
            } catch (err) {
                setError("Failed to load dining hall information. Please try again later.");
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadMenuData();
    }, [id]);

    const goBack = () => {
        navigate(-1);
    };

    // Valentine Hall specific styling
    const getHeaderStyle = () => {
        if (diningHall && diningHall.school === "Amherst College") {
            return { backgroundColor: "#470a77" };
        }
        return { backgroundColor: "#971B2F" }; // Default UMass color
    };

    return (
        <div className="menu-page">
            <MainHeader />
            <Navbar />

            <div className="menu-container">
                {loading ? (
                    <div className="loading">Loading menu information...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <>
                        <div className="menu-header" style={getHeaderStyle()}>
                            <button className="back-button" onClick={goBack}>
                                &larr; Back
                            </button>
                            <h1>{diningHall.name}</h1>
                            <p className="hours">{diningHall.hours}</p>
                        </div>

                        <div className="menu-content">
                            {menuItems.length === 0 ? (
                                <div className="no-menu">
                                    <p>No menu data is currently available for {diningHall.name}.</p>
                                    {diningHall.diningid === 5 ? (
                                        <p>Valentine Hall menu information is currently being updated. Please check back later.</p>
                                    ) : (
                                        <p>We're working on adding menu information for this dining hall.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="menu-items">
                                    <h2>Today's Menu</h2>
                                    <div className="menu-grid">
                                        {menuItems.map((item) => (
                                            <div key={item.mealid} className="menu-item-card">
                                                <h3>{item.name}</h3>
                                                <p className="description">{item.description || "No description available"}</p>
                                                <p className="ingredients">
                                                    <strong>Ingredients:</strong> {item.ingredients || "Not specified"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MenuPage; 