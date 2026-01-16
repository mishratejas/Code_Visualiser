// Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCode, FiZap, FiAward, FiBarChart2, FiCpu, FiShield,
  FiArrowRight, FiUsers, FiTarget, FiCheckCircle, FiMessageSquare,
  FiBookOpen, FiStar, FiTrendingUp, FiGlobe, FiClock
} from 'react-icons/fi';
import { TbBrandPython, TbBinary } from 'react-icons/tb';
import { SiJavascript, SiOpenjdk, SiCplusplus, SiTypescript } from 'react-icons/si';
import { FaReact, FaNodeJs, FaGitAlt } from 'react-icons/fa';

import BinaryBackground from '../animations/BinaryBackground';
import Button from '../components/common/Button';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <FiCode className="text-xl" />,
      title: 'Advanced Editor',
      description: 'Full-featured code editor with real-time collaboration and debugging tools.',
      color: 'from-rose-500/20 to-red-500/10',
      iconColor: 'text-rose-400'
    },
    {
      icon: <FiZap className="text-xl" />,
      title: 'Fast Execution',
      description: 'Execute code in milliseconds with detailed performance analytics.',
      color: 'from-orange-500/20 to-red-500/10',
      iconColor: 'text-orange-400'
    },
    {
      icon: <FiAward className="text-xl" />,
      title: 'Competitions',
      description: 'Weekly coding contests with global leaderboards and prizes.',
      color: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400'
    },
    {
      icon: <FiBarChart2 className="text-xl" />,
      title: 'Progress Tracking',
      description: 'Detailed analytics and personalized learning recommendations.',
      color: 'from-red-500/20 to-rose-500/10',
      iconColor: 'text-red-400'
    },
    {
      icon: <FiCpu className="text-xl" />,
      title: 'Multi-Language',
      description: 'Support for 20+ programming languages and frameworks.',
      color: 'from-pink-500/20 to-rose-500/10',
      iconColor: 'text-pink-400'
    },
    {
      icon: <FiShield className="text-xl" />,
      title: 'Secure Platform',
      description: 'Isolated execution environment with enterprise-grade security.',
      color: 'from-purple-500/20 to-pink-500/10',
      iconColor: 'text-purple-400'
    },
  ];

  const languages = [
    { icon: <TbBrandPython />, name: 'Python', color: 'bg-gradient-to-r from-red-500 to-orange-500' },
    { icon: <SiJavascript />, name: 'JavaScript', color: 'bg-gradient-to-r from-amber-500 to-yellow-500' },
    { icon: <SiOpenjdk />, name: 'Java', color: 'bg-gradient-to-r from-red-600 to-rose-600' },
    { icon: <SiCplusplus />, name: 'C++', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { icon: <SiTypescript />, name: 'TypeScript', color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
    { icon: <FaReact />, name: 'React', color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { icon: <FaNodeJs />, name: 'Node.js', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { icon: <FaGitAlt />, name: 'Git', color: 'bg-gradient-to-r from-orange-600 to-red-600' },
  ];

  const stats = [
    { number: '10,458+', label: 'Active Developers', icon: <FiUsers /> },
    { number: '500+', label: 'Coding Problems', icon: <FiCode /> },
    { number: '150+', label: 'Weekly Contests', icon: <FiTrendingUp /> },
    { number: '98.7%', label: 'Success Rate', icon: <FiStar /> },
  ];

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Binary Background with red tint */}
      <div className="relative">
        <BinaryBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-950/70 to-gray-950"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <section className="min-h-screen flex items-center pt-20 pb-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Content */}
                <div>
                  <div className="mb-6">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20">
                      <TbBinary className="text-rose-400" />
                      <span className="text-sm font-medium text-rose-400">
                        The Ultimate Coding Platform
                      </span>
                    </div>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    <span className="text-white">Code. </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-orange-400">
                      Compete.
                    </span>
                    <span className="block text-white mt-2">Excel.</span>
                  </h1>
                  
                  <p className="text-lg lg:text-xl text-gray-300 mb-8 leading-relaxed">
                    Join <span className="text-rose-400 font-semibold">10,000+ developers</span> mastering 
                    algorithms, data structures, and system design. Transform your coding skills through 
                    practice, competition, and real-world challenges.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <Button
                      size="large"
                      onClick={() => navigate('/register')}
                      className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0"
                    >
                      <FiCode className="mr-3" />
                      Start Free Today
                      <FiArrowRight className="ml-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => navigate('/problems')}
                      className="px-8 py-4 text-lg border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                      <FiBookOpen className="mr-3" />
                      Explore Problems
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                      <div 
                        key={index}
                        className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-rose-500/30 transition-all"
                      >
                        <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <span className="mr-2 text-rose-400/80">{stat.icon}</span>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Content - Time & Date */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    {/* Time Display */}
                    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 lg:p-10 max-w-md">
                      <div className="text-center mb-8">
                        <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 mb-6">
                          <FiClock className="h-8 w-8 text-rose-400" />
                        </div>
                        
                        <div className="text-5xl lg:text-6xl font-bold font-mono text-white mb-2">
                          {formatTime()}
                        </div>
                        <div className="text-lg text-gray-300 mb-6">
                          {formatDate()}
                        </div>
                        
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                            <span>Platform Active</span>
                          </div>
                          <div className="flex items-center">
                            <FiUsers className="mr-2 text-rose-400" />
                            <span>Live Developers</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Global Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-rose-400">24/7</div>
                          <div className="text-xs text-gray-400">Online Support</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-400">99.9%</div>
                          <div className="text-xs text-gray-400">Uptime</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-amber-400">50+</div>
                          <div className="text-xs text-gray-400">Countries</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-red-400">100+</div>
                          <div className="text-xs text-gray-400">Partners</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -right-4 h-32 w-32 bg-gradient-to-r from-rose-500/10 to-red-500/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-4 -left-4 h-24 w-24 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full blur-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900/50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">
                  <span className="text-white">Powerful </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400">
                    Features
                  </span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Everything you need to master coding, from beginner to expert level.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} ${feature.iconColor} mb-6`}>
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 text-sm font-medium">Learn More</span>
                      <FiArrowRight className={`${feature.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6 text-white">
                  Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Technologies</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Build expertise in the most in-demand programming languages and frameworks.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className={`h-16 w-16 rounded-xl ${lang.color} flex items-center justify-center mb-6 mx-auto`}>
                      <div className="text-2xl text-white">
                        {lang.icon}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white text-center">{lang.name}</h4>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500/0 to-red-500/0 group-hover:from-rose-500/5 group-hover:to-red-500/5 transition-all duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 via-gray-900/40 to-red-900/20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_50%)]"></div>
                
                <div className="relative z-10 py-16 px-8 text-center">
                  <h2 className="text-4xl sm:text-5xl font-bold mb-8">
                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400">Transform</span> Your Skills?
                  </h2>
                  
                  <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of developers who are accelerating their careers. 
                    Start your journey today with our comprehensive learning platform.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                    <Button
                      size="large"
                      onClick={() => navigate('/register')}
                      className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0 transform hover:scale-105 transition-transform"
                    >
                      <FiCode className="mr-3" />
                      Start Free Today
                      <FiArrowRight className="ml-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => navigate('/contact')}
                      className="px-12 py-4 text-lg border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                      <FiMessageSquare className="mr-3" />
                      Schedule a Demo
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-sm text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <FiCheckCircle className="text-green-400" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <FiCheckCircle className="text-green-400" />
                      <span>Free forever plan</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <FiCheckCircle className="text-green-400" />
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