import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import Problem from './pages/Problem';
import Submit from './pages/Submit';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import Contests from './pages/Contests';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/problems" element={<PrivateRoute><Problems /></PrivateRoute>} />
                <Route path="/problem/:id" element={<PrivateRoute><Problem /></PrivateRoute>} />
                <Route path="/submit/:problemId" element={<PrivateRoute><Submit /></PrivateRoute>} />
                <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
                <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
                <Route path="/contests" element={<PrivateRoute><Contests /></PrivateRoute>} />
                <Route path="/profile/:username" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;