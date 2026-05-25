/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Upload, X, Trash2, Edit3, CheckCircle, Flame, Plus, Sparkles, HelpCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem, AspectRatio } from '../types';
import { optimizeImage, detectAspectRatio } from '../utils/imageOptimizer';

interface AdminPanelProps {
  items: GalleryItem[];
  onAddImage: (formData: any) => Promise<void>;
  onUpdateImage: (id: string, formData: any) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
  editingItem: GalleryItem | null;
  setEditingItem: (item: GalleryItem | null) => void;
}

export default function AdminPanel({
  items,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  editingItem,
  setEditingItem,
}: AdminPanelProps) {
  // Form hooks
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Landscape');
  const [tags, setTags] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('standard');
  const [cameraModel, setCameraModel] = useState('');
  const [aperture, setAperture] = useState('');
  const [shutterSpeed, setShutterSpeed] = useState('');
  const [iso, setIso] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null);
  const [optimizedBase64, setOptimizedBase64] = useState<string | null>(null);

  // Status hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Supabase Status check
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    status: 'unconfigured' | 'connected' | 'error_table_missing' | 'error';
    message: string;
  } | null>(null);
  const [showDdl, setShowDdl] = useState(false);

  useEffect(() => {
    fetch('/api/supabase-status')
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(err => console.error('Error fetching Supabase integration status:', err));
  }, [items]);

  // Populate form if editing
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description);
      setCategory(editingItem.category);
      setTags(editingItem.tags.join(', '));
      setAspectRatio(editingItem.aspectRatio);
      setCameraModel(editingItem.cameraModel || '');
      setAperture(editingItem.aperture || '');
      setShutterSpeed(editingItem.shutterSpeed || '');
      setIso(editingItem.iso || '');
      setIsFeatured(editingItem.isFeatured || false);
      // Mode edit resets local file inputs
      setSelectedFile(null);
      setPreviewUrl(editingItem.imageUrl);
      setOptimizedBase64(null);
      setCompressionRatio(null);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Landscape');
    setTags('');
    setAspectRatio('standard');
    setCameraModel('');
    setAperture('');
    setShutterSpeed('');
    setIso('');
    setIsFeatured(false);
    setSelectedFile(null);
    if (previewUrl && !previewUrl.startsWith('/uploads/') && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setOptimizedBase64(null);
    setCompressionRatio(null);
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    try {
      setIsCompressing(true);
      setFeedback(null);
      
      // Auto-populate Title with clean filename if empty
      if (!title) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        // Clean name
        setTitle(baseName.replace(/[-_]/g, ' '));
      }

      // Detect original Aspect Ratio to recommend metadata choice
      const detectedRatio = await detectAspectRatio(file);
      setAspectRatio(detectedRatio);

      // Perform local image compression using Canvas element in Web Worker / main thread
      const base64 = await optimizeImage(file, 1200, 1200, 0.82);
      
      // Calculate optimized sizing vs original size
      const originalKB = (file.size / 1024).toFixed(1);
      const base64Length = base64.length - (base64.indexOf(',') + 1);
      const optimizedKB = (base64Length * 0.75 / 1024).toFixed(1);
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOptimizedBase64(base64);
      setCompressionRatio(`Saved ~${Math.round((1 - Number(optimizedKB) / Number(originalKB)) * 100)}% (${originalKB}KB → ${optimizedKB}KB)`);
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Failed to compress image locally: ' + e.message });
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Submit File metadata
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Frame title is required' });
      return;
    }

    if (!editingItem && !optimizedBase64) {
      setFeedback({ type: 'error', message: 'Please drop or pick an image first' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        aspectRatio,
        cameraModel: cameraModel.trim() || undefined,
        aperture: aperture.trim() || undefined,
        shutterSpeed: shutterSpeed.trim() || undefined,
        iso: iso.trim() || undefined,
        isFeatured,
        ...(optimizedBase64 ? { base64Data: optimizedBase64 } : {}),
      };

      if (editingItem) {
        await onUpdateImage(editingItem.id, payload);
        setFeedback({ type: 'success', message: 'Frame updated successfully' });
        setEditingItem(null);
      } else {
        await onAddImage(payload);
        setFeedback({ type: 'success', message: 'Frame added to public pipeline!' });
        resetForm();
      }

      // Auto clear success banner
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick seed inputs for ease
  const fillExifSeeds = () => {
    setCameraModel('Fujifilm X-T5');
    setAperture('f/2.8');
    setShutterSpeed('1/250s');
    setIso('125');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-5 md:p-8 max-w-7xl mx-auto mb-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingItem ? 'Edit Curated Frame' : 'Live Curator Controls'}
            </h2>
            <span className="bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full uppercase">
              Admin Access
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Directly optimize, crop ratio, and inject images to live viewers instantly.
          </p>
        </div>
        {editingItem && (
          <button
            onClick={() => setEditingItem(null)}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 text-xs font-mono"
          >
            <X className="h-3 w-3" />
            Cancel Edit
          </button>
        )}
      </div>

      {supabaseStatus && (
        <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 font-mono text-xs flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Database className={`h-4 w-4 ${supabaseStatus.status === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
              <span className="font-semibold text-white">SUPABASE LINK:</span>
              {supabaseStatus.status === 'connected' && (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  ACTIVE SYNC
                </span>
              )}
              {supabaseStatus.status === 'unconfigured' && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  OFFLINE BACKUP (LOCAL JSON)
                </span>
              )}
              {supabaseStatus.status === 'error_table_missing' && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  MIGRATION REQUIRED
                </span>
              )}
              {supabaseStatus.status === 'error' && (
                <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  AUTH FAILURE
                </span>
              )}
            </div>
            
            {(supabaseStatus.status === 'error_table_missing' || supabaseStatus.status === 'unconfigured') && (
              <button
                onClick={() => setShowDdl(!showDdl)}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                type="button"
              >
                {showDdl ? 'Hide Setup DDL SQL' : 'Show Setup DDL SQL'}
              </button>
            )}
          </div>
          
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {supabaseStatus.message}
            {supabaseStatus.status === 'unconfigured' && (
              <> Add your <code className="text-white">SUPABASE_URL</code> and <code className="text-white">SUPABASE_ANON_KEY</code> to the <strong>Secrets/Environment Variables panel</strong> (Settings icon in AI Studio) to shift storage and metadata query streams to a persistent cloud environment.</>
            )}
          </p>

          {showDdl && (
            <div className="mt-2 bg-neutral-950 p-3.5 rounded-lg border border-neutral-850 overflow-x-auto text-[10px] text-neutral-400 select-all font-mono leading-relaxed relative">
              <span className="absolute top-2 right-2 text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">Doble click to select all</span>
              {`-- 1. Create your gallery_items table in your Supabase SQL Editor:
CREATE TABLE gallery_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  "uploadedAt" TIMESTAMPTZ DEFAULT NOW(),
  "aspectRatio" TEXT DEFAULT 'standard',
  "isFeatured" BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  "cameraModel" TEXT,
  aperture TEXT,
  "shutterSpeed" TEXT,
  iso TEXT
);

-- 2. Configure public Access Control policies 
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON gallery_items FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON gallery_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON gallery_items FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access" ON gallery_items FOR DELETE USING (true);

-- 3. Create a public storage bucket named "gallery_images" under Storage
-- and add storage policy to allow public select and upload actions.`}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM PANEL */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-mono flex items-start gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/35 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-950/35 border-red-500/20 text-red-400'
              }`}
            >
              <div className="mt-0.5 font-bold">●</div>
              <div>{feedback.message}</div>
            </div>
          )}

          {/* Sizing grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-1.5">
                Frame Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Cascade Whispers"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              >
                <option value="Landscape">Landscape</option>
                <option value="Architecture">Architecture</option>
                <option value="Portrait">Portrait</option>
                <option value="Astro">Astro</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Action">Action</option>
                <option value="Street">Street</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-1.5">
              Narrative Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inject a brief creative narrative context about this exposure..."
              rows={2}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-1.5">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex. mountain, snow, exposure"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-1.5">
                Render Aspect AspectRatio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              >
                <option value="standard">Standard (4:3)</option>
                <option value="portrait">Portrait (3:4)</option>
                <option value="wide">Wide (16:10)</option>
                <option value="video">Cinematic (16:9)</option>
                <option value="square">Square (1:1)</option>
              </select>
            </div>
          </div>

          {/* EXIF METADATA DROP */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-850">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-mono text-neutral-300 font-medium">EXIF CAMERA SPECS</span>
              <button
                type="button"
                onClick={fillExifSeeds}
                className="text-[10px] font-mono text-amber-500/90 hover:text-amber-400 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Auto Fill Seeds
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 mb-1">CAMERA</label>
                <input
                  type="text"
                  value={cameraModel}
                  onChange={(e) => setCameraModel(e.target.value)}
                  placeholder="Sony A7R V"
                  className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 mb-1">APERTURE</label>
                <input
                  type="text"
                  value={aperture}
                  onChange={(e) => setAperture(e.target.value)}
                  placeholder="f/1.8"
                  className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 mb-1">SHUTTER</label>
                <input
                  type="text"
                  value={shutterSpeed}
                  onChange={(e) => setShutterSpeed(e.target.value)}
                  placeholder="1/1000s"
                  className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 mb-1">ISO</label>
                <input
                  type="text"
                  value={iso}
                  onChange={(e) => setIso(e.target.value)}
                  placeholder="100"
                  className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-neutral-950 relative" />
              <span className="text-xs font-mono text-neutral-300">CURATOR FEATURE PICK</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-2 ${
                isSubmitting || isCompressing
                  ? 'bg-neutral-850 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                  : 'bg-amber-500 text-neutral-950 hover:bg-amber-450 shadow-md shadow-amber-500/10'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Injected...</span>
                </>
              ) : editingItem ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Update Frame details</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Deploy to Live Stream</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* IMAGE UPLOADER DRAG BOX (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div>
            <span className="block text-xs font-mono uppercase tracking-wide text-neutral-400 mb-3">
              Image File Asset
            </span>

            {/* Drag Target Area */}
            {!editingItem && (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ex-file-selector')?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[190px] ${
                  previewUrl
                    ? 'border-neutral-800 bg-neutral-950/40'
                    : 'border-neutral-800 hover:border-amber-500/40 bg-neutral-950/20 hover:bg-neutral-950/40'
                }`}
              >
                <input
                  id="ex-file-selector"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-xs font-mono text-amber-400">Performing Local optimization...</span>
                  </div>
                ) : previewUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative max-h-[180px] rounded-lg overflow-hidden border border-neutral-800 mb-3 bg-neutral-950">
                      <img src={previewUrl} alt="Thumbnail preview" className="object-contain max-h-[180px] max-w-full" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetForm();
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-neutral-950/80 hover:bg-red-500 rounded-full text-white transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400 truncate max-w-xs">{selectedFile?.name}</p>
                    {compressionRatio && (
                      <span className="text-[10px] font-mono text-emerald-400 mt-1 bg-emerald-950/30 border border-emerald-500/10 px-2 py-0.5 rounded-full">
                        {compressionRatio}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl mb-3">
                      <Upload className="h-5 w-5 text-neutral-400" />
                    </div>
                    <span className="text-xs font-medium text-white block">Drag and drop file here</span>
                    <span className="text-[10px] text-neutral-500 font-mono mt-1">or click to pick from disk [Max 12MB]</span>
                  </>
                )}
              </div>
            )}

            {editingItem && (
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950/60 p-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono text-neutral-500 mb-3 block">CURRENT FRAME ASSET</span>
                <img
                  src={previewUrl || ''}
                  alt={title}
                  className="max-h-[160px] max-w-full object-contain rounded-lg border border-neutral-800 bg-neutral-950 mb-3"
                />
                <span className="text-[10px] font-mono text-neutral-400">Keep standard asset or cancel this edit modal to re-upload.</span>
              </div>
            )}
          </div>

          {/* Quick List of public gallery items to delete or trigger edit */}
          <div className="flex-1 flex flex-col max-h-[290px]">
            <span className="text-xs font-mono uppercase tracking-wide text-neutral-400 mb-2">
              Pipeline Manage ({items.length})
            </span>
            <div className="flex-1 bg-neutral-950/50 rounded-xl border border-neutral-850 overflow-y-auto divide-y divide-neutral-900 scrollbar-none">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 font-mono">
                  No images in db file. Seed some!
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs font-mono hover:bg-neutral-900/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <img src={item.imageUrl} alt="" className="w-8 h-8 object-cover rounded bg-neutral-900 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-neutral-200 truncate font-semibold">{item.title}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{item.category} • Likes {item.likes}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        title="Edit Details"
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                            onDeleteImage(item.id);
                          }
                        }}
                        title="Delete permanently"
                        className="p-1 hover:bg-red-950/40 rounded text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
