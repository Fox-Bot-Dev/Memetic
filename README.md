# Memetic | TTRPG Codex Engine & Local-First Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Architecture: Local-First](https://img.shields.io/badge/Architecture-Local--First%20%2F%20Air--Gapped-brightgreen.svg)]()
[![Status: Phase 2 Active Refactor](https://img.shields.io/badge/Status-Phase%202%20Refactor-orange.svg)]()

**Memetic** is an enterprise-grade, local-first web application and workspace engine engineered for managing high-density TTRPG campaign data, dynamic character sheets, and complex rulesets. Built with Vanilla JavaScript (ES6+) and modern Web APIs, Memetic delivers a desktop-class, zero-latency experience without relying on external server infrastructure.

---

## ⚡ Core Engineering & Architectural Highlights

### 🛡️ Local-First & Air-Gapped Data Engine
* **FileSystem Access API Integration:** Direct read/write synchronization with local `.json` disk buckets (`showOpenFilePicker`), delivering live file persistence while maintaining strict client-side privacy.
* **Bi-Directional JSON Buckets:** Modular import/export pipelines for isolated data layers including Characters, Homebrew, Campaign Lore, and Loot Stashes.

### ⚔️ Combat & Action Economy Mechanics
* **Dynamic D&D Beyond Importer:** Parses raw D&D Beyond modifier arrays, dynamically computing level-scaled proficiency math (+2 to +6), movement speeds, and immediate equipment state bindings.
* **Advanced HP & Condition Engine:** Native support for Necrotic Max HP Drain (`☠️-X`), Temporary HP absorption buffers, and direct keyword action-linking (e.g., executing *Second Wind* auto-rolls `1d10+5` and mutates health).
* **Interactive Turn State Tracking:** Action economy categorization (*Attacks, Actions, Bonus Actions, Reactions*) with live resource consumption and round resets.

### 🎭 Multi-System & GM Master Controls
* **System-Agnostic Design:** Architecture prepared for multi-system schema conversion between D&D 5e, Pathfinder 2e (3-Action System), Call of Cthulhu (Percentile/Sanity), and custom homebrew `.system.json` files.
* **Live GM Roster Inspector:** Real-time party inspection dock allowing GMs to dynamically swap viewports and audit connected player sheets on the fly.
* **Auto-Detecting UI & Spellbooks:** Dynamic class parsing that automatically reveals specialized UI components (like the Spellbook workspace) when spellcasting entities are detected.

### 🎨 Theme Architecture & Accessibility
* **Ergokinetic Theme Engine:** 12 core class-tailored CSS variable palettes alongside low-glare amber bases (`#d48806`) specifically calibrated for astigmatism-friendly, late-night readability.
* **Custom Glassmorphic Chassis:** Real-time opacity slider and dynamic CSS backdrop blur (`backdrop-filter: blur(10px)`) over custom desktop wallpapers.
* **Custom Modal Engine:** Zero-dependency, theme-reactive modal overlay replacing native browser alerts to prevent focus loss.

---

## 🛠️ Master Engineering Roadmap

### 🟢 Phase 1: UI Foundation & Layout Stabilization
- [x] Responsive 3-column grid & sliding tab navigation mechanics.
- [x] Initial theme engine & glassmorphic chassis controls.
- [x] Native browser dialog replacement with custom themed modal overlays.

### 🟡 Phase 2: UI Optimization & Bug Hunting (Current Active Sprint)
> **Goal:** Polish the baseline interface, eliminate layout bugs, and optimize standard tabletop sheet components before scaling game logic.

- [x] **Custom Glassmorphic Modal Engine:** Replaced native browser popups with themed overlays.
- [x] **Advanced HP & Necrotic Max Reduction:** Interactive health controls, temp HP absorption, and condition tracking.
- [x] **Multi-Container Equipment Storage:** Categorized storage with live weight and attunement calculations.
- [x] **D&D Beyond Importer Pipeline:** Dynamic proficiency scaling, movement speed extraction, and inventory state binding.
- [ ] **Ergokinetic Hover Math Tooltips:** Floating popups detailing dice math breakdowns on hover (`1d20 + DEX Mod + PB`).
- [ ] **Accessibility Overlays & Colorblind Profiles:** Protanopia, Deuteranopia, and Tritanopia contrast profiles with geometric shape markers.
- [ ] **Layout Bounds & Scroll Audit:** Fine-tuning right island scroll constraints and dynamic panel rendering under load.

### 🟠 Phase 3: Data Integrity, Persistence & Local Storage
- [ ] Unified Data State Store consolidating loose global arrays into a single reactive State object.
- [ ] Bi-Directional Data Bucket Importer/Exporter for all JSON modules.
- [ ] FileSystem Access API Local Disk Sync for auto-saving direct to disk.

### 🔵 Phase 4: Action Economy & GM Control Engine
- [ ] Interactive Action Economy Engine with turn resets and resource consumption greying.
- [ ] GM Master Command Screen with real-time party session inspection.
- [ ] Golden Ticket Unstructured Rules Injector for parsing pasted homebrew text into interactive widgets.

### 🟣 Phase 5: The Sandbox Engine (Multi-System Fusion v1)
- [ ] Multi-System Conversion Engine (D&D 5e, PF2e, Call of Cthulhu, Cyberpunk RED).
- [ ] System Fusion / Mashup Engine allowing GMs to combine mechanics into hybrid rulesets.
- [ ] Custom `.system.json` Schema Parser for importing completely homebrewed TTRPG systems.

### 🔴 Phase 6: Framework Refactor & Cross-Platform Deployment (v2)
- [ ] React v19 + Vite Architecture Port (Zustand / `useReducer` state management).
- [ ] Mobile App Build (PWA / React Native) with thumb-first bottom gesture navigation.
- [ ] Desktop Executable (Tauri / Electron) with native multi-window support.
- [ ] Serverless P2P WebRTC Sync for direct peer-to-peer GM and player node communication.

---

## 🛠️ Technical Stack

* **Language:** Vanilla JavaScript (ES6+ Modules)
* **Storage & File I/O:** File System Access API + LocalStorage State Synchronization
* **UI & Styling:** CSS3 Grid/Flexbox, dynamic variable mapping, glassmorphic UI overlay
* **Math & Systems:** Exponent ability score calculation, dynamic dice notation parsing (`1d20 + MOD`), real-time weight tallying

---

## 🚀 Local Setup

Since **Memetic** is built with zero framework dependencies, setup is immediate:

1. Clone or download this repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/memetic.git](https://github.com/YOUR_USERNAME/memetic.git)
