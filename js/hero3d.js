/* =====================================================
   AKIRMA EVENTS - hero3d.js
   Interactive WebGL hero: floating gold light particles +
   slowly rotating faceted "gems", reacting to mouse & scroll.
   Progressive enhancement: if Three.js / WebGL is unavailable,
   the existing hero background image is left untouched.
   ===================================================== */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  // Respect users who prefer reduced motion.
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bail out gracefully if Three.js failed to load (e.g. offline / CDN blocked).
  if (typeof window.THREE === 'undefined') {
    return;
  }

  var THREE = window.THREE;

  // --- Basic WebGL capability check ---
  try {
    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;
  } catch (e) {
    return;
  }

  // --- Create + insert the canvas layer (above the photo overlay, below content) ---
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  var overlay = hero.querySelector('.hero-bg-overlay');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.insertBefore(canvas, overlay.nextSibling);
  } else {
    hero.insertBefore(canvas, hero.firstChild);
  }

  // Brand palette
  var GOLD = [0xF0D491, 0xE5C158, 0xD4AF37, 0xFFF3D0];
  var EMERALD = 0x10b981;

  var width = hero.clientWidth || window.innerWidth;
  var height = hero.clientHeight || 600;
  var isSmall = width < 768;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isSmall,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 400);
  camera.position.set(0, 0, 62);

  // A group holds everything so we can parallax the whole scene together.
  var world = new THREE.Group();
  scene.add(world);

  // ---------- Soft glow sprite for particles ----------
  function makeGlowTexture() {
    var s = 64;
    var c = document.createElement('canvas');
    c.width = c.height = s;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,240,200,0.9)');
    g.addColorStop(0.55, 'rgba(228,193,88,0.35)');
    g.addColorStop(1.0, 'rgba(228,193,88,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    var tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }
  var glowTex = makeGlowTexture();

  // ---------- Particle field (floating gold light dust) ----------
  var COUNT = isSmall ? 280 : 780;
  var RANGE_X = 150;
  var RANGE_Y = 110;
  var RANGE_Z_BACK = -80;
  var RANGE_Z_FRONT = 34;

  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var speeds = new Float32Array(COUNT);
  var sways = new Float32Array(COUNT);
  var col = new THREE.Color();

  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * RANGE_X;
    positions[i3 + 1] = (Math.random() - 0.5) * RANGE_Y;
    positions[i3 + 2] = RANGE_Z_BACK + Math.random() * (RANGE_Z_FRONT - RANGE_Z_BACK);
    col.setHex(GOLD[(Math.random() * GOLD.length) | 0]);
    colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
    speeds[i] = 1.4 + Math.random() * 3.4;         // upward drift
    sways[i] = Math.random() * Math.PI * 2;         // sway phase
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var pMat = new THREE.PointsMaterial({
    size: isSmall ? 2.4 : 3.2,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    opacity: 0.95
  });
  var points = new THREE.Points(pGeo, pMat);
  world.add(points);

  // ---------- Floating faceted gems (clearly 3D) ----------
  var ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  var keyLight = new THREE.PointLight(0xffe8b0, 1.5, 400);
  keyLight.position.set(40, 50, 70);
  scene.add(keyLight);
  var rimLight = new THREE.PointLight(EMERALD, 1.1, 400);
  rimLight.position.set(-60, -20, 30);
  scene.add(rimLight);

  var gems = [];
  var GEM_COUNT = isSmall ? 4 : 7;
  var gemGeoOcta = new THREE.OctahedronGeometry(1, 0);
  var gemGeoIco = new THREE.IcosahedronGeometry(1, 0);

  for (var g2 = 0; g2 < GEM_COUNT; g2++) {
    var mat = new THREE.MeshStandardMaterial({
      color: GOLD[g2 % GOLD.length],
      metalness: 0.95,
      roughness: 0.28,
      emissive: 0x3a2c07,
      emissiveIntensity: 0.4,
      flatShading: true,
      transparent: true,
      opacity: 0.92
    });
    var mesh = new THREE.Mesh(g2 % 2 === 0 ? gemGeoOcta : gemGeoIco, mat);
    var scl = 2.4 + Math.random() * 3.6;
    mesh.scale.setScalar(scl);
    mesh.position.set(
      (Math.random() - 0.5) * (isSmall ? 70 : 120),
      (Math.random() - 0.5) * 70,
      -30 + Math.random() * 45
    );
    mesh.userData = {
      rot: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3
      ),
      bob: 2 + Math.random() * 3,
      bobPhase: Math.random() * Math.PI * 2,
      baseY: mesh.position.y
    };
    world.add(mesh);
    gems.push(mesh);
  }

  // ---------- Interaction: mouse + scroll ----------
  var mouseX = 0, mouseY = 0;      // normalized -1..1
  var targetX = 0, targetY = 0;

  function onPointerMove(e) {
    var pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    targetX = (pt.clientX / window.innerWidth) * 2 - 1;
    targetY = (pt.clientY / window.innerHeight) * 2 - 1;
  }
  if (!reduceMotion) {
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
  }

  var scrollProgress = 0; // 0 at top of hero, 1 when scrolled a full hero height
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    scrollProgress = Math.min(1, y / (height || 600));
    // fade the canvas out as the user scrolls past the hero
    canvas.style.opacity = String(Math.max(0, 1 - scrollProgress * 1.15));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Resize ----------
  function onResize() {
    width = hero.clientWidth || window.innerWidth;
    height = hero.clientHeight || 600;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // ---------- Pause when hero is off-screen ----------
  var visible = true;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !reduceMotion) tick();
    }, { threshold: 0.01 });
    io.observe(hero);
  }

  // ---------- Animation loop ----------
  var clock = new THREE.Clock();
  var running = false;
  var posAttr = pGeo.attributes.position;

  function render() {
    // Smooth mouse parallax
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    world.rotation.y = mouseX * 0.28;
    world.rotation.x = -mouseY * 0.16;
    camera.position.x = mouseX * 6;
    camera.position.y = -mouseY * 4 - scrollProgress * 18;
    camera.lookAt(0, -scrollProgress * 6, 0);
    renderer.render(scene, camera);
  }

  function tick() {
    if (running) return;
    running = true;
    (function loop() {
      if (!visible || reduceMotion) { running = false; return; }
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      // drift particles upward with gentle sway; wrap at the top
      for (var k = 0; k < COUNT; k++) {
        var k3 = k * 3;
        positions[k3 + 1] += speeds[k] * dt;
        positions[k3]     += Math.sin(t * 0.5 + sways[k]) * dt * 1.6;
        if (positions[k3 + 1] > RANGE_Y / 2) {
          positions[k3 + 1] = -RANGE_Y / 2;
          positions[k3]     = (Math.random() - 0.5) * RANGE_X;
        }
      }
      posAttr.needsUpdate = true;

      // rotate + bob the gems
      for (var m = 0; m < gems.length; m++) {
        var mesh = gems[m], d = mesh.userData;
        mesh.rotation.x += d.rot.x * dt;
        mesh.rotation.y += d.rot.y * dt;
        mesh.rotation.z += d.rot.z * dt;
        mesh.position.y = d.baseY + Math.sin(t * 0.6 + d.bobPhase) * d.bob;
      }

      render();
      requestAnimationFrame(loop);
    })();
  }

  // Kick things off. Reduced-motion users get one nicely composed static frame.
  if (reduceMotion) {
    render();
  } else {
    tick();
  }

  // Signal that the effect is active (used to tune CSS).
  hero.classList.add('hero-3d-active');
})();
