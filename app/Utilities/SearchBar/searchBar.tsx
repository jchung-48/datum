'use client';

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
    collection,
    getDocs,
    CollectionReference,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient';
import './searchBar.css';
import {FileData, SearchResult, SearchBarProps} from '../../types';

const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};

const companyId = 'mh3VZ5IrZjubXUCZL381';

const SearchBar: React.FC<SearchBarProps> = ({paths}) => {
    const [queryText, setQueryText] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isResultsVisible, setIsResultsVisible] = useState(false);

    const resultsRef = useRef<HTMLDivElement>(null);

    const getSubcollections = async (
        departmentId: string,
    ): Promise<string[]> => {
        if (!departmentId) {
            return [];
        }
        if (departmentId === 'KZm56fUOuTobsTRCfknJ') {
            return ['transportationFiles', 'financialFiles', 'customsFiles'];
        } else if (departmentId === 'Eq2IDInbEQB5nI5Ar6Vj') {
            return ['files'];
        } else if (departmentId === 'NpaV1QtwGZ2MDNOGAlXa') {
            return ['files', 'incidents'];
        } else if (departmentId === 'ti7yNByDOzarVXoujOog') {
            return ['files', 'records'];
        } else {
            return [];
        }
    };


    /**
     * handleSearch
     * 
     * @param {void} None
     * @returns {Promise<void>} - Returns a promise that resolves when the search operation is complete.
     * 
     * Handles the search operation by querying the database based on the provided query text.
     * It splits the query text into individual words, iterates through the specified paths,
     * and fetches and filters documents from the database collections that match the query.
     * Updates the search results and loading state accordingly.
     * 
     * @throws {Error} - Throws an error if there is an issue retrieving search results.
     */
    const handleSearch = async () => {
        if (!queryText) {
            setResults([]);
            setIsResultsVisible(false);
            return;
        }

        const searchResults: SearchResult[] = [];

        try {
            const queryTextSplit = queryText.toLowerCase().split(' ');

            for (const path of paths) {
                const pathSegments = path.split('/');

                const departmentId = pathSegments[0];
                const subPathSegments = pathSegments.slice(1);

                if (subPathSegments.length === 0) {
                    const subcollections =
                        await getSubcollections(departmentId);

                    for (const subcollection of subcollections) {
                        const collectionPath = [
                            'Company',
                            companyId,
                            'Departments',
                            departmentId,
                            subcollection,
                        ].join('/');

                        const collectionRef = collection(
                            db,
                            collectionPath,
                        ) as CollectionReference<FileData>;

                        await fetchAndFilterDocs(
                            collectionRef,
                            searchResults,
                            queryTextSplit,
                        );
                    }
                } else {
                    const collectionPathSegments = [
                        'Company',
                        companyId,
                        'Departments',
                        departmentId,
                        ...subPathSegments,
                    ];

                    const collectionPath = collectionPathSegments.join('/');

                    const collectionRef = collection(
                        db,
                        collectionPath,
                    ) as CollectionReference<FileData>;

                    await fetchAndFilterDocs(
                        collectionRef,
                        searchResults,
                        queryTextSplit,
                    );
                }
            }

            setIsResultsVisible(true);
        } catch (error) {
            console.error('Error retrieving search results:', error);
        }

        setResults(searchResults);
    };

    
    const fetchAndFilterDocs = async (
        collectionRef: CollectionReference<FileData>,
        searchResults: SearchResult[],
        queryTextSplit: string[],
    ) => {
        const docsSnap = await getDocs(collectionRef);

        docsSnap.forEach((doc: QueryDocumentSnapshot<FileData>) => {
            const data = doc.data();

            const name = data.fileName?.toLowerCase();

            if (!name) return;

            const matches = queryTextSplit.every(word => name.includes(word));

            if (matches) {
                searchResults.push({
                    name: data.fileName,
                    downloadURL: data.download,
                });
            }
        });
    };

    const debouncedSearch = useCallback(debounce(handleSearch, 500), [
        queryText,
        paths,
    ]);

    const handleEscapePress = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsResultsVisible(false);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            resultsRef.current &&
            !resultsRef.current.contains(event.target as Node)
        ) {
            setIsResultsVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapePress);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapePress);
        };
    }, []);

    return (
        <div className="main-container">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search..."
                    value={queryText}
                    onChange={e => {
                        setQueryText(e.target.value);
                        debouncedSearch();
                    }}
                    className="search-input"
                />

                {isResultsVisible && results.length > 0 && (
                    <div ref={resultsRef} className="search-results-card">
                        <ul>
                            {results.map((item, index) => (
                                <li key={index} className="search-result-item">
                                    <a
                                        href={item.downloadURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {item.name}
                                    </a>
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
