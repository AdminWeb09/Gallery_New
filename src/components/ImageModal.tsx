/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Heart, Eye, Calendar, Tag, ChevronLeft, ChevronRight, Share2, CornerDownRight, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem } from '../types';

interface ImageModalProps {
  item: GalleryItem;
  onClose: () => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ImageModal({
  item,
  onClose,
  onLike,
  onPrev,
  onNext,
}: ImageModalProps) {
  const [copied, setCopied] = useState(false);

  // Close when pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // Copy shareable link to clipboard safely
  const handleCopyLink = () => {
    const rawUrl = `${window.location.origin}/#frame=${item.id}`;
    navigator.clipboard.writeText(rawUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((e) => {
      console.error('Failed to copy frame url: ', e);
    });
  };

  return (
    <div id="image-modal-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-sm">
      {/* Click-outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-850 rounded-2xl overflow-hidden shadow-2xl z-10 grid grid-cols-1 md:grid-cols-12 max-h-[90vh]">
        
        {/* UPPER/LEFT: High-quality Zoom Frame (Col Span 7) */}
        <div className="relative md:col-span-7 bg-neutral-950 flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-[75vh] w-full object-contain pointer-events-none"
          />

          {/* Carousel Buttons inside layout */}
          <div className="absolute inset-x-4 flex items-center justify-between pointer-events-none">
            {onPrev ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-850 text-white pointer-events-auto border border-neutral-800 backdrop-blur transition-all"
                title="Previous Frame"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : <div />}

            {onNext ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-850 text-white pointer-events-auto border border-neutral-800 backdrop-blur transition-all"
                title="Next Frame"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : <div />}
          </div>

          {/* Quick Double-Tap instructions indicator */}
          <div className="absolute bottom-4 left-4 bg-neutral-950/60 text-[10px] text-neutral-400 font-mono tracking-wider px-2.5 py-1 rounded-md backdrop-blur border border-neutral-800/40 select-none">
            Double Click image to like
          </div>
        </div>

        {/* LOWER/RIGHT: Content / Curator Narrative Metas (Col Span 5) */}
        <div className="md:col-span-5 p-5 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[90vh]">
          <div>
            {/* Header tags */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                {item.category}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 transition-colors flex items-center gap-1 text-[11px] font-mono"
                  title="Copy share link to clip-board"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 transition-colors"
                  title="Close frame modal"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Headline and Description */}
            <h2 className="text-xl font-bold text-white tracking-tight mb-3">
              {item.title}
            </h2>

            <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed mb-6">
              {item.description || 'No creative narrative provided by the curator. Use administrative portal to define descriptions.'}
            </p>

            <div className="space-y-4">
              {/* Stats highlights */}
              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-neutral-850">
                <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-850/80">
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block mb-0.5">EXPOSURE VIEWS</span>
                  <div className="flex items-center gap-1.5 text-neutral-200">
                    <Eye className="h-4 w-4 text-neutral-400" />
                    <span className="font-mono text-sm font-semibold">{item.views}</span>
                  </div>
                </div>

                <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-850/80">
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block mb-0.5">PUBLIC APPRECIATION</span>
                  <div className="flex items-center gap-1.5 text-neutral-200">
                    <Heart className="h-4 w-4 text-red-500 animate-pulse fill-red-500" />
                    <span className="font-mono text-sm font-semibold">{item.likes}</span>
                  </div>
                </div>
              </div>

              {/* Tag bubble lists */}
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Search tags ({item.tags.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.length === 0 ? (
                    <span className="text-[10px] text-neutral-500 font-mono italic">None</span>
                  ) : (
                    item.tags.map(t => (
                      <span key={t} className="text-[10px] font-mono bg-neutral-950 text-neutral-400 py-0.5 px-2 rounded-md border border-neutral-800/60">
                        #{t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* TECHNICAL CAMERAS EXIF GRID */}
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2 font-semibold">Exif Metadata Specs</span>
                <div className="bg-neutral-950/40 border border-neutral-850/60 rounded-xl p-3.5 text-xs font-mono space-y-2 text-neutral-300">
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-900/60">
                    <span className="text-neutral-500 text-[10px] flex items-center gap-1"><Camera className="h-3.5 w-3.5 text-neutral-400" /> CAMERA</span>
                    <span>{item.cameraModel || 'N/A Originally'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-900/60">
                    <span className="text-neutral-500 text-[10px] flex items-center gap-1">☉ APERTURE_CHOICE</span>
                    <span>{item.aperture || 'f/5.6 / default'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-900/60">
                    <span className="text-neutral-500 text-[10px] flex items-center gap-1">⏱ SHUTTER_SPEED</span>
                    <span>{item.shutterSpeed || 'Auto 1/125s'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-900/60">
                    <span className="text-neutral-500 text-[10px] flex items-center gap-1">🎞 ISO_VAL</span>
                    <span>{item.iso || '100 / baseline'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-neutral-500 text-[10px] flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-neutral-400" /> UPLOADING_DATE</span>
                    <span>{new Date(item.uploadedAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick interactive trigger action */}
          <div className="pt-6 border-t border-neutral-850 mt-6 flex items-center justify-between">
            <button
              onClick={(e) => onLike(item.id, e)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-pink-500/5 hover:from-red-500 hover:to-pink-600 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all w-full justify-center group"
            >
              <Heart className="h-4 w-4 fill-transparent group-hover:fill-white group-hover:scale-110 transition-transform" />
              <span>APPRECIATE FIELD (LIKE)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
