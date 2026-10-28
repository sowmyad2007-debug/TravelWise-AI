import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe2 } from 'lucide-react';

interface TravelGlobeProps {
  destinations?: string[];
  activeDestination?: string;
  className?: string;
}

export const TravelGlobe: React.FC<TravelGlobeProps> = ({
  destinations = ['Munnar', 'Paris', 'Tokyo', 'New York', 'Zurich', 'Goa'],
  activeDestination,
  className = 'h-64 sm:h-72 w-full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    try {
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 280;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.3, 3.6);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      container.appendChild(renderer.domElement);

      // Soft Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x4f7df3, 1.6);
      dirLight.position.set(3, 4, 3);
      scene.add(dirLight);

      const tealLight = new THREE.DirectionalLight(0x24b8a5, 1.2);
      tealLight.position.set(-3, -2, 2);
      scene.add(tealLight);

      // Globe Group
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // Procedural Globe Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#eaf5ff';
        ctx.fillRect(0, 0, 512, 256);

        ctx.strokeStyle = 'rgba(79, 125, 243, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 512; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 256);
          ctx.stroke();
        }
        for (let y = 0; y < 256; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(512, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#24b8a5';
        ctx.globalAlpha = 0.28;
        // continents
        ctx.beginPath();
        ctx.ellipse(130, 80, 55, 35, 0, 0, Math.PI * 2);
        ctx.ellipse(170, 165, 30, 45, 0, 0, Math.PI * 2);
        ctx.ellipse(270, 75, 35, 25, 0, 0, Math.PI * 2);
        ctx.ellipse(280, 140, 40, 50, 0, 0, Math.PI * 2);
        ctx.ellipse(360, 90, 65, 45, 0, 0, Math.PI * 2);
        ctx.ellipse(420, 180, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const sphereGeo = new THREE.SphereGeometry(1.2, 36, 36);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      globeGroup.add(sphere);

      // Outer glow
      const atmos = new THREE.Mesh(
        new THREE.SphereGeometry(1.24, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x4f7df3, transparent: true, opacity: 0.12, side: THREE.BackSide })
      );
      globeGroup.add(atmos);

      // Glowing curved flight arc
      const arcPoints = [
        new THREE.Vector3(-0.8, 0.5, 0.9),
        new THREE.Vector3(0, 1.2, 0.8),
        new THREE.Vector3(0.8, 0.3, 0.9),
        new THREE.Vector3(0.4, -0.9, 0.8),
        new THREE.Vector3(-0.6, -0.7, 0.9),
        new THREE.Vector3(-0.8, 0.5, 0.9),
      ];
      const spline = new THREE.CatmullRomCurve3(arcPoints, true);
      const tubeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(spline, 64, 0.012, 6, true),
        new THREE.MeshBasicMaterial({ color: 0x4f7df3, transparent: true, opacity: 0.75 })
      );
      globeGroup.add(tubeMesh);

      // Location Pins on Globe
      const pinCoords = [
        [0.3, 0.7, 1.0],
        [-0.7, 0.4, 0.9],
        [0.8, -0.2, 0.8],
        [-0.4, -0.8, 0.8],
      ];
      pinCoords.forEach(([x, y, z]) => {
        const pin = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x24b8a5 })
        );
        pin.position.set(x, y, z).normalize().multiplyScalar(1.22);
        globeGroup.add(pin);
      });

      // Drag to rotate
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        globeGroup.rotation.y += deltaX * 0.008;
        globeGroup.rotation.x += deltaY * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      const onResize = () => {
        if (!container) return;
        const newW = container.clientWidth || 320;
        const newH = container.clientHeight || 280;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isDragging) {
          globeGroup.rotation.y += 0.004;
        }
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        domElement.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch {
      setWebglSupported(false);
    }
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center">
        {!webglSupported && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Globe2 className="w-12 h-12 text-[#4f7df3] animate-spin-slow mb-2" />
            <span className="text-xs font-semibold">3D Planetary Radar</span>
          </div>
        )}
      </div>
    </div>
  );
};
