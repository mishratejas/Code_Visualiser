import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCode, FiGithub, FiTwitter, FiLinkedin, FiMail, 
  FiMessageSquare, FiGlobe, FiHeart
} from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: 'Problems', to: '/problems' },
    { name: 'Editor', to: '/editor' },
    { name: 'Contests', to: '/contests' },
    { name: 'Interview', to: '/interview' },
  ];

  const companyLinks = [
    { name: 'About', to: '/about' },
    { name: 'Contact', to: '/contact' },
    { name: 'Terms', to: '/terms' },
    { name: 'Privacy', to: '/privacy' },
  ];

  const socialLinks = [
    { icon: <FiGithub />, name: 'GitHub', to: 'https://github.com' },
    { icon: <FiTwitter />, name: 'Twitter', to: 'https://twitter.com' },
    { icon: <FiLinkedin />, name: 'LinkedIn', to: 'https://linkedin.com' },
    { icon: <FiMail />, name: 'Email', to: 'mailto:contact@codeforge.com' },
  ];

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center">
                  <FiCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">CodeForge</h2>
                  <p className="text-rose-400 text-sm">Master Coding Skills</p>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                The platform for developers to master algorithms, data structures, and system design through practice and competition.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-gray-700 transition-all"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-gray-400 hover:text-rose-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-gray-400 hover:text-rose-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 my-8"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © {currentYear} CodeForge. All rights reserved.
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Made with <FiHeart className="inline text-rose-400" /> for developers
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/security" className="text-gray-500 hover:text-rose-400 transition">
                Security
              </Link>
              <Link to="/cookies" className="text-gray-500 hover:text-rose-400 transition">
                Cookies
              </Link>
              <Link to="/sitemap" className="text-gray-500 hover:text-rose-400 transition">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;