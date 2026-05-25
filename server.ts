/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Enable rich JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local uploaded files statically of the public directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Memory store fallback if file read fails
interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  uploadedAt: string;
  aspectRatio: string;
  isFeatured: boolean;
  views: number;
  likes: number;
  cameraModel?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

const SEED_IMAGES: GalleryItem[] = [
  {
    id: 'seed-1',
    title: 'Ethereal Silent Peaks',
    description: 'A serene exposure of snow-swept mountain ranges catching the warm pastel light of late evening.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    category: 'Landscape',
    tags: ['mountain', 'snow', 'sunset', 'exposition'],
    uploadedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    aspectRatio: 'wide',
    isFeatured: true,
    views: 432,
    likes: 58,
    cameraModel: 'Fujifilm X-T4',
    aperture: 'f/8.0',
    shutterSpeed: '1/120s',
    iso: '160',
  },
  {
    id: 'seed-2',
    title: 'Neon Brutalist Geometry',
    description: 'An abstract exploration of cast concrete architecture highlighted by synthetic cyberpunk light reflections.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    category: 'Architecture',
    tags: ['concrete', 'geometric', 'neon', 'shadow'],
    uploadedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    aspectRatio: 'portrait',
    isFeatured: false,
    views: 289,
    likes: 31,
    cameraModel: 'Sony Alpha 7R III',
    aperture: 'f/4.0',
    shutterSpeed: '1/60s',
    iso: '800',
  },
  {
    id: 'seed-3',
    title: 'Celestial Dreamscape',
    description: 'Deep long-exposure capture of the cosmic core arching over a desolate desert monolith.',
    imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80',
    category: 'Astro',
    tags: ['cosmos', 'stars', 'night', 'sky'],
    uploadedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    aspectRatio: 'standard',
    isFeatured: true,
    views: 845,
    likes: 124,
    cameraModel: 'Canon EOS R5',
    aperture: 'f/1.8',
    shutterSpeed: '15s',
    iso: '3200',
  },
  {
    id: 'seed-4',
    title: 'Quiet Coffee Counterpoint',
    description: 'A quiet morning play of light and shadow reflecting off a clean porcelain espresso setup.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    category: 'Minimalist',
    tags: ['coffee', 'interior', 'minimal', 'nordic'],
    uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    aspectRatio: 'square',
    isFeatured: false,
    views: 198,
    likes: 22,
    cameraModel: 'Leica Q2',
    aperture: 'f/2.8',
    shutterSpeed: '1/250s',
    iso: '400',
  },
  {
    id: 'seed-5',
    title: 'Gaze of Golden Hour',
    description: 'Warm, direct sunshine illuminating detailed features framed by amber fall foliage.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80',
    category: 'Portrait',
    tags: ['portrait', 'autumn', 'sunlight', 'bokeh'],
    uploadedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    aspectRatio: 'portrait',
    isFeatured: true,
    views: 612,
    likes: 95,
    cameraModel: 'Sony Alpha 7 IV',
    aperture: 'f/1.4',
    shutterSpeed: '1/500s',
    iso: '100',
  },
  {
    id: 'seed-6',
    title: 'Verdant Canopy Whispers',
    description: 'An atmospheric perspective standing among towering Redwood giants cloaked in coastal dew.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    category: 'Landscape',
    tags: ['forest', 'redwoods', 'nature', 'fog'],
    uploadedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    aspectRatio: 'wide',
    isFeatured: false,
    views: 341,
    likes: 47,
    cameraModel: 'Nikon Z8',
    aperture: 'f/5.6',
    shutterSpeed: '1/160s',
    iso: '200',
  }
];

// Read database
function readDB(): GalleryItem[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file, using memory fallback:', err);
  }
  // Initialize with seeds if not exists
  writeDB(SEED_IMAGES);
  return SEED_IMAGES;
}

// Write database
function writeDB(data: GalleryItem[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Real-time clients list (SSE)
let sseClients: any[] = [];

function broadcast(event: { type: 'create' | 'update' | 'delete'; item: GalleryItem }) {
  console.log('SSE Broadcaster emitting:', event.type, event.item.id);
  const data = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(data);
    } catch (e) {
      console.error('Error writing SSE stream to client:', e);
    }
  });
}

// REST Middlewares
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API Routes

// Real-time Event Stream endpoint
app.get('/api/live', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Cloud Run / Nginx buffering for instantaneous delivery
  });

  const clientId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  console.log(`SSE: Client connected: ${clientId}. Total active listening: ${sseClients.length}`);

  // Send initial keep-alive comment
  res.write(': sse-connection-ready\n\n');

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
    console.log(`SSE: Client disconnected: ${clientId}. Remaining listening: ${sseClients.length}`);
  });
});

// GET images
app.get('/api/images', (req, res) => {
  const items = readDB();
  // Simply return sorted list (most recent first)
  const sorted = [...items].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json(sorted);
});

// GET single image
app.get('/api/images/:id', (req, res) => {
  const items = readDB();
  const found = items.find(i => i.id === req.params.id);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST increment views (view counter side-channel)
app.post('/api/images/:id/view', (req, res) => {
  const items = readDB();
  const index = items.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    items[index].views += 1;
    writeDB(items);
    broadcast({ type: 'update', item: items[index] });
    res.json(items[index]);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST toggle like (or simple like add)
app.post('/api/images/:id/like', (req, res) => {
  const items = readDB();
  const index = items.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    // Simple toggle like or support increment
    items[index].likes += 1;
    writeDB(items);
    broadcast({ type: 'update', item: items[index] });
    res.json(items[index]);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST upload new image
app.post('/api/images', (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      aspectRatio,
      cameraModel,
      aperture,
      shutterSpeed,
      iso,
      base64Data, // Ex: "data:image/jpeg;base64,...."
    } = req.body;

    if (!title || !base64Data) {
      return res.status(400).json({ error: 'Missing title or base64Data' });
    }

    // Decode and save file
    const match = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format, must be data URL base64' });
    }

    const ext = match[1];
    const cleanBase64 = match[2];
    const filename = `uploaded_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));

    // The image path exposed over API
    const imageUrl = `/uploads/${filename}`;

    const items = readDB();
    const newItem: GalleryItem = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: (description || '').trim(),
      imageUrl,
      category: (category || 'General').trim(),
      tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(t => t.trim()).filter(Boolean),
      uploadedAt: new Date().toISOString(),
      aspectRatio: aspectRatio || 'standard',
      isFeatured: false,
      views: 0,
      likes: 0,
      cameraModel: (cameraModel || '').trim() || undefined,
      aperture: (aperture || '').trim() || undefined,
      shutterSpeed: (shutterSpeed || '').trim() || undefined,
      iso: (iso || '').trim() || undefined,
    };

    items.push(newItem);
    writeDB(items);

    broadcast({ type: 'create', item: newItem });

    res.status(201).json(newItem);
  } catch (err: any) {
    console.error('Error handling upload endpoint:', err);
    res.status(500).json({ error: 'Failed to process file upload: ' + err.message });
  }
});

// PUT update image details
app.put('/api/images/:id', (req, res) => {
  const items = readDB();
  const index = items.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    const { title, description, category, tags, aspectRatio, isFeatured, cameraModel, aperture, shutterSpeed, iso } = req.body;
    
    const updated = {
      ...items[index],
      title: title !== undefined ? title.trim() : items[index].title,
      description: description !== undefined ? description.trim() : items[index].description,
      category: category !== undefined ? category.trim() : items[index].category,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : items[index].tags,
      aspectRatio: aspectRatio !== undefined ? aspectRatio : items[index].aspectRatio,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : items[index].isFeatured,
      cameraModel: cameraModel !== undefined ? cameraModel.trim() || undefined : items[index].cameraModel,
      aperture: aperture !== undefined ? aperture.trim() || undefined : items[index].aperture,
      shutterSpeed: shutterSpeed !== undefined ? shutterSpeed.trim() || undefined : items[index].shutterSpeed,
      iso: iso !== undefined ? iso.trim() || undefined : items[index].iso,
    };

    items[index] = updated;
    writeDB(items);

    broadcast({ type: 'update', item: updated });

    res.json(updated);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// DELETE delete image
app.delete('/api/images/:id', (req, res) => {
  const items = readDB();
  const foundItem = items.find(i => i.id === req.params.id);
  if (foundItem) {
    // Optional: Delete physical file if it's local
    if (foundItem.imageUrl.startsWith('/uploads/')) {
      const filename = foundItem.imageUrl.replace('/uploads/', '');
      const fullPath = path.join(UPLOADS_DIR, filename);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (e) {
        console.error('Failed to delete physical file:', e);
      }
    }

    const filtered = items.filter(i => i.id !== req.params.id);
    writeDB(filtered);

    broadcast({ type: 'delete', item: foundItem });

    res.json({ success: true, id: req.params.id });
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// GET summary stats
app.get('/api/stats', (req, res) => {
  const items = readDB();
  const totalImages = items.length;
  const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalLikes = items.reduce((sum, item) => sum + (item.likes || 0), 0);
  
  // Categories lookup map
  const catMap: Record<string, number> = {};
  items.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + 1;
  });

  const categories = Object.keys(catMap).map(name => ({
    name,
    count: catMap[name]
  })).sort((a,b) => b.count - a.count);

  res.json({
    totalImages,
    totalViews,
    totalLikes,
    categories
  });
});

// Full-stack Vite server pipeline
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
