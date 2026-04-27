// components/ar/useGarmentScene.ts
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { TorsoPoints } from "./usePoseTorso";
import type { GarmentConfig } from "./garmentConfig";
import { upperBodyTransform, lowerBodyTransform } from "./landmarkToTransform";

/* eslint-disable @typescript-eslint/no-explicit-any */

type SceneRefs = {
  renderer:          THREE.WebGLRenderer;
  scene:             THREE.Scene;
  camera:            THREE.OrthographicCamera;
  garmentGrp:        THREE.Group;
  loader:            GLTFLoader;
  cache:             Map<string, THREE.Group>;
  activeModel:       string | null;
  modelNaturalWidth: number;
};

export type UpdateSceneFn = (
  torso:        TorsoPoints | null,
  config:       GarmentConfig | null,
  W:            number,
  H:            number,
  conf:         number,
  adjustOffset?: { x: number; y: number },
) => void;

export function useGarmentScene(): {
  threeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  updateScene:    UpdateSceneFn;
  hasGarmentRef:  React.RefObject<boolean>;
} {
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refsRef        = useRef<SceneRefs | null>(null);
  const hasGarmentRef  = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "none";
    document.body.appendChild(renderer.domElement);
    threeCanvasRef.current = renderer.domElement;

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 2000);
    camera.position.z = 500;

    const ambient  = new THREE.AmbientLight(0xffffff, 0.7);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0.5, 1, 1);
    scene.add(ambient, dirLight);

    const garmentGrp = new THREE.Group();
    scene.add(garmentGrp);

    const loader = new GLTFLoader();

    refsRef.current = {
      renderer, scene, camera, garmentGrp,
      loader, cache: new Map(),
      activeModel: null, modelNaturalWidth: 1,
    };

    return () => {
      renderer.dispose();
      renderer.domElement.remove();
      hasGarmentRef.current = false;
      refsRef.current = null;
    };
  }, []);

  const updateScene: UpdateSceneFn = (torso, config, W, H, conf, adjustOffset) => {
    const refs = refsRef.current;
    if (!refs || W === 0 || H === 0) return;

    const { renderer, scene, camera, garmentGrp, loader, cache } = refs;

    if (renderer.domElement.width !== W || renderer.domElement.height !== H) {
      renderer.setSize(W, H, false);
      camera.left   = -W / 2;
      camera.right  =  W / 2;
      camera.top    =  H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
    }

    if (config && config.modelPath !== refs.activeModel) {
      refs.activeModel = config.modelPath;

      while (garmentGrp.children.length) garmentGrp.remove(garmentGrp.children[0]);
      hasGarmentRef.current = false;

      const cached = cache.get(config.modelPath);
      if (cached) {
        const clone = cached.clone();
        garmentGrp.add(clone);
        hasGarmentRef.current = true;
        const box  = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);
        refs.modelNaturalWidth = size.x || 1;
      } else {
        loader.load(config.modelPath, (gltf) => {
          if (refs.activeModel !== config.modelPath) return;
          const model = gltf.scene;

          const box    = new THREE.Box3().setFromObject(model);
          const centre = new THREE.Vector3();
          box.getCenter(centre);
          model.position.sub(centre);

          const size = new THREE.Vector3();
          box.getSize(size);
          refs.modelNaturalWidth = size.x || 1;

          cache.set(config.modelPath, model);
          const clone = model.clone();
          garmentGrp.add(clone);
          hasGarmentRef.current = true;
        });
      }
    }

    if (!torso || !config || conf < 0.55 || garmentGrp.children.length === 0) {
      garmentGrp.visible = false;
      renderer.render(scene, camera);
      return;
    }

    garmentGrp.visible = true;

    const t = config.garmentType === "lower"
      ? lowerBodyTransform(torso, W, H, config.widthMultiplier3d)
      : upperBodyTransform(torso, W, H, config.widthMultiplier3d);

    const scale = t.scaleFactor / refs.modelNaturalWidth;

    garmentGrp.position.copy(t.position);
    garmentGrp.position.y += config.yOffset3d; // direct canvas-pixel offset (not scaled)
    // Apply user drag offset (ortho camera: 1 world unit = 1 canvas pixel; y-axis inverted)
    if (adjustOffset) {
      garmentGrp.position.x += adjustOffset.x;
      garmentGrp.position.y -= adjustOffset.y;
    }
    garmentGrp.rotation.z  = 0; // keep garment upright regardless of shoulder tilt
    garmentGrp.rotation.x  = config.rotationX ?? 0; // per-model orientation fix
    garmentGrp.scale.setScalar(scale);

    const alpha = Math.min(1, (conf - 0.55) / 0.15 + 0.7);
    garmentGrp.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = Math.max(0, Math.min(1, alpha));
      }
    });

    renderer.render(scene, camera);
  };

  return { threeCanvasRef, updateScene, hasGarmentRef };
}
