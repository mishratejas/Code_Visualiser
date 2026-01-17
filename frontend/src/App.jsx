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

// Create a wrapper component that shows sidebar for protected routes
const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="flex flex-1">
      {showSidebar && <Sidebar />}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <EditorProvider>
            <div className="min-h-screen flex flex-col bg-gray-950 text-white overflow-x-hidden">
              <Header />
              
              <Suspense fallback={<Loader fullScreen={true} />}>
                <Routes>
                  {/* Public Routes without sidebar */}
                  <Route path="/" element={<Layout><Home /></Layout>} />
                  <Route path="/login" element={<Layout><Login /></Layout>} />
                  <Route path="/register" element={<Layout><Register /></Layout>} />
                  
                  {/* Protected Routes with sidebar */}
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/problems" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Problems />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/problem/:id" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Problem />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/submit/:problemId" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Submit />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/submissions" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Submissions />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/leaderboard" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Leaderboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/contests" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Contests />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/profile/:username" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Profile />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* Redirects */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/signin" element={<Navigate to="/login" replace />} />
                  <Route path="/signup" element={<Navigate to="/register" replace />} />
                  <Route path="/account" element={<Navigate to="/settings" replace />} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={
                    <Layout>
                      <div className="text-center py-12">
                        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                        <p className="text-gray-400 mb-6">Page not found</p>
                        <a href="/" className="px-6 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg hover:opacity-90">
                          Go Home
                        </a>
                      </div>
                    </Layout>
                  } />
                </Routes>
              </Suspense>
              
              <Footer />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151',
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