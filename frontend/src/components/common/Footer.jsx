import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: 'Problems', to: '/problems' },
    { name: 'Contests', to: '/contests' },
    { name: 'Discuss', to: '/discuss' },
    { name: 'Blog', to: '/blog' },
    { name: 'About', to: '/about' },
    { name: 'Contact', to: '/contact' },
    { name: 'Privacy', to: '/privacy' },
    { name: 'Terms', to: '/terms' },
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <FiCode className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-white">CodeForge</span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Master coding skills with our interactive platform. Solve problems, 
              compete in contests, and track your progress.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-400">
                <FiGithub size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400">
                <FiLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {links.slice(0, 4).map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="text-gray-400 hover:text-green-400 text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {links.slice(4).map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="text-gray-400 hover:text-green-400 text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} CodeForge. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Made with ❤️ for developers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;