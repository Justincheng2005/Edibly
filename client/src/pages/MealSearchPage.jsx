import MainHeader from "../components/MainHeader";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import {fetchSearchMeals} from "../api/diningAPI";
import "./MealSearchPage.css"
import { useParams } from "react-router-dom";


const MealSearchPage = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
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
            const data = await fetchSearchMeals(mealQuery);
            setResults(data.results);
        }catch(error){
            setError(error.message);
        }finally {
            setIsLoading(false);
        }
    }
    //const query = useParams();
    return(
        <div>
            <div className="meal-search-page-container">
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
                {results.length > 0 && (
                    <div className="results-container">
                        <h2>Search Results:</h2>
                        <ul className="results-list">
                            {results.map((meal, index) => (
                                <li key={index} className="result-item">
                                    {meal.name} - {meal.description}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
export default MealSearchPage;