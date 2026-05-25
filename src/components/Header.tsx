/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, Sparkles, Wifi, WifiOff, Eye, Heart, Image as ImageIcon, Award, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryStats } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  stats: GalleryStats | null;
  onlineStatus: 'connected' | 'reconnecting' | 'disconnected';
  onToggleAdmin: () => void;
  showAdmin: boolean;
  categories: string[];
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  stats,
  onlineStatus,
  onToggleAdmin,
  showAdmin,
  categories,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 shadow-lg py-3'
          : 'bg-gradient-to-b from-neutral-950 to-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Brand Logo & Connection Beacon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-gradient-to-tr from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/30">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">
                  Aura<span className="text-amber-400 font-light font-sans">Gallery</span>
                </h1>
                <p className="text-[10px] text-neutral-400 tracking-widest uppercase font-mono mt-0.5">
                  Serverless Display Engine
                </p>
              </div>
            </div>

            {/* Mobile Admin & Live Sync Badge */}
            <div className="flex items-center gap-3 sm:hidden">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono border ${
                  onlineStatus === 'connected'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : onlineStatus === 'reconnecting'
                    ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                    : 'bg-red-950/40 text-red-400 border-red-500/30'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${onlineStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-red-450'} `} />
                <span>{onlineStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Settings Controls */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
              <div className="flex items-center gap-1.5 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800">
                <ImageIcon className="h-3.5 w-3.5 text-neutral-500" />
                <span><strong className="text-white font-medium">{stats?.totalImages ?? 0}</strong> frames</span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800">
                <Eye className="h-3.5 w-3.5 text-neutral-500" />
                <span><strong className="text-white font-medium">{stats?.totalViews ?? 0}</strong> views</span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800">
                <Heart className="h-3.5 w-3.5 text-neutral-500" />
                <span><strong className="text-white font-medium">{stats?.totalLikes ?? 0}</strong> likes</span>
              </div>
            </div>

            {/* Connection Status & Admin toggle */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border ${
                  onlineStatus === 'connected'
                    ? 'bg-emerald-950/45 text-emerald-400 border-emerald-500/20'
                    : onlineStatus === 'reconnecting'
                    ? 'bg-amber-950/45 text-amber-400 border-amber-500/20'
                    : 'bg-red-950/45 text-red-400 border-red-500/20'
                }`}
                title={onlineStatus === 'connected' ? 'Real-time Event Stream listening for upload notifications' : 'Connecting to Server Stream...'}
              >
                {onlineStatus === 'connected' ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                )}
                <span>LIVE SYNC</span>
              </div>

              <button
                id="admin-btn"
                onClick={onToggleAdmin}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                  showAdmin
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-neutral-800/80 text-white border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600'
                }`}
              >
                {showAdmin ? 'CLOSE CURATOR' : 'ADMIN ACC'}
              </button>
            </div>
          </div>

          {/* Small Device Admin Access Buttons */}
          <div className="flex items-center gap-2 sm:hidden md:hidden justify-end">
            <button
              id="admin-btn-mobile"
              onClick={onToggleAdmin}
              className="w-full bg-neutral-800 text-white font-mono text-xs py-2 px-4 rounded-lg border border-neutral-700 flex items-center justify-center gap-1"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showAdmin ? 'Close Dashboard' : 'Curator Portal'}
            </button>
          </div>
        </div>

        {/* Dynamic Search & Filters Area */}
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-1 border-t border-neutral-800/40">
          
          {/* Category Slider Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wide whitespace-nowrap transition-all duration-200 relative ${
                    active
                      ? 'text-neutral-900 font-semibold'
                      : 'text-neutral-400 hover:text-white bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800/80'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeCategoryIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {cat.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Aesthetic Search input */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query frames, tags, settings..."
              className="block w-full pl-9 pr-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white text-xs font-mono"
              >
                ESC
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
