---
name: ar-card-invitation
description: >-
  Build, customize, and deploy interactive WebAR pop-up invitation cards and business cards
  anchored to physical cards (visiting cards, printed invites, envelopes) using MindAR and Three.js.
  Use whenever the user provides card designs, event images, or invites and wants an AR experience
  where 3D cards pop up vertically from a physical visual trigger with smooth reading stabilization
  and each card is published to its own independent live URL.
---

# WebAR Physical Card Invitation & Pop-Up Creator

This skill provides the complete end-to-end recipe, battle-tested code architecture, and automated CLI tooling to transform any physical card (visiting card, printed invite, event flyer) into a stunning, camera-anchored 3D WebAR pop-up experience **deployed to its own distinct, dedicated live URL**.

---

## 1. Core Architecture

A complete card-anchored AR experience consists of 6 integrated layers:

```
┌────────────────────────────────────────────────────────┐
│                   HTML Glassmorphism UI                │
│  (Landing page, Audio toggle, Carousel Dock, Modals)   │
├────────────────────────────────────────────────────────┤
│          Three.js Scene & Unlit Texture Material       │
│   (MeshBasicMaterial, sRGB color, gentle 3D lights)    │
├────────────────────────────────────────────────────────┤
│           3D Pop-Up Carousel (Camera-Facing)           │
│  (Deadband hysteresis orientation, reading stillness)  │
├────────────────────────────────────────────────────────┤
│            Ground Base Plate (On Card Surface)         │
│         (Golden pedestal bar, rotating mandala ring)   │
├────────────────────────────────────────────────────────┤
│             MindAR 6-DoF Image Tracking Engine         │
│      (Calibrated 1€ Filter: filterMinCF, filterBeta)    │
├────────────────────────────────────────────────────────┤
│                 Web Audio Acoustic Synthesizer         │
│     (Zero-latency procedural chords, no MP3 files)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Essential Inputs

When the user asks to create an AR invitation, collect or generate:
1. **Trigger Card Image (`target_card.png`)**:
   - The physical item being scanned (visiting card, invitation envelope, postcard).
   - High contrast, textured or foiled elements, oriented horizontally (landscape).
2. **Event / Card Details**:
   - 2 to 5 cards (e.g. *Save The Date*, *Wedding Invite*, *Reception*, or *Visiting Card Sides*).
   - Titles, dates/subtitles, theme colors (hex codes).
3. **Card Content Images**:
   - High-resolution textures (`card_1.jpg`, `card_2.jpg`, etc.) OR procedural HTML5 `<canvas>` card designs.
4. **Unique Project Slug**:
   - Each card MUST have its own slug (e.g. `cherish-visiting-card`, `priya-rohit-wedding`, `acme-card-ar`).

---

## 3. Dedicated Live URL Architecture (Rule: Never Overwrite Previous Cards)

> [!IMPORTANT]
> **Every card or client invitation MUST be deployed to its own independent live URL.**
> Never overwrite an existing card repo (such as `anchit-natasha-card-ar`). Each card gets its own GitHub repository and its own GitHub Pages URL:
> `https://<username>.github.io/<slug>/`

### Option A: Turnkey Automated Scaffolding (Recommended)
Use the included generator script to build, compile, and deploy a brand-new card experience in one command:

```bash
node scripts/scaffold_card.mjs \
  --name "Cherish Luxury Card" \
  --slug "cherish-luxury-card" \
  --target "path/to/visiting_card.png" \
  --cards "path/to/c1.jpg,path/to/c2.jpg" \
  --deploy
```
This automatically:
1. Creates the dedicated folder `<slug>/`.
2. Copies the calibrated template `index.html`.
3. Compiles `targets.mind` in seconds using headless GPU Chromium.
4. Adapts geometry and loads the custom card images.
5. Initializes Git, creates `AbhinavGos/<slug>`, pushes, and deploys to `https://abhinavgos.github.io/<slug>/`.

### Option B: Manual Git Deployment Runbook
If deploying manually:
```bash
# 1. Create a dedicated directory
mkdir my-new-card && cd my-new-card

# 2. Copy template and compile targets.mind
node ../scripts/compile_target.mjs ./target_card.png ./targets.mind

# 3. Initialize separate git repository
git init
git add .
git commit -m "Initial WebAR Card: <Title>"

# 4. Create separate remote GitHub repository
gh repo create AbhinavGos/<card-slug> --public --source=. --push

# 5. Enable GitHub Pages
gh api repos/AbhinavGos/<card-slug>/pages -X POST -F "source[branch]=master" -F "source[path]=/"
```
Live URL is immediately: **`https://abhinavgos.github.io/<card-slug>/`**

---

## 4. Production Engineering Rules

### Rule 1: Anti-Washout & 100% Color Contrast (Crucial)
- **The Problem**: 2D printed invitation cards already contain rich pre-rendered lighting, watercolor art, and metallic typography. If rendered with `MeshStandardMaterial` under Three.js scene lights, light multiplication clamps pixel values ($> 1.0 \rightarrow 1.0$), blowing out ivory/cream cards into pure blinding white and washing away dates and names.
- **The Mandate**: Always use **`MeshBasicMaterial`** for content card meshes:
  ```javascript
  const tex = texLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: (i === 0) ? 1.0 : 0.55 // Inactive cards dim to focus reading
  });
  ```
- **Scene Lighting**: Keep scene lights gentle strictly for 3D metallic elements (the pedestal bar):
  ```javascript
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xfff5e6, 0x24182b, 0.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffecd1, 0.8);
  key.position.set(-2, 5, 4);
  scene.add(key);
  // NEVER add a front spotlight pointing directly at the card faces!
  ```

### Rule 2: Card Aspect Ratio & Grounded Pivot
Never let cards clip through the pedestal or float disconnected in air:
- Measure aspect ratio ($w : h$, e.g. $661 \times 1024 \rightarrow 0.74 \times 1.146$).
- Shift geometry so the bottom edge is at $y = 0$:
  ```javascript
  const cardGeo = new THREE.PlaneGeometry(0.74, 1.146);
  cardGeo.translate(0, 1.146 / 2, 0); // Bottom edge rests flush on pedestal
  ```

### Rule 3: Anti-Tremor Reading Stabilization (Schmitt Trigger Deadband)
Eliminate hand tremor and tiny phone micro-tilts while reading:
- Micro-tilts $< 3.7^\circ$ are ignored $\rightarrow$ **Cards remain 100% rigid and readable**.
- Deliberate rotations $> 3.7^\circ$ smoothly glide to face the viewer.
- Lock rigid again once settled within $0.8^\circ$.
```javascript
let isReorienting = false;
const ORIENTATION_WAKE_THRESHOLD = 0.065;  // ~3.7°
const ORIENTATION_SLEEP_THRESHOLD = 0.015; // ~0.8°
const REORIENT_SLERP_SPEED = 0.045;

function updateOrientation() {
  if (!isTargetFound || !cardsCarouselGroup || !anchor || !anchor.group) return;

  anchor.group.getWorldQuaternion(parentQuat);
  targetLocalQuat.copy(parentQuat).invert();

  if (justFoundTarget) {
    cardsCarouselGroup.quaternion.copy(targetLocalQuat);
    justFoundTarget = false;
    isReorienting = false;
    return;
  }

  const angleDiff = cardsCarouselGroup.quaternion.angleTo(targetLocalQuat);
  if (!isReorienting && angleDiff > ORIENTATION_WAKE_THRESHOLD) {
    isReorienting = true;
  }
  if (isReorienting) {
    cardsCarouselGroup.quaternion.slerp(targetLocalQuat, REORIENT_SLERP_SPEED);
    if (angleDiff < ORIENTATION_SLEEP_THRESHOLD) {
      isReorienting = false;
    }
  }
}
```

### Rule 4: MindAR Container Display Sequencing
`arContainer` **must** be set to `display: block` BEFORE initializing `new MindARThree()`:
```javascript
arContainer.style.display = 'block';

const mindarThree = new MindARThree({
  container: arContainer,
  imageTargetSrc: './targets.mind',
  filterMinCF: 0.0001,   // Strong stationary smoothing
  filterBeta: 0.01,       // Eliminates pixel jitter
  warmupTolerance: 3,
  missTolerance: 10,
  uiLoading: "no",
  uiScanning: "no"
});
```

### Rule 5: Zero-Dependency Procedural Indian Instrumental Synthesizer
Avoid external MP3 files that fail on mobile autoplay or CORS. Use Web Audio API:
- **Tanpura Drone**: Sustained root-fifth ambient drone ($Sa - Pa$, 130.81 Hz / 196.00 Hz) with gentle LFO chorus.
- **Sitar / Santoor**: Plucked high-resonance triangle harmonics playing auspicious wedding scales (Raga Bhupali: $Sa, Re, Ga, Pa, Dha$).

### Rule 6: 1-Shot Unified Permission Gate (Mobile WebAR + GitHub CLI)

> [!IMPORTANT]
> **Mobile WebAR requires 3 distinct system capabilities**: Camera access, iOS Motion/Gyroscope sensors, and Web Audio autoplay. If requested separately or asynchronously, browsers block them or display multiple confusing prompts.

Always implement the **1-Shot Permission Gate** attached to the user's initial "Experience in AR" tap:

```javascript
async function requestOneShotPermissions() {
  // 1. In-App Browser Detection (WhatsApp / Instagram / LinkedIn WebViews)
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isInApp = /FBAN|FBAV|Instagram|WhatsApp|LinkedIn|Line|MicroMessenger/i.test(ua);
  if (isInApp && !/Safari/i.test(ua)) {
    console.warn('In-app browser detected. Prompt user to open in Safari/Chrome if camera fails.');
  }

  // 2. HTTPS Secure Context check
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    throw new Error('Camera & AR sensors require HTTPS. Open this page from your GitHub Pages HTTPS link.');
  }

  // 3. iOS 13+ Motion Sensors (MUST be invoked synchronously within user tap)
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      await DeviceOrientationEvent.requestPermission();
    } catch (e) {
      console.warn('DeviceOrientation permission bypassed:', e);
    }
  }

  // 4. Web Audio Autoplay Unlock (Instantly primes synthesizer)
  initFestiveMusic();

  // 5. Camera Support check
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access not supported on this browser. Please open in Safari (iOS) or Chrome (Android).');
  }

  // 6. Proactive Permission Check (if supported)
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'camera' });
      if (status.state === 'denied') {
        throw new Error('Camera permission blocked. Tap the lock (🔒) / AA icon in your address bar, allow Camera, and reload.');
      }
    } catch(e) {
      if (e?.message?.includes('Camera permission blocked')) throw e;
    }
  }
}
```

#### Denied Permission Recovery Guidance:
In the `catch (err)` block, provide explicit operating-system guidance so users know exactly how to unblock:
- **iOS Safari**: Tap the `AA` or lock icon in the address bar $\rightarrow$ Website Settings $\rightarrow$ Camera $\rightarrow$ **Allow**, then refresh.
- **Android Chrome**: Tap the lock (🔒) icon $\rightarrow$ Permissions $\rightarrow$ Camera $\rightarrow$ **Allow**, then refresh.

#### Developer Tooling 1-Shot Permission (GitHub CLI):
To allow `scaffold_card.mjs` to create repositories and enable GitHub Pages without interactive password/token prompts:
```bash
gh auth refresh -s "repo,workflow"
```

---

## 5. Pre-Flight Verification Checklist

Before sharing any live invitation link with the user:
- [ ] **Unique Live URL**: Built in its own directory and repo (`https://abhinavgos.github.io/<slug>/`), preserving other cards intact.
- [ ] **1-Shot Permission Gate**: Single tap on landing button unlocks Camera, Motion Sensors, and Audio simultaneously.
- [ ] **Contrast Verification**: Cards use `MeshBasicMaterial` and are crisp and readable under any ambient light.
- [ ] **Tracking Stability**: `targets.mind` compiles to $> 100\text{ KB}$ and locks smoothly on the physical card.
- [ ] **Reading Stillness**: Cards do not tremble or vibrate when reading in hand.
- [ ] **Audio Autoplay Flow**: Music starts smoothly on first user touch / camera start.
- [ ] **GitHub Pages Deployment**: Verified via `gh run list --repo AbhinavGos/<slug>`.
