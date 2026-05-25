/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, ZoomIn } from 'lucide-react';
import { GalleryItem } from '../types';
import ImageCard from './ImageCard';

interface GalleryGridProps {
  items: GalleryItem[];
  filteredItems: GalleryItem[];
  onSelectImage: (item: GalleryItem) => void;
  onLikeImage: (id: string, e: React.MouseEvent) => void;
  isAdmin: boolean;
  onDeleteImage?: (id: string, e: React.MouseEvent) => void;
  onEditImage?: (item: GalleryItem, e: React.MouseEvent) => void;
  isLoading: boolean;
  resetFilters: () => void;
}

export default function GalleryGrid({
  items,
  filteredItems,
  onSelectImage,
  onLikeImage,
  isAdmin,
  onDeleteImage,
  onEditImage,
  isLoading,
  resetFilters,
}: GalleryGridProps) {
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          <ZoomIn className="h-5 w-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-sm font-mono text-neutral-400 tracking-wider">
          Resolving frame assets...
        </p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="py-24 px-4 bg-neutral-900/30 border border-neutral-800 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-full mb-4">
          <Camera className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">No Frames Found</h3>
        <p className="text-sm text-neutral-400 mb-6 font-light">
          We couldn't find any images matching your current selection query. Expand your search or check alternative tags.
        </p>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 bg-amber-500 text-neutral-950 px-4 py-2 rounded-xl text-xs font-mono font-semibold hover:bg-amber-400 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Filter Controls</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      
      {/* Dynamic Grid / Masonry Columns */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredItems.map((item) => (
            <div key={item.id} className="break-inside-avoid">
              <ImageCard
                item={item}
                onSelect={onSelectImage}
                onLike={onLikeImage}
                isAdmin={isAdmin}
                onDelete={onDeleteImage}
                onEdit={onEditImage}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Grid count display */}
      <div className="mt-12 text-center text-xs font-mono text-neutral-500">
        Displaying {filteredItems.length} of {items.length} frames globally
      </div>
    </div>
  );
}
