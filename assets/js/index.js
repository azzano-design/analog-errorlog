import * as THREE from 'three';
import { GCodeLoader } from 'three/addons/loaders/GCodeLoader.js';

// ── nav ──
const nav = document.getElementById("main-nav");
window.addEventListener(
  "scroll",
  () => { nav.classList.toggle("scrolled", window.scrollY > 20); },
  { passive: true },
);

// ── reveal on scroll ──
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -32px 0px" },
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ── hero scene ──
function initHeroScene() {
  const container = document.getElementById("hero-canvas");
  if (!container) return;

  const fallback = document.getElementById("hero-bg-fallback");
  if (fallback) fallback.style.display = "none";

  const w = container.offsetWidth || window.innerWidth;
  const h = container.offsetHeight || window.innerHeight;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  camera.position.z = 10;

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(5, 10, 7.5);
  scene.add(sun);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  container.appendChild(renderer.domElement);

  // ── Load GCode ──
  const CYCLE = 15; // seconds per direction

  // oklch(0.6756 0.1623 54.12) → #E17617
  const extrudedMat = new THREE.LineBasicMaterial({ color: 0xdddddd });
  const travelMat   = new THREE.LineBasicMaterial({ color: 0xe17617 });

  let extrudedSegs = [], totalExtruded = 0;
  let travelSegs   = [], totalTravel   = 0;
  let model = null;

  const loader = new GCodeLoader();
  loader.load(
    '/assets/3D/AzzanoDesignLogo.gcode',
    (object) => {
      object.traverse((child) => {
        if (!child.isLineSegments) return;

        // GCodeLoader flags travel moves as invisible; check child and its parent
        const isTravel = !child.visible ||
          (child.parent && child.parent !== object && !child.parent.visible);

        if (isTravel) {
          child.visible = true;
          if (child.parent && !child.parent.visible) child.parent.visible = true;
          child.material = travelMat;
          const count = child.geometry.attributes.position.count;
          travelSegs.push({ geo: child.geometry, count });
          totalTravel += count;
        } else {
          child.material = extrudedMat;
          const count = child.geometry.attributes.position.count;
          extrudedSegs.push({ geo: child.geometry, count });
          totalExtruded += count;
        }

        child.geometry.setDrawRange(0, 0);
      });

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const pivot = new THREE.Group();
      object.position.copy(center).negate();
      pivot.add(object);
      if (maxDim > 0) pivot.scale.setScalar(3 / maxDim);
      // GCode Z is the build/layer direction — rotate so it maps to Three.js Y (up)
      pivot.rotation.x = Math.PI / 2;

      // Separate spinner so rotation.y acts on world Y, not pivot's local Y
      const spinner = new THREE.Group();
      spinner.position.set(0.7, 0.2, 4);
      spinner.add(pivot);
      scene.add(spinner);
      model = spinner;

      const vFovRad = camera.fov * (Math.PI / 180);
      const dist = (1.5 / Math.tan(vFovRad / 2)) * 1.7;
      camera.position.z = dist;
      camera.near = dist / 100;
      camera.far = dist * 100;
      camera.updateProjectionMatrix();
    },
    undefined,
    (err) => console.warn('GCodeLoader:', err),
  );

  function applyFill(segs, target) {
    let remaining = target;
    for (const seg of segs) {
      if (remaining <= 0) {
        seg.geo.setDrawRange(0, 0);
      } else {
        const draw = Math.min(remaining, seg.count);
        // LineSegments needs an even count (2 verts per segment)
        seg.geo.setDrawRange(0, Math.floor(draw / 2) * 2);
        remaining -= draw;
      }
    }
  }

  // ── Animate ──
  // getDelta() and getElapsedTime() share internal state, so call getDelta()
  // once per frame and accumulate elapsed manually.
  const clock = new THREE.Clock();
  let elapsed = 0;

  (function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    elapsed += delta;

    if (model) model.rotation.y += delta * 0.2;

    if (extrudedSegs.length > 0 || travelSegs.length > 0) {
      // Ping-pong t: 0→1 over CYCLE seconds, then 1→0 over CYCLE seconds
      const phase = elapsed % (CYCLE * 2);
      const t = phase < CYCLE ? phase / CYCLE : 2 - phase / CYCLE;

      // Animate each type independently so both fill at the same rate
      applyFill(extrudedSegs, Math.round(totalExtruded * t));
      applyFill(travelSegs,   Math.round(totalTravel   * t));
    }

    renderer.render(scene, camera);
  })();

  // ── Resize ──
  window.addEventListener('resize', () => {
    const nw = container.offsetWidth || window.innerWidth;
    const nh = container.offsetHeight || window.innerHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }, { passive: true });
}

const isNarrow = window.matchMedia('(max-width: 767px)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!isNarrow && !reducedMotion) {
  initHeroScene();
}
