import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCode, FiZap, FiAward, FiBarChart2, FiCpu, FiShield,
  FiChevronRight, FiUsers, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import { TbBrandPython } from 'react-icons/tb';
import { SiJavascript, SiOpenjdk, SiCplusplus } from 'react-icons/si';
import { FaCode } from 'react-icons/fa';

import BinaryBackground from '../animations/BinaryBackground';
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
      icon: <FiCode className="h-6 w-6" />,
      title: 'Code Editor',
      description: 'Write, run, and test code instantly',
    },
    {
      icon: <FiZap className="h-6 w-6" />,
      title: 'Instant Evaluation',
      description: 'Get immediate feedback',
    },
    {
      icon: <FiAward className="h-6 w-6" />,
      title: 'Weekly Contests',
      description: 'Compete with developers',
    },
    {
      icon: <FiBarChart2 className="h-6 w-6" />,
      title: 'Progress Tracking',
      description: 'Track your growth',
    },
    {
      icon: <FiCpu className="h-6 w-6" />,
      title: 'Multiple Languages',
      description: 'Python, Java, C++, JS, and more',
    },
    {
      icon: <FiShield className="h-6 w-6" />,
      title: 'Secure Environment',
      description: 'Isolated code execution',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Coders' },
    { value: '500+', label: 'Problems' },
    { value: '100+', label: 'Contests' },
    { value: '50+', label: 'Companies' },
  ];

  const languages = [
    { icon: <TbBrandPython />, name: 'Python', color: 'text-green-400' },
    { icon: <SiJavascript />, name: 'JavaScript', color: 'text-yellow-400' },
    { icon: <SiOpenjdk />, name: 'Java', color: 'text-red-400' },
    { icon: <SiCplusplus />, name: 'C++', color: 'text-blue-400' },
    { icon: <FaCode />, name: 'C', color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Binary Background */}
      <BinaryBackground />
      
      {/* Header Spacing Fix - Removes extra space */}
      <div className="relative z-10">
        
        {/* Hero Section - Full width, no extra margins */}
        <section className="min-h-screen flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                {/* Badge */}
                <div className="inline-block px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
                  <span className="text-sm font-medium text-green-400">
                    Trusted by 10,000+ Developers
                  </span>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                  <span className="text-white">Master </span>
                  <span className="text-green-400">Coding</span>
                  <span className="text-white"> Skills</span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
                  Solve challenging problems, compete in global contests, and track your progress 
                  with our interactive coding platform.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Button
                    size="large"
                    onClick={() => navigate('/register')}
                    className="px-8 py-3"
                  >
                    Start Coding Free
                    <FiChevronRight className="ml-2" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="large"
                    onClick={() => navigate('/problems')}
                    className="px-8 py-3"
                  >
                    Browse Problems
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-green-400">{stat.value}</div>
                      <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
                  Why CodeForge?
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Everything you need to become a better developer
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 hover:border-green-500/30 transition-colors"
                  >
                    <div className="inline-flex p-3 rounded-lg bg-green-500/10 text-green-400 mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6 text-white">
                  Supported Languages
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Write code in your favorite programming language
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 mb-16">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-4 hover:border-green-500/30 transition-colors"
                  >
                    <div className={`text-2xl ${lang.color}`}>
                      {lang.icon}
                    </div>
                    <div className="text-lg font-medium">{lang.name}</div>
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <div className="text-center">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-12 max-w-3xl mx-auto">
                  <h3 className="text-3xl font-bold mb-6 text-white">
                    Ready to Level Up Your Skills?
                  </h3>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Join thousands of developers improving with CodeForge
                  </p>
                  <Button
                    size="large"
                    onClick={() => navigate('/register')}
                    className="px-10 py-4"
                  >
                    Get Started For Free
                    <FiChevronRight className="ml-2" />
                  </Button>
                  <p className="text-gray-500 text-sm mt-4">
                    No credit card required • Free forever plan
                  </p>
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