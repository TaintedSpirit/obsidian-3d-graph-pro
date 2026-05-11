import { DisplaySettings } from "./categories/DisplaySettings";
import { FilterSettings } from "./categories/FilterSettings";
import { GroupSettings } from "./categories/GroupSettings";
import { LocalGraphSettings } from "./categories/LocalGraphSettings";

export default class GraphSettings {
	filters: FilterSettings;
	groups: GroupSettings;
	display: DisplaySettings;
	localGraph: LocalGraphSettings;

	constructor(
		filterOptions: FilterSettings,
		groupOptions: GroupSettings,
		displayOptions: DisplaySettings,
		localGraphOptions: LocalGraphSettings,
	) {
		this.filters = filterOptions;
		this.groups = groupOptions;
		this.display = displayOptions;
		this.localGraph = localGraphOptions;
	}

	public static fromStore(store: any) {
		return new GraphSettings(
			FilterSettings.fromStore(store?.filters),
			GroupSettings.fromStore(store?.groups),
			DisplaySettings.fromStore(store?.display),
			LocalGraphSettings.fromStore(store?.localGraph),
		);
	}

	public reset() {
		Object.assign(this.filters, new FilterSettings());
		Object.assign(this.groups, new GroupSettings());
		Object.assign(this.display, new DisplaySettings());
		Object.assign(this.localGraph, new LocalGraphSettings());
	}

	public toObject() {
		return {
			filters: this.filters.toObject(),
			groups: this.groups.toObject(),
			display: this.display.toObject(),
			localGraph: this.localGraph.toObject(),
		};
	}
}
