import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LiveContest = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    fetchContest();
    
    // Connect to socket
    const socket = socketService.connect();
    socketService.joinContest(id, user?.id);

    // Listen for real-time updates
    socketService.onLeaderboardUpdate((newLeaderboard) => {
      console.log('📊 Leaderboard updated!');
      setLeaderboard(newLeaderboard);
    });

    socketService.onContestStatus((data) => {
      if (data.status === 'ended') {
        alert('Contest has ended!');
      }
    });

    return () => {
      socketService.leaveContest(id);
      socketService.disconnect();
    };
  }, [id, user]);

  // Timer countdown
  useEffect(() => {
    if (!contest) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  const fetchContest = async () => {
    try {
      const response = await api.get(`/contests/${id}`);
      setContest(response.data.contest);
      setProblems(response.data.problems || []);
    } catch (error) {
      console.error('Failed to fetch contest');
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Contest Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{contest?.title}</h1>
        <div className="flex items-center gap-6">
          <div className="text-2xl font-mono text-yellow-500">
            ⏱ {formatTime(timeRemaining)}
          </div>
          <div className="text-gray-400">
            {contest?.participantsCount || 0} participants
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Problems List */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Problems</h2>
          {problems.map((problem, index) => (
            <div key={problem.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 mr-2">Problem {index + 1}</span>
                  <span className="font-bold">{problem.title}</span>
                </div>
                <span className="text-yellow-500">{problem.points} points</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🏆 Live Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`p-3 rounded ${index < 3 ? 'bg-yellow-900/20' : 'bg-gray-700'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">#{entry.rank}</span>
                    <span>{entry.username}</span>
                  </div>
                  <span className="font-bold text-yellow-500">{entry.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveContest;