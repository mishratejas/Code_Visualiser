import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail, FiCode } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    Platform: [
      { name: 'Problems', to: '/problems' },
      { name: 'Contests', to: '/contests' },
      { name: 'Discuss', to: '/discuss' },
      { name: 'Leaderboard', to: '/leaderboard' },
    ],
    Company: [
      { name: 'About', to: '/about' },
      { name: 'Careers', to: '/careers' },
      { name: 'Privacy', to: '/privacy' },
      { name: 'Terms', to: '/terms' },
    ],
    Support: [
      { name: 'Help Center', to: '/help' },
      { name: 'Contact Us', to: '/contact' },
      { name: 'FAQ', to: '/faq' },
      { name: 'Community', to: '/community' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <FiCode className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">CodeForge</span>
            </Link>
            <p className="mb-6 max-w-md">
              Master coding skills with our interactive platform. Solve problems, compete in contests, 
              and join a community of passionate developers.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <FiGithub className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <FiTwitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <FiLinkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@CodeForge.com"
                className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, categoryLinks]) => (
            <div key={category}>
              <h3 className="text-white font-bold mb-4">{category}</h3>
              <ul className="space-y-2">
                {categoryLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="hover:text-white transition hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                &copy; {currentYear} CodeForge. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/cookies" className="hover:text-white transition">
                Cookie Policy
              </Link>
              <Link to="/security" className="hover:text-white transition">
                Security
              </Link>
              <Link to="/sitemap" className="hover:text-white transition">
                Sitemap
              </Link>
              <Link to="/status" className="hover:text-white transition">
                Status
              </Link>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-8 flex flex-wrap gap-4 items-center justify-center">
          <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
            🚀 10,000+ Active Coders
          </div>
          <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
            💻 500+ Problems
          </div>
          <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
            🏆 100+ Contests
          </div>
          <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
            ⭐ 4.8/5 Rating
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;