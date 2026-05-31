## Obsidian 3D Graph

A 3D graph for Obsidian — a heavily reworked fork with a deep-space look and a set
of quality-of-life features on top of the original plugin.

### ✨ Features

- **Space scene** — glowing crystal-ball nodes, an additive star halo, a drifting
  starfield, nebula clouds tinted from your folder palette, and depth fog.
- **Search HUD** — type to find a node and fly the camera to it (`/` to focus the box).
- **Screen-space labels** — optional always-readable node names that track the camera.
- **Local graph with depth** — open a depth-limited subgraph around any note.
- **Groups & auto-folder colors** — color nodes by path/tag query, or generate one
  color group per top-level folder with a click.
- **Pin & freeze** — Shift-click to pin a node in place; Space to freeze/resume physics.
- **Filters** — hide orphans / attachments, filter by path.

### 🎛️ Visual options (Display settings)

- **Link arrows** — directional arrows showing which note links to which.
- **Dim others on hover** — fade everything except the hovered node and its neighbors.
- **Show nebula** — toggle the nebula clouds independently of the background.
- **Star density** — scale the starfield from empty to dense.
- **Fog** — control depth-fog strength.
- **Pure black background** — swap the nebula backdrop for a solid black void.

### ⌨️ Shortcuts

- `/` — focus search · `F` — focus current file · `Space` — freeze/resume physics
- Shift-click a node — pin/unpin · Right-click a node — context menu

### 👨‍💻 Development

Written in TypeScript; rendering uses [`3d-force-graph`](https://github.com/vasturiano/3d-force-graph)
(Three.js + d3-force-3d). See [dev docs](docs/dev-docs.md).

```bash
npm install
npm run build      # typecheck + esbuild production → main.js
```

Then copy `main.js`, `styles.css`, and `manifest.json` into
`<vault>/.obsidian/plugins/3d-graph/` and reload the plugin.
