import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiSearch, FiGlobe, FiLock, FiEye,
  FiX, FiRefreshCw, FiTag, FiChevronRight,
} from 'react-icons/fi';
import { BsTrophyFill } from 'react-icons/bs';
import { MdOutlineGroups } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import Loader from '../components/common/Loader';

const TYPE_ICONS = { group: '👥', organization: '🏢', team: '⚡', club: '🎯' };
const VIS_ICONS  = { public: <FiGlobe className="h-3 w-3" />, private: <FiLock className="h-3 w-3" />, secret: <FiEye className="h-3 w-3" /> };

function CreateGroupModal({ onClose, onCreate, isDark }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'group', visibility: 'public', join_password: '', tags: '', website: '' });
  const [loading, setLoading] = useState(false);
  const inp = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const lbl = isDark ? 'text-gray-300' : 'text-gray-700';

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      await onCreate({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-6 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Group / Organization</h2>
          <button onClick={onClose}><FiX className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., AlgoMasters Club" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="What is this group about?" className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={`w-full px-3 py-2.5 rounded-xl border text-sm ${inp}`}>
                <option value="group">👥 Group</option>
                <option value="organization">🏢 Organization</option>
                <option value="team">⚡ Team</option>
                <option value="club">🎯 Club</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Visibility</label>
              <select value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))} className={`w-full px-3 py-2.5 rounded-xl border text-sm ${inp}`}>
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private (password)</option>
                <option value="secret">👁️ Secret (invite only)</option>
              </select>
            </div>
          </div>
          {form.visibility === 'private' && (
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Join Password</label>
              <input type="password" value={form.join_password} onChange={e => setForm(p => ({ ...p, join_password: e.target.value }))}
                placeholder="Password to join" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
            </div>
          )}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="algorithms, dp, competitive" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider ${lbl} block mb-1.5`}>Website (optional)</label>
            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              placeholder="https://..." className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className={`px-4 py-2 text-sm rounded-xl ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
            <button onClick={submit} disabled={loading || !form.name.trim()}
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
              {loading ? <FiRefreshCw className="animate-spin h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, isDark, onJoin }) {
  const card = isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${card} border rounded-2xl p-5 transition-all flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
            {group.avatar_url
              ? <img src={group.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              : TYPE_ICONS[group.type] || '👥'
            }
          </div>
          <div className="min-w-0">
            <Link to={`/groups/${group.id}`} className={`font-bold text-sm ${txt} hover:text-rose-400 transition-colors line-clamp-1`}>
              {group.name}
            </Link>
            <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${sub}`}>
              <span className="capitalize">{group.type}</span>
              <span>·</span>
              <span className="flex items-center gap-1">{VIS_ICONS[group.visibility]}{group.visibility}</span>
            </div>
          </div>
        </div>
        {group.isMember
          ? <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full shrink-0">✓ Joined</span>
          : group.visibility !== 'secret' && (
            <button onClick={() => onJoin(group)}
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shrink-0">
              Join
            </button>
          )
        }
      </div>

      {group.description && (
        <p className={`text-xs ${sub} line-clamp-2 leading-relaxed`}>{group.description}</p>
      )}

      <div className={`flex items-center gap-4 text-xs ${sub} pt-1`}>
        <span className="flex items-center gap-1"><FiUsers className="h-3 w-3" />{group.member_count} members</span>
        {group.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {group.tags.slice(0, 3).map(t => (
              <span key={t} className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>#{t}</span>
            ))}
          </div>
        )}
        <Link to={`/groups/${group.id}`} className="ml-auto flex items-center gap-1 text-rose-400 hover:text-rose-300">
          View <FiChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joining, setJoining] = useState(false);

  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';
  const inp  = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (myOnly && user) params.my = 'true';
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/groups', { params });
      setGroups(res?.data || res || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [search, myOnly, typeFilter, user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (data) => {
    const res = await api.post('/groups', data);
    const newGroup = res?.data;
    if (newGroup) {
      toast.success('Group created! 🎉');
      navigate(`/groups/${newGroup.id}`);
    }
  };

  const handleJoinClick = (group) => {
    if (!user) { toast.error('Please login to join groups'); navigate('/login'); return; }
    if (group.visibility === 'private') {
      setJoinTarget(group);
    } else {
      doJoin(group.id, null);
    }
  };

  const doJoin = async (id, password) => {
    setJoining(true);
    try {
      await api.post(`/groups/${id}/join`, password ? { password } : {});
      toast.success('Joined group! 🎉');
      setJoinTarget(null);
      setJoinPassword('');
      fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleCreate} isDark={isDark} />}

      {/* Password modal for private groups */}
      {joinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold mb-2 ${txt}`}>🔒 Private Group</h3>
            <p className={`text-sm ${sub} mb-4`}>Enter password to join <strong>{joinTarget.name}</strong></p>
            <input type="password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)}
              placeholder="Group password" className={`w-full px-4 py-2.5 rounded-xl border text-sm mb-4 ${inp}`} />
            <div className="flex gap-3">
              <button onClick={() => { setJoinTarget(null); setJoinPassword(''); }}
                className={`flex-1 py-2 rounded-xl text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button onClick={() => doJoin(joinTarget.id, joinPassword)} disabled={joining || !joinPassword}
                className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {joining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className={`text-2xl font-black ${txt} flex items-center gap-2`}>
              <MdOutlineGroups className="h-7 w-7 text-rose-400" /> Groups & Organizations
            </h1>
            <p className={`text-sm ${sub} mt-1`}>Form teams, host private contests, collaborate together</p>
          </div>
          <button onClick={() => user ? setShowCreate(true) : navigate('/login')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all">
            <FiPlus className="h-4 w-4" /> New Group
          </button>
        </div>

        {/* Filters */}
        <div className={`${card} border rounded-2xl p-3 flex flex-wrap gap-3 mb-6`}>
          <div className="relative flex-1 min-w-[160px]">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${sub}`} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`} />
          </div>
          {user && (
            <button onClick={() => setMyOnly(p => !p)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${myOnly ? 'bg-rose-500 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              My Groups
            </button>
          )}
          {['', 'group', 'organization', 'team', 'club'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${typeFilter === t ? 'bg-rose-500 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader /></div>
        ) : groups.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <MdOutlineGroups className={`h-12 w-12 mx-auto mb-3 ${sub} opacity-30`} />
            <p className={`${sub} text-sm mb-4`}>{myOnly ? "You haven't joined any groups yet." : "No groups found."}</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-rose-500 text-white text-sm rounded-xl font-semibold">
              Create the first one
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => <GroupCard key={g.id} group={g} isDark={isDark} onJoin={handleJoinClick} />)}
          </div>
        )}
      </div>
    </div>
  );
}