import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FiMessageSquare, FiSearch, FiPlus, FiX, FiClock,
  FiTrendingUp, FiSend, FiTag, FiEye, FiArrowLeft,
  FiChevronUp, FiRefreshCw, FiThumbsUp, FiCornerDownRight, FiFilter,
} from 'react-icons/fi';
import { BsFire, BsTrophyFill } from 'react-icons/bs';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const CATEGORIES = ['All','Discussion','Editorial','Help','Announcement'];
const CAT_COLORS = {
  editorial:    'bg-green-500/10 text-green-400 border-green-500/20',
  help:         'bg-blue-500/10  text-blue-400  border-blue-500/20',
  discussion:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  announcement: 'bg-rose-500/10  text-rose-400  border-rose-500/20',
  general:      'bg-gray-500/10  text-gray-400  border-gray-500/20',
};
const fmt = iso => {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000)    return 'just now';
  if (d < 3600000)  return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  if (d < 604800000)return `${Math.floor(d/86400000)}d ago`;
  return new Date(iso).toLocaleDateString('en',{month:'short',day:'numeric'});
};

function Avatar({ name, size=8 }) {
  const colors=['from-rose-500 to-red-600','from-blue-500 to-indigo-600','from-green-500 to-emerald-600','from-purple-500 to-violet-600','from-yellow-500 to-amber-600'];
  const c=colors[(name?.charCodeAt(0)||0)%colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${c} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
      {(name||'U').charAt(0).toUpperCase()}
    </div>
  );
}

function NewPostModal({ onClose, onSubmit, isDark, problemId, problemTitle }) {
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  const [cat,setCat]=useState('discussion');
  const [tagIn,setTagIn]=useState('');
  const [tags,setTags]=useState([]);
  const [loading,setLoad]=useState(false);
  const inp=isDark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const addTag=t=>{const c=t.trim().toLowerCase().replace(/\s+/g,'-');if(c&&!tags.includes(c)&&tags.length<5)setTags(p=>[...p,c]);setTagIn('');};
  const submit=async()=>{if(!title.trim()||!body.trim()){toast.error('Title and body required');return;}setLoad(true);await onSubmit({title,body,category:cat,tags,problemId,problemTitle});setLoad(false);};
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-2xl rounded-2xl border ${isDark?'bg-gray-900 border-gray-700':'bg-white border-gray-200'} p-6 max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className={`text-lg font-bold ${isDark?'text-white':'text-gray-900'}`}>{problemTitle?`Discuss: ${problemTitle}`:'New Post'}</h2>
          <button onClick={onClose}><FiX className="h-5 w-5 text-gray-400"/></button>
        </div>
        <div className="space-y-4">
          {problemTitle&&<div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400"><FiMessageSquare className="h-4 w-4 flex-shrink-0"/>Linked to: <strong>{problemTitle}</strong></div>}
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What's your question or topic?" className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`}/>
          <select value={cat} onChange={e=>setCat(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${inp}`}>
            <option value="discussion">💬 Discussion</option>
            <option value="editorial">📝 Editorial / Solution</option>
            <option value="help">🙋 Help Needed</option>
          </select>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="Explain your question or approach. Use ``` for code blocks." className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`}/>
          <div>
            <div className="flex gap-2 mb-2">
              <input value={tagIn} onChange={e=>setTagIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagIn);}}} placeholder="Add tags (Enter)..." className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}/>
              <button onClick={()=>addTag(tagIn)} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-600">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">{tags.map(t=>(<span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs">#{t}<button onClick={()=>setTags(tags.filter(x=>x!==t))}><FiX className="h-3 w-3"/></button></span>))}</div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className={`px-4 py-2 text-sm rounded-xl ${isDark?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-600'}`}>Cancel</button>
            <button onClick={submit} disabled={loading||!title.trim()||!body.trim()} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg transition-all">
              {loading?<FiRefreshCw className="animate-spin h-4 w-4"/>:<FiSend className="h-4 w-4"/>}Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadView({ thread, onClose, isDark, user, onVoteUpdate }) {
  const [comments,setComments]=useState([]);
  const [reply,setReply]=useState('');
  const [sending,setSending]=useState(false);
  const [votes,setVotes]=useState(thread.votes||0);
  const card=isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-200 shadow-sm';
  const txt=isDark?'text-white':'text-gray-900';
  const sub=isDark?'text-gray-400':'text-gray-500';
  const inp=isDark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  useEffect(()=>{
    api.get(`/discuss/${thread.id}`).then(r=>{
      // api interceptor already unwraps: r = { success, data: { ...thread, comments } }
      const d=r?.data;
      if(d?.comments)setComments(d.comments);
      if(d?.votes!==undefined)setVotes(d.votes);
    }).catch(()=>{});
  },[thread.id]);

  const sendReply=async()=>{
    if(!reply.trim())return;
    if(!user){toast.error('Login to reply');return;}
    setSending(true);
    try{
      const r=await api.post(`/discuss/${thread.id}/comments`,{body:reply.trim()});
      // axios interceptor unwraps response.data → r = { success, data: newComment }
      const newComment = r?.data ?? r;
      if(newComment?._id) setComments(p=>[...p,newComment]);
      setReply('');toast.success('Reply posted!');
    }catch(e){toast.error(e.response?.data?.message||'Failed to reply');}
    finally{setSending(false);}
  };

  const voteComment=async cid=>{
    if(!user){toast.error('Login to vote');return;}
    try{
      const r=await api.post(`/discuss/${thread.id}/comments/${cid}/vote`);
      const newVotes=r?.data?.votes ?? r?.votes;
      setComments(p=>p.map(c=>c._id===cid
        ?{...c,votes:newVotes!==undefined?newVotes:(c.votes||0)+1}
        :c
      ));
    }catch(e){toast.error('Failed to vote');}
  };

  const voteThread=async()=>{
    if(!user){toast.error('Login to vote');return;}
    try{
      const r=await api.post(`/discuss/${thread.id}/vote`);
      // api interceptor already unwraps: r = {success, data:{votes}}
      const v=r?.data?.votes ?? r?.votes;
      if(v!==undefined){setVotes(v);onVoteUpdate&&onVoteUpdate(thread.id,v);}
    }catch(e){toast.error('Failed to vote');}
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className={`min-h-screen ${isDark?'bg-gray-950':'bg-gray-50'} py-6 px-4`}>
        <div className="max-w-3xl mx-auto space-y-4">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"><FiArrowLeft className="h-4 w-4"/>Back to Discuss</button>

          <div className={`${card} border rounded-2xl p-6`}>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <button onClick={voteThread} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><FiChevronUp className="h-5 w-5"/></button>
                <span className={`text-base font-bold ${txt}`}>{votes}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[thread.category]||CAT_COLORS.general}`}>{thread.category}</span>
                  {thread.problemTitle&&<span className="text-xs px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">📘 {thread.problemTitle}</span>}
                  {thread.isPinned&&<span className="text-xs text-yellow-400">📌 Pinned</span>}
                </div>
                <h2 className={`text-xl font-bold mb-3 ${txt}`}>{thread.title}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={thread.author} size={7}/>
                  <div><p className={`text-sm font-semibold ${txt}`}>@{thread.author}</p><p className="text-xs text-gray-400">{fmt(thread.time)}</p></div>
                </div>
                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark?'text-gray-200':'text-gray-700'} mb-4`}>{thread.body}</div>
                <div className={`flex flex-wrap gap-2 pt-3 border-t ${isDark?'border-gray-800':'border-gray-100'}`}>
                  {thread.tags?.map(t=>(<span key={t} className={`text-xs px-2 py-0.5 rounded-lg ${isDark?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>#{t}</span>))}
                  <span className={`ml-auto flex items-center gap-1 text-xs ${sub}`}><FiEye className="h-3 w-3"/>{thread.views||0} views</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`${card} border rounded-2xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDark?'border-gray-800':'border-gray-100'}`}>
              <h3 className={`font-bold text-sm ${txt}`}>{comments.length} {comments.length===1?'Reply':'Replies'}</h3>
            </div>
            {user?(
              <div className={`px-6 py-4 border-b ${isDark?'border-gray-800 bg-gray-800/30':'border-gray-100 bg-gray-50'}`}>
                <div className="flex gap-3">
                  <Avatar name={user.username} size={8}/>
                  <div className="flex-1">
                    <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={2} placeholder="Write a thoughtful reply..." onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))sendReply();}} className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 ${inp}`}/>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Ctrl+Enter to post</p>
                      <button onClick={sendReply} disabled={sending||!reply.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-rose-600 transition-colors">
                        {sending?<FiRefreshCw className="animate-spin h-3 w-3"/>:<FiSend className="h-3 w-3"/>}Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ):(
              <div className={`px-6 py-4 text-center border-b ${isDark?'border-gray-800':'border-gray-100'}`}>
                <p className={`text-sm ${sub}`}><Link to="/login" className="text-rose-400 hover:underline">Login</Link> to reply</p>
              </div>
            )}
            {comments.length===0?(
              <div className="py-12 text-center"><FiCornerDownRight className={`h-8 w-8 mx-auto mb-2 ${sub} opacity-30`}/><p className={`${sub} text-sm`}>No replies yet. Be the first!</p></div>
            ):(
              <div className={`divide-y ${isDark?'divide-gray-800':'divide-gray-100'}`}>
                {comments.map((c,i)=>(
                  <div key={c._id||i} className={`px-6 py-4 ${isDark?'hover:bg-gray-800/30':'hover:bg-gray-50'} transition-colors`}>
                    <div className="flex gap-3">
                      <Avatar name={c.authorName||'User'} size={8}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${txt}`}>@{c.authorName||'User'}</span>
                          {c.isPinned&&<span className="text-xs text-yellow-400">📌</span>}
                          <span className="text-xs text-gray-500">{fmt(c.createdAt)}</span>
                          {c.isEdited&&<span className="text-xs text-gray-500 italic">(edited)</span>}
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark?'text-gray-200':'text-gray-700'}`}>{c.body}</p>
                        <button onClick={()=>voteComment(c._id)} className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-rose-400 transition-colors">
                          <FiThumbsUp className="h-3.5 w-3.5"/>{c.votes>0&&<span>{c.votes}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, isDark, onVote, onClick }) {
  const card=isDark?'bg-gray-900 border-gray-800 hover:border-gray-700':'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow';
  const txt=isDark?'text-white':'text-gray-900';
  const sub=isDark?'text-gray-500':'text-gray-400';
  return (
    <div className={`${card} border rounded-2xl p-5 transition-all cursor-pointer`} onClick={onClick}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 min-w-[42px]">
          <button onClick={e=>{e.stopPropagation();onVote(post.id);}} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><FiChevronUp className="h-5 w-5"/></button>
          <span className={`text-sm font-bold ${txt}`}>{post.votes||0}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[post.category]||CAT_COLORS.general}`}>{post.category}</span>
            {post.problemTitle&&<span className="text-xs px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">📘 {post.problemTitle}</span>}
            {post.isPinned&&<span className="text-xs text-yellow-400">📌</span>}
            {post.tags?.slice(0,3).map(t=>(<span key={t} className={`text-xs px-1.5 py-0.5 rounded ${isDark?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>#{t}</span>))}
          </div>
          <h3 className={`font-bold text-sm mb-1.5 ${txt} line-clamp-1`}>{post.title}</h3>
          <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isDark?'text-gray-400':'text-gray-600'}`}>{post.body}</p>
          <div className={`flex items-center gap-4 text-xs ${sub}`}>
            <div className="flex items-center gap-1.5"><Avatar name={post.author} size={5}/><span className="font-medium text-rose-400">@{post.author}</span></div>
            <span className="flex items-center gap-1"><FiClock className="h-3 w-3"/>{fmt(post.time)}</span>
            <span className="flex items-center gap-1"><FiMessageSquare className="h-3 w-3"/>{post.replies||0}</span>
            <span className="flex items-center gap-1"><FiEye className="h-3 w-3"/>{post.views||0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Discuss({ problemId: propProblemId, problemTitle: propProblemTitle }={}) {
  const { isDark } = useTheme();
  const { user }   = useAuth();
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [stats,setStats]=useState(null);
  const [popularTags,setPopularTags]=useState([]);
  const [topContribs,setTopContribs]=useState([]);
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [tag,setTag]=useState('');
  const [sort,setSort]=useState('hot');
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [showNew,setShowNew]=useState(false);
  const [activeThread,setActiveThread]=useState(null);

  const bg=isDark?'bg-gray-950':'bg-gray-50';
  const card=isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-200 shadow-sm';
  const txt=isDark?'text-white':'text-gray-900';
  const sub=isDark?'text-gray-400':'text-gray-600';
  const inp=isDark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const params={sort,page,limit:15};
      if(category!=='All')params.category=category.toLowerCase();
      if(tag)params.tag=tag;
      if(search)params.search=search;
      if(propProblemId)params.problemId=propProblemId;
      const res=await api.get('/discuss',{params});
      // api interceptor already unwraps response.data, so res = { success, data: { threads, pages, popularTags } }
      const d=res?.data;
      if(d){
        setPosts(d.threads||[]);
        setTotalPages(d.pages||1);
        if(d.popularTags)setPopularTags(d.popularTags.map(t=>t.tag));
      }
    }catch(e){console.error('Discuss load error:',e);toast.error('Could not load posts');setPosts([]);}
    finally{setLoading(false);}
  },[sort,page,category,tag,search,propProblemId]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    // api interceptor already unwraps: r = { success, data: { totalPosts, ... } }
    api.get('/discuss/stats').then(r=>{const d=r?.data;if(d){setStats(d);setTopContribs(d.topContributors||[]);}}).catch(()=>{});
  },[]);

  const handleVote=async id=>{
    if(!user){toast.error('Login to vote');return;}
    try{
      const r=await api.post(`/discuss/${id}/vote`);
      // Server toggles: returns new count
      const newVotes=r?.data?.votes ?? r?.votes;
      if(newVotes!==undefined){
        setPosts(ps=>ps.map(p=>p.id===id?{...p,votes:newVotes}:p));
      }
    }catch(e){
      toast.error('Failed to vote');
    }
  };

  const handleVoteUpdate=(id,v)=>{setPosts(ps=>ps.map(p=>p.id===id?{...p,votes:v}:p));};

  const handleNew=async data=>{
    if(!user){toast.error('Please login to post');return;}
    try{
      const res=await api.post('/discuss',data);
      const np=res.data?.data;
      if(np){setPosts(ps=>[np,...ps]);toast.success('Post created! 🎉');}
    }catch(e){toast.error(e.response?.data?.message||'Failed to create post');}
    setShowNew(false);
  };

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      {activeThread&&<ThreadView thread={activeThread} onClose={()=>setActiveThread(null)} isDark={isDark} user={user} onVoteUpdate={handleVoteUpdate}/>}
      {showNew&&<NewPostModal onClose={()=>setShowNew(false)} onSubmit={handleNew} isDark={isDark} problemId={propProblemId} problemTitle={propProblemTitle}/>}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className={`text-2xl font-black ${txt}`}>{propProblemTitle?`Discuss: ${propProblemTitle}`:'Discuss'}</h1>
            <p className={`text-sm ${sub} mt-1`}>{stats?`${stats.totalPosts} posts · ${stats.totalComments} replies`:'Community forum'}</p>
          </div>
          <button onClick={()=>user?setShowNew(true):toast.error('Login to post')} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all">
            <FiPlus className="h-4 w-4"/> New Post
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_260px] gap-6">
          <div className="space-y-4">
            <div className={`${card} border rounded-2xl p-3 flex flex-wrap gap-3`}>
              <div className="relative flex-1 min-w-[160px]">
                <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${sub}`}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){setPage(1);load();}}} placeholder="Search posts..." className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}/>
              </div>
              {[{k:'hot',i:<BsFire className="h-3.5 w-3.5"/>},{k:'new',i:<FiClock className="h-3.5 w-3.5"/>},{k:'top',i:<FiTrendingUp className="h-3.5 w-3.5"/>}].map(s=>(
                <button key={s.k} onClick={()=>{setSort(s.k);setPage(1);}} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${sort===s.k?'bg-rose-500 text-white':isDark?'bg-gray-800 text-gray-400 hover:bg-gray-700':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s.i}{s.k}</button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c=>(
                <button key={c} onClick={()=>{setCategory(c);setPage(1);}} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category===c?'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow':isDark?'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600':'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{c}</button>
              ))}
              {tag&&<button onClick={()=>setTag('')} className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold">#{tag}<FiX className="h-3 w-3"/></button>}
            </div>

            {loading?<div className="py-12 flex justify-center"><Loader/></div>
            :posts.length===0?(
              <div className={`${card} border rounded-2xl p-12 text-center`}>
                <FiMessageSquare className={`h-10 w-10 mx-auto mb-3 ${sub} opacity-30`}/>
                <p className={`${sub} text-sm mb-3`}>{search||tag||category!=='All'?'No posts match your filters':'No posts yet. Start the conversation!'}</p>
                <button onClick={()=>{setSearch('');setCategory('All');setTag('');}} className="px-4 py-1.5 bg-rose-500 text-white text-xs rounded-xl mr-2">Clear filters</button>
                <button onClick={()=>setShowNew(true)} className="px-4 py-1.5 bg-gray-700 text-white text-xs rounded-xl">New Post</button>
              </div>
            ):(
              <div className="space-y-3">
                {posts.map(p=><PostCard key={p.id} post={p} isDark={isDark} onVote={handleVote} onClick={()=>setActiveThread(p)}/>)}
              </div>
            )}

            {totalPages>1&&(
              <div className="flex justify-center gap-2 pt-2">
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className={`px-4 py-2 rounded-xl text-sm ${isDark?'bg-gray-800 text-gray-300 disabled:opacity-30':'bg-white border border-gray-200 text-gray-600 disabled:opacity-30'}`}>← Prev</button>
                <span className={`px-4 py-2 text-sm ${sub}`}>{page} / {totalPages}</span>
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className={`px-4 py-2 rounded-xl text-sm ${isDark?'bg-gray-800 text-gray-300 disabled:opacity-30':'bg-white border border-gray-200 text-gray-600 disabled:opacity-30'}`}>Next →</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={`${card} border rounded-2xl p-4`}>
              <h3 className={`text-sm font-bold ${txt} mb-3`}>Community Stats</h3>
              {[['Total Posts',stats?.totalPosts??'—'],['Replies',stats?.totalComments??'—'],['Posts Today',stats?.postsToday??'—']].map(([l,v])=>(
                <div key={l} className="flex justify-between py-1.5"><span className={`text-xs ${sub}`}>{l}</span><span className={`text-sm font-bold ${txt}`}>{v}</span></div>
              ))}
            </div>
            {popularTags.length>0&&(
              <div className={`${card} border rounded-2xl p-4`}>
                <h3 className={`text-sm font-bold ${txt} mb-3 flex items-center gap-2`}><FiTag className="h-4 w-4 text-rose-400"/>Popular Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.slice(0,18).map(t=>(
                    <button key={t} onClick={()=>{setTag(tag===t?'':t);setPage(1);}} className={`text-xs px-2 py-1 rounded-lg border transition-all ${tag===t?'bg-rose-500/20 text-rose-400 border-rose-500/30':isDark?'border-gray-700 text-gray-400 hover:border-rose-500/40 hover:text-rose-400':'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-500'}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}
            {topContribs.length>0&&(
              <div className={`${card} border rounded-2xl p-4`}>
                <h3 className={`text-sm font-bold ${txt} mb-3 flex items-center gap-2`}><BsTrophyFill className="h-4 w-4 text-yellow-400"/>Top Contributors</h3>
                {topContribs.map((c,i)=>(
                  <div key={c.id||i} className="flex items-center gap-2.5 py-1.5">
                    <span className={`text-sm font-bold w-5 ${['text-yellow-400','text-gray-300','text-amber-600','text-gray-500','text-gray-600'][i]||'text-gray-600'}`}>{i+1}</span>
                    <Avatar name={c.name} size={6}/>
                    <div className="flex-1 min-w-0"><p className={`text-xs font-semibold ${txt} truncate`}>@{c.name}</p><p className={`text-xs ${sub}`}>{c.posts} posts · {c.totalVotes} votes</p></div>
                  </div>
                ))}
              </div>
            )}
            <div className={`${card} border rounded-2xl p-4`}>
              <h3 className={`text-sm font-bold ${txt} mb-3`}>Guidelines</h3>
              {['Be respectful and constructive','Use ``` for code blocks','Search before posting duplicates','Tag your posts appropriately'].map((g,i)=>(
                <div key={i} className={`text-xs ${sub} py-1.5 flex items-start gap-2`}><span className="text-rose-400 mt-0.5">→</span>{g}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}