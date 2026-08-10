# Memetic | TTRPG Codex Engine & Local-First Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Architecture: Local-First](https://img.shields.io/badge/Architecture-Local--First%20%2F%20Air--Gapped-brightgreen.svg)]()
[![Status: Phase 2.5 Active High-Performance Architecture](https://img.shields.io/badge/Status-Phase%202.5%20Active-orange.svg)]()

**Memetic** is an enterprise-grade, local-first web application and workspace engine engineered for managing high-density TTRPG campaign data, dynamic multi-class character sheets, and complex rulesets. Built with Vanilla JavaScript (ES6+ Modules) and modern Web APIs, Memetic delivers a desktop-class, zero-latency experience without relying on external server infrastructure.

---

## 📂 Ecosystem Directory Architecture

```text
memetic/
├── css/                     <-- Ergokinetic Themes, Glassmorphism, Components & Layout
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   └── themes.css
├── js/
│   ├── classes/             <-- Class Engines, Subclass Registries & Gestalt Synthesizers
│   ├── components/          <-- HP, Inventory, Actions, Features, Importer, Buckets, GM Module
│   ├── core/                <-- State Engine, Dice, Modals, Autosave, Accessibility
│   ├── engines/             <-- HP, Recharge, Resource, Sequence, Accessibility Engines
│   ├── sources/             <-- Open-License Baseline Rules & Package Manager
│   ├── species/             <-- Species Trait Injector & Lineage Schemas
│   └── spells/              <-- High-Performance Subfolder Engine
│       ├── database/        <-- School-by-School SRD Compendium Modules
│       ├── spellCache.js    <-- Dual-Tier Hot/Ephemeral Cache Manager
│       ├── spellEngine.js   <-- Math Calculation & Slot Routing
│       ├── spellModal.js    <-- Dual-Layer 16:9 Homebrew Editor & Search Drawer
│       ├── spellUI.js       <-- Virtualized Viewport Render & Upcast Controls
│       └── spellWorker.js   <-- Web Worker Async JSON Parsing
└── index.html               <-- Primary App Workspace Chassis

⚡ Core Engineering & Architectural Highlights
🛡️ Local-First & Air-Gapped Data Engine
FileSystem Access API Integration: Direct read/write synchronization with local .json disk buckets (showOpenFilePicker), delivering live file persistence while maintaining strict client-side privacy.

Bi-Directional JSON Buckets: Modular import/export pipelines for isolated data layers including Characters, Homebrew, Campaign Lore, and Loot Stashes.

The Nomicon Package Importer: Instant loading and runtime ingestion of custom "Thought-Scroll" JSON bundles.

🔮 High-Performance Multi-Caster Spell Engine
Dual-Tier Memory Manager (spellCache.js): Combines hot memory state tracking with ephemeral caching for zero-delay slot calculations across multi-class casters.

Web Worker Async JSON Parsing (spellWorker.js): Non-blocking background worker that parses heavy compendium data off the main UI thread.

Dynamic Dock Controls & Upcasting (spellUI.js): Multi-mode display featuring 🎯 CLEAN VIEW vs. ⇡ UPCAST ON spillover toggles, top-dock downward tooltips, and dynamic slot depletion lockouts with bottom-sorting.

16:9 Dual-Layer Homebrew Editor (spellModal.js): Panoramic modal workspace supporting active attribute overrides while preserving an immutable SRD baseline reference.

Modular School Compendium (database/): Decoupled, school-by-school database structure (evocation.js, abjuration.js, etc.) integrated into a granular multi-filter compendium search drawer.

⚔️ Combat, Health & Inventory Mechanics
Dynamic D&D Beyond Importer Pipeline: Parses raw D&D Beyond modifier arrays, dynamically computing level-scaled proficiency math (+2 to +6), movement speeds, and immediate equipment state bindings.

Advanced HP & Necrotic Max Drain Engine: Native support for Necrotic Max HP Drain (☠️-X), Temporary HP absorption buffers with priority logic, and direct keyword action-linking (e.g., executing Second Wind auto-rolls 1d10+5 and mutates health).

Multi-Container Equipment & Attunement Engine: Categorized storage containers with real-time weight tallying, currency tracking, and strict 3-slot attunement enforcement.

Interactive Action Economy & Resource Depletion: Action economy categorization (Attacks, Actions, Bonus Actions, Reactions) with live resource consumption (Sorcery Points, Superiority Dice, Tides of Chaos) and round resets.

🎭 Multi-System & GM Master Controls
Omni-System Blend Architecture: Modular foundation built to support and convert between multiple open-license RPG frameworks (5e, AD&D 2e, PF2e, Call of Cthulhu, etc.) without performance walls.

Live GM Roster Inspector & Combat Tracker: Real-time party inspection dock allowing GMs to dynamically swap viewports, audit connected player sheets, track initiative, and render dynamic hsl() health status bars.

Auto-Detecting UI Component Suite: Dynamic class and entity parsing that automatically reveals specialized UI components (like the Spellbook workspace or custom resource bars) when spellcasting entities are detected.

🎨 Theme Architecture & Ergokinetic Accessibility
Ergokinetic Theme Engine: 12 core class-tailored CSS variable palettes alongside low-glare amber bases (#d48806) specifically calibrated for astigmatism-friendly, late-night readability.

Custom Glassmorphic Chassis: Real-time opacity slider and dynamic CSS backdrop blur (backdrop-filter: blur(10px)) over custom desktop wallpapers.

Ergokinetic Hover Math Tooltips: Floating popups detailing exact math breakdowns on hover (1d20 + DEX Mod + PB).

Custom Modal Engine: Zero-dependency, theme-reactive 16:9 modal overlay replacing native browser popups to prevent focus loss and preserve state.

🛠️ Master Engineering Roadmap
🟢 Phase 1: Engine Architecture & Core Infrastructure (✅ COMPLETE)
[x] Responsive 3-column grid & sliding tab navigation mechanics.

[x] Initial theme engine & glassmorphic chassis controls.

[x] Modular subfolder restructuring (/js/core, /js/components, /js/engines, /js/spells).

[x] Standalone roll engine (diceEngine.js) and accessibility suite.

[x] Legal-safe subclass engine and species/lineage subsystem.

🟡 Phase 2: Client Ingestion & Tabletop Workspace (✅ COMPLETE)
[x] Interactive Health & HP mechanics (Temp HP, Necrotic Max Drain).

[x] Multi-container equipment storage with live weight and attunement calculations.

[x] Client-side D&D Beyond importer pipeline (dndbImporter.js).

[x] Action economy categorization and charge depletion engine (actions.js).

[x] Dynamic resource pools module for class features (resourceEngine.js).

[x] GM Stealth, Viewport Security, and Combat Tracker Integration (gmModule.js).

[x] Ergokinetic hover math tooltips across skills and attributes.

[x] The Nomicon package importer for JSON buckets.

🟡 Phase 2.5: High-Performance Architecture & Custom Spell Manager (✅ COMPLETE)
[x] Dual-Tier Memory Manager: Fast spell cache management (spellCache.js).

[x] Web Worker Async Parser: Off-thread compendium parsing (spellWorker.js).

[x] Virtualized Viewports: Off-screen rendering optimization for high-density cards.

[x] Standalone Dynamic Spell Engine: Modular database architecture partitioned by school.

[x] Dual-Layer Homebrew Modifier Modal: 16:9 side-by-side override editor with baseline preservation.

[x] Upcast Spillover & Depletion Locks: Dynamic dock filtering and automatic bottom-sorting for depleted slots.

🟠 Phase 3: Immersive Viewports, Gestalt Synthesizer & Local Disk Sync (⏳ CURRENT ACTIVE SPRINT)
[ ] Full-Screen Immersive Mode: Native Fullscreen API integration toggling focus-mode UI styling on #appFrame.

[ ] Universal 3-Line Text Clamp & Hover Inspection: CSS clamp truncation with bottom gradient fade and floating detail inspection popups across all cards.

[ ] Gestalt Multi-Class Synthesizer: Multi-class feature fusion engine (gestaltEngine.js).

[ ] System Blend Configuration UI: Visual toggles connecting systemBlend.js to active sheet mechanics.

[ ] Unified Data State Store & FileSystem Access API: Native background disk-syncing.

🔴 Phase 4: Cross-Platform & Next-Gen Architecture (v2)
[ ] React v19 + Vite Architecture Port.

[ ] Native Desktop Executable build (Tauri / Electron).

[ ] Mobile PWA Build with thumb-first bottom gesture navigation.

[ ] Serverless P2P WebRTC sync for direct peer-to-peer GM and player node communication.

🛠️ Technical Stack
Language: Vanilla JavaScript (ES6+ Modules)

Storage & File I/O: File System Access API + LocalStorage State Synchronization

UI & Styling: CSS3 Grid/Flexbox, dynamic variable mapping, glassmorphic UI overlay

Async Processing: Web Workers + requestAnimationFrame DOM chunking

🚀 Local Setup
Since Memetic is built with zero framework dependencies, setup is immediate:

Clone this repository:

Bash
git clone [https://Fox-Bot-Dev/memetic.git]
Open index.html in any modern Web Standards compliant browser (Chrome, Edge, Firefox, Brave, Safari).

No build steps, npm install, or server setups required.
