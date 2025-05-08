import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import {fetchSearchMeals} from "../api/diningAPI";
import "./MealSearchPage.css"
import backgroundImage from "../images/amherst-branded-twilight-zoom-background.jpg";
import { useParams } from "react-router-dom";


const MealSearchPage = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const[expandedMeal, setExpandedMeal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const {mealQuery} = useParams();

    useEffect(() => {
        if (mealQuery) {
            setQuery(mealQuery);
            handleSearch(mealQuery);
        }
    }, [mealQuery]);

    useEffect(() => {
        const debouncerTimer = setTimeout(() => {
            if (query.trim() !== "") {
                handleSearch(query);
            }
        }
        , 100); // Adjust the delay as needed (100ms here)
        return () => clearTimeout(debouncerTimer);
    }, [query]);
    
    const handleSearch = async (mealQuery) => {
        try{
            setIsLoading(true);
            setError(null);
            if(!mealQuery.trim()){
                setResults([]);
                return;
            }
            const data = await fetchSearchMeals(mealQuery);
            const formattedResults = (data?.results || data || []).map(e => ({
                ...e,
                macros: typeof e.macros === 'string' ? JSON.parse(e.macros) : e.macros
            }));
            // setResults(data?.results || data || []);
            setResults(formattedResults);
        }catch(error){
            if(error.message !== '{"error":"Search query is missing"}') {
                setError(error.message);
            }
           // setError(error.message);
            setResults([]); //Clear results on error
        }finally {
            setIsLoading(false);
        }
    }
    //const query = useParams();
    const toggleMealDescription = (mealId) => {
        setExpandedMeal((prev) => (prev === mealId ? null : mealId));
    }

    const formatLabel = (key) => {
        return key
        .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
        .trim(); // Remove any leading/trailing spaces
    };

    return(
        <div>
            <div className="meal-search-page-container">
                <div className="background-overlay"></div>
            <img 
            src={backgroundImage} 
            alt="Background" 
            className="background-image"
        />
        
        <div className="content-wrapper">
                <MainHeader/>
                <Navbar/>
                <h1 style={{color:"#7a1727"}}>Meal Search Page</h1>
                <div className="search-container">
                    <input 
                        type="text" 
                        placeholder="Search for meals..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        className="search-input"
                    />
                    <button onClick={() => handleSearch(query)} className="search-button">
                        Search
                    </button>
                </div>
                {isLoading && <div>Loading...</div>}
                {error && <div className="error-message">Error: {error}</div>}
                {results.length > 0 ? (
                    <div className="results-container">
                        <h2>Search Results:</h2>
                        <ul className="results-list">
                            {results.map((meal) => (
                                <li key={meal.mealid} className={`result-item ${expandedMeal === meal.mealid ? 'expanded' : ''}`} 
                                    onClick={() => toggleMealDescription(meal.mealid)}>
                                    <div className="meal-header">    
                                        <div className="meal-name">{meal.name}</div>
                                            {meal.description && 
                                            <div className="meal-description">{meal.description}</div>}
                                                </div>
                                                {expandedMeal === meal.mealid && ( 
                                                    <div className="meal-macros">
                                                        <h4>Nutritional Information:</h4>
                                                        {meal.macros ? (
                                                            <div className="macros-grid">
                                                                {Object.entries(meal.macros).map(([key,value]) =>(
                                                                    <div key={key} className="macro-row">
                                                                        <span className="macro-label">{formatLabel(key)}:</span>
                                                                        <span className="macro-value">{value}</span>
                                                                        </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p>No nutritional information available</p>
                                                        )}
                                                    </div>
                                                )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                ) : (!isLoading && !error && <div className="no-results">No Results found</div>)}
            </div>
            </div>
        </div>
    );
}
export default MealSearchPage;