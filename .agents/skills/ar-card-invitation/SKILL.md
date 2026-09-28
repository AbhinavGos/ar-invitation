---
name: ar-card-invitation
description: >-
  Build, customize, and deploy interactive WebAR pop-up invitation cards, business cards,
  and event passes anchored to physical cards (visiting cards, printed invites, envelopes)
  using MindAR and Three.js. Supports multi-style layouts (Carousel, Triptych, Diorama Tunnel,
  Frame-Break Pop-Out, Hybrid), context-driven themes (Royal Wedding, Haldi/Garden, Cocktail/Sangeet,
  Corporate Summit, Minimal Luxury), die-cut silhouettes, and physical cardstock depth with gilded edges.
  Each card is published to its own independent live URL.
permissions:
  commands:
    - "node scripts/scaffold_card.mjs *"
    - "node scripts/compile_target.mjs *"
    - "git *"
    - "gh *"
  github:
    - 'gh.create({"org": "AbhinavGos", "repo": "*"})'
    - 'gh.update({"org": "AbhinavGos", "repo": "*"})'
    - 'gh.read({"org": "AbhinavGos", "repo": "*"})'
    - 'git.create({"org": "AbhinavGos", "repo": "*", "branch": "*"})'
    - 'git.update({"org": "AbhinavGos", "repo": "*", "branch": "*"})'
    - 'git.read({"org": "AbhinavGos", "repo": "*", "contents": "*"})'
---

# Universal WebAR Card Invitation & Pop-Up Engine

This skill provides an extensible, battle-tested WebAR system to transform any physical stationery into a stunning, camera-anchored 3D augmented-reality experience **deployed to its own distinct, dedicated live URL**.

---

## 1. Core Architecture

The Universal WebAR Card System separates visual presentation into 4 composable layers:

```
┌────────────────────────────────────────────────────────┐
│                   HTML Glassmorphism UI                │
│ (Theme-styled Landing, Audio toggle, Carousel/Tabs)    │
├────────────────────────────────────────────────────────┤
│          Three.js Scene & Unlit Texture Material       │
│  (MeshBasicMaterial, sRGB color, zero-washout contrast)│
├────────────────────────────────────────────────────────┤
│               3D Spatial Layout Engine                 │
│  [Carousel | Triptych | Diorama | Pop-Out | Hybrid]    │
├────────────────────────────────────────────────────────┤
│               Physical Depth & Edge Bevels             │
│   (350gsm BoxGeometry with Gold/Chrome/Matte Bevels)   │
├────────────────────────────────────────────────────────┤
│             Thematic Particles & Atmosphere            │
│  (Rose Petals | Marigold | Bubbles | Embers | Grid)    │
├────────────────────────────────────────────────────────┤
│             MindAR 6-DoF Image Tracking Engine         │
│     (Schmitt-Trigger Deadband Anti-Tremor Filtering)   │
├────────────────────────────────────────────────────────┤
│            Harmonized Procedural Audio Synthesizer     │
│   (Shehnai Raga | Acoustic Folk | Lounge Jazz | Tech)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. The 4 Visual Layout Modes

| Layout Mode | Flag | Spatial Description | Best Suited For |
| :--- | :--- | :--- | :--- |
| **Hybrid Showstopper** | `--layout hybrid` | **(Default)** Fans out in a 3.2s grand triptych reveal with particle burst, then smoothly glides into the focused reading carousel. | High-impact luxury weddings, flagship product reveals. |
| **Focus Carousel** | `--layout carousel` | 1 active card front and center at 100% scale and opacity; inactive cards recede into depth ($z = -0.22$, rotY = $\pm 13^\circ$). Story progress bar auto-advances. | Detailed multi-event schedules (4+ cards), maps, itineraries. |
| **Panoramic Triptych** | `--layout triptych` | 3 cards stand simultaneously in a grand folding screen ($X$-axis spread, side cards angled inward at $\pm 18^\circ$). All events visible at once. | 2–3 sub-events (e.g. Haldi, Wedding, Reception) requiring instant glanceability with zero taps. |
| **Diorama Tunnel** | `--layout diorama` | Architectural multi-plane layering along the **$Z$-axis (depth)**. Concentric hollow archways create an optical corridor with couple/character inside. | Palace entrance, temple gate, theatrical stage with real camera parallax. |
| **Frame-Break Pop-Out** | `--layout popout` | Anamorphic 3D pop-out. A bounded background window with the hero subject scaled 120% breaking through top/bottom borders into physical space with contact shadow. | Hero couple portraits, champagne bottle pop, mascot/vehicle launch. |

---

## 3. The 5 Event Themes

Use `--theme <theme-name>` to automatically tune landing UI, colors, edge bevels, atmospheric particles, and audio:

| Theme | Flag | Visual Palette | Particles | Sound Profile | Edge Bevel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Royal Wedding** | `--theme royal-wedding` | Crimson, ivory & antique gold | Embers & rose petals | Shehnai & Tanpura Raga loop | Gold Foil |
| **Haldi & Garden** | `--theme haldi-garden` | Marigold yellow & terracotta | Tumbling yellow petals | Acoustic Kalimba / Santoor plucks | Cotton Paper Matte |
| **Cocktail & Sangeet**| `--theme cocktail-glam` | Midnight navy & champagne neon | Champagne bubbles & sparkles | Lounge Jazz Rhodes minor 7th/9th | Silver Chrome / Neon |
| **Corporate Summit** | `--theme corporate-summit`| Slate gray, titanium & cyan | Holographic grid motes | Modern ambient tech chime | Brushed Aluminum |
| **Minimal Luxury** | `--theme minimal-luxury` | Warm parchment & espresso linen| Floating golden dust motes | Ambient minimalist piano | Champagne Matte |

---

## 4. Die-Cut Silhouettes & Cardstock Depth

To ensure cards never look like flat computer rectangles or razor-thin polygons:

### Silhouettes (`--silhouette <type>`)
* `arch`: Mughal jharokha or Roman arched dome top.
* `scalloped`: Repeating decorative rounded petal borders.
* `chamfer`: Precision 45° angular corner cuts.
* `deckled`: Organic torn paper fibrous edges.
* `portal`: Hollow cut-out window for diorama/popout views.
* `rect`: Modern rounded rectangle.

### Physical Depth & Edge Bevels (`--depth <type>`)
* Replaces thin planes with `THREE.BoxGeometry(w, h, 0.008)` to simulate heavy 350+ gsm cardstock.
* Side faces receive dedicated metallic or matte materials (`gold-foil`, `silver-chrome`, `paper-matte`, `neon-glow`).

### Grounding & Anchoring (`--anchor <type>`)
* `back-edge`: Anchored at top/rear edge ($y \approx +0.38$). The physical card in the user's hand acts as the foreground table/floor.
* `center`: Centered on the card with a 3D metallic pedestal bar and rotating mandala ring.
* `offset`: Floats to the right ($x \approx +0.55$) so printed text on the physical card is unobstructed.

---

## 5. Turnkey CLI Runbook

Scaffold, compile, and deploy a brand-new card experience with **1 single command**:

```bash
# Example 1: Royal Wedding with Hybrid Reveal
node scripts/scaffold_card.mjs \
  --name "Karan & Tanya Wedding" \
  --slug "karan-tanya-wedding" \
  --theme "royal-wedding" \
  --layout "hybrid" \
  --silhouette "arch" \
  --depth "gold-foil" \
  --anchor "back-edge" \
  --target "./target_card.png" \
  --cards "./card1.png,./card2.png,./card3.png" \
  --deploy

# Example 2: Cocktail & Sangeet Soirée
node scripts/scaffold_card.mjs \
  --name "Skyline Sangeet Soirée" \
  --slug "skyline-sangeet" \
  --theme "cocktail-glam" \
  --layout "triptych" \
  --silhouette "chamfer" \
  --depth "silver-chrome" \
  --target "./invite.png" \
  --deploy

# Example 3: Tech Summit & VIP Pass
node scripts/scaffold_card.mjs \
  --name "Apex AI Summit 2026" \
  --slug "apex-ai-summit" \
  --theme "corporate-summit" \
  --layout "carousel" \
  --silhouette "chamfer" \
  --depth "silver-chrome" \
  --target "./badge_target.png" \
  --deploy
```

---

## 6. Pre-Authorized 1-Shot Permission Mandate

Always execute pipeline commands chained or via `scaffold_card.mjs` to maintain 1-shot user approval:
* Terminal allowlist: `node scripts/scaffold_card.mjs *`, `node scripts/compile_target.mjs *`, `git *`, `gh *`.
* GitHub grant: `gh.create({"org": "AbhinavGos", "repo": "*"})` and `git.create({"org": "AbhinavGos", "repo": "*", "branch": "*"})`.
* Every card gets its **own dedicated repository and live URL** (`https://abhinavgos.github.io/<slug>/`), preserving existing cards intact.
