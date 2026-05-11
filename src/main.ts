import { Notice, Plugin } from "obsidian";
import { Graph3dView } from "./views/graph/Graph3dView";
import GraphSettings from "./settings/GraphSettings";
import State from "./util/State";
import Graph from "./graph/Graph";
import ObsidianTheme from "./util/ObsidianTheme";
import EventBus from "./util/EventBus";
import { ResolvedLinkCache } from "./graph/Link";
import shallowCompare from "./util/ShallowCompare";

export default class Graph3dPlugin extends Plugin {
	_resolvedCache: ResolvedLinkCache;

	public settingsState: State<GraphSettings>;
	public openFileState: State<string | undefined> = new State(undefined);
	private cacheIsReady: State<boolean> = new State(
		this.app.metadataCache.resolvedLinks !== undefined
	);

	public globalGraph: Graph;
	public theme: ObsidianTheme;
	private queuedGraphs: Graph3dView[] = [];
	private callbackUnregisterHandles: (() => void)[] = [];
	private themeObserver: MutationObserver | null = null;

	async onload() {
		await this.init();
		this.addRibbonIcon("glasses", "3D Graph", this.openGlobalGraph);

		this.addCommand({
			id: "open-3d-graph-global",
			name: "Open Global 3D Graph",
			callback: this.openGlobalGraph,
		});

		this.addCommand({
			id: "open-3d-graph-local",
			name: "Open Local 3D Graph",
			callback: this.openLocalGraph,
		});

		this.addCommand({
			id: "open-3d-graph-local-for-active",
			name: "Open Local 3D Graph for active file",
			callback: this.openLocalGraph,
		});
	}

	private async init() {
		await this.initStates();
		this.initListeners();
		this.initThemeObserver();
	}

	private async initStates() {
		const settings = await this.loadSettings();
		this.settingsState = new State<GraphSettings>(settings);
		this.theme = new ObsidianTheme(this.app.workspace.containerEl);
		this.cacheIsReady.value = this.app.metadataCache.resolvedLinks !== undefined;
		this.onGraphCacheChanged();
	}

	private initThemeObserver() {
		this.themeObserver = new MutationObserver(() => {
			this.theme = new ObsidianTheme(this.app.workspace.containerEl);
			EventBus.trigger("theme-changed");
		});
		this.themeObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ["class", "data-theme"],
		});
	}

	private initListeners() {
		this.callbackUnregisterHandles.push(
			this.settingsState.onChange(() => this.saveSettings())
		);

		EventBus.on("do-reset-settings", this.onDoResetSettings);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!file) return;
				menu.addItem((item) => {
					item.setTitle("Open in local 3D Graph")
						.setIcon("glasses")
						.onClick(() => {
							this.openFileState.value = file.path;
							this.openGraph(true);
						});
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (file) this.openFileState.value = file.path;
			})
		);

		this.callbackUnregisterHandles.push(
			this.cacheIsReady.onChange((isReady) => {
				if (isReady) this.openQueuedGraphs();
			})
		);

		this.app.metadataCache.on("resolved", this.onGraphCacheReady.bind(this));
		this.app.metadataCache.on("resolve", this.onGraphCacheChanged.bind(this));
	}

	private openQueuedGraphs() {
		this.queuedGraphs.forEach((view) => view.showGraph());
		this.queuedGraphs = [];
	}

	private onGraphCacheReady = () => {
		this.onGraphCacheChanged();   // sets globalGraph FIRST
		this.cacheIsReady.value = true; // THEN fires openQueuedGraphs
	};

	private onGraphCacheChanged = () => {
		if (
			this.cacheIsReady.value &&
			!shallowCompare(this._resolvedCache, this.app.metadataCache.resolvedLinks)
		) {
			this._resolvedCache = structuredClone(this.app.metadataCache.resolvedLinks);
			this.globalGraph = Graph.createFromApp(this.app);
			EventBus.trigger("graph-changed");
		}
	};

	private onDoResetSettings = () => {
		this.settingsState.value.reset();
		EventBus.trigger("did-reset-settings");
	};

	private openLocalGraph = () => {
		const path = this.app.workspace.getActiveFile()?.path;
		if (path) {
			this.openFileState.value = path;
			this.openGraph(true);
		} else {
			new Notice("No file is currently open");
		}
	};

	private openGlobalGraph = () => {
		this.openGraph(false);
	};

	private openGraph = (isLocalGraph: boolean) => {
		const leaf = this.app.workspace.getLeaf(isLocalGraph ? "split" : false);
		const graphView = new Graph3dView(this, leaf, isLocalGraph);
		leaf.open(graphView);
		if (this.cacheIsReady.value) {
			graphView.showGraph();
		} else {
			this.queuedGraphs.push(graphView);
		}
	};

	// Called from ForceGraph right-click context menu
	public openLocalGraphForPath(path: string) {
		this.openFileState.value = path;
		this.openGraph(true);
	}

	private async loadSettings(): Promise<GraphSettings> {
		const loadedData = await this.loadData();
		return GraphSettings.fromStore(loadedData);
	}

	async saveSettings() {
		await this.saveData(this.settingsState.getRawValue().toObject());
	}

	onunload() {
		super.onunload();
		this.themeObserver?.disconnect();
		this.callbackUnregisterHandles.forEach((h) => h());
		EventBus.off("do-reset-settings", this.onDoResetSettings);
	}

	public getSettings(): GraphSettings {
		return this.settingsState.value;
	}
}
