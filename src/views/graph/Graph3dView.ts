import { ItemView, WorkspaceLeaf } from "obsidian";
import { ForceGraph } from "./ForceGraph";
import { GraphSettingsView } from "../settings/GraphSettingsView";
import Graph3dPlugin from "src/main";

export class Graph3dView extends ItemView {
	private forceGraph: ForceGraph;
	private readonly isLocalGraph: boolean;
	private readonly plugin: Graph3dPlugin;

	private searchInput: HTMLInputElement | null = null;
	private freezeBtn: HTMLElement | null = null;

	constructor(plugin: Graph3dPlugin, leaf: WorkspaceLeaf, isLocalGraph = false) {
		super(leaf);
		this.isLocalGraph = isLocalGraph;
		this.plugin = plugin;
	}

	onunload() {
		super.onunload();
		this.forceGraph?.destroy();
	}

	showGraph() {
		const viewContent = this.containerEl.querySelector(".view-content") as HTMLElement;
		if (!viewContent) {
			console.error("Could not find view content");
			return;
		}

		viewContent.classList.add("graph-3d-view");

		this.appendGraph(viewContent);
		this.appendHUD(viewContent);

		const settings = new GraphSettingsView(
			this.plugin.settingsState,
			this.plugin.theme,
			this.isLocalGraph
		);
		viewContent.appendChild(settings);
	}

	getDisplayText(): string {
		return this.isLocalGraph ? "3D Graph (Local)" : "3D Graph";
	}

	getViewType(): string {
		return "3d_graph_view";
	}

	getIcon(): string {
		return "glasses";
	}

	onResize() {
		super.onResize();
		this.forceGraph?.updateDimensions();
	}

	private appendGraph(viewContent: HTMLElement) {
		this.forceGraph = new ForceGraph(this.plugin, viewContent, this.isLocalGraph);
	}

	private appendHUD(viewContent: HTMLElement) {
		const hud = viewContent.createDiv({ cls: "graph-hud" });

		// Search bar
		const searchWrap = hud.createDiv({ cls: "graph-search-wrap" });
		const searchIcon = searchWrap.createDiv({ cls: "graph-search-icon" });
		searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

		this.searchInput = searchWrap.createEl("input", {
			cls: "graph-search-input",
			attr: { type: "text", placeholder: "Search nodes…", spellcheck: "false" },
		});

		this.searchInput.addEventListener("input", () => {
			this.forceGraph?.setSearch(this.searchInput!.value);
		});

		this.searchInput.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this.searchInput!.value = "";
				this.forceGraph?.setSearch("");
				this.searchInput!.blur();
			}
		});

		// Control buttons
		const controls = hud.createDiv({ cls: "graph-hud-controls" });

		// Focus current file
		const focusBtn = controls.createDiv({ cls: "graph-hud-btn", attr: { title: "Focus current file (F)" } });
		focusBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
		focusBtn.addEventListener("click", () => this.forceGraph?.focusCurrentFile());

		// Freeze / resume physics
		this.freezeBtn = controls.createDiv({ cls: "graph-hud-btn", attr: { title: "Freeze physics (Space)" } });
		this.updateFreezeIcon(false);
		this.freezeBtn.addEventListener("click", () => {
			const frozen = this.forceGraph?.toggleFreeze();
			this.updateFreezeIcon(frozen ?? false);
		});

		// Keyboard shortcuts
		viewContent.addEventListener("keydown", (e) => {
			if (document.activeElement === this.searchInput) return;
			if (e.key === "f" || e.key === "F") this.forceGraph?.focusCurrentFile();
			if (e.key === " ") {
				e.preventDefault();
				const frozen = this.forceGraph?.toggleFreeze();
				this.updateFreezeIcon(frozen ?? false);
			}
			if (e.key === "/") {
				e.preventDefault();
				this.searchInput?.focus();
			}
		});

		// Make the HUD area focusable so keyboard events register
		viewContent.setAttribute("tabindex", "0");
	}

	private updateFreezeIcon(frozen: boolean) {
		if (!this.freezeBtn) return;
		this.freezeBtn.setAttribute("title", frozen ? "Resume physics (Space)" : "Freeze physics (Space)");
		this.freezeBtn.classList.toggle("is-active", frozen);
		this.freezeBtn.innerHTML = frozen
			? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
			: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
	}
}
