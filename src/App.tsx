/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GalleryItem, GalleryStats } from './types';
import Header from './components/Header';
import GalleryGrid from './components/GalleryGrid';
import ImageModal from './components/ImageModal';
import AdminPanel from './components/AdminPanel';
import { Sparkles, SlidersHorizontal, Info, Award, Image as ImageIcon } from 'lucide-react';

export default function App() {
  // Master state
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connection Stream state
  const [onlineStatus, setOnlineStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Interactive Modals
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Load assets initially
  useEffect(() => {
    fetchImages();
    fetchStats();
  }, []);

  // Set up EventSource SSE Stream listener
  useEffect(() => {
    let sse: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      console.log('Opening EventSource Live Sync connection...');
      setOnlineStatus('reconnecting');

      sse = new EventSource('/api/live');

      sse.onopen = () => {
        console.log('EventSource Stream established!');
        setOnlineStatus('connected');
      };

      sse.onerror = (e) => {
        console.error('EventSource Stream disconnected, trying to reconnect...', e);
        setOnlineStatus('disconnected');
        // Handle custom timing reconnect fallback
        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 3000);
      };

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('SSE message payload received:', payload);
          const { type, item } = payload;

          if (type === 'create') {
            setItems((prev) => {
              if (prev.some((p) => p.id === item.id)) return prev;
              return [item, ...prev];
            });
          } else if (type === 'update') {
            setItems((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, ...item } : p))
            );
            // Also update currently rendered selected image detail modal in real-time
            setSelectedItem((curr) => (curr && curr.id === item.id ? { ...curr, ...item } : curr));
          } else if (type === 'delete') {
            setItems((prev) => prev.filter((p) => p.id !== item.id));
            setSelectedItem((curr) => (curr && curr.id === item.id ? null : curr));
          }

          // Trigger a refresh of aggregate stats metrics
          fetchStats();
        } catch (err) {
          console.error('Failed to parse incoming streaming event:', err);
        }
      };
    };

    connectSSE();

    return () => {
      if (sse) sse.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Hash route detector for shared URLs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#frame=')) {
        const frameId = hash.replace('#frame=', '');
        const match = items.find((i) => i.id === frameId);
        if (match) {
          setSelectedItem(match);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // Initial trigger once items resolve
    if (items.length > 0) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [items]);

  // Fetch lists handler
  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Error fetching images:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  // REST mutations
  const handleAddImage = async (formData: any) => {
    const res = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to post frame');
    }
  };

  const handleUpdateImage = async (id: string, formData: any) => {
    const res = await fetch(`/api/images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update frame');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStats();
      } else {
        const err = await res.json();
        alert('Failed to remove frame: ' + err.error);
      }
    } catch (e: any) {
      alert('Network failure: ' + e.message);
    }
  };

  // Like Frame Action
  const handleLikeImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/images/${id}/like`, { method: 'POST' });
      if (res.ok) {
        // SSE will update state dynamically. Update fallback immediately locally
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (selectedItem?.id === id) {
          setSelectedItem(updated);
        }
      }
    } catch (err) {
      console.error('Failed to trigger frame like: ', err);
    }
  };

  // Views Frame Register Modal Open
  const handleOpenDetailModal = async (item: GalleryItem) => {
    setSelectedItem(item);
    window.location.hash = `frame=${item.id}`;
    
    // Side-channel post to increase view metrics
    try {
      const res = await fetch(`/api/images/${item.id}/view`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
      }
    } catch (err) {
      console.log('Failed to post view count:', err);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedItem(null);
    window.location.hash = '';
  };

  // Previous & Next Carousel handlers for modal view
  const handlePrevImage = () => {
    if (!selectedItem) return;
    const currIndex = filteredItems.findIndex((i) => i.id === selectedItem.id);
    if (currIndex > 0) {
      handleOpenDetailModal(filteredItems[currIndex - 1]);
    } else {
      // Loop to end
      handleOpenDetailModal(filteredItems[filteredItems.length - 1]);
    }
  };

  const handleNextImage = () => {
    if (!selectedItem) return;
    const currIndex = filteredItems.findIndex((i) => i.id === selectedItem.id);
    if (currIndex < filteredItems.length - 1) {
      handleOpenDetailModal(filteredItems[currIndex + 1]);
    } else {
      // Loop to beginning
      handleOpenDetailModal(filteredItems[0]);
    }
  };

  // Derived list of unique categories actually on disk
  const computedCategories = ['ALL', 'Landscape', 'Architecture', 'Portrait', 'Astro', 'Minimalist', 'Action', 'Street'];

  // Apply real-time client-side filter constraints
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'ALL' || item.category.toLowerCase() === activeCategory.toLowerCase();
    
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.tags.some((tag) => tag.toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-neutral-950 font-sans pb-24">
      
      {/* Dynamic Header Component */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        stats={stats}
        onlineStatus={onlineStatus}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        showAdmin={showAdmin}
        categories={computedCategories}
      />

      {/* Decorative ambient sunset background radial circles */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Intro Section (Subtle display typography constraints) */}
      <div className="pt-36 md:pt-40 max-w-7xl mx-auto px-4 md:px-8 mb-12 text-center md:text-left">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] font-mono font-medium text-amber-400 uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Curated exposures
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white font-sans leading-none">
            Aesthetic Visual Frame Stream.
          </h2>
          <p className="mt-3.5 text-sm text-neutral-400 font-light font-sans max-w-lg leading-relaxed">
            A highly optimized serverless exhibition celebrating fine landscape, celestial exposures, and warm lighting geometry values. Click frames to zoom and inspect structural EXIF cameras.
          </p>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Curators Config Portal Panel */}
        {showAdmin && (
          <div className="mb-10">
            <AdminPanel
              items={items}
              onAddImage={handleAddImage}
              onUpdateImage={handleUpdateImage}
              onDeleteImage={handleDeleteImage}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
            />
          </div>
        )}

        {/* Gallery Grid display component */}
        <GalleryGrid
          items={items}
          filteredItems={filteredItems}
          onSelectImage={handleOpenDetailModal}
          onLikeImage={handleLikeImage}
          isAdmin={showAdmin}
          onDeleteImage={handleDeleteImage}
          onEditImage={(item, e) => {
            e.stopPropagation();
            setEditingItem(item);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          isLoading={isLoading}
          resetFilters={() => {
            setSearchQuery('');
            setActiveCategory('ALL');
          }}
        />

      </main>

      {/* IMAGE DETAIL ZOOM MODAL OVERLAY */}
      {selectedItem && (
        <ImageModal
          item={selectedItem}
          onClose={handleCloseDetailModal}
          onLike={handleLikeImage}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />
      )}

      {/* Simple Footer Details */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-24 pt-8 border-t border-neutral-900 text-center font-mono text-[10px] text-neutral-600 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div>
          <span>© AuraGallery Systems Inc. Sandbox Display Module.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-neutral-400 transition-colors">Serverless Engine</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">Vercel Pipeline</a>
        </div>
      </footer>

    </div>
  );
}
