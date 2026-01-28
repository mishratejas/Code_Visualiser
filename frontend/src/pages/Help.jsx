import React, { useState } from 'react';
import { FiHelpCircle, FiChevronDown, FiChevronUp, FiBook, FiCode, FiMessageCircle } from 'react-icons/fi';

const Help = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      icon: <FiBook />,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click the "Register" button in the top right corner, fill in your details, and verify your email.'
        },
        {
          q: 'How do I solve a problem?',
          a: 'Go to the Problems page, select a problem, write your code in the editor, and click Submit.'
        },
        {
          q: 'What programming languages are supported?',
          a: 'We support C++17, Python 3, Java 11, and JavaScript (Node.js).'
        }
      ]
    },
    {
      category: 'Contests',
      icon: <FiCode />,
      questions: [
        {
          q: 'How do I participate in a contest?',
          a: 'Register for the contest before it starts. When it begins, you can submit solutions and see your rank on the live leaderboard.'
        },
        {
          q: 'How is scoring calculated?',
          a: 'Points are awarded based on problem difficulty and submission time. Wrong submissions may add time penalties.'
        },
        {
          q: 'Can I practice contest problems after they end?',
          a: 'Yes! All contest problems become available for practice once the contest ends.'
        }
      ]
    },
    {
      category: 'Submissions',
      icon: <FiMessageCircle />,
      questions: [
        {
          q: 'What are the different verdicts?',
          a: 'Accepted (AC) - Correct solution, Wrong Answer (WA) - Incorrect output, Time Limit Exceeded (TLE) - Too slow, Runtime Error (RE) - Code crashed, Compilation Error (CE) - Code won\'t compile.'
        },
        {
          q: 'Why is my solution timing out?',
          a: 'Your algorithm may be too slow. Try optimizing your approach or using more efficient data structures.'
        },
        {
          q: 'Can I see other users\' solutions?',
          a: 'Solutions are private, but you can view editorial explanations after solving a problem.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <FiHelpCircle />
              Help Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Find answers to common questions
            </p>
          </div>
        </div>

        {faqs.map((category, catIndex) => (
          <div key={catIndex} className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-5"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const key = `${catIndex}-${faqIndex}`;
                  const isOpen = openFaq === key;

                  return (
                    <div
                      key={key}
                      className="border-b border-gray-200 dark:border-gray-700 pb-4"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {faq.q}
                        </span>
                        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                      {isOpen && (
                        <p className="mt-3 text-gray-600 dark:text-gray-400">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="mb-6">Our support team is here to help!</p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;