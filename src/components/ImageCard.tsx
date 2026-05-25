/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Eye, Camera, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem } from '../types';

interface ImageCardProps {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  isAdmin: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onEdit?: (item: GalleryItem, e: React.MouseEvent) => void;
}

export default function ImageCard({
  item,
  onSelect,
  onLike,
  isAdmin,
  onDelete,
  onEdit,
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [doubleTapHearth, setDoubleTapHearth] = useState(false);

  // Convert aspect ratio type to styles
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[3/4]';
      case 'video': return 'aspect-[16/9]';
      case 'wide': return 'aspect-[16/10]';
      case 'standard': default: return 'aspect-[4/3]';
    }
  };

  // Double click photo to like
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDoubleTapHearth(true);
    onLike(item.id, e);
    setTimeout(() => {
      setDoubleTapHearth(false);
    }, 800);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative overflow-hidden bg-neutral-900 border border-neutral-850 rounded-2xl cursor-pointer"
      onClick={() => onSelect(item)}
    >
      {/* Aspect Ratio Sized Image Container */}
      <div 
        className={`relative overflow-hidden w-full ${getAspectRatioClass(item.aspectRatio)} bg-neutral-950`}
        onDoubleClick={handleDoubleClick}
      >
        {/* Low quality blurred dummy loading placeholder */}
        <div
          className={`absolute inset-0 bg-neutral-900 flex items-center justify-center transition-opacity duration-500 ${
            isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          </div>
        </div>

        {/* Real optimized Image */}
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            isLoaded ? 'scale-100 filter-none opacity-100' : 'scale-105 blur-md opacity-20'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            // Fallback for failed image load
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=50';
          }}
        />

        {/* Floating Heart Popup Bubble on Double Tap */}
        <AnimatePresence>
          {doubleTapHearth && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0.8, 1.3, 1], opacity: [0, 1, 0.8] }}
              exit={{ scale: 1.5, opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <div className="p-4 bg-neutral-950/70 rounded-full backdrop-blur-md border border-white/20">
                <Heart className="h-10 w-10 text-red-500 fill-red-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay Dark shading on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-neutral-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
          
          {/* Metadata Display */}
          <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-1 block">
              {item.category}
            </span>
            <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1 mb-1.5">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-300 line-clamp-2 font-sans font-light mb-3">
              {item.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400">
              {/* Technical specs */}
              {item.cameraModel ? (
                <div className="flex items-center gap-1">
                  <Camera className="h-3 w-3 text-neutral-500" />
                  <span className="truncate max-w-[120px]">{item.cameraModel}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-neutral-500">
                  <Tag className="h-3 w-3" />
                  <span>{item.tags[0] || 'Original'}</span>
                </div>
              )}

              {/* View/Like quick action toggles */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(item.id, e);
                  }}
                  className="flex items-center gap-1 hover:text-red-400 transition-colors py-1 px-1.5 rounded bg-neutral-900/40 hover:bg-neutral-900/90 border border-transparent hover:border-neutral-800"
                >
                  <Heart className={`h-3 w-3 ${item.likes > 0 ? 'text-red-500 fill-red-500' : 'text-neutral-450'}`} />
                  <span>{item.likes}</span>
                </button>
                <div className="flex items-center gap-1 py-1 px-0.5 text-neutral-500">
                  <Eye className="h-3 w-3" />
                  <span>{item.views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Tag Pin */}
        {item.isFeatured && (
          <div className="absolute top-3.5 left-3.5 bg-amber-500 text-neutral-950 text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-lg border border-amber-400/30 flex items-center gap-1 pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>Curator Pick</span>
          </div>
        )}

        {/* Admin Quick Action Controls Overlay */}
        {isAdmin && (
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <button
                onClick={(e) => onEdit(item, e)}
                className="p-1.5 bg-neutral-900/90 hover:bg-amber-500 text-neutral-450 hover:text-neutral-950 rounded-lg backdrop-blur-md border border-neutral-800 transition-colors"
                title="Edit Frame Details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => onDelete(item.id, e)}
                className="p-1.5 bg-neutral-900/95 hover:bg-red-500 text-neutral-450 hover:text-white rounded-lg backdrop-blur-md border border-neutral-800 transition-colors"
                title="Remove Frame permanently"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Under-Card subtle metadata for standard scroll layout */}
      <div className="p-4 bg-neutral-900/20 group-hover:bg-neutral-900/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {item.category}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h3 className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
          {item.title}
        </h3>
      </div>
    </motion.div>
  );
}
