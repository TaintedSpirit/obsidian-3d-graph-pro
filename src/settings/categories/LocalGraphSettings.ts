export class LocalGraphSettings {
	depth = 1;

	constructor(depth?: number) {
		this.depth = depth ?? this.depth;
	}

	public static fromStore(store: any) {
		return new LocalGraphSettings(store?.depth);
	}

	public toObject() {
		return { depth: this.depth };
	}
}
