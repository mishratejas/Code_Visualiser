import React, { useState } from 'react';
import {
  FiHelpCircle, FiChevronDown, FiChevronUp, FiChevronRight,
  FiBook, FiCode, FiMessageCircle, FiMail, FiMessageSquare,
  FiVideo, FiBookOpen, FiUsers, FiGlobe
} from 'react-icons/fi';
import { MdSupportAgent, MdOutlineContactSupport } from 'react-icons/md';

const Help = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <FiBook className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'problems',
      name: 'Problems & Solutions',
      icon: <FiCode className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'contests',
      name: 'Contests',
      icon: <FiUsers className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'editor',
      name: 'Code Editor',
      icon: <FiBookOpen className="h-5 w-5" />,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'account',
      name: 'Account & Settings',
      icon: <FiMessageSquare className="h-5 w-5" />,
      color: 'from-red-500 to-rose-500',
    },
  ];

  const faqs = {
    'getting-started': [
      {
        q: 'How do I create an account?',
        a: 'Click the "Register" button in the top right corner, fill in your details, and verify your email. Registration is free and takes less than a minute.'
      },
      {
        q: 'How do I solve my first problem?',
        a: 'Go to the Problems page, select a problem of your preferred difficulty, read the description, write your solution in the code editor, and click "Submit" to test it against our test cases.'
      },
      {
        q: 'What programming languages are supported?',
        a: 'We support C++17, Python 3, Java 11, and JavaScript (Node.js). Each language has its own runtime environment with appropriate libraries.'
      },
      {
        q: 'Is there a mobile app available?',
        a: 'Yes! Our platform is fully responsive and works great on mobile browsers. You can also install it as a PWA on your home screen.'
      },
      {
        q: 'How do I track my progress?',
        a: 'Visit your Dashboard to see detailed statistics, progress charts, and achievement badges. You can also check your profile for comprehensive analytics.'
      }
    ],
    'problems': [
      {
        q: 'What are the different verdicts?',
        a: 'Accepted (AC) - Correct solution, Wrong Answer (WA) - Incorrect output, Time Limit Exceeded (TLE) - Too slow, Runtime Error (RE) - Code crashed, Compilation Error (CE) - Code won\'t compile, Memory Limit Exceeded (MLE) - Used too much memory.'
      },
      {
        q: 'Why is my solution timing out?',
        a: 'Your algorithm may be too slow. Try optimizing your approach, using more efficient data structures, or reducing time complexity from O(n²) to O(n log n) or better.'
      },
      {
        q: 'Can I see other users\' solutions?',
        a: 'Solutions are private to encourage independent learning. However, you can view editorial explanations and discuss approaches in the problem discussion section after solving.'
      },
      {
        q: 'How are problems rated by difficulty?',
        a: 'Problems are rated Easy, Medium, or Hard based on acceptance rate, solution complexity, and community feedback. We continuously adjust ratings based on user performance.'
      },
      {
        q: 'What should I do if I\'m stuck on a problem?',
        a: 'Use the "Hint" feature, check the editorial (available after some attempts), or discuss with the community in the problem\'s discussion section.'
      }
    ],
    'contests': [
      {
        q: 'How do I participate in a contest?',
        a: 'Register for the contest before it starts. When it begins, you can submit solutions and see your rank on the live leaderboard. Contests are timed and competitive.'
      },
      {
        q: 'How is scoring calculated?',
        a: 'Points are awarded based on problem difficulty and submission time. Wrong submissions may add time penalties. The scoring system is designed to reward both speed and accuracy.'
      },
      {
        q: 'Can I practice contest problems after they end?',
        a: 'Yes! All contest problems become available for practice once the contest ends. You can find them in the "Past Contests" section.'
      },
      {
        q: 'What types of contests are available?',
        a: 'We offer Weekly Challenges, Bi-weekly Contests, Monthly Competitions, and Special Events. Each has different formats and difficulty levels.'
      },
      {
        q: 'How do contest ratings work?',
        a: 'Your contest rating changes based on your performance relative to other participants. It follows an Elo-like system where better performance increases your rating.'
      }
    ],
    'editor': [
      {
        q: 'Can I customize the code editor?',
        a: 'Yes! Go to Settings > Editor to change themes, font size, tab size, and enable/disable features like word wrap, minimap, and auto-save.'
      },
      {
        q: 'What keyboard shortcuts are available?',
        a: 'Press Ctrl+/ to toggle comments, Ctrl+Space for autocomplete, Ctrl+F to find, Ctrl+H to replace. You can customize all shortcuts in Settings > Keybindings.'
      },
      {
        q: 'Does the editor support debugging?',
        a: 'Yes! You can add print statements to debug. For supported languages, we provide basic debugging features and error highlighting.'
      },
      {
        q: 'Can I use custom code snippets?',
        a: 'Yes! You can save and manage your code snippets in the editor. Use them to quickly insert frequently used code patterns.'
      },
      {
        q: 'Is there auto-completion available?',
        a: 'Yes! The editor provides intelligent code completion for all supported languages, suggesting functions, variables, and language keywords.'
      }
    ],
    'account': [
      {
        q: 'How do I change my email or password?',
        a: 'Go to Settings > Account to update your email address or change your password. You\'ll need to verify any email changes.'
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes, you can delete your account in Settings > Account > Danger Zone. This action is irreversible and will delete all your data.'
      },
      {
        q: 'How do I update my profile picture?',
        a: 'Go to Settings > Profile to upload a new profile picture. We support JPG, PNG, and GIF files up to 5MB.'
      },
      {
        q: 'Can I export my data?',
        a: 'Yes! You can export all your submissions, progress data, and account information from Settings > Account > Data Export.'
      },
      {
        q: 'How do notification preferences work?',
        a: 'Customize which notifications you receive in Settings > Notifications. Choose between email, push notifications, or both for different event types.'
      }
    ]
  };

  const activeFaqs = faqs[activeCategory] || [];
  const filteredFaqs = activeFaqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      // Find first matching category
      for (const [category, items] of Object.entries(faqs)) {
        if (items.some(item => 
          item.q.toLowerCase().includes(e.target.value.toLowerCase()) ||
          item.a.toLowerCase().includes(e.target.value.toLowerCase())
        )) {
          setActiveCategory(category);
          break;
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600">
                    <FiHelpCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Help Center
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                      Find answers to common questions and learn how to use CodeForge effectively.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                    <MdSupportAgent className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <FiVideo className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-400">Video Tutorials</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                    <FiGlobe className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Community Forums</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 min-w-[250px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">FAQs</span>
                    <span className="text-white font-bold">{Object.values(faqs).flat().length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Categories</span>
                    <span className="text-blue-400 font-bold">{categories.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Avg. Response</span>
                    <span className="text-green-400 font-bold">2 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <div className="relative">
              <FiHelpCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-6 w-6" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 text-lg transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-400">Popular:</span>
              {['How to submit code', 'Contest rules', 'Editor settings', 'Account recovery'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSearchQuery(topic)}
                  className="px-3 py-1.5 bg-gray-700/50 text-gray-300 text-sm rounded-lg hover:bg-gray-600/50 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSearchQuery('');
              }}
              className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                activeCategory === category.id
                  ? `bg-gradient-to-r ${category.color} border-transparent shadow-xl`
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600'
              }`}
            >
              <div className={`p-3 rounded-xl mb-3 ${activeCategory === category.id ? 'bg-white/20' : 'bg-gray-700/50'}`}>
                <div className={activeCategory === category.id ? 'text-white' : 'text-gray-400'}>
                  {category.icon}
                </div>
              </div>
              <span className={`font-medium text-sm text-center ${activeCategory === category.id ? 'text-white' : 'text-gray-400'}`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ List */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {categories.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <div className="text-sm text-gray-400">
                    {filteredFaqs.length} of {activeFaqs.length} questions
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-700/50">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => {
                    const key = `${activeCategory}-${index}`;
                    const isOpen = openFaq === key;
                    
                    return (
                      <div
                        key={key}
                        className="border-b border-gray-700/50 last:border-b-0"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : key)}
                          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                              <span className="text-lg">❓</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {faq.q}
                              </h3>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-400">
                                  {categories.find(c => c.id === activeCategory)?.name}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="text-sm text-gray-400">
                                  Updated recently
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {isOpen ? (
                              <FiChevronUp className="h-5 w-5 text-blue-400" />
                            ) : (
                              <FiChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-6 ml-14">
                            <div className="p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                  <span className="text-lg">💡</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-white mb-2">Answer</h4>
                                  <p className="text-gray-300 leading-relaxed">
                                    {faq.a}
                                  </p>
                                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
                                    <span className="text-sm text-gray-400">Was this helpful?</span>
                                    <div className="flex gap-2">
                                      <button className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-lg hover:bg-green-500/20">
                                        👍 Yes
                                      </button>
                                      <button className="px-3 py-1 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20">
                                        👎 No
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50">
                      <FiHelpCircle className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                    <p className="text-gray-400 mb-4">
                      No FAQs match your search. Try a different keyword or browse the categories.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('getting-started');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      Browse All FAQs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                  <MdOutlineContactSupport className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Quick Help</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <span className="text-gray-300">Submit a ticket</span>
                  <FiMail className="h-4 w-4 text-blue-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <span className="text-gray-300">Live chat</span>
                  <FiMessageSquare className="h-4 w-4 text-green-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <span className="text-gray-300">Community forums</span>
                  <FiUsers className="h-4 w-4 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Popular Articles */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Popular Articles</h3>
              <div className="space-y-3">
                {[
                  'How to write efficient code',
                  'Understanding time complexity',
                  'Contest preparation guide',
                  'Debugging common errors',
                  'Optimizing memory usage',
                ].map((article, index) => (
                  <a
                    key={index}
                    href="#"
                    className="block p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 group-hover:text-white">
                        {article}
                      </span>
                      <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Need more help?</h3>
              <p className="text-blue-100 mb-4">
                Our support team is available 24/7 to help you with any issues.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FiMail className="h-4 w-4 text-blue-400" />
                  <span className="text-white">support@codeforge.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiMessageSquare className="h-4 w-4 text-green-400" />
                  <span className="text-white">Live Chat: Available</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiGlobe className="h-4 w-4 text-purple-400" />
                  <span className="text-white">Response time: &lt;2 hours</span>
                </div>
              </div>
              <button className="w-full mt-6 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all">
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-500/30 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Join our community of developers, participate in discussions, and learn from others' experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-green-600 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 justify-center">
                <FiUsers className="h-5 w-5" />
                Join Community
              </button>
              <button className="px-8 py-3 bg-transparent text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/10 transition-all">
                Browse Tutorials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;