import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import hampshireImg from "../images/hampshire.jpg";
import berkshireImg from "../images/berkshire.jpg";
import valentineImg from "../images/valentine.jpg";

const HomePage = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = [hampshireImg, berkshireImg, valentineImg];

    // Image carousel effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, [images.length]);

    // Function to handle manual image change when dots are clicked
    const handleDotClick = (index) => {
        setCurrentImageIndex(index);
    };

    return (
        <div className="home-container">
            {/* UMass style header */}
            <header className="main-header">
                <div className="header-content">
                    <h1 className="site-title">Edibly | Campus Dining</h1>
                </div>
            </header>

            {/* Red Navbar */}
            <div className="main-navbar">
                <Link to="/dining-halls" className="nav-button">
                    Dining Halls
                </Link>
                <div className="nav-button search-button">
                    Search Meal
                </div>
                <div className="nav-button">
                    Profile
                </div>
            </div>

            {/* Welcome Section with carousel background */}
            <div
                className="welcome-section"
                style={{
                    backgroundImage: `url(${images[currentImageIndex]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'background-image 1s ease-in-out'
                }}
            >
                <div
                    className="blur-overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backdropFilter: 'blur(2px)',
                        zIndex: -1
                    }}
                />
                <h1 className="welcome-title">Welcome to Edibly</h1>
                <p className="welcome-text">Your one-stop destination for campus dining options</p>

                {/* Carousel indicator dots */}
                <div className="carousel-indicators">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => handleDotClick(index)}
                        />
                    ))}
                </div>
            </div>

            {/* About Us Section */}
            <div className="about-section">
                <h2 className="about-title">About Us | Mission</h2>
                <p className="about-text">
                    Edibly helps college students find and rate dining options across the Five College Consortium.
                    Our mission is to make campus dining more accessible and enjoyable for everyone.
                </p>
            </div>
        </div>
    );
};

export default HomePage; 