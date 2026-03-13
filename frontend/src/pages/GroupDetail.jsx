import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiGlobe, FiLock, FiArrowLeft, FiSettings,
  FiRefreshCw, FiCalendar, FiTrash2, FiUserMinus, FiUserPlus,
  FiLink, FiEdit2, FiCheckCircle,
} from 'react-icons/fi';
import { BsTrophyFill } from 'react-icons/bs';
import { MdOutlineGroups } from 'react-icons/md';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import Loader from '../components/common/Loader';
import ContestTimer from '../components/contests/ContestTimer';

const getRatingColor = r => r >= 2000 ? 'text-yellow-400' : r >= 1700 ? 'text-blue-400' : r >= 1400 ? 'text-green-400' : 'text-gray-400';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';
  const inp  = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const bdr  = isDark ? 'border-gray-800' : 'border-gray-200';
  const div  = isDark ? 'divide-gray-800' : 'divide-gray-100';

  const isAdmin  = group?.myRole === 'owner' || group?.myRole === 'admin';
  const isMember = !!group?.isMember;
  const isOwner  = group?.myRole === 'owner';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/${id}`);
      const data = res?.data;
      if (!data) throw new Error('Not found');
      setGroup(data);
      setMembers(data.members || []);
      setContests(data.contests || []);
    } catch (e) {
      toast.error('Failed to load group');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    if (!user) { navigate('/login'); return; }
    setJoining(true);
    try {
      await api.post(`/groups/${id}/join`);
      toast.success('Joined! 🎉');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to join'); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/groups/${id}/leave`);
      toast.success('Left group');
      navigate('/groups');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to leave'); }
    finally { setLeaveConfirm(false); }
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await api.post(`/groups/${id}/invite`, { username: inviteUsername.trim() });
      toast.success(`@${inviteUsername} added!`);
      setInviteUsername('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to invite'); }
    finally { setInviting(false); }
  };

  const handleRemoveMember = async (targetId, username) => {
    if (!window.confirm(`Remove @${username} from the group?`)) return;
    try {
      await api.delete(`/groups/${id}/members/${targetId}`);
      toast.success(`@${username} removed`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to remove'); }
  };

  const handleRoleChange = async (targetId, role) => {
    try {
      await api.put(`/groups/${id}/members/${targetId}/role`, { role });
      toast.success('Role updated');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update'); }
  };

  if (loading) return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;
  if (!group) return null;

  const safeDate = (v) => { try { return format(new Date(v), 'MMM dd, yyyy'); } catch { return '—'; } };
  const getStatusColor = s => ({ live: 'text-green-400 bg-green-500/10 border-green-500/20', upcoming: 'text-blue-400 bg-blue-500/10 border-blue-500/20', ended: 'text-gray-400 bg-gray-500/10 border-gray-500/20' }[s] || 'text-gray-400 bg-gray-500/10 border-gray-500/20');

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/groups')} className={`flex items-center gap-2 text-sm ${sub} hover:text-rose-400 transition-colors mb-4`}>
            <FiArrowLeft className="h-4 w-4" /> All Groups
          </button>

          <div className={`${card} border rounded-2xl p-6`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                {group.avatar_url
                  ? <img src={group.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  : ({ group: '👥', organization: '🏢', team: '⚡', club: '🎯' }[group.type] || '👥')
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className={`text-2xl font-black ${txt}`}>{group.name}</h1>
                    <div className={`flex items-center gap-3 mt-1 text-sm ${sub}`}>
                      <span className="capitalize">{group.type}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {group.visibility === 'public' ? <FiGlobe className="h-3.5 w-3.5" /> : <FiLock className="h-3.5 w-3.5" />}
                        {group.visibility}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><FiUsers className="h-3.5 w-3.5" />{group.member_count} members</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isMember ? (
                      <>
                        {isAdmin && (
                          <Link to={`/contests/create?groupId=${group.id}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold rounded-xl">
                            <FiPlus className="h-3.5 w-3.5" /> Host Contest
                          </Link>
                        )}
                        <button onClick={() => setLeaveConfirm(true)}
                          className={`px-3 py-2 text-xs rounded-xl border ${isDark ? 'border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400' : 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-500'} transition-all`}>
                          Leave
                        </button>
                      </>
                    ) : group.visibility !== 'secret' ? (
                      <button onClick={handleJoin} disabled={joining}
                        className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm rounded-xl font-bold disabled:opacity-50">
                        {joining ? 'Joining...' : 'Join Group'}
                      </button>
                    ) : (
                      <span className={`px-3 py-2 text-xs ${sub} ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl`}>Invite only</span>
                    )}
                  </div>
                </div>
                {group.description && <p className={`mt-3 text-sm ${sub} leading-relaxed`}>{group.description}</p>}
                {group.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.tags.map(t => <span key={t} className={`text-xs px-2 py-0.5 rounded-lg ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>#{t}</span>)}
                  </div>
                )}
                {group.website && (
                  <a href={group.website} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300">
                    <FiLink className="h-3 w-3" />{group.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${bdr} mb-6`}>
          {['overview', 'members', 'contests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors
                ${tab === t ? 'border-rose-500 text-rose-400' : `border-transparent ${sub} hover:text-gray-200`}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Stats */}
            <div className={`${card} border rounded-2xl p-5`}>
              <h3 className={`font-bold text-sm ${txt} mb-4`}>Group Stats</h3>
              {[
                ['Members', group.member_count],
                ['Contests Hosted', contests.length],
                ['Active Contests', contests.filter(c => c.currentStatus === 'live').length],
                ['Created', safeDate(group.created_at)],
              ].map(([l, v]) => (
                <div key={l} className={`flex justify-between py-2.5 border-b last:border-0 ${bdr}`}>
                  <span className={`text-xs ${sub}`}>{l}</span>
                  <span className={`text-sm font-bold ${txt}`}>{v}</span>
                </div>
              ))}
            </div>

            {/* Top members */}
            <div className={`${card} border rounded-2xl p-5`}>
              <h3 className={`font-bold text-sm ${txt} mb-4 flex items-center gap-2`}><BsTrophyFill className="h-4 w-4 text-yellow-400" />Top Members</h3>
              {members.slice(0, 5).map((m, i) => (
                <div key={m.userId} className={`flex items-center gap-3 py-2 ${i > 0 ? `border-t ${bdr}` : ''}`}>
                  <span className={`text-sm font-bold w-5 text-center ${['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-gray-500', 'text-gray-600'][i] || 'text-gray-600'}`}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full rounded-lg object-cover" /> : m.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${txt} truncate`}>@{m.username}</p>
                    <p className={`text-xs ${sub}`}>{m.totalSolved} solved</p>
                  </div>
                  <span className={`text-xs font-bold ${getRatingColor(m.rating)}`}>{m.rating}</span>
                </div>
              ))}
              {members.length === 0 && <p className={`text-sm ${sub} text-center py-4`}>No members yet</p>}
            </div>

            {/* Upcoming contests */}
            {contests.filter(c => c.currentStatus !== 'ended').length > 0 && (
              <div className={`${card} border rounded-2xl p-5 md:col-span-2`}>
                <h3 className={`font-bold text-sm ${txt} mb-4`}>Upcoming & Live Contests</h3>
                <div className="space-y-3">
                  {contests.filter(c => c.currentStatus !== 'ended').map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div>
                        <Link to={`/contests/${c.id}`} className={`font-semibold text-sm ${txt} hover:text-rose-400`}>{c.title}</Link>
                        <p className={`text-xs ${sub} mt-0.5`}>{safeDate(c.startTime || c.start_time)} · {c.duration || c.duration_minutes}min</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusColor(c.currentStatus)}`}>
                        {c.currentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div className="space-y-4">
            {/* Invite panel (admin only) */}
            {isAdmin && (
              <div className={`${card} border rounded-2xl p-4`}>
                <h3 className={`text-sm font-bold ${txt} mb-3 flex items-center gap-2`}><FiUserPlus className="h-4 w-4 text-rose-400" />Invite Member</h3>
                <div className="flex gap-2">
                  <input value={inviteUsername} onChange={e => setInviteUsername(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                    placeholder="@username" className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
                  <button onClick={handleInvite} disabled={inviting || !inviteUsername.trim()}
                    className="px-4 py-2.5 bg-rose-500 text-white text-sm rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
                    {inviting ? <FiRefreshCw className="animate-spin h-4 w-4" /> : <FiUserPlus className="h-4 w-4" />}
                    Invite
                  </button>
                </div>
              </div>
            )}

            {/* Members list */}
            <div className={`${card} border rounded-2xl overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${bdr}`}>
                <span className={`text-sm font-bold ${txt}`}>{members.length} Members</span>
              </div>
              <div className={`divide-y ${div}`}>
                {members.map(m => (
                  <div key={m.userId} className={`flex items-center gap-3 px-4 py-3.5 ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : m.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${txt}`}>@{m.username}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${
                          m.role === 'owner' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          m.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          m.role === 'moderator' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>{m.role}</span>
                      </div>
                      <p className={`text-xs ${sub}`}>{m.totalSolved} solved · Rating: <span className={`font-bold ${getRatingColor(m.rating)}`}>{m.rating}</span></p>
                    </div>
                    {isAdmin && m.role !== 'owner' && m.userId !== user?.id && m.userId !== user?._id?.toString() && (
                      <div className="flex items-center gap-1.5">
                        <select value={m.role} onChange={e => handleRoleChange(m.userId, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          {isOwner && <option value="admin">Admin</option>}
                        </select>
                        <button onClick={() => handleRemoveMember(m.userId, m.username)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <FiUserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTESTS ── */}
        {tab === 'contests' && (
          <div className="space-y-4">
            {isAdmin && (
              <Link to={`/contests/create?groupId=${group.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-rose-500/40 rounded-2xl text-rose-400 hover:bg-rose-500/5 transition-colors text-sm font-semibold">
                <FiPlus className="h-4 w-4" /> Host a New Contest for this Group
              </Link>
            )}
            {contests.length === 0 ? (
              <div className={`${card} border rounded-2xl p-12 text-center`}>
                <BsTrophyFill className={`h-10 w-10 mx-auto mb-3 ${sub} opacity-20`} />
                <p className={`${sub} text-sm`}>No contests yet for this group.</p>
              </div>
            ) : (
              <div className={`${card} border rounded-2xl overflow-hidden`}>
                <div className={`divide-y ${div}`}>
                  {contests.map(c => (
                    <div key={c.id} className={`px-4 py-4 flex items-center gap-4 ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                      <div className="flex-1 min-w-0">
                        <Link to={`/contests/${c.id}`} className={`font-bold text-sm ${txt} hover:text-rose-400 line-clamp-1`}>{c.title}</Link>
                        <p className={`text-xs ${sub} mt-0.5`}>
                          {safeDate(c.startTime || c.start_time)} · {c.duration || c.duration_minutes}min · {c.problemsCount} problems
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 ${getStatusColor(c.currentStatus)}`}>
                        {c.currentStatus}
                      </span>
                      <Link to={c.currentStatus === 'live' ? `/contests/${c.id}/live` : `/contests/${c.id}`}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold shrink-0 ${
                          c.currentStatus === 'live'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {c.currentStatus === 'live' ? '🟢 Enter' : 'View'}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave confirmation modal */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold mb-2 ${txt}`}>Leave group?</h3>
            <p className={`text-sm ${sub} mb-5`}>You will lose your membership in <strong>{group.name}</strong>. You can rejoin later.</p>
            <div className="flex gap-3">
              <button onClick={() => setLeaveConfirm(false)} className={`flex-1 py-2.5 rounded-xl text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button onClick={handleLeave} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}