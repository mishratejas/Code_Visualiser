import React, { useState, useMemo } from 'react';
import {
  FiHelpCircle, FiChevronDown,
  FiBook, FiCode, FiZap, FiCalendar, FiUser, FiSearch,
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';

const faqs = {
  'getting-started': [
    { q: 'How do I create an account?', a: 'Click "Register" at the top right, fill in your username, email and password. You can also sign in with Google for a faster experience.' },
    { q: 'How do I solve my first problem?', a: 'Go to Problems, pick one (Easy is a great start), read the problem statement, write your solution in the code editor, and hit Submit or Run to test it.' },
    { q: 'What programming languages are supported?', a: 'We support Python 3, C++17, Java 11, and JavaScript (Node.js). More languages are being added regularly.' },
    { q: 'What is a streak?', a: 'A streak counts how many consecutive days you have submitted at least one solution. Streaks reset at midnight if you miss a day.' },
  ],
  'problems': [
    { q: 'Why does my code pass locally but fail here?', a: 'Our judge uses strict input/output matching. Ensure you read ALL inputs and print outputs exactly as specified — no extra whitespace or text.' },
    { q: 'What does TLE mean?', a: 'TLE stands for Time Limit Exceeded. Your solution takes too long on some test cases. Try to optimize it (e.g., avoid O(n²) loops for large n).' },
    { q: 'How are acceptance rates calculated?', a: "Acceptance rate = (accepted submissions) / (total unique submissions). It's not per-user, so trying multiple times still helps you but lowers the acceptance rate." },
    { q: 'Can I see other users solutions?', a: 'After you solve a problem, you can view the solutions of others who have solved it. This encourages learning from different approaches.' },
    { q: 'What are hidden test cases?', a: "Problems have both visible sample test cases (shown in the problem) and hidden test cases used for final judging. Your solution must handle edge cases too." },
  ],
  'contests': [
    { q: 'How do I register for a contest?', a: 'Go to Contests, find an upcoming contest, and click Register. Private contests require a password from the organizer.' },
    { q: 'Can I create my own contest?', a: 'Yes! Any user with an Organizer account can create contests. Sign up as an organizer or use the contest creation form if you already have admin access.' },
    { q: 'How is the contest leaderboard ranked?', a: 'Rankings are based on: number of problems solved (more = better), then total penalty time (less = better). Penalty is added for each wrong submission.' },
    { q: 'What happens if I submit after the contest ends?', a: "Submissions after the end time are not counted toward the contest. You can still submit for practice, but they won't affect your rank." },
  ],
  'editor': [
    { q: 'How do I change the editor theme or font size?', a: 'Go to Settings → Editor. You can change your default language, font size, and app theme (light/dark) there.' },
    { q: 'Can I use my own IDE?', a: 'You must submit through our editor for official judging. However, you can develop locally and paste your code into the editor.' },
    { q: 'What is the "Run" button vs "Submit"?', a: '"Run" tests your code against the visible sample test cases only. "Submit" runs it against all (including hidden) test cases and records a verdict.' },
  ],
  'account': [
    { q: 'How do I change my password?', a: 'Go to Settings → Security. Enter your current password and then your new password. If you signed in with Google, you may need to set a password first.' },
    { q: 'Can I change my username?', a: 'Yes, go to Settings → Profile. Note: changing your username updates your profile URL, so old links may not work.' },
    { q: 'How do I delete my account?', a: "Go to Settings → Danger Zone. You'll need to confirm by typing your username. This action is permanent and cannot be undone." },
  ],
};

const categories = [
  { id: 'getting-started', name: 'Getting Started', icon: <FiBook />, color: 'from-blue-500 to-cyan-500' },
  { id: 'problems',        name: 'Problems',        icon: <FiCode />, color: 'from-purple-500 to-pink-500' },
  { id: 'contests',        name: 'Contests',        icon: <FiCalendar />, color: 'from-green-500 to-emerald-500' },
  { id: 'editor',          name: 'Code Editor',     icon: <FiZap />, color: 'from-yellow-500 to-orange-500' },
  { id: 'account',         name: 'Account',         icon: <FiUser />, color: 'from-red-500 to-rose-500' },
];

const Help = () => {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results = [];
    Object.entries(faqs).forEach(([cat, items]) => {
      items.forEach(item => {
        if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
          results.push({ ...item, category: cat });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const displayFaqs = searchResults || faqs[activeCategory] || [];

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputClass = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const faqBg = isDark ? 'bg-gray-800/50' : 'bg-gray-50';
  const activeCategoryClass = isDark ? 'bg-gray-800 text-white border-rose-500' : 'bg-rose-50 text-rose-700 border-rose-300';
  const inactiveCategoryClass = isDark ? 'text-gray-400 hover:bg-gray-800 border-transparent' : 'text-gray-600 hover:bg-gray-50 border-transparent';

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-500">
              <FiHelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Help Center</h1>
              <p className={`text-sm ${subTextClass}`}>Find answers to common questions</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextClass} h-5 w-5`} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3.5 ${inputClass} rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${subTextClass} hover:${textClass}`}
            >
              Clear
            </button>
          )}
        </div>

        {searchResults ? (
          <div className="space-y-4">
            <p className={`text-sm ${subTextClass}`}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            {searchResults.length > 0 ? (
              searchResults.map((item, idx) => (
                <FaqItem key={idx} item={item} idx={`search-${idx}`} openFaq={openFaq} setOpenFaq={setOpenFaq} isDark={isDark} textClass={textClass} subTextClass={subTextClass} faqBg={faqBg} />
              ))
            ) : (
              <div className={`${cardClass} border rounded-xl p-12 text-center`}>
                <FiSearch className={`mx-auto h-12 w-12 ${subTextClass} mb-4 opacity-30`} />
                <p className={`${textClass} font-medium mb-2`}>No results found</p>
                <p className={`text-sm ${subTextClass}`}>Try different keywords or browse the categories below.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="space-y-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                    activeCategory === cat.id ? activeCategoryClass : inactiveCategoryClass
                  }`}
                >
                  <span className={`${activeCategory === cat.id ? 'text-rose-500' : subTextClass}`}>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* FAQ Content */}
            <div className="md:col-span-3 space-y-3">
              {(() => {
                const cat = categories.find(c => c.id === activeCategory);
                return cat ? (
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center gap-3 mb-2`}>
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white`}>{cat.icon}</div>
                    <h2 className={`text-lg font-bold ${textClass}`}>{cat.name}</h2>
                    <span className={`ml-auto text-sm ${subTextClass}`}>{displayFaqs.length} questions</span>
                  </div>
                ) : null;
              })()}

              {displayFaqs.map((item, idx) => (
                <FaqItem key={idx} item={item} idx={idx} openFaq={openFaq} setOpenFaq={setOpenFaq} isDark={isDark} textClass={textClass} subTextClass={subTextClass} faqBg={faqBg} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const FaqItem = ({ item, idx, openFaq, setOpenFaq, isDark, textClass, subTextClass, faqBg }) => {
  const isOpen = openFaq === idx;
  return (
    <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden transition-all`}>
      <button
        className={`w-full flex items-center justify-between p-4 text-left ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}
        onClick={() => setOpenFaq(isOpen ? null : idx)}
      >
        <span className={`font-medium text-sm pr-4 ${textClass}`}>{item.q}</span>
        <span className={`flex-shrink-0 ${subTextClass}`}>
          <FiChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 text-sm ${subTextClass} leading-relaxed border-t ${isDark ? 'border-gray-800' : 'border-gray-100'} pt-3`}>
          {item.a}
        </div>
      )}
    </div>
  );
};

export default Help;