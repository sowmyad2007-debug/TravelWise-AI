import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Sparkles,
  ArrowRight,
  Sun,
  CloudSun,
  DollarSign,
  Layers,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export interface DestinationPOI {
  id: string;
  name: string;
  region: string;
  country: string;
  category: 'mountain' | 'coastal' | 'heritage' | 'global';
  lat: number;
  lon: number;
  dailyCost: string;
  climate: string;
  bestSeason: string;
  image: string;
  highlights: string[];
  description: string;
}

export const DESTINATIONS_CATALOG: DestinationPOI[] = [
  {
    id: 'munnar',
    name: 'Munnar',
    region: 'Western Ghats, Kerala',
    country: 'India',
    category: 'mountain',
    lat: 10.0889,
    lon: 77.0595,
    dailyCost: '₹1,350',
    climate: '15°C - 22°C • Misty Temperate',
    bestSeason: 'Sep - May',
    image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80',
    highlights: ['Anamudi Peak', 'Tea Plantations', 'Attukal Waterfalls'],
    description: 'Rolling emerald tea hills blanketed in morning fog with winding scenic mountain paths.'
  },
  {
    id: 'ooty',
    name: 'Ooty (Nilgiris)',
    region: 'Tamil Nadu',
    country: 'India',
    category: 'mountain',
    lat: 11.4102,
    lon: 76.695,
    dailyCost: '₹1,200',
    climate: '12°C - 19°C • Cool Highlands',
    bestSeason: 'Oct - Jun',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    highlights: ['UNESCO Toy Train', 'Botanical Gardens', 'Doddabetta Peak'],
    description: 'Heritage colonial hill town framed by pine forests and aromatic eucalyptus groves.'
  },
  {
    id: 'goa',
    name: 'Goa',
    region: 'Konkan Coast',
    country: 'India',
    category: 'coastal',
    lat: 15.2993,
    lon: 74.124,
    dailyCost: '₹1,500',
    climate: '26°C - 32°C • Coastal Breeze',
    bestSeason: 'Nov - Mar',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    highlights: ['Aguada Lighthouse', 'Old Goa Cathedrals', 'Spice Plantations'],
    description: 'Golden beaches, Portuguese baroque architecture, and vibrant coastal cuisine.'
  },
  {
    id: 'jaipur',
    name: 'Jaipur (Pink City)',
    region: 'Rajasthan',
    country: 'India',
    category: 'heritage',
    lat: 26.9124,
    lon: 75.7873,
    dailyCost: '₹1,400',
    climate: '22°C - 30°C • Desert Sunny',
    bestSeason: 'Oct - Mar',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    highlights: ['Amber Palace', 'Hawa Mahal', 'City Palace & Observatory'],
    description: 'Royal terracotta architecture, majestic hilltop forts, and legendary artisan bazaars.'
  },
  {
    id: 'manali',
    name: 'Manali',
    region: 'Himachal Pradesh',
    country: 'India',
    category: 'mountain',
    lat: 32.2432,
    lon: 77.1892,
    dailyCost: '₹1,300',
    climate: '8°C - 16°C • Alpine Fresh',
    bestSeason: 'Apr - Jun & Dec - Feb',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    highlights: ['Solang Valley', 'Hadimba Temple', 'Old Manali Cafes'],
    description: 'Gateway to the high Himalayas with pine forests, glacial streams, and cedar valleys.'
  },
  {
    id: 'paris',
    name: 'Paris',
    region: 'Île-de-France',
    country: 'France',
    category: 'global',
    lat: 48.8566,
    lon: 2.3522,
    dailyCost: '€55',
    climate: '14°C - 23°C • Mild European',
    bestSeason: 'Apr - Oct',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    highlights: ['Louvre Museum', 'Montmartre', 'Seine River Cruise'],
    description: 'Iconic world capital of art, gastronomy, historic boulevards, and timeless cafe culture.'
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    region: 'Interlaken / Zermatt',
    country: 'Switzerland',
    category: 'global',
    lat: 46.5584,
    lon: 8.5732,
    dailyCost: 'CHF 75',
    climate: '6°C - 18°C • Alpine Crisp',
    bestSeason: 'Jun - Sep & Dec - Mar',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    highlights: ['Matterhorn Views', 'Jungfrau Railway', 'Glacier Lakes'],
    description: 'Pristine snow-capped mountain peaks, emerald alpine meadows, and panoramic cogwheel trains.'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'Kansai',
    country: 'Japan',
    category: 'global',
    lat: 35.0116,
    lon: 135.7681,
    dailyCost: '¥7,500',
    climate: '16°C - 24°C • Temperate',
    bestSeason: 'Mar - May & Oct - Nov',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    highlights: ['Fushimi Inari Shrine', 'Arashiyama Bamboo Grove', 'Kinkaku-ji'],
    description: 'Centuries of preserved imperial gardens, serene bamboo forests, and traditional tea houses.'  },
  {
    id: 'tirupati',
    name: 'Tirupati (Tirumala)',
    region: 'Andhra Pradesh',
    country: 'India',
    category: 'heritage',
    lat: 13.6288,
    lon: 79.4192,
    dailyCost: '₹1,100',
    climate: '24°C - 34°C • Tropical Pilgrimage',
    bestSeason: 'Sep - Feb',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/960px-Tirumala_090615.jpg',
    highlights: ['Venkateswara Temple', 'Silathoranam Geological Arch', 'Kapila Theertham Falls'],
    description: 'Sacred Seven Hills of Seshachalam, housing the world-renowned temple of Lord Venkateswara.'
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam (Vizag)',
    region: 'Andhra Pradesh',
    country: 'India',
    category: 'coastal',
    lat: 17.6868,
    lon: 83.2185,
    dailyCost: '₹1,400',
    climate: '25°C - 32°C • Bay of Bengal Coast',
    bestSeason: 'Oct - Mar',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/RK_Beach_Visakhapatnam.jpg/960px-RK_Beach_Visakhapatnam.jpg',
    highlights: ['INS Kursura Submarine', 'Kailasagiri Hilltop', 'Rushikonda Beach'],
    description: 'Jewel of the East Coast with natural harbors, dramatic coastal cliffs, and maritime history.'
  },
  {
    id: 'london',
    name: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    category: 'global',
    lat: 51.5074,
    lon: -0.1278,
    dailyCost: '£65',
    climate: '11°C - 20°C • Maritime Temperate',
    bestSeason: 'May - Sep',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/London_Montage_L.jpg/960px-London_Montage_L.jpg',
    highlights: ['Big Ben & Westminster', 'Tower Bridge & Tower of London', 'British Museum'],
    description: 'World capital along the River Thames blending centuries of royal history with modern energy.'
  },
  {
    id: 'new_york',
    name: 'New York City',
    region: 'New York',
    country: 'United States',
    category: 'global',
    lat: 40.7128,
    lon: -74.0060,
    dailyCost: '',
    climate: '12°C - 26°C • Four Seasons',
    bestSeason: 'Apr - Jun & Sep - Nov',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
    highlights: ['Statue of Liberty', 'Central Park', 'Empire State Building'],
    description: 'The city that never sleeps, with world-famous skyscrapers, Broadway stages, and Central Park.'
  },
  {
    id: 'sydney',
    name: 'Sydney',
    region: 'New South Wales',
    country: 'Australia',
    category: 'global',
    lat: -33.8688,
    lon: 151.2093,
    dailyCost: 'AU',
    climate: '18°C - 27°C • Sunny Coastal',
    bestSeason: 'Sep - Nov & Mar - May',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Sydney_Opera_House_-_Dec_2008.jpg/960px-Sydney_Opera_House_-_Dec_2008.jpg',
    highlights: ['Sydney Opera House', 'Sydney Harbour Bridge', 'Bondi Beach Coastal Walk'],
    description: 'Glistening Pacific harbour city world-renowned for its architectural sails, bridge climb, and surf.'
  },
  {
    id: 'bali',
    name: 'Bali',
    region: 'Lesser Sunda Islands',
    country: 'Indonesia',
    category: 'coastal',
    lat: -8.3405,
    lon: 115.0920,
    dailyCost: '₹2,200',
    climate: '26°C - 31°C • Tropical Island',
    bestSeason: 'Apr - Oct',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Uluwatu_Temple_Bali.jpg/960px-Uluwatu_Temple_Bali.jpg',
    highlights: ['Uluwatu Sea Temple', 'Tegallalang Rice Terraces', 'Tanah Lot'],
    description: 'Island of the Gods featuring terraced rice fields, ancient Hindu cliff temples, and coastal beaches.'
  },
  {
    id: 'kedarnath',
    name: 'Kedarnath (Char Dham)',
    region: 'Garhwal Himalayas, Uttarakhand',
    country: 'India',
    category: 'mountain',
    lat: 30.7352,
    lon: 79.0669,
    dailyCost: '₹1,500',
    climate: '2°C - 14°C • High Altitude Alpine',
    bestSeason: 'May - Oct (Strictly Seasonal)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kedarnath_Temple_Uttarakhand.jpg/960px-Kedarnath_Temple_Uttarakhand.jpg',
    highlights: ['Kedarnath Temple (3,584m)', 'Bhairavnath Peak', 'Mandakini River Valley'],
    description: 'Sacred Himalayan Jyotirlinga standing amidst snow-clad peaks; open seasonally from May to October.'
  }
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural high-resolution realistic Earth canvas texture generator
function createEarthCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep oceanic background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#040d1a');
  oceanGrad.addColorStop(0.5, '#061a2f');
  oceanGrad.addColorStop(1, '#040d1a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle coordinate grid lines
  ctx.strokeStyle = 'rgba(13, 148, 136, 0.08)';
  ctx.lineWidth = 1;
  for (let lat = 0; lat <= canvas.height; lat += canvas.height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, lat);
    ctx.lineTo(canvas.width, lat);
    ctx.stroke();
  }
  for (let lon = 0; lon <= canvas.width; lon += canvas.width / 24) {
    ctx.beginPath();
    ctx.moveTo(lon, 0);
    ctx.lineTo(lon, canvas.height);
    ctx.stroke();
  }

  // Draw continent landmass approximations in deep emerald and charcoal-teal
  ctx.fillStyle = '#0f3833';
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
  ctx.lineWidth = 1.5;

  const continents = [
    // Eurasia & India
    [[1100, 220], [1450, 240], [1600, 320], [1500, 480], [1380, 520], [1280, 460], [1180, 400], [1050, 300]],
    // India sub-continent detail
    [[1320, 420], [1380, 430], [1390, 520], [1350, 560], [1330, 530], [1310, 460]],
    // Africa
    [[980, 400], [1150, 420], [1200, 560], [1140, 750], [1050, 780], [980, 620], [920, 480]],
    // North America
    [[350, 200], [600, 220], [680, 350], [550, 480], [420, 450], [280, 320]],
    // South America
    [[520, 520], [650, 560], [680, 720], [580, 880], [520, 820], [480, 620]],
    // Australia
    [[1550, 620], [1720, 640], [1750, 780], [1620, 820], [1520, 720]],
    // Japan / East Asian islands
    [[1650, 380], [1680, 410], [1660, 450], [1630, 420]],
    // UK & Western Europe
    [[980, 280], [1050, 290], [1080, 350], [1000, 360], [960, 310]]
  ];

  continents.forEach((poly) => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Mountain highlights and warm topographical elevation spots
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  const mountainRegions = [
    [1330, 380, 60], // Himalayas
    [1040, 330, 30], // Alps
    [480, 320, 45],  // Rockies
    [580, 680, 40]   // Andes
  ];
  mountainRegions.forEach(([x, y, r]) => {
    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const Globe3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDest, setSelectedDest] = useState<DestinationPOI>(DESTINATIONS_CATALOG[0]);
  const [isRotating, setIsRotating] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const filteredDestinations = DESTINATIONS_CATALOG.filter((d) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'india') return d.country === 'India';
    if (activeCategory === 'global') return d.country !== 'India';
    return d.category === activeCategory;
  });

  const handleSelectDestination = (dest: DestinationPOI) => {
    setSelectedDest(dest);
    if (globeGroupRef.current) {
      // Calculate rotation required to center target lat/lon
      const targetY = -((dest.lon + 90) * (Math.PI / 180));
      const targetX = (dest.lat) * (Math.PI / 180) * 0.5;
      targetRotationRef.current = { x: targetX, y: targetY };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // 1. Scene & Camera
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 500;
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 2.8;
      cameraRef.current = camera;

      // 2. WebGL Renderer with High-DPI & Anti-aliasing
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 3. Lighting Setup: Sun Directional Light + Warm Fill + Soft Ambient
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
      sunLight.position.set(4, 3, 3);
      scene.add(sunLight);

      const tealRimLight = new THREE.DirectionalLight(0x0d9488, 1.8);
      tealRimLight.position.set(-4, -2, -2);
      scene.add(tealRimLight);

      // 4. Globe Object Group
      const globeGroup = new THREE.Group();
      globeGroupRef.current = globeGroup;
      scene.add(globeGroup);

      // 5. Earth Sphere
      const earthRadius = 0.95;
      const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
      const earthTexture = createEarthCanvasTexture();

      const earthMaterial = new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 0.65,
        metalness: 0.1,
      });

      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
      globeGroup.add(earthMesh);

      // 6. Atmospheric Glow Outer Shell
      const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.025, 48, 48);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x14b8a6,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      });
      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      globeGroup.add(atmosphereMesh);

      // 7. Add Destination Markers
      const markerGroup = new THREE.Group();
      globeGroup.add(markerGroup);

      DESTINATIONS_CATALOG.forEach((dest) => {
        const pos = latLonToVector3(dest.lat, dest.lon, earthRadius * 1.01);
        
        // Marker Pin Core
        const pinGeom = new THREE.SphereGeometry(0.022, 16, 16);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
        const pinMesh = new THREE.Mesh(pinGeom, pinMat);
        pinMesh.position.copy(pos);
        pinMesh.userData = { destinationId: dest.id };

        // Outer Beacon Ring
        const ringGeom = new THREE.RingGeometry(0.028, 0.04, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
        pinMesh.add(ringMesh);

        markerGroup.add(pinMesh);
      });

      // 8. Interactive Mouse & Touch Drag Controls
      const onMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        setIsRotating(false);
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x = Math.max(-0.8, Math.min(0.8, targetRotationRef.current.x + deltaY * 0.005));

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        setTimeout(() => setIsRotating(true), 3000);
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Handle Resize
      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // 9. Animation Render Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (globeGroupRef.current) {
          // Auto spin when idle
          if (isRotating && !isDraggingRef.current) {
            targetRotationRef.current.y += 0.0018;
          }

          // Smooth interpolation damping
          globeGroupRef.current.rotation.y += (targetRotationRef.current.y - globeGroupRef.current.rotation.y) * 0.05;
          globeGroupRef.current.rotation.x += (targetRotationRef.current.x - globeGroupRef.current.rotation.x) * 0.05;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        domElement.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        renderer.dispose();
      };
    } catch (err) {
      console.warn('WebGL initialization fallback triggered:', err);
      setWebglError(true);
    }
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const delta = direction === 'in' ? -0.3 : 0.3;
    cameraRef.current.position.z = Math.max(1.8, Math.min(3.8, cameraRef.current.position.z + delta));
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-[#050b14] to-slate-950 border border-slate-800/80 shadow-2xl p-6 lg:p-8">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3984F5]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F472B6]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header controls & Filter Pills */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/15 border border-[#3984F5]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#60A5FA]">
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Interactive 3D Planetary Navigator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Explore Destinations in Real 3D Space
          </h2>
          <p className="text-xs text-slate-400">
            Rotate the globe, pinpoint curated travel havens, and initialize a customized budget itinerary.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Sights' },
            { id: 'india', label: 'India' },
            { id: 'global', label: 'International' },
            { id: 'mountain', label: 'Misty Mountains' },
            { id: 'coastal', label: 'Coastal' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#3984F5] text-white shadow-md shadow-[#3984F5]/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Canvas Area & Floating Preview Split */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center min-h-[500px] mt-4">
        
        {/* Left / Center 3D Globe Canvas Container */}
        <div className="lg:col-span-7 relative h-[420px] sm:h-[500px] flex items-center justify-center">
          
          {!webglError ? (
            <div
              ref={containerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center relative z-10"
              title="Click and drag to rotate the globe"
            />
          ) : (
            // Graceful 2.5D Fallback Radar for devices without WebGL
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Compass className="w-16 h-16 text-teal-400 animate-spin-slow opacity-80" />
              <div>
                <h3 className="text-base font-bold text-white">Interactive Destination Radar</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Select any destination below to inspect travel budget estimates and launch your adaptive itinerary.
                </p>
              </div>
            </div>
          )}

          {/* On-Canvas Floating Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => handleZoom('in')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`p-2 rounded-xl transition-colors ${
                isRotating ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title={isRotating ? 'Pause Rotation' : 'Resume Auto Rotation'}
            >
              <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin-slow' : ''}`} />
            </button>
          </div>

          <div className="absolute top-4 left-4 z-20 text-[10px] text-slate-500 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-800 font-mono">
            DRAG TO ROTATE • HOVER PINS
          </div>
        </div>

        {/* Right: Floating Glass Luxury Destination Preview Card */}
        <div className="lg:col-span-5 relative z-20">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Destination Photo Header */}
            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={selectedDest.image}
                alt={selectedDest.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-teal-300 border border-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>{selectedDest.region}</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{selectedDest.name}</h3>
                  <p className="text-xs text-slate-300 font-medium">{selectedDest.country}</p>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-300 border border-emerald-500/30 text-right">
                  <span className="text-[9px] uppercase block text-emerald-400">Est. Daily</span>
                  {selectedDest.dailyCost}
                </div>
              </div>
            </div>

            {/* Description & Climate */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedDest.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <CloudSun className="w-3 h-3 text-teal-400" />
                  Climate
                </span>
                <p className="font-bold text-white text-[11px] truncate">{selectedDest.climate}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  Optimal Season
                </span>
                <p className="font-bold text-white text-[11px] truncate">{selectedDest.bestSeason}</p>
              </div>
            </div>

            {/* Highlights Tag Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Curated Highlights</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedDest.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-medium"
                  >
                    • {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct 1-Click Planning Action */}
            <button
              onClick={() => navigate(`/create-trip?destination=${encodeURIComponent(selectedDest.name)}`)}
              className="w-full py-3 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Plan Personalized Trip to {selectedDest.name}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Select Destination Pill Strip */}
      <div className="mt-6 pt-5 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 shrink-0 mr-2 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          Quick Focus:
        </span>
        {filteredDestinations.map((dest) => (
          <button
            key={dest.id}
            onClick={() => handleSelectDestination(dest)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
              selectedDest.id === dest.id
                ? 'bg-[#3984F5]/20 border-[#3984F5] text-[#60A5FA] shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>{dest.name}</span>
            <span className="text-[10px] text-slate-500">({dest.dailyCost}/day)</span>
          </button>
        ))}
      </div>

    </div>
  );
};
