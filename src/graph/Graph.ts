import Link from "./Link";
import Node from "./Node";
import { App } from "obsidian";

export default class Graph {
	public readonly nodes: Node[];
	public readonly links: Link[];

	private readonly nodeIndex: Map<string, number>;
	private readonly linkIndex: Map<string, Map<string, number>>;

	constructor(
		nodes: Node[],
		links: Link[],
		nodeIndex: Map<string, number>,
		linkIndex: Map<string, Map<string, number>>
	) {
		this.nodes = nodes;
		this.links = links;
		this.nodeIndex = nodeIndex || new Map<string, number>();
		this.linkIndex = linkIndex || new Map<string, Map<string, number>>();
	}

	public getNodeById(id: string): Node | null {
		const index = this.nodeIndex.get(id);
		return index !== undefined ? this.nodes[index] : null;
	}

	public getLinkByIds(sourceNodeId: string, targetNodeId: string): Link | null {
		const sourceLinkMap = this.linkIndex.get(sourceNodeId);
		if (sourceLinkMap) {
			const index = sourceLinkMap.get(targetNodeId);
			if (index !== undefined) return this.links[index];
		}
		return null;
	}

	public getLinksFromNode(sourceNodeId: string): Link[] {
		const sourceLinkMap = this.linkIndex.get(sourceNodeId);
		if (sourceLinkMap) {
			return Array.from(sourceLinkMap.values()).map((index) => this.links[index]);
		}
		return [];
	}

	public getLinksWithNode(nodeId: string): Link[] {
		// D3 replaces string ids with Node instances after graph renders
		// @ts-ignore
		if (this.links[0]?.source?.id) {
			return this.links.filter(
				// @ts-ignore
				(link) => link.source.id === nodeId || link.target.id === nodeId
			);
		}
		return this.links.filter(
			(link) => link.source === nodeId || link.target === nodeId
		);
	}

	// Returns a depth-limited local subgraph centered on nodeId.
	// depth=1 = direct neighbors, depth=2 = neighbors of neighbors, etc.
	public getLocalGraph(nodeId: string, depth = 1): Graph {
		const root = this.getNodeById(nodeId);
		if (!root) return new Graph([], [], new Map(), new Map());

		// BFS expansion up to `depth` hops
		const included = new Map<string, Node>();
		let frontier: Node[] = [root];
		included.set(root.id, root);

		for (let d = 0; d < depth; d++) {
			const next: Node[] = [];
			for (const node of frontier) {
				for (const neighbor of node.neighbors) {
					if (!included.has(neighbor.id)) {
						included.set(neighbor.id, neighbor);
						next.push(neighbor);
					}
				}
			}
			frontier = next;
			if (frontier.length === 0) break;
		}

		const nodes = Array.from(included.values());
		const nodeIndex = new Map<string, number>();
		nodes.forEach((n, i) => nodeIndex.set(n.id, i));

		const links: Link[] = [];
		const seenLinks = new Set<string>();

		nodes.forEach((node) => {
			// Trim neighbors and links to the subgraph
			const filteredNeighbors = node.neighbors.filter((nb) => included.has(nb.id));
			node.neighbors.splice(0, node.neighbors.length, ...filteredNeighbors);

			const filteredLinks = node.links.filter(
				(l) => included.has(l.source as string) && included.has(l.target as string)
			);
			node.links.splice(0, node.links.length, ...filteredLinks);

			filteredLinks.forEach((link) => {
				const key = `${link.source}|${link.target}`;
				if (!seenLinks.has(key)) {
					seenLinks.add(key);
					links.push(link);
				}
			});
		});

		return new Graph(nodes, links, nodeIndex, Link.createLinkIndex(links));
	}

	public clone = (): Graph => {
		return new Graph(
			structuredClone(this.nodes),
			structuredClone(this.links),
			structuredClone(this.nodeIndex),
			structuredClone(this.linkIndex)
		);
	};

	public static createFromApp = (app: App): Graph => {
		const [nodes, nodeIndex] = Node.createFromFiles(app.vault.getFiles()),
			[links, linkIndex] = Link.createFromCache(
				app.metadataCache.resolvedLinks,
				nodes,
				nodeIndex
			);
		return new Graph(nodes, links, nodeIndex, linkIndex);
	};

	public update = (app: App) => {
		const newGraph = Graph.createFromApp(app);
		this.nodes.splice(0, this.nodes.length, ...newGraph.nodes);
		this.links.splice(0, this.links.length, ...newGraph.links);
		this.nodeIndex.clear();
		newGraph.nodeIndex.forEach((v, k) => this.nodeIndex.set(k, v));
		this.linkIndex.clear();
		newGraph.linkIndex.forEach((v, k) => this.linkIndex.set(k, v));
	};
}
