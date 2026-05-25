/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AspectRatio = 'square' | 'video' | 'portrait' | 'wide' | 'standard';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  uploadedAt: string;
  aspectRatio: AspectRatio;
  isFeatured: boolean;
  views: number;
  likes: number;
  cameraModel?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

export interface LiveUpdateEvent {
  type: 'create' | 'update' | 'delete';
  item: GalleryItem;
}

export interface GalleryStats {
  totalImages: number;
  totalViews: number;
  totalLikes: number;
  categories: { name: string; count: number }[];
}
