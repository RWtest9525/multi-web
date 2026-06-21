import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, ExternalLink, Play, Pause, RefreshCw, Link as LinkIcon, LayoutGrid, MonitorPlay, Shield } from 'lucide-react';

interface LinkItem {
  id: string;
  url: string;
  title: string;
  isScrolling: boolean;
  scrollSpeed: number;
  useProxy?: boolean;
}

// Get Supabase URL for proxy
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/proxy-view?url=`;

function App() {
  const [links, setLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('viewer-links');
    return saved ? JSON.parse(saved) : [];
  });
  const [newUrl, setNewUrl] = useState('');
  const [isAllScrolling, setIsAllScrolling] = useState(false);
  const scrollIntervalsRef = useRef<Map<string, number>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    localStorage.setItem('viewer-links', JSON.stringify(links));
  }, [links]);

  const getProxyUrl = (url: string) => {
    return `${PROXY_URL}${encodeURIComponent(url)}`;
  };

  const addLink = () => {
    if (!newUrl.trim()) return;

    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newLink: LinkItem = {
      id: Date.now().toString(),
      url,
      title: new URL(url).hostname,
      isScrolling: false,
      scrollSpeed: 1,
      useProxy: true, // Use proxy by default
    };

    setLinks(prev => [...prev, newLink]);
    setNewUrl('');
  };

  const removeLink = (id: string) => {
    stopScrolling(id);
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const clearAll = () => {
    scrollIntervalsRef.current.forEach((_, id) => {
      const interval = scrollIntervalsRef.current.get(id);
      if (interval) clearInterval(interval);
    });
    scrollIntervalsRef.current.clear();
    setLinks([]);
    setIsAllScrolling(false);
  };

  const startScrolling = useCallback((id: string) => {
    if (scrollIntervalsRef.current.has(id)) {
      const existingInterval = scrollIntervalsRef.current.get(id);
      if (existingInterval) clearInterval(existingInterval);
    }

    const interval = window.setInterval(() => {
      const container = containerRefs.current.get(id);
      if (container) {
        container.scrollTop += 1.5;
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          container.scrollTop = 0;
        }
      }
    }, 50);

    scrollIntervalsRef.current.set(id, interval);
    setLinks(prev => prev.map(link => link.id === id ? { ...link, isScrolling: true } : link));
  }, []);

  const stopScrolling = useCallback((id: string) => {
    const interval = scrollIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      scrollIntervalsRef.current.delete(id);
    }
    setLinks(prev => prev.map(link => link.id === id ? { ...link, isScrolling: false } : link));
  }, []);

  const toggleScrolling = (id: string) => {
    const link = links.find(l => l.id === id);
    if (link?.isScrolling) {
      stopScrolling(id);
    } else {
      startScrolling(id);
    }
  };

  const toggleAllScrolling = () => {
    if (isAllScrolling) {
      links.forEach(link => stopScrolling(link.id));
      setIsAllScrolling(false);
    } else {
      links.forEach(link => startScrolling(link.id));
      setIsAllScrolling(true);
    }
  };

  const resetScroll = (id: string) => {
    const container = containerRefs.current.get(id);
    if (container) {
      container.scrollTop = 0;
    }
  };

  const toggleProxy = (id: string) => {
    setLinks(prev => prev.map(link =>
      link.id === id ? { ...link, useProxy: !link.useProxy } : link
    ));
  };

  const openInPopup = (url: string, id: string) => {
    const width = 400;
    const height = 600;
    const left = window.screenX + 100;
    const top = window.screenY + 100;
    window.open(
      url,
      `viewer-${id}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  const addSampleLink = () => {
    const sampleUrl = 'https://news.newzo.in/Lnk/SRWR202606211040321652638311';
    const newLink: LinkItem = {
      id: Date.now().toString(),
      url: sampleUrl,
      title: 'newzo.in',
      isScrolling: false,
      scrollSpeed: 1,
      useProxy: true,
    };
    setLinks(prev => [...prev, newLink]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutGrid className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Multi-Link Viewer</h1>
          </div>
          <p className="text-slate-400">Add multiple links and view them simultaneously with auto-scrolling</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Proxy enabled</span>
            <span className="text-slate-500">- bypasses iframe restrictions</span>
          </div>
        </div>

        {/* Add Link Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
                placeholder="Enter website URL (e.g., news.newzo.in/...)"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={addLink}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5" />
              Add Link
            </button>
          </div>

          {links.length > 0 && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={toggleAllScrolling}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  isAllScrolling
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isAllScrolling ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause All
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start All Scrolling
                  </>
                )}
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <span className="ml-auto text-slate-400 flex items-center">
                {links.length} link{links.length !== 1 ? 's' : ''} added
              </span>
            </div>
          )}
        </div>

        {/* Links Grid */}
        {links.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all"
              >
                {/* Card Header */}
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${link.isScrolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-white font-medium truncate">{link.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleScrolling(link.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        link.isScrolling
                          ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                          : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                      }`}
                      title={link.isScrolling ? 'Pause' : 'Start scrolling'}
                    >
                      {link.isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => resetScroll(link.id)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
                      title="Reset scroll"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleProxy(link.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        link.useProxy
                          ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      title={link.useProxy ? 'Proxy ON - click to disable' : 'Proxy OFF - click to enable'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openInPopup(link.url, link.id)}
                      className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-all"
                      title="Open in popup window"
                    >
                      <MonitorPlay className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Iframe Container */}
                <div
                  ref={(el) => { if (el) containerRefs.current.set(link.id, el); }}
                  className="relative h-80 overflow-hidden bg-white"
                >
                  <iframe
                    id={`iframe-${link.id}`}
                    src={link.useProxy ? getProxyUrl(link.url) : link.url}
                    title={link.title}
                    className="w-full h-[500%] border-0"
                    loading="lazy"
                    sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                    style={{ pointerEvents: 'auto' }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-800/30 to-transparent pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <LayoutGrid className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-400 mb-2">No links added yet</h3>
            <p className="text-slate-500 mb-4">Add URLs above to view multiple websites at once</p>
            <button
              onClick={addSampleLink}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all mx-auto"
            >
              <Plus className="w-4 h-4" />
              Try Sample Link
            </button>
            <p className="text-slate-600 text-sm mt-4 max-w-md mx-auto">
              Proxy mode bypasses iframe restrictions on most sites.
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Links are stored locally in your browser. Proxy bypasses iframe restrictions.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
