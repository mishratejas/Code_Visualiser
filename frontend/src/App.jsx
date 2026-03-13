import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { EditorProvider } from "./context/EditorContext";
import PrivateRoute from "./components/common/PrivateRoute";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Sidebar from "./components/common/Sidebar";
import Loader from "./components/common/Loader";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Problems = lazy(() => import("./pages/Problems"));
const Problem = lazy(() => import("./pages/Problem"));
const Submit = lazy(() => import("./pages/Submit"));
const Submissions = lazy(() => import("./pages/Submissions"));
const Contests = lazy(() => import("./pages/Contests"));
const CreateContest = lazy(() => import("./pages/CreateContest"));
const ContestDetail = lazy(() => import("./pages/ContestDetail"));
const LiveContest = lazy(() => import("./pages/LiveContest"));
const AddProblemsToContest = lazy(() => import("./pages/AddProblemsToContest"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ContestProblem = lazy(() => import("./pages/ContestProblem"));
const GoogleAuthSuccess = lazy(() => import("./pages/GoogleAuthSuccess"));

// Other pages
const ProblemCategories = lazy(() => import("./pages/ProblemCategories"));
const FavoriteProblems = lazy(() => import("./pages/FavoriteProblems"));
const PracticePage = lazy(() => import("./pages/PracticePage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Help = lazy(() => import("./pages/Help"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Interview = lazy(() => import("./pages/Interview"));
const Discuss = lazy(() => import("./pages/Discuss"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));

// Layout wrapper
const Layout = ({ children, showSidebar = false }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex flex-1 min-h-0">
      {showSidebar && (
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className={showSidebar ? "p-6 min-h-full" : "min-h-full"}>
          {children}
        </div>
        {!showSidebar && <Footer />}
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
            {/* h-screen + flex-col: header is fixed height, rest fills remaining */}
            <div className="h-screen flex flex-col bg-gray-950 text-white">
              <Header />

              {/* flex-1 min-h-0: allows child Layout to shrink and use overflow properly */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <Suspense fallback={<Loader fullScreen={true} />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/login" element={<Layout><Login /></Layout>} />
                    <Route path="/register" element={<Layout><Register /></Layout>} />
                    <Route path="/auth/google-success" element={<Layout><GoogleAuthSuccess /></Layout>} />

                    {/* Dashboard */}
                    <Route path="/dashboard" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Dashboard /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Problems */}
                    <Route path="/problems" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Problems /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/problem/:id" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Problem /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/problems/categories" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><ProblemCategories /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/problems/favorite" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><FavoriteProblems /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/problems/practice" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><PracticePage /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Submit */}
                    <Route path="/submit/:problemId" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Submit /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Submissions */}
                    <Route path="/submissions" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Submissions /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Leaderboard */}
                    <Route path="/leaderboard" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Leaderboard /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Achievements */}
                    <Route path="/achievements" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Achievements /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Help */}
                    <Route path="/help" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Help /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Notifications */}
                    <Route path="/notifications" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Notifications /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Contests — single page, no subcategory routes */}
                    <Route path="/contests" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Contests /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/contests/create" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><CreateContest /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/contests/:id/add-problems" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><AddProblemsToContest /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/contests/:id/live" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><LiveContest /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/contests/:contestId/problems/:problemId" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><ContestProblem /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/contests/:id" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><ContestDetail /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Profile & Settings */}
                    <Route path="/profile" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Profile /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/profile/:username" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Profile /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Settings /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Discuss */}
                    <Route path="/discuss" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Discuss /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Interview */}
                    <Route path="/interview" element={
                      <PrivateRoute>
                        <Layout showSidebar={false}><Interview /></Layout>
                      </PrivateRoute>
                    } />

                    {/* Groups & Organizations */}
                    <Route path="/groups" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><Groups /></Layout>
                      </PrivateRoute>
                    } />
                    <Route path="/groups/:id" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><GroupDetail /></Layout>
                      </PrivateRoute>
                    } />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </div>

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1f2937",
                  color: "#fff",
                  border: "1px solid #374151",
                },
                success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
                error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
              }}
            />
          </Router>
        </EditorProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;