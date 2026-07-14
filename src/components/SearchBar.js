import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";

const placeholderExamples = [
  "Search by problem name...",
  "Try 'Two Sum' or 'Binary Search'...",
  "Find a problem...",
  "Search by difficulty, e.g. 'easy'...",
];

export function SearchBar({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const rotatePlaceholder = useCallback(() => {
    setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderExamples[placeholderIndex]}
        onFocus={rotatePlaceholder}
        className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        aria-label="Search problems"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
