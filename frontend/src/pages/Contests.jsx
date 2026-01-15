import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUsers, FiAward, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { format, isFuture, isPast } from 'date-fns';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, past
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchContests();
  }, [filter]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await api.get('/contests', { params });
      setContests(response.data);
    } catch (error) {
      toast.error('Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'past';
  };

  const getTimeRemaining = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Starts in ${days}d ${hours}h`;
    } else if (now >= start && now <= end) {
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hours}h ${minutes}m`;
    } else {
      return 'Ended';
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Compete with coders from around the world
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiFilter className="mr-2" />
            Filter
            {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
          </button>
          <Link
            to="/contests/create"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
          >
            Create Contest
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              All Contests
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'upcoming'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'ongoing'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'past'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Past
            </button>
          </div>
        </div>
      )}

      {/* Featured Contest */}
      {contests.length > 0 && getContestStatus(contests[0]) === 'upcoming' && (
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <MdOutlineEmojiEvents className="h-6 w-6 mr-2" />
                <span className="font-medium">FEATURED CONTEST</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">{contests[0].title}</h2>
              <p className="text-blue-100 mb-4">{contests[0].description}</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center">
                  <FiCalendar className="mr-2" />
                  <span>{format(new Date(contests[0].startTime), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-2" />
                  <span>{contests[0].duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <FiUsers className="mr-2" />
                  <span>{contests[0].participants?.length || 0} registered</span>
                </div>
                <div className="flex items-center">
                  <FiAward className="mr-2" />
                  <span>{contests[0].prize}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="text-sm text-blue-100">Starts In</div>
                <div className="text-2xl font-bold">{getTimeRemaining(contests[0])}</div>
              </div>
              <div className="flex space-x-3">
                <Link
                  to={`/contests/${contests[0]._id}`}
                  className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
                >
                  View Details
                </Link>
                <button className="px-6 py-3 bg-white/20 backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition">
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => {
          const status = getContestStatus(contest);
          const isFeatured = contest._id === contests[0]?._id && status === 'upcoming';

          if (isFeatured) return null; // Skip featured contest in grid

          return (
            <div
              key={contest._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
            >
              {/* Status Badge */}
              <div className="px-6 pt-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'upcoming'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : status === 'ongoing'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                  {status === 'upcoming' ? 'Upcoming' : status === 'ongoing' ? 'Ongoing' : 'Past'}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Link
                    to={`/contests/${contest._id}`}
                    className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {contest.title}
                  </Link>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {contest.type}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                  {contest.description}
                </p>

                {/* Contest Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <FiCalendar className="mr-3" />
                    <span>{format(new Date(contest.startTime), 'MMM dd, yyyy • hh:mm a')}</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <FiClock className="mr-3" />
                    <span>{contest.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <FiUsers className="mr-3" />
                    <span>{contest.participants?.length || 0} participants</span>
                  </div>
                  {contest.prize && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <FiAward className="mr-3" />
                      <span>{contest.prize}</span>
                    </div>
                  )}
                </div>

                {/* Time Remaining */}
                <div className="mb-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Remaining</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {getTimeRemaining(contest)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Link
                    to={`/contests/${contest._id}`}
                    className="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    View Details
                  </Link>
                  {status === 'upcoming' && (
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition">
                      Register
                    </button>
                  )}
                  {status === 'ongoing' && (
                    <Link
                      to={`/contests/${contest._id}/participate`}
                      className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Enter Contest
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {contests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No contests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter !== 'all'
              ? `No ${filter} contests at the moment.`
              : 'No contests available at the moment.'}
          </p>
          <button
            onClick={() => setFilter('all')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
          >
            View All Contests
          </button>
        </div>
      )}

      {/* Contest Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
              <FiAward className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Earn Rewards</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Win prizes, certificates, and recognition by performing well in contests.
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-4">
              <FiTrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Improve Skills</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Compete with top coders and improve your problem-solving skills under pressure.
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg mr-4">
              <FiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Global Ranking</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Get ranked globally and showcase your skills to recruiters and the community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contests;