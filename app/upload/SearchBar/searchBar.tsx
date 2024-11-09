"use client";

import React, { useState } from "react";
import { ref, listAll } from "firebase/storage";
import { storage } from "@/lib/firebaseClient"; // Adjust import path if necessary
import "./SearchBar.css";

interface SearchResult {
    name: string;
}

const SearchBar: React.FC<{ department: string }> = ({ department }) => {
    const [queryText, setQueryText] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!queryText) return;

        setLoading(true);
        const searchResults: SearchResult[] = [];

        try {
            // Reference to the department’s directory in Firebase Storage
            const departmentPath = `Company/Departments/${department}`;
            const departmentRef = ref(storage, departmentPath);

            // Retrieve list of all files in the specified directory
            const list = await listAll(departmentRef);

            // Filter files based on the search query
            for (const itemRef of list.items) {
                if (itemRef.name.toLowerCase().includes(queryText.toLowerCase())) {
                    searchResults.push({
                        name: itemRef.name,
                    });
                }
            }
        } catch (error) {
            console.error("Error retrieving search results:", error);
        }

        setResults(searchResults);
        setLoading(false);
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            await handleSearch();
        }
    };

    return (
        <div className="main-container">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search..."
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    onKeyUp={handleKeyPress}
                    className="search-input"
                />
                <button onClick={handleSearch} className="search-button">🔍</button>
    
                {loading && <p>Loading results...</p>}
    
                {results.length > 0 && (
                    <div className="search-results-card">
                        <h3>Search Results</h3>
                        <ul>
                            {results.map((item, index) => (
                                <li key={index} className="search-result-item">
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
    
};

export default SearchBar;
