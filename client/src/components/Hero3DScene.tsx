import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Plane,
  Receipt,
  PieChart,
  Wallet,
  TrendingDown,
  ShieldCheck,
  Globe2,
  Coins,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface CityPOI {
  name: string;
  country: string;
  lat: number;
  lon: number;
  color: number;
  flag: string;
}

const CITIES: CityPOI[] = [
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, color: 0x4f7df3, flag: '🇬🇧' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, color: 0x24b8a5, flag: '🇫🇷' },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, color: 0x8b5cf6, flag: '🇨🇭' },
  { name: 'Munnar', country: 'India', lat: 10.0889, lon: 77.0595, color: 0x10b981, flag: '🇮🇳' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, color: 0xf43f5e, flag: '🇯🇵' },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060, color: 0x3b82f6, flag: '🇺🇸' },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural high-fidelity Earth texture fallback in case texture loading is delayed or blocked
function createFallbackEarthCanvas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep realistic ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0a2342');
    oceanGrad.addColorStop(0.3, '#0c2d54');
    oceanGrad.addColorStop(0.5, '#0e3a6c');
    oceanGrad.addColorStop(0.7, '#0c2d54');
    oceanGrad.addColorStop(1, '#0a2342');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle coastal turquoise shallow shelf glow
    ctx.fillStyle = '#155d82';
    const drawBlob = (cx: number, cy: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // Continents base (Rich Earth green & savanna tan)
    ctx.fillStyle = '#1c4a2b';
    drawBlob(480, 320, 220, 140);  // North America
    drawBlob(540, 400, 120, 90);   // Mexico / Central America
    drawBlob(680, 660, 120, 190);  // South America
    drawBlob(1100, 300, 130, 90);  // Europe
    drawBlob(1120, 560, 160, 190); // Africa
    drawBlob(1440, 340, 260, 170); // Asia / Siberia
    drawBlob(1340, 460, 120, 110); // India subcontinent
    drawBlob(1680, 420, 50, 70);   // Japan
    drawBlob(1680, 720, 140, 100); // Australia

    // Desert / savanna ochre highlights (Sahara, Gobi, Outback)
    ctx.fillStyle = '#8b6c42';
    drawBlob(1120, 480, 130, 70);  // Sahara
    drawBlob(1420, 360, 110, 50);  // Gobi
    drawBlob(1680, 720, 90, 60);   // Australian Outback

    // Mountain ranges (Rockies, Andes, Himalayas, Alps)
    ctx.fillStyle = '#5c4832';
    drawBlob(420, 300, 40, 110);   // Rockies
    drawBlob(640, 660, 30, 160);   // Andes
    drawBlob(1360, 380, 90, 40);   // Himalayas
    drawBlob(1080, 330, 40, 25);   // Alps

    // Polar ice caps
    ctx.fillStyle = '#e8f4fc';
    ctx.fillRect(0, 0, 2048, 70);
    ctx.fillRect(0, 954, 2048, 70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export const Hero3DScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Floating Micro-Expense Badges
  const [activeBadgeIndex, setActiveBadgeIndex] = useState(0);

  const sampleBadges = [
    { city: 'Tokyo, Japan', item: 'Shinkansen Bullet Train', cost: '$98.50', category: 'Transit', icon: '🚄' },
    { city: 'Paris, France', item: 'Montmartre Hotel Stay', cost: '€124.00', category: 'Stay', icon: '🏨' },
    { city: 'New York, USA', item: 'JFK to Heathrow Flight', cost: '$540.00', category: 'Flight', icon: '✈️' },
    { city: 'Munnar, India', item: 'Highland Tea Estate', cost: '₹1,850', category: 'Experience', icon: '🍵' },
    { city: 'Zurich, Switzerland', item: 'Alpine Cable Car Pass', cost: 'CHF 65.00', category: 'Activity', icon: '🚠' },
    { city: 'London, UK', item: 'Westminster Heritage Tour', cost: '£42.00', category: 'Culture', icon: '🏛️' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBadgeIndex((prev) => (prev + 1) % sampleBadges.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [sampleBadges.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    try {
      // Ensure clean container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 580;

      // 1. Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0.35, 4.3);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      container.appendChild(renderer.domElement);

      // 2. Realistic Space Lighting (Sunlight from one side, soft cosmic fill, subtle rim glow)
      const ambientLight = new THREE.AmbientLight(0x405570, 0.95);
      scene.add(ambientLight);

      // Main Directional Sunlight casting crisp planetary day/night terminator
      const sunLight = new THREE.DirectionalLight(0xffffff, 2.3);
      sunLight.position.set(5.5, 3.8, 4.2);
      scene.add(sunLight);

      // Atmospheric Rim Light (Cyan/Blue horizon glow)
      const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
      rimLight.position.set(-5.5, -2.5, -3.2);
      scene.add(rimLight);

      // Turquoise soft accent light for ocean depth
      const oceanLight = new THREE.DirectionalLight(0x24b8a5, 0.7);
      oceanLight.position.set(2, -4, 2.5);
      scene.add(oceanLight);

      // 3. Globe Group
      const globeGroup = new THREE.Group();
      // Subtle tilt corresponding to Earth's 23.4° axial tilt
      globeGroup.rotation.z = THREE.MathUtils.degToRad(-15);
      scene.add(globeGroup);

      const globeRadius = 1.38;

      // 4. Load High-Resolution Realistic Earth Texture Maps
      const textureLoader = new THREE.TextureLoader();

      // Earth Material setup with immediate realistic canvas fallback
      const fallbackTexture = createFallbackEarthCanvas();
      const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
      const globeMat = new THREE.MeshStandardMaterial({
        map: fallbackTexture,
        roughness: 0.65,
        metalness: 0.08,
      });
      const globeMesh = new THREE.Mesh(globeGeo, globeMat);
      globeGroup.add(globeMesh);

      // Safely load bundled realistic Earth daymap texture
      textureLoader.load(
        '/textures/earth_daymap.jpg',
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          globeMat.map = tex;
          globeMat.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn('Bundled Earth texture fallback used:', err);
        }
      );

      // 5. Realistic Natural Cloud Sphere Layer
      let cloudMesh: THREE.Mesh | null = null;
      const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.012, 48, 48);
      const cloudMat = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      globeGroup.add(cloudMesh);

      textureLoader.load(
        '/textures/earth_clouds.png',
        (cloudTex) => {
          cloudTex.colorSpace = THREE.SRGBColorSpace;
          cloudTex.needsUpdate = true;
          cloudMat.map = cloudTex;
          cloudMat.needsUpdate = true;
        },
        undefined,
        () => {
          // Keep subtle transparent cloud sheen if image fails
          cloudMat.color.set(0xffffff);
          cloudMat.opacity = 0.15;
        }
      );

      // 6. Thin Blue Atmospheric Outer Glow Shell
      const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.035, 36, 36);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: 0x4f8cff,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      globeGroup.add(atmosMesh);

      // 7. Geographic Location Markers (London, Tokyo, Paris, New York, Munnar, Zurich)
      const pinGroup = new THREE.Group();
      const ringMeshes: { ring: THREE.Mesh; mat: THREE.MeshBasicMaterial; index: number }[] = [];

      CITIES.forEach((city, index) => {
        const pos = latLonToVector3(city.lat, city.lon, globeRadius);

        // Core glowing beacon bead
        const pinGeo = new THREE.SphereGeometry(0.038, 16, 16);
        const pinMat = new THREE.MeshStandardMaterial({
          color: city.color,
          emissive: city.color,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(pos.clone().multiplyScalar(1.012));
        pinGroup.add(pinMesh);

        // Pulsating beacon radar ring
        const ringGeo = new THREE.RingGeometry(0.045, 0.075, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: city.color,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos.clone().multiplyScalar(1.014));
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        pinGroup.add(ring);
        ringMeshes.push({ ring, mat: ringMat, index });
      });

      globeGroup.add(pinGroup);

      // 8. Great-Circle Curved Flight Routes
      // Create closed-loop route: New York -> London -> Paris -> Zurich -> Munnar -> Tokyo -> New York
      const routeOrder = [5, 0, 1, 2, 3, 4]; // indices in CITIES
      const splinePoints: THREE.Vector3[] = [];

      for (let i = 0; i < routeOrder.length; i++) {
        const c1 = CITIES[routeOrder[i]];
        const c2 = CITIES[routeOrder[(i + 1) % routeOrder.length]];
        const p1 = latLonToVector3(c1.lat, c1.lon, globeRadius);
        const p2 = latLonToVector3(c2.lat, c2.lon, globeRadius);

        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const dist = p1.distanceTo(p2);
        // Elevate curve above Earth surface smoothly
        const altitude = globeRadius + 0.15 + Math.min(0.25, dist * 0.08);
        mid.normalize().multiplyScalar(altitude);

        const q1 = p1.clone().lerp(mid, 0.5).normalize().multiplyScalar(globeRadius + (altitude - globeRadius) * 0.72);
        const q2 = mid.clone().lerp(p2, 0.5).normalize().multiplyScalar(globeRadius + (altitude - globeRadius) * 0.72);

        splinePoints.push(p1.clone().multiplyScalar(1.015), q1, mid, q2);
      }

      const flightSpline = new THREE.CatmullRomCurve3(splinePoints, true);

      // Primary Flight Tube (Glowing Royal Blue)
      const tubeGeo = new THREE.TubeGeometry(flightSpline, 140, 0.013, 8, true);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x4f7df3,
        transparent: true,
        opacity: 0.85,
      });
      const flightPathMesh = new THREE.Mesh(tubeGeo, tubeMat);
      globeGroup.add(flightPathMesh);

      // Moving Turquoise Route Particles / Light Pulses
      const particlesCount = 8;
      const particleGeo = new THREE.SphereGeometry(0.024, 12, 12);
      const particleMat = new THREE.MeshBasicMaterial({ color: 0x24b8a5 });
      const particles: THREE.Mesh[] = [];

      for (let i = 0; i < particlesCount; i++) {
        const pMesh = new THREE.Mesh(particleGeo, particleMat);
        globeGroup.add(pMesh);
        particles.push(pMesh);
      }

      // Secondary Route (Paris -> Zurich -> Munnar regional connector)
      const altP1 = latLonToVector3(48.8566, 2.3522, globeRadius);
      const altP2 = latLonToVector3(47.3769, 8.5417, globeRadius);
      const altP3 = latLonToVector3(10.0889, 77.0595, globeRadius);
      const altMid = altP2.clone().add(altP3).multiplyScalar(0.5).normalize().multiplyScalar(globeRadius + 0.22);
      const altSpline = new THREE.CatmullRomCurve3([altP1, altP2, altMid, altP3]);
      const altTube = new THREE.Mesh(
        new THREE.TubeGeometry(altSpline, 64, 0.009, 6, false),
        new THREE.MeshBasicMaterial({ color: 0x24b8a5, transparent: true, opacity: 0.65 })
      );
      globeGroup.add(altTube);

      // 9. Low-Poly White 3D Airplane Model
      const airplaneGroup = new THREE.Group();

      // Fuselage (Body)
      const bodyGeo = new THREE.ConeGeometry(0.055, 0.32, 12);
      bodyGeo.rotateX(Math.PI / 2);
      const whiteGlossMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.15,
      });
      const fuselage = new THREE.Mesh(bodyGeo, whiteGlossMat);
      airplaneGroup.add(fuselage);

      // Wings
      const wingGeo = new THREE.BoxGeometry(0.42, 0.012, 0.09);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
      });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, 0, -0.04);
      airplaneGroup.add(wings);

      // Wingtip Accents (Primary Blue)
      const tipGeo = new THREE.BoxGeometry(0.02, 0.03, 0.08);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x4f7df3 });
      const tipL = new THREE.Mesh(tipGeo, tipMat);
      tipL.position.set(-0.21, 0.015, -0.04);
      airplaneGroup.add(tipL);
      const tipR = new THREE.Mesh(tipGeo, tipMat);
      tipR.position.set(0.21, 0.015, -0.04);
      airplaneGroup.add(tipR);

      // Tail fin
      const finGeo = new THREE.BoxGeometry(0.015, 0.085, 0.07);
      const fin = new THREE.Mesh(finGeo, wingMat);
      fin.position.set(0, 0.045, -0.12);
      airplaneGroup.add(fin);

      globeGroup.add(airplaneGroup);

      // 10. Interactive Drag-to-Rotate & Smooth Mouse Parallax
      let mouseX = 0;
      let mouseY = 0;
      let isDragging = false;
      let prevMousePos = { x: 0, y: 0 };

      const onPointerDown = (e: MouseEvent) => {
        isDragging = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
      };

      const onPointerMove = (e: MouseEvent) => {
        if (isDragging) {
          const deltaX = e.clientX - prevMousePos.x;
          const deltaY = e.clientY - prevMousePos.y;
          globeGroup.rotation.y += deltaX * 0.005;
          globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, globeGroup.rotation.x + deltaY * 0.005));
          prevMousePos = { x: e.clientX, y: e.clientY };
        } else {
          const rect = container.getBoundingClientRect();
          mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        }
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      // Resize Listener
      const onResize = () => {
        if (!container) return;
        const newW = container.clientWidth || 600;
        const newH = container.clientHeight || 580;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', onResize);

      // 11. Animation Loop
      const startTime = performance.now();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const elapsedTime = (performance.now() - startTime) / 1000;

        // Smooth Earth Rotation around its axis
        if (!isDragging && !prefersReducedMotion) {
          globeGroup.rotation.y += 0.0022;
        }

        // Natural swirling cloud rotation (clouds rotate slightly faster than Earth)
        if (cloudMesh && !prefersReducedMotion) {
          cloudMesh.rotation.y += 0.0028;
        }

        // Camera mouse parallax
        if (!prefersReducedMotion) {
          camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.035;
          camera.position.y += (0.35 + mouseY * 0.22 - camera.position.y) * 0.035;
          camera.lookAt(0, 0, 0);
        }

        // Move Airplane along Catmull-Rom spline orbit
        const airplaneSpeed = prefersReducedMotion ? 0.015 : 0.055;
        const t = (elapsedTime * airplaneSpeed) % 1;
        const currentPos = flightSpline.getPointAt(t);
        const tangent = flightSpline.getTangentAt(t).normalize();

        // Compute orientation matrix aligning airplane nose to tangent and belly to Earth surface
        const up = currentPos.clone().normalize();
        const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

        const orientMatrix = new THREE.Matrix4();
        orientMatrix.makeBasis(right, correctedUp, tangent);

        airplaneGroup.position.copy(currentPos);
        airplaneGroup.setRotationFromMatrix(orientMatrix);

        // Move turquoise light particles along flight path
        particles.forEach((p, i) => {
          const pt = (elapsedTime * 0.08 + (i / particles.length)) % 1;
          p.position.copy(flightSpline.getPointAt(pt));
        });

        // Animate pulsating city beacon radar rings
        ringMeshes.forEach(({ ring, mat, index }) => {
          const wave = Math.sin(elapsedTime * 2.8 + index * 1.1);
          const scale = 1 + 0.3 * wave;
          ring.scale.set(scale, scale, scale);
          mat.opacity = 0.35 + 0.45 * (1 - (wave + 1) / 2);
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        container.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('resize', onResize);

        // Dispose Three.js resources
        globeGeo.dispose();
        globeMat.dispose();
        cloudGeo.dispose();
        cloudMat.dispose();
        atmosGeo.dispose();
        atmosMat.dispose();
        tubeGeo.dispose();
        tubeMat.dispose();
        bodyGeo.dispose();
        wingGeo.dispose();
        tipGeo.dispose();
        finGeo.dispose();
        whiteGlossMat.dispose();
        wingMat.dispose();
        tipMat.dispose();

        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('3D Scene WebGL initialization skipped:', err);
      setWebglSupported(false);
    }
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#F5F8FF] via-white to-[#F5F8FF] dark:from-[#0B1224] dark:via-[#121D33] dark:to-[#0B1224] pt-6 sm:pt-10 pb-16 lg:pb-24 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
      
      {/* Decorative Pastel Ambient Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-[#3984F5]/10 dark:bg-[#3984F5]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#F472B6]/10 dark:bg-[#F472B6]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-[#FACC15]/10 dark:bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: SaaS Value Proposition & Action CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] shadow-sm text-xs font-semibold text-[#172554] dark:text-[#F1F5F9]">
              <span className="w-2 h-2 rounded-full bg-[#3984F5] animate-ping" />
              <span className="text-[#3984F5] dark:text-[#60A5FA] font-bold">3D Earth Tracker</span>
              <span className="text-[#64748B] dark:text-[#B6C2D6]">•</span>
              <span className="text-[#64748B] dark:text-[#B6C2D6]">Realistic Planetary Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight leading-[1.12]">
              Travel More. <br />
              <span className="bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] bg-clip-text text-transparent">
                Spend Smarter.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#64748B] dark:text-[#B6C2D6] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Plan your journeys, track every expense, and make every trip count with TravelWise AI+. Seamless currency conversion, interactive 3D analytics, and an intelligent budget guardian.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/create-trip"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-sm shadow-lg shadow-[#3984F5]/25 hover:shadow-xl hover:shadow-[#3984F5]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-[#121D33] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] font-bold text-sm border border-[#DCE6F5] dark:border-[#2A3A56] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                <span>Explore Dashboard</span>
              </Link>
            </div>

            {/* Value Stat Pills */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#DCE6F5] dark:border-[#2A3A56] max-w-lg mx-auto lg:mx-0">
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">100%</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-medium">Automatic Balance</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-[#F472B6]">0%</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-medium">Overspend Risk</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-[#3984F5] dark:text-[#60A5FA]">9+ Currencies</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-medium">Live Conversion</p>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic 3D Earth Globe Scene */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[540px]">
            
            {/* 3D WebGL Canvas Container */}
            <div
              ref={containerRef}
              className="w-full h-[460px] sm:h-[540px] flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
              title="Click and drag to rotate the realistic 3D Earth"
            >
              {!webglSupported && (
                // 2.5D Fallback for non-WebGL environments
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#121D33] rounded-3xl border border-[#DCE6F5] dark:border-[#2A3A56] shadow-xl space-y-4">
                  <div className="w-24 h-24 rounded-full bg-[#3984F5]/10 flex items-center justify-center text-[#3984F5] dark:text-[#60A5FA]">
                    <Globe2 className="w-14 h-14 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">3D Earth Interactive Radar</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] mt-1">Real-time global routes & automated expense tracking</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Floating Glass Travel Badge 1 (Top Left) */}
            <div className="absolute top-6 left-2 sm:left-6 z-20 hidden sm:flex items-center gap-3 p-3 bg-white/95 dark:bg-[#121D33]/95 backdrop-blur-md rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] shadow-lg shadow-slate-200/50 dark:shadow-black/50 animate-float-gentle">
              <div className="w-10 h-10 rounded-xl bg-[#3984F5]/15 flex items-center justify-center text-xl">
                ✈️
              </div>
              <div className="text-left pr-2">
                <span className="text-[10px] uppercase font-bold text-[#3984F5] dark:text-[#60A5FA] tracking-wider">Flight Active</span>
                <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">London → Tokyo</p>
                <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] font-mono">$620 • On Budget</p>
              </div>
            </div>

            {/* Dynamic Floating Glass Travel Badge 2 (Bottom Right) */}
            <div className="absolute bottom-6 right-2 sm:right-6 z-20 flex items-center gap-3 p-3 bg-white/95 dark:bg-[#121D33]/95 backdrop-blur-md rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] shadow-lg shadow-slate-200/50 dark:shadow-black/50 animate-float-reverse">
              <div className="w-10 h-10 rounded-xl bg-[#F472B6]/15 flex items-center justify-center text-xl">
                {sampleBadges[activeBadgeIndex].icon}
              </div>
              <div className="text-left pr-2">
                <span className="text-[10px] uppercase font-bold text-[#F472B6] tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Recent Spend Logged</span>
                </span>
                <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] truncate max-w-[150px]">
                  {sampleBadges[activeBadgeIndex].item}
                </p>
                <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] font-mono">
                  {sampleBadges[activeBadgeIndex].cost} • {sampleBadges[activeBadgeIndex].city}
                </p>
              </div>
            </div>

            {/* Quick Micro Stat Pill (Bottom Left) */}
            <div className="absolute bottom-6 left-2 sm:left-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-[#121D33]/90 backdrop-blur-sm rounded-full border border-[#DCE6F5] dark:border-[#2A3A56] shadow-sm text-xs font-semibold text-[#172554] dark:text-[#F1F5F9]">
              <span className="w-2 h-2 rounded-full bg-[#3984F5]" />
              <span>3D Realistic Earth & Orbit Active</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
