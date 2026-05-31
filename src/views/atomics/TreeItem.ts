export type HtmlBuilder = (containerEl: HTMLElement) => void;

// Collapsible tree item that imitates Obsidian's tree items.
//
// Implemented as a plain <div> builder rather than a customized built-in
// element (`extends HTMLDivElement` + customElements.define). Customized
// built-ins can only be registered once per window, so when the plugin
// hot-reloads the fresh module's class is left unregistered and
// `new TreeItem()` throws "Illegal constructor" — which previously broke the
// entire graph-options widget after any reload.
export function TreeItem($inner: HTMLElement, children: HtmlBuilder[]): HTMLDivElement {
	const root = document.createElement("div");
	root.classList.add("graph-control-section", "tree-item");

	const $self = document.createElement("div");
	$self.classList.add("tree-item-self");
	$self.addEventListener("click", () => {
		root.classList.toggle("is-collapsed");
	});

	const $innerWrap = document.createElement("div");
	$innerWrap.classList.add("tree-item-inner");
	$innerWrap.append($inner);
	$self.append($innerWrap);
	root.append($self);

	const $children = document.createElement("div");
	$children.classList.add("tree-item-children");
	children.forEach((build) => build($children));
	root.append($children);

	return root;
}
