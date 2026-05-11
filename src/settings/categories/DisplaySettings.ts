export class DisplaySettings {
	nodeSize = 4;
	linkThickness = 1;
	particleSize = 3;
	particleCount = 4;
	showLabels = false;
	labelSize = 4;
	nodeScale: "uniform" | "degree" = "uniform";

	constructor(
		nodeSize?: number,
		linkThickness?: number,
		particleSize?: number,
		particleCount?: number,
		showLabels?: boolean,
		labelSize?: number,
		nodeScale?: "uniform" | "degree",
	) {
		this.nodeSize = nodeSize ?? this.nodeSize;
		this.linkThickness = linkThickness ?? this.linkThickness;
		this.particleSize = particleSize ?? this.particleSize;
		this.particleCount = particleCount ?? this.particleCount;
		this.showLabels = showLabels ?? this.showLabels;
		this.labelSize = labelSize ?? this.labelSize;
		this.nodeScale = nodeScale ?? this.nodeScale;
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
		};
	}
}
