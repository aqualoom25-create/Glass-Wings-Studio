# Glass Wings Studio — 3D Staircase & 10mm Toughened Glass Railing (3ds Max & WebGL)

Open-source **Autodesk 3ds Max (`MAXScript` & `pymxs` Python)** procedural generator and **Real-Time 3D WebGL Architectural Renderer** built from **CAD Drawing #700029** (*Location: Staircase*).

---

## 📐 CAD Drawing #700029 Specifications (All Dimensions in `mm`)

| Component | Specification | Material / Grade |
| :--- | :--- | :--- |
| **Glass Panels** | `10 mm` Toughened Glass (Stepped bottom profile following stair steps) | Clear Tempered Architectural Glass (`IOR 1.52`) |
| **Railing Height** | `915 mm` vertical from step nosing to handrail top | — |
| **Top Handrail** | `Ø50 mm` SS Pipe / Tube | Stainless Steel `SS 304 Grade` (Brushed) |
| **Top Fixing** | Pipe-to-Glass Holder saddle brackets | Stainless Steel `SS 304 Grade` |
| **Bottom Fixing** | `1"` (`25.4 mm`) Projection Studs (Dual side-mount standoffs per anchor step) | Stainless Steel `SS 304 Grade` |
| **Total Measurement** | `53 Rft` (Approximate across flights) | — |

---

## 📂 Repository Structure

- [`3dsmax/GlassWings_Staircase_Generator.ms`](./3dsmax/GlassWings_Staircase_Generator.ms) — **Native 3ds Max MAXScript** with a full parametric Rollout UI dialog. Procedurally generates the concrete staircase, wooden/stone treads, stepped 10mm toughened glass panels, Ø50mm SS 304 top handrail pipe, pipe-to-glass holders, 1" projection studs, house interior walls/floors, `PhysicalMaterial` shaders, and camera/lighting ready for **Arnold, V-Ray, or Corona**.
- [`3dsmax/GlassWings_PyMXS_Generator.py`](./3dsmax/GlassWings_PyMXS_Generator.py) — **3ds Max Python (`pymxs`)** launcher script for 3ds Max 2021–2026.
- [`index.html`](./index.html) — **Interactive 3D Web Renderer & `.OBJ` Exporter** built with Three.js PBR (`MeshPhysicalMaterial`). Preview the staircase inside a 3D house interior, switch between **3D House Perspective**, **CAD Side Elevation**, **Section View**, and **SS 304 Hardware Detail**, and export a `.OBJ` mesh directly for 3ds Max.

---

## 🚀 How to Render in Autodesk 3ds Max

### Method 1: Run the MAXScript Generator (`.ms`)
1. Open **Autodesk 3ds Max** (2020–2026).
2. Go to **Scripting → Run Script...** (or drag and drop [`3dsmax/GlassWings_Staircase_Generator.ms`](./3dsmax/GlassWings_Staircase_Generator.ms) directly into the viewport).
3. In the **Glass Wings Studio** dialog window:
   - Verify or customize parameters (`15 Steps`, `915 mm` Railing Height, `10 mm` Toughened Glass, `50 mm` SS Pipe, `25.4 mm` 1" Projection Stud).
   - Keep **Build House Interior**, **Assign Physical Materials**, and **Create Architectural Lighting & Physical Camera** checked.
   - Click **BUILD 3D HOUSE STAIRCASE & GLASS RAILING**.
4. Press **`F9`** (or **`Shift + Q`**) to render!

### Method 2: Interactive 3D Browser Preview & `.OBJ` Export
1. Open [`index.html`](./index.html) in a local web server (e.g., `npx serve .` or `python -m http.server 8080`).
2. Adjust the parametric sliders in real time and click **⬇ Export .OBJ for 3ds Max** to download `GlassWings_Staircase_CAD700029.obj`.
3. In 3ds Max, go to **File → Import → Import...** and select the downloaded `.obj` file.

---

## 🔗 Reference Open-Source GitHub Repositories for 3ds Max Scripting

- **[Autodesk ADN-DevTech / 3dsMax-Python-HowTos](https://github.com/ADN-DevTech/3dsMax-Python-HowTos)** — Official Autodesk open-source examples for automating geometry, materials, and rendering in 3ds Max with `pymxs` and `MAXScript`.
- **[GitHub Topic: `maxscript`](https://github.com/topics/maxscript)** — Open-source MAXScript procedural modeling utilities, spline array tools, and architectural visualization scripts.
- **[GitHub Topic: `3ds-max-scripting`](https://github.com/topics/3ds-max-scripting)** — Community scripts and automation pipelines for Autodesk 3ds Max.
- **[KhronosGroup / 3dsMax-glTF-Exporter](https://github.com/KhronosGroup/3dsMax-glTF-Exporter)** — Open-source 3ds Max PBR material & mesh exporter.
