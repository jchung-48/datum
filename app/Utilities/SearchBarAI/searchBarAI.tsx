'use client';

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
    collection,
    getDocs,
    CollectionReference,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient'; // Adjust import path if necessary
import styles from './searchBarAI.module.css';
import {FileData, SummarySearchResult, SearchBarAIProps} from '../../types';

// Debounce function to limit search calls
const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};

const companyId = 'mh3VZ5IrZjubXUCZL381';

const SearchBarAI: React.FC<SearchBarAIProps> = ({paths, onFileSelect}) => {
    const [queryText, setQueryText] = useState('');
    const [results, setResults] = useState<SummarySearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isResultsVisible, setIsResultsVisible] = useState(false);
    const [fileSelectedForSummary, setFileSelectedForSummary] = useState<string | null>(null);

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

    const handleSearch = async () => {
        if (!queryText) {
            setResults([]);
            setIsResultsVisible(false);
            return;
        }

        setLoading(true);
        const searchResults: SummarySearchResult[] = [];

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
                    // Subpaths are provided
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
        setLoading(false);
    };

    // Helper function to fetch and filter documents
    const fetchAndFilterDocs = async (
        collectionRef: CollectionReference<FileData>,
        searchResults: SummarySearchResult[],
        queryTextSplit: string[],
    ) => {
        const docsSnap = await getDocs(collectionRef);

        docsSnap.forEach((doc: QueryDocumentSnapshot<FileData>) => {
            const data = doc.data();
            
            // Use fileName instead of name
            const name = data.fileName?.toLowerCase();

            // Ensure name is defined before trying to use it
            if (!name) return;

            const matches = queryTextSplit.every(word => name.includes(word));

            if (matches) {
                searchResults.push({
                    name: data.fileName, // Use fileName for displaying
                    downloadURL: data.download, // Use download field for URL
                    author: data.userDisplayName,
                    uploadDate: data.uploadTimeStamp.toString(),
                    tags: data.tags,
                });
            }
        });
    };

    // Debounced version of handleSearch with a 500ms delay
    const debouncedSearch = useCallback(debounce(handleSearch, 500), [
        queryText,
        paths,
    ]);

    const handleFileSelect = (file: SummarySearchResult): void => {
        onFileSelect(file);
        setIsResultsVisible(false);
        setQueryText(file.name);    
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

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.mainContainer}>
        <div className={styles.searchBar}>
            <input
                type="text"
                placeholder="Search..."
                value={queryText}
                onChange={e => {
                    setQueryText(e.target.value);
                    debouncedSearch();
                }}
                className={styles.searchInput}
            />

            {isResultsVisible && results.length > 0 && (
                <div ref={resultsRef} className={styles.searchResultsCard}>
                    <ul>
                        {results.map((item, index) => (
                            <li key={index} className={styles.searchResultItem}
                            onClick={() => handleFileSelect(item)}>
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
export default SearchBarAI;