import { Setting } from "obsidian";
import { DisplaySettings } from "../../../settings/categories/DisplaySettings";
import SimpleSliderSetting, {
	DEFAULT_SLIDER_STEP_OPTIONS,
	SliderOptions,
} from "../../atomics/SimpleSliderSetting";
import State from "../../../util/State";

const DisplaySettingsView = (
	displaySettings: State<DisplaySettings>,
	containerEl: HTMLElement
) => {
	NodeSizeSetting(displaySettings, containerEl);
	NodeScaleSetting(displaySettings, containerEl);
	LinkThicknessSetting(displaySettings, containerEl);
	ParticleSizeSetting(displaySettings, containerEl);
	ParticleCountSetting(displaySettings, containerEl);
	ShowLabelsSetting(displaySettings, containerEl);
	LabelSizeSetting(displaySettings, containerEl);
	NodeOpacitySetting(displaySettings, containerEl);
	LinkOpacitySetting(displaySettings, containerEl);
	LinkArrowsSetting(displaySettings, containerEl);
	DimOnHoverSetting(displaySettings, containerEl);
	BlackBackgroundSetting(displaySettings, containerEl);
	ShowNebulaSetting(displaySettings, containerEl);
	StarDensitySetting(displaySettings, containerEl);
	FogDensitySetting(displaySettings, containerEl);
};

const NodeOpacitySetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Node opacity",
		value: displaySettings.value.nodeOpacity,
		stepOptions: { min: 0.1, max: 1, step: 0.02 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.nodeOpacity = value;
	});
};

const LinkOpacitySetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Link opacity",
		value: displaySettings.value.linkOpacity,
		stepOptions: { min: 0.1, max: 1, step: 0.02 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.linkOpacity = value;
	});
};

const LinkArrowsSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Link arrows").addToggle((toggle) => {
		toggle.setValue(displaySettings.value.linkArrows).onChange((value) => {
			displaySettings.value.linkArrows = value;
		});
	});
};

const DimOnHoverSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Dim others on hover").addToggle((toggle) => {
		toggle.setValue(displaySettings.value.dimOnHover).onChange((value) => {
			displaySettings.value.dimOnHover = value;
		});
	});
};

const ShowNebulaSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Show nebula").addToggle((toggle) => {
		toggle.setValue(displaySettings.value.showNebula).onChange((value) => {
			displaySettings.value.showNebula = value;
		});
	});
};

const StarDensitySetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Star density",
		value: displaySettings.value.starDensity,
		stepOptions: { min: 0, max: 5, step: 0.25 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.starDensity = value;
	});
};

const FogDensitySetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Fog",
		value: displaySettings.value.fogDensity,
		stepOptions: { min: 0, max: 5, step: 0.25 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.fogDensity = value;
	});
};

const BlackBackgroundSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Pure black background").addToggle((toggle) => {
		toggle.setValue(displaySettings.value.blackBackground).onChange((value) => {
			displaySettings.value.blackBackground = value;
		});
	});
};

const NodeSizeSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Node Size",
		value: displaySettings.value.nodeSize,
		stepOptions: DEFAULT_SLIDER_STEP_OPTIONS,
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.nodeSize = value;
	});
};

const NodeScaleSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Node Scale").addDropdown((dd) => {
		dd.addOption("uniform", "Uniform")
			.addOption("degree", "By connections")
			.setValue(displaySettings.value.nodeScale)
			.onChange((value) => {
				displaySettings.value.nodeScale = value as "uniform" | "degree";
			});
	});
};

const LinkThicknessSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Link Thickness",
		value: displaySettings.value.linkThickness,
		stepOptions: { min: 0, max: 25, step: 0.5 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.linkThickness = value;
	});
};

const ParticleSizeSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Particle Size",
		value: displaySettings.value.particleSize,
		stepOptions: DEFAULT_SLIDER_STEP_OPTIONS,
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.particleSize = value;
	});
};

const ParticleCountSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Particle Count",
		value: displaySettings.value.particleCount,
		stepOptions: DEFAULT_SLIDER_STEP_OPTIONS,
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.particleCount = value;
	});
};

const ShowLabelsSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Show Labels").addToggle((toggle) => {
		toggle.setValue(displaySettings.value.showLabels).onChange((value) => {
			displaySettings.value.showLabels = value;
		});
	});
};

const LabelSizeSetting = (displaySettings: State<DisplaySettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Label Size",
		value: displaySettings.value.labelSize,
		stepOptions: { min: 1, max: 30, step: 1 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.labelSize = value;
	});
};

export default DisplaySettingsView;
