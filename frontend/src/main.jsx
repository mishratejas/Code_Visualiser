import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

// M5 fix: @tanstack/react-query was installed but never actually mounted —
// every page fetched data with raw axios-in-useEffect, so navigating back to
// a page re-fetched everything with no caching or request deduplication.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // data considered fresh for 30s — avoids refetch storms on quick nav
      refetchOnWindowFocus: false, // this app doesn't need refetch-on-focus; avoids surprise reloads
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);