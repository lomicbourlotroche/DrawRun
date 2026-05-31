'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2 } from '@/components/ui/icons';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface LocationSearchProps {
  onSelectLocation: (_lat: number, _lng: number, _label: string) => void;
  placeholder?: string;
}

export default function LocationSearch({
  onSelectLocation,
  placeholder = 'Rechercher un lieu…',
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const searchLocation = useCallback(async (q: string) => {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=fr`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchLocation(value), 400);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    onSelectLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-surface/90 backdrop-blur-sm border border-border text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-surface rounded-lg shadow-lg border border-border z-[1000] max-h-60 overflow-y-auto">
          {results.map((result, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(result)}
              className="flex items-start gap-3 w-full p-3 text-left hover:bg-primary/5 transition-colors border-b border-border last:border-0"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{result.display_name.split(',')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
