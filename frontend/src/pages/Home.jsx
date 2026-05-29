// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiCode,
  FiZap,
  FiAward,
  FiBarChart2,
  FiCpu,
  FiShield,
  FiArrowRight,
  FiUsers,
  FiTarget,
  FiCheckCircle,
  FiMessageSquare,
  FiBookOpen,
  FiStar,
  FiTrendingUp,
  FiGlobe,
  FiClock,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { TbBrandPython, TbBinary } from "react-icons/tb";
import {
  SiJavascript,
  SiOpenjdk,
  SiCplusplus,
  SiTypescript,
} from "react-icons/si";
import { FaReact, FaNodeJs, FaGitAlt } from "react-icons/fa";

import BinaryBackground from "../animations/BinaryBackground";
import Button from "../components/common/Button";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <FiCode className="text-lg" />,
      title: "Advanced Editor",
      description:
        "Full-featured code editor with real-time collaboration and debugging tools.",
      color: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-400",
      lightColor: "from-rose-500/10 to-red-500/5",
    },
    {
      icon: <FiZap className="text-lg" />,
      title: "Fast Execution",
      description:
        "Execute code in milliseconds with detailed performance analytics.",
      color: "from-orange-500/20 to-red-500/10",
      iconColor: "text-orange-400",
      lightColor: "from-orange-500/10 to-red-500/5",
    },
    {
      icon: <FiAward className="text-lg" />,
      title: "Competitions",
      description:
        "Weekly coding contests with global leaderboards and prizes.",
      color: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-400",
      lightColor: "from-amber-500/10 to-orange-500/5",
    },
    {
      icon: <FiBarChart2 className="text-lg" />,
      title: "Progress Tracking",
      description:
        "Detailed analytics and personalized learning recommendations.",
      color: "from-red-500/20 to-rose-500/10",
      iconColor: "text-red-400",
      lightColor: "from-red-500/10 to-rose-500/5",
    },
    {
      icon: <FiCpu className="text-lg" />,
      title: "Multi-Language",
      description: "Support for 20+ programming languages and frameworks.",
      color: "from-pink-500/20 to-rose-500/10",
      iconColor: "text-pink-400",
      lightColor: "from-pink-500/10 to-rose-500/5",
    },
    {
      icon: <FiShield className="text-lg" />,
      title: "Secure Platform",
      description:
        "Isolated execution environment with enterprise-grade security.",
      color: "from-purple-500/20 to-pink-500/10",
      iconColor: "text-purple-400",
      lightColor: "from-purple-500/10 to-pink-500/5",
    },
  ];

  const languages = [
    {
      icon: <TbBrandPython />,
      name: "Python",
      color: "from-blue-500 to-blue-600",
      lightColor: "from-blue-400 to-blue-500",
    },
    {
      icon: <SiJavascript />,
      name: "JavaScript",
      color: "from-yellow-500 to-amber-500",
      lightColor: "from-yellow-400 to-amber-400",
    },
    {
      icon: <SiOpenjdk />,
      name: "Java",
      color: "from-red-500 to-red-600",
      lightColor: "from-red-400 to-red-500",
    },
    {
      icon: <SiCplusplus />,
      name: "C++",
      color: "from-blue-600 to-indigo-600",
      lightColor: "from-blue-500 to-indigo-500",
    },
    {
      icon: <SiTypescript />,
      name: "TypeScript",
      color: "from-blue-500 to-cyan-500",
      lightColor: "from-blue-400 to-cyan-400",
    },
    {
      icon: <FaReact />,
      name: "React",
      color: "from-cyan-400 to-blue-400",
      lightColor: "from-cyan-300 to-blue-300",
    },
    {
      icon: <FaNodeJs />,
      name: "Node.js",
      color: "from-green-500 to-emerald-500",
      lightColor: "from-green-400 to-emerald-400",
    },
    {
      icon: <FaGitAlt />,
      name: "Git",
      color: "from-orange-500 to-red-500",
      lightColor: "from-orange-400 to-red-400",
    },
  ];

  const formatTime = () => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = () => {
    return time.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Theme-specific classes
  const bgClass = isDark ? "bg-gray-950" : "bg-gray-50";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const subTextClass = isDark ? "text-gray-300" : "text-gray-600";
  const cardBgClass = isDark
    ? "bg-gray-900/40 backdrop-blur-sm border-gray-700/50"
    : "bg-white/80 backdrop-blur-sm border-gray-200/50";
  const cardHoverClass = isDark
    ? "hover:border-rose-500/30"
    : "hover:border-rose-400/50";
  const statBgClass = isDark
    ? "bg-gray-900/40 border-gray-700/50"
    : "bg-white/60 border-gray-200/50";

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} overflow-hidden`}>
      {/* Binary Background with theme-aware tint */}
      <div className="relative">
        <BinaryBackground />
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-b from-gray-950/40 via-gray-950/70 to-gray-950"
              : "bg-gradient-to-b from-gray-50/40 via-gray-50/70 to-gray-50"
          }`}
        ></div>
      </div>

  

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center pt-20 pb-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Content */}
                <div>
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                        isDark
                          ? "bg-rose-500/10 border-rose-500/20"
                          : "bg-rose-100 border-rose-200"
                      } border`}
                    >
                      <TbBinary
                        className={isDark ? "text-rose-400" : "text-rose-600"}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isDark ? "text-rose-400" : "text-rose-600"
                        }`}
                      >
                        The Ultimate Coding Platform
                      </span>
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    <span className={textClass}>Code. </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-500">
                      Compete.
                    </span>
                    <span className={`block mt-1 ${textClass}`}>Excel.</span>
                  </h1>
                  <p
                    className={`text-base lg:text-lg ${subTextClass} mb-6 leading-relaxed max-w-lg`}
                  >
                    Join{" "}
                    <span className="text-rose-500 font-semibold">
                      10,000+ developers
                    </span>{" "}
                    mastering algorithms, data structures, and system design.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <Button
                      size="medium"
                      onClick={() => navigate("/register")}
                      className="px-6 py-2.5 text-base font-semibold bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 border-0"
                    >
                      <FiCode className="mr-2" />
                      Start Free Today
                      <FiArrowRight className="ml-2" />
                    </Button>

                    <Button
                      variant="outline"
                      size="medium"
                      onClick={() => navigate("/problems")}
                      className={`px-6 py-2.5 text-base border ${
                        isDark
                          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          : "border-rose-400 text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      <FiBookOpen className="mr-2" />
                      Explore Problems
                    </Button>
                  </div>
                  {/* Highlights */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                      className={`${statBgClass} border rounded-lg p-3 ${cardHoverClass}`}
                    >
                      <div className="flex items-center mb-1 text-rose-500">
                        <FiTarget className="mr-2" />
                        <span className="text-sm font-semibold">Practice</span>
                      </div>
                      <p className={`text-xs ${subTextClass}`}>
                        Solve curated DSA problems designed for interviews.
                      </p>
                    </div>

                    <div
                      className={`${statBgClass} border rounded-lg p-3 ${cardHoverClass}`}
                    >
                      <div className="flex items-center mb-1 text-orange-500">
                        <FiZap className="mr-2" />
                        <span className="text-sm font-semibold">Compete</span>
                      </div>
                      <p className={`text-xs ${subTextClass}`}>
                        Participate in coding contests and climb the
                        leaderboard.
                      </p>
                    </div>

                    <div
                      className={`${statBgClass} border rounded-lg p-3 ${cardHoverClass}`}
                    >
                      <div className="flex items-center mb-1 text-pink-500">
                        <FiBarChart2 className="mr-2" />
                        <span className="text-sm font-semibold">Analyze</span>
                      </div>
                      <p className={`text-xs ${subTextClass}`}>
                        Get AI insights on code quality and complexity.
                      </p>
                    </div>

                    <div
                      className={`${statBgClass} border rounded-lg p-3 ${cardHoverClass}`}
                    >
                      <div className="flex items-center mb-1 text-purple-500">
                        <FiAward className="mr-2" />
                        <span className="text-sm font-semibold">Achieve</span>
                      </div>
                      <p className={`text-xs ${subTextClass}`}>
                        Track progress and unlock achievements.
                      </p>
                    </div>
                  </div>{" "}
                </div>

                {/* Right Content - Time & Date */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    {/* Time Display */}
                    <div
                      className={`${cardBgClass} border rounded-xl p-6 lg:p-8 max-w-sm`}
                    >
                      <div className="text-center mb-6">
                        <div
                          className={`inline-flex p-3 rounded-lg ${
                            isDark ? "bg-rose-500/20" : "bg-rose-100"
                          } mb-4`}
                        >
                          <FiClock
                            className={`h-6 w-6 ${isDark ? "text-rose-400" : "text-rose-600"}`}
                          />
                        </div>

                        <div
                          className={`text-4xl lg:text-5xl font-bold font-mono ${textClass} mb-1`}
                        >
                          {formatTime()}
                        </div>
                        <div className={`text-sm ${subTextClass} mb-4`}>
                          {formatDate()}
                        </div>

                        <div
                          className={`flex items-center justify-center space-x-4 text-xs ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></div>
                            <span>Platform Active</span>
                          </div>
                          <div className="flex items-center">
                            <FiUsers
                              className={`mr-1.5 ${isDark ? "text-rose-400" : "text-rose-600"}`}
                            />
                            <span>Live Developers</span>
                          </div>
                        </div>
                      </div>

                      {/* Global Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`${isDark ? "bg-gray-800/50" : "bg-gray-100/80"} rounded-lg p-3 text-center`}
                        >
                          <div
                            className={`text-lg font-bold ${isDark ? "text-rose-400" : "text-rose-600"}`}
                          >
                            24/7
                          </div>
                          <div
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Online Support
                          </div>
                        </div>
                        <div
                          className={`${isDark ? "bg-gray-800/50" : "bg-gray-100/80"} rounded-lg p-3 text-center`}
                        >
                          <div
                            className={`text-lg font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}
                          >
                            99.9%
                          </div>
                          <div
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Uptime
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div
                      className={`absolute -top-3 -right-3 h-24 w-24 ${
                        isDark ? "bg-rose-500/10" : "bg-rose-200/50"
                      } rounded-full blur-xl`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className={`py-16 ${
            isDark
              ? "bg-gradient-to-b from-gray-950 to-gray-900/50"
              : "bg-gradient-to-b from-gray-50 to-gray-100/50"
          }`}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">
                  <span className={textClass}>Powerful </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-500">
                    Features
                  </span>
                </h2>
                <p className={`text-base ${subTextClass} max-w-2xl mx-auto`}>
                  Everything you need to master coding, from beginner to expert
                  level.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`group ${cardBgClass} border rounded-xl p-6 ${cardHoverClass} transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${isDark ? feature.color : feature.lightColor} ${feature.iconColor} mb-4`}
                    >
                      {feature.icon}
                    </div>

                    <h3 className={`text-lg font-bold mb-2 ${textClass}`}>
                      {feature.title}
                    </h3>
                    <p
                      className={`text-sm ${subTextClass} mb-4 leading-relaxed`}
                    >
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${isDark ? "text-rose-400" : "text-rose-600"}`}
                      >
                        Learn More
                      </span>
                      <FiArrowRight
                        className={`${feature.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">
                  <span className={textClass}>Master </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                    Technologies
                  </span>
                </h2>
                <p className={`text-base ${subTextClass} max-w-xl mx-auto`}>
                  Build expertise in the most in-demand programming languages.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className={`group relative ${cardBgClass} border rounded-xl p-6 ${cardHoverClass} transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div
                      className={`h-12 w-12 rounded-lg bg-gradient-to-r ${isDark ? lang.color : lang.lightColor} flex items-center justify-center mb-4 mx-auto`}
                    >
                      <div className="text-lg text-white">{lang.icon}</div>
                    </div>
                    <h4
                      className={`text-base font-bold ${textClass} text-center`}
                    >
                      {lang.name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div
                className={`relative rounded-2xl overflow-hidden ${
                  isDark
                    ? "bg-gradient-to-r from-rose-900/20 via-gray-900/40 to-red-900/20"
                    : "bg-gradient-to-r from-rose-100 via-white to-red-100"
                }`}
              >
                <div
                  className={`absolute inset-0 ${
                    isDark
                      ? "bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_50%)]"
                      : "bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.1),transparent_50%)]"
                  }`}
                ></div>

                <div className="relative z-10 py-12 px-6 text-center">
                  <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>
                    Ready to{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-500">
                      Transform
                    </span>{" "}
                    Your Skills?
                  </h2>

                  <p
                    className={`text-sm ${subTextClass} mb-6 max-w-md mx-auto`}
                  >
                    Join thousands of developers accelerating their careers.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                    <Button
                      size="medium"
                      onClick={() => navigate("/register")}
                      className="px-8 py-2.5 text-base font-semibold bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 border-0"
                    >
                      <FiCode className="mr-2" />
                      Start Free Today
                    </Button>

                    <Button
                      variant="outline"
                      size="medium"
                      onClick={() => navigate("/contact")}
                      className={`px-8 py-2.5 text-base border ${
                        isDark
                          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          : "border-rose-400 text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      <FiMessageSquare className="mr-2" />
                      Schedule a Demo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-xs">
                    <div
                      className={`flex items-center justify-center space-x-1.5 ${subTextClass}`}
                    >
                      <FiCheckCircle className="text-green-500" />
                      <span>No credit card required</span>
                    </div>
                    <div
                      className={`flex items-center justify-center space-x-1.5 ${subTextClass}`}
                    >
                      <FiCheckCircle className="text-green-500" />
                      <span>Free forever plan</span>
                    </div>
                    <div
                      className={`flex items-center justify-center space-x-1.5 ${subTextClass}`}
                    >
                      <FiCheckCircle className="text-green-500" />
                      <span>24/7 community support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
