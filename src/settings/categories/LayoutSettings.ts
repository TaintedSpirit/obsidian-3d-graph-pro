export type LayoutPattern =
	| "physics"
	| "sphere"
	| "spiral"
	| "sunflower"
	| "flower"
	| "grid"
	| "torus";

export class LayoutSettings {
	enabled = true;
	pattern: LayoutPattern = "physics";
	patternScale = 1;
	anchorStrength = 0.6;
	centerForce = 1;
	repelForce = 30;
	linkDistance = 40;
	linkForce = 0.4;
	confineX = 0;
	confineY = 0;
	confineZ = 0;

	constructor(
		enabled?: boolean,
		pattern?: LayoutPattern,
		patternScale?: number,
		anchorStrength?: number,
		centerForce?: number,
		repelForce?: number,
		linkDistance?: number,
		linkForce?: number,
		confineX?: number,
		confineY?: number,
		confineZ?: number,
	) {
		this.enabled = enabled ?? this.enabled;
		this.pattern = pattern ?? this.pattern;
		this.patternScale = patternScale ?? this.patternScale;
		this.anchorStrength = anchorStrength ?? this.anchorStrength;
		this.centerForce = centerForce ?? this.centerForce;
		this.repelForce = repelForce ?? this.repelForce;
		this.linkDistance = linkDistance ?? this.linkDistance;
		this.linkForce = linkForce ?? this.linkForce;
		this.confineX = confineX ?? this.confineX;
		this.confineY = confineY ?? this.confineY;
		this.confineZ = confineZ ?? this.confineZ;
	}

	public static fromStore(store: any) {
		return new LayoutSettings(
			store?.enabled,
			store?.pattern,
			store?.patternScale,
			store?.anchorStrength,
			store?.centerForce,
			store?.repelForce,
			store?.linkDistance,
			store?.linkForce,
			store?.confineX,
			store?.confineY,
			store?.confineZ,
		);
	}

	public toObject() {
		return {
			enabled: this.enabled,
			pattern: this.pattern,
			patternScale: this.patternScale,
			anchorStrength: this.anchorStrength,
			centerForce: this.centerForce,
			repelForce: this.repelForce,
			linkDistance: this.linkDistance,
			linkForce: this.linkForce,
			confineX: this.confineX,
			confineY: this.confineY,
			confineZ: this.confineZ,
		};
	}
}
