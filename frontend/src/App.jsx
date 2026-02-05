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
const Contests = lazy(() => import('./pages/Contests'));
const CreateContest = lazy(() => import('./pages/CreateContest'));
const ContestDetail = lazy(() => import('./pages/ContestDetail')); // ✅ NEW
const LiveContest = lazy(() => import('./pages/LiveContest'));
const AddProblemsToContest = lazy(() => import('./pages/AddProblemsToContest'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// NEW PAGES
const ProblemCategories = lazy(() => import('./pages/ProblemCategories'));
const FavoriteProblems = lazy(() => import('./pages/FavoriteProblems'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Help = lazy(() => import('./pages/Help'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Create a wrapper component that shows sidebar for protected routes
const Layout = ({ children, showSidebar = false }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex flex-1">
      {showSidebar && <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <EditorProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-950 text-white overflow-x-hidden">
              <Header />
              
              <Suspense fallback={<Loader fullScreen={true} />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Layout><Home /></Layout>} />
                  <Route path="/login" element={<Layout><Login /></Layout>} />
                  <Route path="/register" element={<Layout><Register /></Layout>} />
                  
                  {/* Dashboard */}
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* PROBLEMS ROUTES */}
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

                  <Route path="/problems/categories" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <ProblemCategories />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/problems/favorite" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <FavoriteProblems />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/problems/practice" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <PracticePage />
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
                  
                  {/* SUBMISSIONS */}
                  <Route path="/submissions" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Submissions />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* LEADERBOARD */}
                  <Route path="/leaderboard" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Leaderboard />
                      </Layout>
                    </PrivateRoute>
                  } />

                  {/* ACHIEVEMENTS */}
                  <Route path="/achievements" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Achievements />
                      </Layout>
                    </PrivateRoute>
                  } />

                  {/* HELP */}
                  <Route path="/help" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Help />
                      </Layout>
                    </PrivateRoute>
                  } />

                  {/* NOTIFICATIONS */}
                  <Route path="/notifications" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Notifications />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* ============================================
                      CONTESTS ROUTES
                      ============================================ */}
                  <Route path="/contests" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Contests />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  <Route path="/contests/create" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <CreateContest />
                      </Layout>
                    </PrivateRoute>
                  } />
                  {/* ✅ Add Problems to Contest */}
                  <Route path="/contests/:id/add-problems" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <AddProblemsToContest />
                      </Layout>
                    </PrivateRoute>
                  } />

                  {/* ✅ Live Contest */}
                  <Route path="/contests/:id/live" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <LiveContest />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* ✅ NEW: Contest Detail Page (MUST come before /contests/:id/live) */}
                  <Route path="/contests/:id" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <ContestDetail />
                      </Layout>
                    </PrivateRoute>
                  } />
                  
                  {/* PROFILE & SETTINGS */}
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <Layout showSidebar={true}>
                        <Profile />
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
                  
                  {/* 404 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              
              <Footer />
              
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </EditorProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;