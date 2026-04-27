"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ModelViewer({ modelPath }: { modelPath: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Perspective camera — closer fov for a fashion-editorial feel
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.01, 1000);
    camera.position.set(0, 0.1, 3.2);

    // Renderer (transparent bg so frosted glass frame shows through)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lighting — key + fill + rim for garment depth
    const ambient  = new THREE.AmbientLight(0xffffff, 0.7);
    const key      = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.5, 2.5, 2);
    const fill     = new THREE.DirectionalLight(0xaac4ff, 0.6);
    fill.position.set(-2, 0, -1);
    const rim      = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, -2, -2);
    scene.add(ambient, key, fill, rim);

    // Orbit controls — auto-rotate, drag to pause
    const controls                = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping        = true;
    controls.dampingFactor        = 0.07;
    controls.enableZoom           = false;
    controls.enablePan            = false;
    controls.autoRotate           = true;
    controls.autoRotateSpeed      = 1.6;
    controls.minPolarAngle        = Math.PI * 0.25;
    controls.maxPolarAngle        = Math.PI * 0.78;

    // Load GLB
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;

      // Centre and scale to fit the viewport
      const box    = new THREE.Box3().setFromObject(model);
      const centre = new THREE.Vector3();
      const size   = new THREE.Vector3();
      box.getCenter(centre);
      box.getSize(size);
      model.position.sub(centre);

      const maxDim = Math.max(size.x, size.y, size.z);
      model.scale.setScalar(1.8 / maxDim);

      scene.add(model);
    });

    // Render loop
    let rafId: number;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    // Handle container resize
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      ro.disconnect();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [modelPath]);

  return <div ref={containerRef} className="h-full w-full" />;
}
