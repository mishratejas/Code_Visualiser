import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCode, FiChevronRight, FiCheck, FiAward, 
  FiUsers, FiZap, FiLock, FiGlobe, FiTrendingUp,
  FiBarChart2, FiCpu, FiCloud, FiShield
} from 'react-icons/fi';
import { 
  MdOutlineEmojiEvents, MdOutlineSecurity,
  MdOutlineSpeed, MdOutlinePalette
} from 'react-icons/md';
import { TbCode, TbBrandPython } from 'react-icons/tb';
import { SiJavascript, SiOpenjdk, SiCplusplus } from 'react-icons/si';

// Import animations
import {
  ParticleRain,
  NeonGrid,
  FloatingCode,
  InteractiveParticles,
  HolographicText,
  CircuitBoard,
  BinaryMatrix
} from '../animations';

import Button from '../components/common/Button';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <FiCode className="h-8 w-8" />,
      title: 'Real-time Code Editor',
      description: 'Powerful Monaco editor with syntax highlighting, auto-completion, and multiple themes.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <MdOutlineSpeed className="h-8 w-8" />,
      title: 'Instant Evaluation',
      description: 'Get immediate feedback on your solutions with our lightning-fast execution engine.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <MdOutlineEmojiEvents className="h-8 w-8" />,
      title: 'Weekly Contests',
      description: 'Compete with developers worldwide in timed coding challenges.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <FiBarChart2 className="h-8 w-8" />,
      title: 'Progress Tracking',
      description: 'Detailed analytics and visualizations of your coding journey.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: <FiCpu className="h-8 w-8" />,
      title: 'Multiple Languages',
      description: 'Support for 10+ programming languages including Python, Java, C++, and JavaScript.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: <FiShield className="h-8 w-8" />,
      title: 'Secure Environment',
      description: 'Code execution in isolated containers ensuring security and fairness.',
      color: 'from-amber-500 to-yellow-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Coders' },
    { value: '500+', label: 'Problems' },
    { value: '100+', label: 'Contests' },
    { value: '50+', label: 'Companies' },
  ];

  const languages = [
    { icon: <TbBrandPython />, name: 'Python', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { icon: <SiJavascript />, name: 'JavaScript', color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { icon: <SiOpenjdk />, name: 'Java', color: 'bg-gradient-to-r from-red-500 to-orange-500' },
    { icon: <SiCplusplus />, name: 'C++', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { icon: <TbCode />, name: 'C', color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Background Animations */}
      <BinaryMatrix />
      <ParticleRain />
      <NeonGrid />
      <CircuitBoard />
      <InteractiveParticles />
      <FloatingCode />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🚀 Trusted by 10,000+ Developers
              </span>
            </div>
            
            <HolographicText 
              text="Master Coding Skills" 
              size="text-5xl sm:text-7xl lg:text-8xl" 
              className="mb-6"
            />
            
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Solve <span className="text-cyan-400 font-semibold">challenging problems</span>, compete in{' '}
              <span className="text-purple-400 font-semibold">global contests</span>, and{' '}
              <span className="text-green-400 font-semibold">track your progress</span> with our interactive platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="large"
              onClick={() => navigate('/register')}
              className="group relative overflow-hidden"
            >
              <span className="relative z-10">Start Coding Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="large"
              onClick={() => navigate('/problems')}
              className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
            >
              Browse Problems
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FiChevronRight className="h-6 w-6 text-cyan-400 transform rotate-90" />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose CodeForge?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to become a better developer, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
                
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
                
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FiChevronRight className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Supported Languages
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Write code in your favorite programming language with full IDE support.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {languages.map((lang, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                <div className="relative">
                  <div className={`absolute inset-0 rounded-xl ${lang.color} blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-4xl mb-3">{lang.icon}</div>
                    <div className="text-lg font-semibold">{lang.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
            
            <div className="relative z-10 py-16 px-8 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Level Up Your{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Coding Skills?
                </span>
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who are improving their skills with CodeForge.
              </p>
              <Button
                size="large"
                onClick={() => navigate('/register')}
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started For Free
                <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-gray-400 text-sm mt-4">
                No credit card required • Free forever plan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <FiCode className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold">CodeForge</span>
              </div>
              <p className="text-gray-400">Master coding skills, one problem at a time.</p>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/about" className="text-gray-400 hover:text-white transition">
                About
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white transition">
                Contact
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition">
                Privacy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition">
                Terms
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} CodeForge. All rights reserved.</p>
            <p className="mt-2">Built with ❤️ for developers worldwide</p>
          </div>
        </div>
      </footer>

      {/* Additional Styles */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default Home;