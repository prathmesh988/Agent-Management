/**
 * Custom hook for debounced search with server-side querying
 * Eliminates duplicate debounce logic across components
 */

import { useState, useEffect, useRef } from 'react';
import { UI } from '@/lib/constants';

interface UseDebounceSearchOptions {
  debounceMs?: number;
}

interface UseDebounceSearchResult<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: T[] | null;
  isSearching: boolean;
}

/**
 * Custom hook for debounced search functionality
 * @param searchFn - Async function that performs the search
 * @param options - Configuration options
 * @returns Object with search state and handlers
 * 
 * @example
 * ```
 * const { searchTerm, setSearchTerm, results, isSearching } = useDebounceSearch(
 *   async (term) => await searchEmployees(term),
 *   { debounceMs: 300 }
 * );
 * ```
 */
export function useDebounceSearch<T>(
  searchFn: (term: string) => Promise<T[]>,
  options: UseDebounceSearchOptions = {}
): UseDebounceSearchResult<T> {
  const { debounceMs = UI.SEARCH.DEBOUNCE_MS } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<T[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchTerm.trim()) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const searchResults = await searchFn(searchTerm.trim());
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, searchFn, debounceMs]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
  };
}
