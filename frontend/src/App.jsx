import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { EditorProvider } from './context/EditorContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Sidebar from './components/common/Sidebar';
import Loader from './components/common/Loader';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Problems = lazy(() => import('./pages/Problems'));
const Problem = lazy(() => import('./pages/Problem'));
const Submit = lazy(() => import('./pages/Submit'));
const Submissions = lazy(() => import('./pages/Submissions'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Contests = lazy(() => import('./pages/Contests'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
// Commented out pages for now - you can uncomment when you create them
// const CreateContest = lazy(() => import('./pages/CreateContest'));
// const ContestLeaderboard = lazy(() => import('./pages/ContestLeaderboard'));
// const About = lazy(() => import('./pages/About'));
// const Help = lazy(() => import('./pages/Help'));
// const NotFound = lazy(() => import('./pages/NotFound'));

import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <EditorProvider>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Header />
              
              <div className="flex flex-1">
                {/* Sidebar for authenticated users on specific routes */}
                <Routes>
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/problems" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/problem/:id" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/submit/:problemId" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/submissions" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/leaderboard" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/contests" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/profile/:username" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                  <Route path="/settings" element={
                    <PrivateRoute>
                      <Sidebar />
                    </PrivateRoute>
                  } />
                </Routes>

                <main className="flex-1 container mx-auto px-4 py-8">
                  <Suspense fallback={<Loader fullScreen={false} />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      {/* Commented out for now - create these pages later */}
                      {/* <Route path="/about" element={<About />} /> */}
                      {/* <Route path="/help" element={<Help />} /> */}
                      
                      {/* Protected Routes */}
                      <Route path="/dashboard" element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      } />
                      <Route path="/problems" element={
                        <PrivateRoute>
                          <Problems />
                        </PrivateRoute>
                      } />
                      <Route path="/problem/:id" element={
                        <PrivateRoute>
                          <Problem />
                        </PrivateRoute>
                      } />
                      <Route path="/submit/:problemId" element={
                        <PrivateRoute>
                          <Submit />
                        </PrivateRoute>
                      } />
                      <Route path="/submissions" element={
                        <PrivateRoute>
                          <Submissions />
                        </PrivateRoute>
                      } />
                      <Route path="/leaderboard" element={
                        <PrivateRoute>
                          <Leaderboard />
                        </PrivateRoute>
                      } />
                      <Route path="/contests" element={
                        <PrivateRoute>
                          <Contests />
                        </PrivateRoute>
                      } />
                      <Route path="/profile/:username" element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      } />
                      <Route path="/settings" element={
                        <PrivateRoute>
                          <Settings />
                        </PrivateRoute>
                      } />
                      
                      {/* Redirects */}
                      <Route path="/home" element={<Navigate to="/" replace />} />
                      <Route path="/signin" element={<Navigate to="/login" replace />} />
                      <Route path="/signup" element={<Navigate to="/register" replace />} />
                      <Route path="/account" element={<Navigate to="/settings" replace />} />
                      
                      {/* 404 Route - simple fallback for now */}
                      <Route path="*" element={
                        <div className="text-center py-12">
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
                          <a href="/" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90">
                            Go Home
                          </a>
                        </div>
                      } />
                    </Routes>
                  </Suspense>
                </main>
              </div>
              
              <Footer />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#FFFFFF',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#FFFFFF',
                    },
                  },
                }}
              />
            </div>
          </EditorProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;