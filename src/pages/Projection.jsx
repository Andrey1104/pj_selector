import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import PARAMS, {ASSET_BASE} from '@/lib/projector-data';
import {projectionsApi, roomPhotosApi} from '@/lib/api';
import {toast} from 'sonner';
import {Image as ImageIcon, Trash2, Save, Camera, X} from 'lucide-react';

const FLOOR_W = 12;
const FLOOR_H = 12;


function colorizeWorker(root) {
  const COLORS = {
    hardhat: new THREE.Color(0xF59E0B),
    skin: new THREE.Color(0xE2B894),
    vest: new THREE.Color(0xFB923C),
    pants: new THREE.Color(0x2563EB),
    boots: new THREE.Color(0x1F2937),
  };
  const pick = (t) => {
    if (t > 0.93) return COLORS.hardhat;
    if (t > 0.85) return COLORS.skin;
    if (t > 0.55) return COLORS.vest;
    if (t > 0.12) return COLORS.pants;
    return COLORS.boots;
  };
  const box = new THREE.Box3().setFromObject(root);
  const minY = box.min.y;
  const range = Math.max(0.001, box.max.y - minY);
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const geom = o.geometry;
    const pos = geom.attributes.position;
    if (!pos) return;
    const colors = new Float32Array(pos.count * 3);
    o.updateWorldMatrix(true, false);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const t = (v.y - minY) / range;
      const c = pick(t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    o.material = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.75, metalness: 0.05,
      emissive: 0xffffff, emissiveIntensity: 0.45, color: 0xffffff,
    });
    o.castShadow = true;
  });
}

export default function Projection() {
  const containerRef = useRef(null);
  const sceneStateRef = useRef(null);
  const [params, setParams] = useState(() => ({...PARAMS.defaults}));
  const [roomPhotoUrl, setRoomPhotoUrl] = useState(null);
  // const [savedPhotos, setSavedPhotos] = useState([]);
  const [stats, setStats] = useState({diameter: 0, width: 0, height: 0, factor: 0});
  const [savingProj, setSavingProj] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [showWorkers, setShowWorkers] = useState(true);

  // useEffect(() => {
  //   roomPhotosApi.list().then((data) => {
  //     const safe = Array.isArray(data)
  //       ? data
  //       : data?.data ?? [];
  //     setSavedPhotos(safe);
  //   });
  // }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 0.005;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 8, 10);
    const floorGeo = new THREE.PlaneGeometry(FLOOR_W, FLOOR_H);
    const uvs = floorGeo.attributes.uv.array;
    floorGeo.setAttribute('uv2', new THREE.BufferAttribute(uvs, 2));
    const floorMat = new THREE.MeshStandardMaterial({color: 0xbfbfbf});
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const photoGeo = new THREE.PlaneGeometry(FLOOR_W, FLOOR_H);
    const photoUvs = photoGeo.attributes.uv.array;
    photoGeo.setAttribute('uv2', new THREE.BufferAttribute(photoUvs, 2));
    const photoMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
    });
    const photoFloor = new THREE.Mesh(photoGeo, photoMat);
    photoFloor.rotation.x = -Math.PI / 2;
    photoFloor.position.y = 0.001;
    photoFloor.receiveShadow = true;
    photoFloor.visible = false;
    scene.add(photoFloor);

    const spot = new THREE.SpotLight(0xffffff, 0, 0, 0, 0.02, 2.0);
    spot.position.set(0, 9, 0);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot);
    scene.add(spot.target);

    const pointLights = [];
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xffffff, 0, 0, 2);
      const x = Math.floor(i / 2) === 1 ? -4 : 4;
      const z = i % 2 === 1 ? -4 : 4;
      pl.position.set(x, 4, z);
      scene.add(pl);
      pointLights.push(pl);
    }
    const hemi = new THREE.HemisphereLight(0xbfd6ff, 0x1a1a1a, 0.15);
    scene.add(hemi);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.5;
    controls.minDistance = 1;
    controls.maxDistance = 12;
    controls.enablePan = false;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
    controls.target.set(0, -0.1, 0);
    controls.update();

    const workersGroup = new THREE.Group();
    scene.add(workersGroup);
    const loader = new GLTFLoader();
    const layout = [
      ['models/person_12.glb', -4.0, 1.5, 20],
      ['models/person_4.glb', -3.5, -3.0, -45],
      ['models/person_207.glb', 3.2, -4.0, -100],
      ['models/person_10.glb', 4.0, -3.5, -135],
    ];
    layout.forEach(([file, x, z, ry]) => {
      loader.load(`${ASSET_BASE}/${file}`, (gltf) => {
        gltf.scene.position.set(x, 0, z);
        gltf.scene.rotation.y = THREE.MathUtils.degToRad(ry);
        colorizeWorker(gltf.scene);
        workersGroup.add(gltf.scene);
      });
    });

    const texLoader = new THREE.TextureLoader();
    let projectionTexture = null;

    function setProjectionImage(url) {
      texLoader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (projectionTexture) projectionTexture.dispose();
        projectionTexture = tex;
        spot.map = tex;
      });
    }

    let materialTextures = {map: null, normal: null, mat: null};

    function loadFloorMaterial(matIdx) {
      const m = PARAMS.floor_material[matIdx];
      const repeat = FLOOR_W / m.scale;
      const cb = (slot, encoding) => (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat, repeat);
        tex.anisotropy = 4;
        if (encoding === 'srgb') tex.colorSpace = THREE.SRGBColorSpace;
        materialTextures[slot]?.dispose?.();
        materialTextures[slot] = tex;
        if (slot === 'map') floorMat.map = tex;
        if (slot === 'normal') floorMat.normalMap = tex;
        if (slot === 'mat') {
          floorMat.aoMap = tex;
          floorMat.metalnessMap = tex;
          floorMat.roughnessMap = tex;
        }
        floorMat.needsUpdate = true;
      };
      texLoader.load(`${ASSET_BASE}/materials/${m.filename}-albedo.png`, cb('map', 'srgb'));
      texLoader.load(`${ASSET_BASE}/materials/${m.filename}-normals.png`, cb('normal', 'linear'));
      texLoader.load(`${ASSET_BASE}/materials/${m.filename}-mat.png`, cb('mat', 'linear'));
    }

    let photoTexture = null;

    function setRoomPhoto(url) {
      if (!url) {
        photoFloor.visible = false;
        floor.visible = true;
        workersGroup.visible = true;
        return;
      }
      texLoader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        if (photoTexture) photoTexture.dispose();
        photoTexture = tex;
        photoMat.map = tex;
        photoMat.needsUpdate = true;
        photoFloor.visible = true;
        floor.visible = false;
        workersGroup.visible = false;
      });
    }

    function resize() {
      const r = container.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / Math.max(1, r.height);
      camera.updateProjectionMatrix();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf;

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    animate();

    sceneStateRef.current = {
      scene, renderer, camera, floor, floorMat, photoFloor, spot, pointLights, workersGroup,
      setProjectionImage, loadFloorMaterial, setRoomPhoto,
      isPhotoMode: () => photoFloor.visible,
      dispose: () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      },
    };

    return () => sceneStateRef.current?.dispose();
  }, []);

  useEffect(() => {
    const s = sceneStateRef.current;
    if (!s) return;
    if (!s.isPhotoMode()) {
      s.loadFloorMaterial(params.floor_material);
    }
    s.setProjectionImage(`${ASSET_BASE}/symbols/${PARAMS.symbol[params.symbol].filename}`);

    const optAng = THREE.MathUtils.degToRad(PARAMS.optics[params.optics].angle_deg);
    const heightM = params.projection_height_cm / 100;
    const fluxLm = PARAMS.projector[params.projector].flux_lm;
    const halfAng = optAng / 2;
    const solidAngle = 2 * Math.PI * (1 - Math.cos(halfAng));
    const intensity = fluxLm / Math.max(0.001, solidAngle);
    s.spot.position.y = heightM;
    s.spot.angle = halfAng;
    s.spot.intensity = intensity;
    s.spot.decay = 2.0;

    const hex = rgbStringToHex(params.floor_color);
    s.floorMat.color.setHex(hex);

    let total_w = 0;
    for (const p of s.pointLights) {
      const len = p.position.length();
      total_w += (p.position.y / len) / (len * len);
    }
    const ambIntensity = params.spot_illuminance_lx / Math.max(0.001, total_w);
    for (const p of s.pointLights) p.intensity = ambIntensity;

    const target = 2 * params.spot_illuminance_lx;
    s.renderer.toneMappingExposure = 3 / target;

    const symbolRadiusCm = Math.tan(optAng / 2) * params.projection_height_cm;
    const symbolDiameterCm = symbolRadiusCm * 2;
    const symbolAreaM2 = Math.PI * Math.pow(symbolRadiusCm / 100, 2);
    const ambient = Math.max(1, params.spot_illuminance_lx);
    const projIll = fluxLm / symbolAreaM2;
    setStats({
      diameter: Math.round(symbolDiameterCm),
      width: Math.round(symbolDiameterCm),
      height: Math.round(symbolDiameterCm),
      factor: Math.round((projIll / ambient) * 100) / 100,
    });
  }, [params]);

  useEffect(() => {
    const s = sceneStateRef.current;
    if (!s || !s.workersGroup) return;
    if (!s.isPhotoMode()) s.workersGroup.visible = showWorkers;
  }, [showWorkers]);

  useEffect(() => {
    const s = sceneStateRef.current;
    if (!s) return;
    s.setRoomPhoto(roomPhotoUrl);
  }, [roomPhotoUrl]);

  function update(field, value) {
    setParams((p) => ({...p, [field]: value}));
  }

  function onUploadRoomPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRoomPhotoUrl(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function savePhotoToLibrary() {
    if (!roomPhotoUrl) {
      toast.error('No photo loaded');
      return;
    }
    setSavingPhoto(true);
    try {
      const created = await roomPhotosApi.create({
        name: `Room ${new Date().toISOString().slice(0, 16)}`,
        data_url: roomPhotoUrl
      });
      setSavedPhotos((p) => [created, ...p]);
      toast.success('Photo saved to library');
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function saveProjection() {
    setSavingProj(true);
    try {
      await projectionsApi.create({
        ...params,
        projection_diameter_cm: stats.diameter,
        illuminance_factor: stats.factor,
      });
      toast.success('Projection settings saved');
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSavingProj(false);
    }
  }

  async function loadSavedPhoto(id) {
    const p = await roomPhotosApi.get(id);
    setRoomPhotoUrl(p.data_url);
  }

  async function deleteSavedPhoto(id) {
    await roomPhotosApi.remove(id);
    setSavedPhotos((p) => p.filter((x) => x.id !== id));
  }

  const inPhotoMode = !!roomPhotoUrl;

  return (
    <div className="flex-1 flex bg-black overflow-hidden" data-testid="projection-page">
      <aside
        className="w-[300px] shrink-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-r border-zinc-800/50 overflow-y-auto scrollbar-thin"
        data-testid="projection-controls">
        <div className="sticky top-0 z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-zinc-800/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-white">Projection Setup</h2>
            <label
              className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 cursor-pointer text-[10px] font-medium uppercase tracking-wider transition-all duration-200 hover:scale-[1.02]"
              data-testid="upload-room">
              <ImageIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110"/>
              <span>Background</span>
              <input type="file" accept="image/*" className="hidden" onChange={onUploadRoomPhoto}
                     data-testid="projection-room-photo-input"/>
            </label>
          </div>
          {roomPhotoUrl && (
            <div className="flex gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <button onClick={savePhotoToLibrary} disabled={savingPhoto} data-testid="save-photo"
                      className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-medium uppercase tracking-wider disabled:opacity-50 transition-all">
                <Camera className="w-3 h-3 inline -mt-0.5 mr-1"/> Save
              </button>
              <button onClick={() => setRoomPhotoUrl(null)} data-testid="clear-photo"
                      className="py-1.5 px-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-medium uppercase tracking-wider transition-all">
                <X className="w-3 h-3"/>
              </button>
            </div>
          )}
          {/*{savedPhotos.length > 0 && (*/}
          {/*  <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in duration-300">*/}
          {/*    {savedPhotos.slice(0, 4).map((p) => (*/}
          {/*      <button key={p.id} onClick={() => loadSavedPhoto(p.id)} data-testid={`saved-photo-${p.id}`}*/}
          {/*              className="group relative flex items-center gap-1 px-2 py-1 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-[9px] text-zinc-400 hover:text-white font-mono transition-all">*/}
          {/*        <span className="truncate max-w-[60px]">{p.name.slice(0, 8)}</span>*/}
          {/*        <button onClick={(e) => {*/}
          {/*          e.stopPropagation();*/}
          {/*          deleteSavedPhoto(p.id);*/}
          {/*        }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">*/}
          {/*          <Trash2 className="w-2.5 h-2.5"/>*/}
          {/*        </button>*/}
          {/*      </button>*/}
          {/*    ))}*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>

        <div className="p-3 space-y-3">
          <CompactSection title="Symbol" testId="projection-symbol">
            <Selector options={PARAMS.symbol.map((x) => x.label)} value={params.symbol}
                      onChange={(v) => update('symbol', v)} testIdPrefix="symbol"/>
          </CompactSection>

          <CompactSection title="Floor" disabled={inPhotoMode}>
            <div data-testid="projection-floor-material"
                 className={`space-y-2 ${inPhotoMode ? 'opacity-40 pointer-events-none' : ''}`}>
              <Selector options={PARAMS.floor_material.map((x) => x.label)} value={params.floor_material}
                        onChange={(v) => update('floor_material', v)} testIdPrefix="floor-material"/>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Color</span>
                <input type="color" value={rgbStringToHexString(params.floor_color)}
                       onChange={(e) => update('floor_color', hexToRgbString(e.target.value))} data-testid="floor-color"
                       disabled={inPhotoMode}
                       className="flex-1 h-7 bg-transparent border border-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"/>
              </div>
            </div>
          </CompactSection>

          <CompactSection title="Optics" testId="projection-optics">
            <Selector options={PARAMS.optics.map((x) => x.label)} value={params.optics}
                      onChange={(v) => update('optics', v)} testIdPrefix="optics" cols={3}/>
          </CompactSection>

          <CompactSection title="Power" testId="projection-projector">
            <Selector options={PARAMS.projector.map((x) => x.label)} value={params.projector}
                      onChange={(v) => update('projector', v)} testIdPrefix="projector" cols={3}/>
          </CompactSection>

          <CompactSection title="Illuminance" unit="lx" testId="projection-illuminance">
            <NumberSlider value={params.spot_illuminance_lx} onChange={(v) => update('spot_illuminance_lx', v)} min={50}
                          max={2000} step={10} testId="spot-illuminance"/>
          </CompactSection>

          <CompactSection title="Height" unit="cm" testId="projection-height">
            <NumberSlider value={params.projection_height_cm} onChange={(v) => update('projection_height_cm', v)}
                          min={200} max={1500} step={10} testId="projection-height"/>
          </CompactSection>

          <div
            className={`flex items-center justify-between py-2 px-2.5 bg-zinc-900/50 border border-zinc-800/50 transition-opacity ${inPhotoMode ? 'opacity-40' : ''}`}>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Workers</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={showWorkers} onChange={(e) => setShowWorkers(e.target.checked)}
                     data-testid="projection-workers-toggle" disabled={inPhotoMode} className="sr-only peer"/>
              <div
                className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500/50 peer-checked:after:bg-amber-400"></div>
            </label>
          </div>
        </div>

        {/*<div className="sticky bottom-0 p-3 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent pt-6">*/}
        {/*  <button onClick={saveProjection} disabled={savingProj} data-testid="projection-save"*/}
        {/*          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-medium text-xs uppercase tracking-wider disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]">*/}
        {/*    <Save className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5"/>*/}
        {/*    {savingProj ? 'Saving...' : 'Save Projection'}*/}
        {/*  </button>*/}
        {/*</div>*/}
      </aside>

      <div className="relative flex-1 min-w-0">
        <div ref={containerRef} className="absolute inset-0" data-testid="three-canvas-container"/>
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-3 pointer-events-none z-10">
          <StatPill label="Factor" value={stats.factor.toFixed(1)} testId="stat-factor"/>
          <StatPill label="Optics" value={PARAMS.optics[params.optics].label} testId="stat-optics"/>
          <StatPill label="Power" value={PARAMS.projector[params.projector].label} testId="stat-power"/>
          <StatPill label="Height" value={`${params.projection_height_cm} cm`} testId="stat-height"/>
          {inPhotoMode && (
            <div
              className="px-3 py-2 bg-amber-500/20 backdrop-blur-md border border-amber-500 text-amber-400 font-mono text-[10px] tracking-widest uppercase pointer-events-auto">
              ROOM PHOTO MODE
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="px-4 py-3 bg-black/80 backdrop-blur-md border border-amber-500/50 text-center"
               data-testid="projection-dimensions">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Projection Size</div>
            <div className="font-mono text-lg text-amber-400 font-semibold">
              {stats.width} x {stats.height} cm
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              ({(stats.width / 100).toFixed(2)} x {(stats.height / 100).toFixed(2)} m)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({label, value, testId}) {
  return (
    <div className="px-3 py-2 bg-black/70 backdrop-blur-md border border-zinc-800 pointer-events-auto"
         data-testid={testId}>
      <div className="label-metric leading-tight">{label}</div>
      <div className="font-mono text-sm text-white leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function CompactSection({title, children, disabled, unit, compact, testId}) {
  return (
    <div
      className={`${compact ? '' : 'p-2.5 bg-zinc-900/30 border border-zinc-800/50'} transition-opacity ${disabled ? 'opacity-50' : ''}`}
      data-testid={testId}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{title}</span>
        {unit && <span className="text-[9px] text-zinc-600 font-mono">{unit}</span>}
      </div>
      {children}
    </div>
  );
}

function Selector({options, value, onChange, testIdPrefix, cols = 3, small}) {
  const gridClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className={`grid ${gridClass} gap-1`}>
      {options.map((opt, i) => (
        <button key={i} onClick={() => onChange(i)} data-testid={`${testIdPrefix}-${i}`}
                className={`${small ? 'py-1 px-1 text-[9px]' : 'py-1.5 px-2 text-[10px]'} font-medium uppercase tracking-wide border transition-all duration-150 ${
                  value === i
                    ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-sm shadow-amber-500/10'
                    : 'border-zinc-800/80 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5'
                }`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function NumberSlider({value, onChange, min, max, step, testId}) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(Number(e.target.value))} data-testid={`${testId}-range`}
             className="flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-amber-500/30 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"/>
      <input type="number" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(Number(e.target.value))} data-testid={`${testId}-input`}
             className="w-16 bg-zinc-900/50 border border-zinc-800/80 px-2 py-1 text-[11px] font-mono text-white focus:border-amber-500/50 focus:outline-none focus:bg-zinc-900 transition-colors text-center"/>
    </div>
  );
}

function rgbStringToHex(rgbStr) {
  if (typeof rgbStr === 'string' && rgbStr.startsWith('#')) return parseInt(rgbStr.slice(1), 16);
  const m = String(rgbStr).match(/rgb\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/);
  if (!m) return 0xbfbfbf;
  const isPct = rgbStr.includes('%');
  const r = isPct ? Math.round(parseFloat(m[1]) * 2.55) : parseInt(m[1]);
  const g = isPct ? Math.round(parseFloat(m[2]) * 2.55) : parseInt(m[2]);
  const b = isPct ? Math.round(parseFloat(m[3]) * 2.55) : parseInt(m[3]);
  return (r << 16) | (g << 8) | b;
}

function rgbStringToHexString(rgbStr) {
  const n = rgbStringToHex(rgbStr);
  return '#' + n.toString(16).padStart(6, '0');
}

function hexToRgbString(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
