export class DisplaySettings {
	nodeSize = 4;
	linkThickness = 1;
	particleSize = 3;
	particleCount = 4;
	showLabels = false;
	labelSize = 4;
	nodeScale: "uniform" | "degree" = "uniform";
	blackBackground = false;
	linkArrows = true;
	dimOnHover = true;
	showNebula = true;
	starDensity = 1;
	fogDensity = 1;
	nodeOpacity = 0.92;
	linkOpacity = 0.32;

	constructor(
		nodeSize?: number,
		linkThickness?: number,
		particleSize?: number,
		particleCount?: number,
		showLabels?: boolean,
		labelSize?: number,
		nodeScale?: "uniform" | "degree",
		blackBackground?: boolean,
		linkArrows?: boolean,
		dimOnHover?: boolean,
		showNebula?: boolean,
		starDensity?: number,
		fogDensity?: number,
		nodeOpacity?: number,
		linkOpacity?: number,
	) {
		this.nodeSize = nodeSize ?? this.nodeSize;
		this.linkThickness = linkThickness ?? this.linkThickness;
		this.particleSize = particleSize ?? this.particleSize;
		this.particleCount = particleCount ?? this.particleCount;
		this.showLabels = showLabels ?? this.showLabels;
		this.labelSize = labelSize ?? this.labelSize;
		this.nodeScale = nodeScale ?? this.nodeScale;
		this.blackBackground = blackBackground ?? this.blackBackground;
		this.linkArrows = linkArrows ?? this.linkArrows;
		this.dimOnHover = dimOnHover ?? this.dimOnHover;
		this.showNebula = showNebula ?? this.showNebula;
		this.starDensity = starDensity ?? this.starDensity;
		this.fogDensity = fogDensity ?? this.fogDensity;
		this.nodeOpacity = nodeOpacity ?? this.nodeOpacity;
		this.linkOpacity = linkOpacity ?? this.linkOpacity;
	}

	public static fromStore(store: any) {
		return new DisplaySettings(
			store?.nodeSize,
			store?.linkThickness,
			store?.particleSize,
			store?.particleCount,
			store?.showLabels,
			store?.labelSize,
			store?.nodeScale,
			store?.blackBackground,
			store?.linkArrows,
			store?.dimOnHover,
			store?.showNebula,
			store?.starDensity,
			store?.fogDensity,
			store?.nodeOpacity,
			store?.linkOpacity,
		);
	}

	public toObject() {
		return {
			nodeSize: this.nodeSize,
			linkThickness: this.linkThickness,
			particleSize: this.particleSize,
			particleCount: this.particleCount,
			showLabels: this.showLabels,
			labelSize: this.labelSize,
			nodeScale: this.nodeScale,
			blackBackground: this.blackBackground,
			linkArrows: this.linkArrows,
			dimOnHover: this.dimOnHover,
			showNebula: this.showNebula,
			starDensity: this.starDensity,
			fogDensity: this.fogDensity,
			nodeOpacity: this.nodeOpacity,
			linkOpacity: this.linkOpacity,
		};
	}
}
