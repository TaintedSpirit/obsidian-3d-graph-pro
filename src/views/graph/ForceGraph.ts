import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import * as THREE from "three";
import Node from "../../graph/Node";
import Link from "../../graph/Link";
import { StateChange } from "../../util/State";
import Graph3dPlugin from "../../main";
import Graph from "../../graph/Graph";
import { NodeGroup } from "../../settings/categories/GroupSettings";
import EventBus from "../../util/EventBus";
import { Menu } from "obsidian";

export class ForceGraph {
	private instance: ForceGraph3DInstance;
	private readonly rootHtmlElement: HTMLElement;

	private readonly highlightedNodes: Set<string> = new Set();
	private readonly highlightedLinks: Set<Link> = new Set();
	private readonly pinnedNodes: Set<string> = new Set();
	hoveredNode: Node | null = null;

	private readonly isLocalGraph: boolean;
	private graph: Graph;
	private readonly plugin: Graph3dPlugin;

	// Per-view transient state
	private searchText = "";
	private isFrozen = false;
	private callbackUnregisterHandles: (() => void)[] = [];

	// Label overlay
	private labelsOverlay: HTMLElement | null = null;
	private labelDivs: Map<string, HTMLElement> = new Map();
	private lastCameraX = 0;
	private lastCameraY = 0;
	private lastCameraZ = 0;

	// Space makeover (starfield / nebula / glowing star nodes)
	private starGroup: any = null;
	private nebula: any = null;
	private spaceScene: any = null;
	private spaceRAF: number | null = null;
	private spaceRetry = 0;
	private spaceDisposables: { dispose: () => void }[] = [];
	private glowTexture: any = null;

	constructor(plugin: Graph3dPlugin, rootHtmlElement: HTMLElement, isLocalGraph: boolean) {
		this.rootHtmlElement = rootHtmlElement;
		this.isLocalGraph = isLocalGraph;
		this.plugin = plugin;

		this.createGraph();
		this.initListeners();
		this.initLabelsOverlay();
	}

	// ─── init ────────────────────────────────────────────────────────────────

	private initListeners() {
		this.callbackUnregisterHandles.push(
			this.plugin.settingsState.onChange(this.onSettingsStateChanged)
		);
		if (this.isLocalGraph) {
			this.callbackUnregisterHandles.push(
				this.plugin.openFileState.onChange(this.refreshGraphData)
			);
		}
		EventBus.on("graph-changed", this.refreshGraphData);
		EventBus.on("theme-changed", this.onThemeChanged);
	}

	private createGraph() {
		this.createInstance();
		this.createNodes();
		this.createLinks();
		this.setupSpaceScene();
	}

	private createInstance() {
		const width = this.rootHtmlElement.offsetWidth || 800;
		const height = this.rootHtmlElement.offsetHeight || 600;

		this.instance = ForceGraph3D()(this.rootHtmlElement)
			.graphData(this.getGraphData())
			.nodeLabel((node: Node) => this.buildTooltip(node))
			.nodeRelSize(this.plugin.getSettings().display.nodeSize)
			.backgroundColor("rgba(0,0,0,0)")
			.width(width)
			.height(height);

		// Engine tick hook for label updates
		(this.instance as any).onEngineTick?.(() => {
			if (this.plugin.getSettings().display.showLabels) {
				this.updateLabels();
			}
		});
	}

	private initLabelsOverlay() {
		this.labelsOverlay = document.createElement("div");
		this.labelsOverlay.className = "graph-labels-overlay";
		this.rootHtmlElement.appendChild(this.labelsOverlay);
	}

	// ─── graph data ──────────────────────────────────────────────────────────

	private getGraphData = (): any => {
		if (!this.plugin.globalGraph) return { nodes: [], links: [] };
		if (this.isLocalGraph && this.plugin.openFileState.value) {
			const depth = this.plugin.getSettings().localGraph.depth;
			this.graph = this.plugin.globalGraph
				.clone()
				.getLocalGraph(this.plugin.openFileState.value, depth);
		} else {
			this.graph = this.plugin.globalGraph.clone();
		}
		return this.graph;
	};

	public refreshGraphData = () => {
		this.instance.graphData(this.getGraphData());
		this.clearLabels();
	};

	// ─── settings ────────────────────────────────────────────────────────────

	private onSettingsStateChanged = (data: StateChange) => {
		const path = data.currentPath;

		if (path === "display.nodeSize") {
			this.instance.nodeRelSize(data.newValue);
		} else if (path === "display.linkThickness") {
			// linkWidth fn handles this via closure
		} else if (path === "display.particleSize") {
			this.instance.linkDirectionalParticleWidth(data.newValue);
		} else if (path === "display.showLabels") {
			if (!data.newValue) this.clearLabels();
		} else if (path === "localGraph.depth" && this.isLocalGraph) {
			this.refreshGraphData();
			return;
		}

		this.instance.refresh();
	};

	private onThemeChanged = () => {
		this.instance.refresh();
	};

	// ─── node helpers ────────────────────────────────────────────────────────

	private getNodeColor = (node: Node): string => {
		if (this.isHighlightedNode(node)) {
			return node === this.hoveredNode
				? this.plugin.theme.interactiveAccentHover
				: this.plugin.theme.textAccent;
		}

		if (this.searchText && node.name.toLowerCase().includes(this.searchText.toLowerCase())) {
			return this.plugin.theme.interactiveAccentHover;
		}

		let color = this.plugin.theme.textMuted;
		this.plugin.getSettings().groups.groups.forEach((group) => {
			if (NodeGroup.matches(group.query, node)) color = group.color;
		});
		return color;
	};

	private getNodeVal = (node: Node): number => {
		if (this.plugin.getSettings().display.nodeScale === "degree") {
			return Math.max(1, Math.sqrt(node.links.length + 1) * 3);
		}
		return 1;
	};

	private doShowNode = (node: Node): boolean => {
		const filters = this.plugin.getSettings().filters;

		if (!filters.doShowAttachments && node.isAttachment) return false;
		if (!filters.doShowOrphans && node.links.length === 0) return false;

		const pathFilter = filters.pathFilter?.trim();
		if (pathFilter) {
			const lc = pathFilter.toLowerCase();
			if (!node.path.toLowerCase().includes(lc) && !node.name.toLowerCase().includes(lc)) {
				return false;
			}
		}

		return true;
	};

	private doShowLink = (link: Link): boolean => {
		return this.plugin.getSettings().filters.doShowAttachments || !link.linksAnAttachment;
	};

	private buildTooltip = (node: Node): string => {
		const degree = node.links.length;
		const tagsHtml = node.tags.length
			? `<div class="node-tooltip-tags">${node.tags.map((t) => `<span>#${t}</span>`).join(" ")}</div>`
			: "";
		return `
			<div class="node-tooltip">
				<div class="node-tooltip-name">${node.name.replace(/\.md$/, "")}</div>
				<div class="node-tooltip-path">${node.path}</div>
				<div class="node-tooltip-meta">${degree} link${degree !== 1 ? "s" : ""}${node.isAttachment ? " · attachment" : ""}${node.tags.length ? ` · ${node.tags.length} tag${node.tags.length !== 1 ? "s" : ""}` : ""}</div>
				${tagsHtml}
			</div>`;
	};

	// ─── node / link rendering ───────────────────────────────────────────────

	private createNodes = () => {
		this.instance
			.nodeColor((node: Node) => this.getNodeColor(node))
			.nodeVal((node: Node) => this.getNodeVal(node))
			.nodeVisibility(this.doShowNode)
			.nodeThreeObject((node: Node) => this.makeNodeObject(node))
			.nodeThreeObjectExtend(false)
			.onNodeHover(this.onNodeHover)
			.onNodeRightClick(this.onNodeRightClick)
			.onNodeClick(this.onNodeClick);
	};

	private createLinks = () => {
		const display = this.plugin.getSettings().display;
		this.instance
			.linkWidth((link: Link) =>
				this.isHighlightedLink(link)
					? display.linkThickness * 2
					: display.linkThickness
			)
			.linkOpacity(0.32)
			.linkDirectionalParticles((link: Link) =>
				this.isHighlightedLink(link) ? display.particleCount : 1
			)
			.linkDirectionalParticleSpeed(0.006)
			.linkDirectionalParticleWidth(display.particleSize)
			.linkDirectionalParticleColor((link: Link) =>
				this.isHighlightedLink(link) ? this.plugin.theme.textAccent : "#bcd4ff"
			)
			.linkVisibility(this.doShowLink)
			.onLinkHover(this.onLinkHover)
			.linkColor((link: Link) =>
				this.isHighlightedLink(link) ? this.plugin.theme.textAccent : "#3b4d80"
			);
	};

	// ─── space scene (starfield / nebula / glowing star nodes) ─────────────────

	private getPalette(): string[] {
		const groups = this.plugin.getSettings().groups?.groups ?? [];
		const cols = groups.map((g) => g.color).filter(Boolean);
		return cols.length
			? cols
			: ["#61afef", "#c678dd", "#56b6c2", "#e5c07b", "#e06c75", "#98c379"];
	}

	private getStarColor(node: Node): string {
		const c = this.getNodeColor(node);
		if (!c || c === this.plugin.theme.textMuted || c === this.plugin.theme.textFaint) {
			return "#cfe0ff";
		}
		return this.toSolidColor(c);
	}

	// THREE.Color ignores (and warns about) alpha; drop it from rgba() theme colors.
	private toSolidColor(c: string): string {
		const m = c.match(/^rgba?\(([^)]+)\)/i);
		if (m) {
			const p = m[1].split(",").map((s) => s.trim());
			return `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
		}
		return c;
	}

	private getGlowTexture(): any {
		if (this.glowTexture) return this.glowTexture;
		const size = 128;
		const cv = document.createElement("canvas");
		cv.width = cv.height = size;
		const ctx = cv.getContext("2d")!;
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(0.22, "rgba(255,255,255,0.85)");
		g.addColorStop(0.45, "rgba(255,255,255,0.30)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
		const tex = new THREE.Texture(cv);
		tex.needsUpdate = true;
		this.glowTexture = tex;
		return tex;
	}

	private makeNodeObject(node: Node): any {
		const tex = this.getGlowTexture();
		const mat = new THREE.SpriteMaterial({
			map: tex,
			color: new THREE.Color(this.getStarColor(node)),
			blending: THREE.AdditiveBlending,
			transparent: true,
			depthWrite: false,
		});
		const sprite = new THREE.Sprite(mat);
		const val = this.getNodeVal(node) || 1;
		const baseSize = this.plugin.getSettings().display.nodeSize || 4;
		const s = baseSize * 2.4 * Math.cbrt(val);
		sprite.scale.set(s, s, 1);
		(node as any).__starSprite = sprite;
		return sprite;
	}

	private applyNodeColor(node: Node) {
		const sprite = (node as any).__starSprite;
		if (sprite && sprite.material) {
			sprite.material.color.set(this.getStarColor(node));
		}
	}

	private recolorAllNodes() {
		this.graph?.nodes.forEach((n: Node) => this.applyNodeColor(n));
	}

	private setupSpaceScene = () => {
		const scene = (this.instance as any).scene?.();
		if (!scene) {
			this.spaceRetry += 1;
			if (this.spaceRetry < 120) requestAnimationFrame(this.setupSpaceScene);
			return;
		}
		if (this.starGroup) return;

		this.spaceScene = scene;
		const palette = this.getPalette();
		const tex = this.getGlowTexture();
		this.spaceDisposables = [];

		// Starfield — additive Points scattered in a spherical shell
		const starCount = 2500;
		const positions = new Float32Array(starCount * 3);
		const colors = new Float32Array(starCount * 3);
		const tmp = new THREE.Color();
		for (let i = 0; i < starCount; i++) {
			const r = 2200 + Math.random() * 4000;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = r * Math.cos(phi);
			if (Math.random() < 0.35) tmp.set(palette[(Math.random() * palette.length) | 0]);
			else tmp.set("#ffffff");
			const b = 0.6 + Math.random() * 0.4;
			colors[i * 3] = tmp.r * b;
			colors[i * 3 + 1] = tmp.g * b;
			colors[i * 3 + 2] = tmp.b * b;
		}
		const starGeo = new THREE.BufferGeometry();
		starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		const starMat = new THREE.PointsMaterial({
			size: 36,
			map: tex,
			vertexColors: true,
			blending: THREE.AdditiveBlending,
			transparent: true,
			depthWrite: false,
			sizeAttenuation: true,
		});
		const stars = new THREE.Points(starGeo, starMat);
		const starGroup = new THREE.Group();
		starGroup.add(stars);
		scene.add(starGroup);
		this.starGroup = starGroup;
		this.spaceDisposables.push(starGeo, starMat);

		// Nebula — large faint additive sprites tinted from the folder palette
		const nebula = new THREE.Group();
		for (let i = 0; i < 6; i++) {
			const col = palette[(Math.random() * palette.length) | 0];
			const nm = new THREE.SpriteMaterial({
				map: tex,
				color: new THREE.Color(col),
				blending: THREE.AdditiveBlending,
				transparent: true,
				opacity: 0.13,
				depthWrite: false,
			});
			const sp = new THREE.Sprite(nm);
			const d = 1500 + Math.random() * 2200;
			const th = Math.random() * Math.PI * 2;
			const ph = Math.acos(2 * Math.random() - 1);
			sp.position.set(
				d * Math.sin(ph) * Math.cos(th),
				d * Math.sin(ph) * Math.sin(th),
				d * Math.cos(ph)
			);
			const sc = 2200 + Math.random() * 2000;
			sp.scale.set(sc, sc, 1);
			nebula.add(sp);
			this.spaceDisposables.push(nm);
		}
		scene.add(nebula);
		this.nebula = nebula;

		// Subtle depth fog (low density so the far starfield survives)
		scene.fog = new THREE.FogExp2(new THREE.Color("#05060f").getHex(), 0.00007);

		// Rebuild node objects now that full THREE is ready, then drift the field
		this.instance
			.nodeThreeObject((node: Node) => this.makeNodeObject(node))
			.nodeThreeObjectExtend(false);

		const animate = () => {
			if (this.starGroup) this.starGroup.rotation.y += 0.00012;
			if (this.nebula) this.nebula.rotation.y -= 0.00007;
			this.spaceRAF = requestAnimationFrame(animate);
		};
		this.spaceRAF = requestAnimationFrame(animate);
	};

	private teardownSpaceScene() {
		if (this.spaceRAF !== null) cancelAnimationFrame(this.spaceRAF);
		this.spaceRAF = null;
		try {
			const scene = this.spaceScene;
			if (scene) {
				if (this.starGroup) scene.remove(this.starGroup);
				if (this.nebula) scene.remove(this.nebula);
				scene.fog = null;
			}
			this.spaceDisposables.forEach((d) => d?.dispose?.());
			this.glowTexture?.dispose?.();
		} catch (e) {
			/* noop */
		}
		this.starGroup = null;
		this.nebula = null;
		this.spaceScene = null;
		this.spaceDisposables = [];
		this.glowTexture = null;
	}

	// ─── highlights ──────────────────────────────────────────────────────────

	private onNodeHover = (node: Node | null) => {
		if ((!node && !this.highlightedNodes.size) || (node && this.hoveredNode === node)) return;

		this.clearHighlights();

		if (node) {
			this.highlightedNodes.add(node.id);
			node.neighbors.forEach((nb) => this.highlightedNodes.add(nb.id));
			this.graph.getLinksWithNode(node.id).forEach((l) => this.highlightedLinks.add(l));
		}
		this.hoveredNode = node ?? null;
		this.updateHighlight();
	};

	private onLinkHover = (link: Link | null) => {
		this.clearHighlights();
		if (link) {
			this.highlightedLinks.add(link);
			// @ts-ignore D3 may replace string ids with node objects
			this.highlightedNodes.add(link.source?.id ?? link.source);
			// @ts-ignore
			this.highlightedNodes.add(link.target?.id ?? link.target);
		}
		this.updateHighlight();
	};

	private clearHighlights = () => {
		this.highlightedNodes.clear();
		this.highlightedLinks.clear();
	};

	private updateHighlight() {
		this.recolorAllNodes();
		this.instance
			.linkColor(this.instance.linkColor())
			.linkDirectionalParticles(this.instance.linkDirectionalParticles())
			.linkDirectionalParticleColor(this.instance.linkDirectionalParticleColor());
	}

	private isHighlightedNode = (node: Node): boolean => this.highlightedNodes.has(node.id);
	private isHighlightedLink = (link: Link): boolean => this.highlightedLinks.has(link);

	// ─── click handlers ──────────────────────────────────────────────────────

	private onNodeClick = (node: Node, event: MouseEvent) => {
		if (event.shiftKey) {
			this.togglePinNode(node);
			return;
		}

		const file = this.plugin.app.vault.getFiles().find((f) => f.path === node.path);
		if (!file) return;

		this.plugin.app.workspace.getLeaf(false).openFile(file);
	};

	private onNodeRightClick = (node: Node, event: MouseEvent) => {
		event.preventDefault();
		const menu = new Menu();

		menu.addItem((item) =>
			item.setTitle("Open file").setIcon("file-text").onClick(() => {
				const file = this.plugin.app.vault.getFiles().find((f) => f.path === node.path);
				if (file) this.plugin.app.workspace.getLeaf(false).openFile(file);
			})
		);

		menu.addItem((item) =>
			item.setTitle("Open in local 3D graph").setIcon("git-fork").onClick(() => {
				this.plugin.openLocalGraphForPath(node.path);
			})
		);

		menu.addItem((item) => {
			const isPinned = this.pinnedNodes.has(node.id);
			item.setTitle(isPinned ? "Unpin node" : "Pin node (Shift+click)")
				.setIcon(isPinned ? "pin-off" : "pin")
				.onClick(() => this.togglePinNode(node));
		});

		menu.addItem((item) =>
			item.setTitle("Focus camera here").setIcon("crosshair").onClick(() => this.flyToNode(node))
		);

		menu.addItem((item) =>
			item.setTitle("Copy path").setIcon("copy").onClick(() => {
				navigator.clipboard.writeText(node.path);
			})
		);

		menu.showAtMouseEvent(event);
	};

	// ─── camera ──────────────────────────────────────────────────────────────

	public flyToNode(node: Node) {
		const n = node as any;
		if (n.x === undefined) return;

		const distance = 80;
		const mag = Math.hypot(n.x || 1, n.y || 1, n.z || 1);
		const ratio = 1 + distance / mag;

		this.instance.cameraPosition(
			{ x: n.x * ratio, y: n.y * ratio, z: (n.z || 0) * ratio },
			{ x: n.x, y: n.y, z: n.z || 0 },
			800
		);
	}

	public focusCurrentFile() {
		const path = this.plugin.openFileState.value;
		if (!path) return;

		const node = this.graph?.getNodeById(path);
		if (!node) return;

		this.flyToNode(node);
		this.clearHighlights();
		this.highlightedNodes.add(node.id);
		this.updateHighlight();
		setTimeout(() => {
			this.clearHighlights();
			this.updateHighlight();
		}, 2500);
	}

	// ─── search ──────────────────────────────────────────────────────────────

	public setSearch(text: string) {
		this.searchText = text;
		this.recolorAllNodes();

		if (!text) return;

		const match = this.graph?.nodes.find(
			(n) => this.doShowNode(n) && n.name.toLowerCase().includes(text.toLowerCase())
		);
		if (match) this.flyToNode(match);
	}

	// ─── physics ─────────────────────────────────────────────────────────────

	public toggleFreeze(): boolean {
		this.isFrozen = !this.isFrozen;
		if (this.isFrozen) {
			this.instance.cooldownTicks(0);
		} else {
			this.instance.cooldownTicks(Infinity);
			(this.instance as any).d3ReheatSimulation?.();
		}
		return this.isFrozen;
	}

	public get frozen() {
		return this.isFrozen;
	}

	// ─── pin nodes ───────────────────────────────────────────────────────────

	private togglePinNode(node: Node) {
		const n = node as any;
		if (this.pinnedNodes.has(node.id)) {
			this.pinnedNodes.delete(node.id);
			n.fx = undefined;
			n.fy = undefined;
			n.fz = undefined;
		} else {
			this.pinnedNodes.add(node.id);
			n.fx = n.x;
			n.fy = n.y;
			n.fz = n.z;
		}
		this.instance.refresh();
	}

	// ─── label overlay ───────────────────────────────────────────────────────

	private updateLabels() {
		if (!this.labelsOverlay || !this.graph) return;

		const camera = (this.instance as any).camera?.() as any;
		if (!camera?.position) return;

		const { x, y, z } = camera.position;
		if (x === this.lastCameraX && y === this.lastCameraY && z === this.lastCameraZ) return;
		this.lastCameraX = x;
		this.lastCameraY = y;
		this.lastCameraZ = z;

		const width = this.rootHtmlElement.offsetWidth;
		const height = this.rootHtmlElement.offsetHeight;
		const labelSize = this.plugin.getSettings().display.labelSize;
		const activeIds = new Set<string>();

		this.graph.nodes.forEach((node: Node) => {
			if (!this.doShowNode(node)) return;
			const n = node as any;
			if (n.x === undefined) return;

			const screen = this.projectToScreen(n.x, n.y, n.z || 0, camera, width, height);
			if (!screen) return;

			if (screen.x < -60 || screen.x > width + 60 || screen.y < -20 || screen.y > height + 20) return;

			activeIds.add(node.id);
			let div = this.labelDivs.get(node.id);
			if (!div) {
				div = document.createElement("div");
				div.className = "graph-node-label";
				this.labelsOverlay!.appendChild(div);
				this.labelDivs.set(node.id, div);
			}
			div.textContent = node.name.replace(/\.md$/, "");
			div.style.left = `${screen.x}px`;
			div.style.top = `${screen.y}px`;
			div.style.fontSize = `${labelSize * 2 + 6}px`;
			div.style.color = this.getNodeColor(node);
			div.style.display = "block";
		});

		this.labelDivs.forEach((div, id) => {
			if (!activeIds.has(id)) div.style.display = "none";
		});
	}

	private clearLabels() {
		this.labelsOverlay?.replaceChildren();
		this.labelDivs.clear();
	}

	// Project world → screen without importing THREE
	private projectToScreen(
		wx: number, wy: number, wz: number,
		camera: any,
		width: number, height: number
	): { x: number; y: number } | null {
		const mv = camera.matrixWorldInverse?.elements;
		const p = camera.projectionMatrix?.elements;
		if (!mv || !p) return null;

		const cx = mv[0]*wx + mv[4]*wy + mv[8]*wz + mv[12];
		const cy = mv[1]*wx + mv[5]*wy + mv[9]*wz + mv[13];
		const cz = mv[2]*wx + mv[6]*wy + mv[10]*wz + mv[14];
		const cw = mv[3]*wx + mv[7]*wy + mv[11]*wz + mv[15];

		const px = p[0]*cx + p[4]*cy + p[8]*cz + p[12]*cw;
		const py = p[1]*cx + p[5]*cy + p[9]*cz + p[13]*cw;
		const pw = p[3]*cx + p[7]*cy + p[11]*cz + p[15]*cw;

		if (pw <= 0) return null;

		return {
			x: ((px / pw) + 1) / 2 * width,
			y: (1 - (py / pw)) / 2 * height,
		};
	}

	// ─── dimensions ──────────────────────────────────────────────────────────

	public updateDimensions() {
		this.instance.width(this.rootHtmlElement.offsetWidth).height(this.rootHtmlElement.offsetHeight);
	}

	public setDimensions(width: number, height: number) {
		this.instance.width(width).height(height);
	}

	public getInstance(): ForceGraph3DInstance {
		return this.instance;
	}

	public destroy() {
		this.callbackUnregisterHandles.forEach((h) => h());
		this.callbackUnregisterHandles.length = 0;
		this.clearLabels();
		this.labelsOverlay?.remove();
		EventBus.off("graph-changed", this.refreshGraphData);
		EventBus.off("theme-changed", this.onThemeChanged);
		this.teardownSpaceScene();
		(this.instance as any)._destructor?.();
	}
}
