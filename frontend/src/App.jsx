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
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Problems = lazy(() => import("./pages/problem/Problems"));
const Problem = lazy(() => import("./pages/problem/Problem"));
const Submit = lazy(() => import("./pages/problem/Submit"));
const Submissions = lazy(() => import("./pages/problem/Submissions"));
const Contests = lazy(() => import("./pages/contest/Contests"));
const CreateContest = lazy(() => import("./pages/contest/CreateContest"));
const ContestDetail = lazy(() => import("./pages/contest/ContestDetail"));
const LiveContest = lazy(() => import("./pages/contest/LiveContest"));
const AddProblemsToContest = lazy(() => import("./pages/contest/AddProblemsToContest"));
const Profile = lazy(() => import("./pages/user/Profile"));
const Settings = lazy(() => import("./pages/user/Settings"));
const ContestProblem = lazy(() => import("./pages/contest/ContestProblem"));
const GoogleAuthSuccess = lazy(() => import("./pages/auth/GoogleAuthSuccess"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const OrganizerRegister = lazy(() => import("./pages/auth/OrganizerRegister"));

// Other pages
const ProblemCategories = lazy(() => import("./pages/problem/ProblemCategories"));
const FavoriteProblems = lazy(() => import("./pages/problem/FavoriteProblems"));
const PracticePage = lazy(() => import("./pages/problem/PracticePage"));
const Leaderboard = lazy(() => import("./pages/social/Leaderboard"));
const Achievements = lazy(() => import("./pages/user/Achievements"));
const Help = lazy(() => import("./pages/Help"));
const Notifications = lazy(() => import("./pages/user/Notifications"));
const Interview = lazy(() => import("./pages/ai/Interview"));
const Discuss = lazy(() => import("./pages/social/Discuss"));
const Groups = lazy(() => import("./pages/social/Groups"));
const GroupDetail = lazy(() => import("./pages/social/GroupDetail"));
const PlagiarismPanel = lazy(() => import("./pages/ai/PlagiarismPanel"));
const LearningPath = lazy(() => import("./pages/ai/LearningPath"));

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
                    <Route path="/register/organizer" element={<Layout><OrganizerRegister /></Layout>} />
                    <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
                    <Route path="/reset-password/:token" element={<Layout><ResetPassword /></Layout>} />
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

                    {/* Learning Path */}
                    <Route path="/learning-path" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><LearningPath /></Layout>
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

                    {/* Admin: Plagiarism Panel */}
                    <Route path="/contests/:contestId/plagiarism" element={
                      <PrivateRoute>
                        <Layout showSidebar={true}><PlagiarismPanel /></Layout>
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