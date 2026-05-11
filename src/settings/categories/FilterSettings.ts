export class FilterSettings {
	doShowOrphans = true;
	doShowAttachments = false;
	pathFilter = "";

	constructor(
		doShowOrphans?: boolean,
		doShowAttachments?: boolean,
		pathFilter?: string,
	) {
		this.doShowOrphans = doShowOrphans ?? this.doShowOrphans;
		this.doShowAttachments = doShowAttachments ?? this.doShowAttachments;
		this.pathFilter = pathFilter ?? "";
	}

	public static fromStore(store: any) {
		return new FilterSettings(
			store?.doShowOrphans,
			store?.doShowAttachments,
			store?.pathFilter,
		);
	}

	public toObject() {
		return {
			doShowOrphans: this.doShowOrphans,
			doShowAttachments: this.doShowAttachments,
			pathFilter: this.pathFilter,
		};
	}
}
