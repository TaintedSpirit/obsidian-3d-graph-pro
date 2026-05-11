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
		stepOptions: { min: 0, max: 10, step: 0.5 },
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
		stepOptions: { min: 1, max: 12, step: 1 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		displaySettings.value.labelSize = value;
	});
};

export default DisplaySettingsView;
