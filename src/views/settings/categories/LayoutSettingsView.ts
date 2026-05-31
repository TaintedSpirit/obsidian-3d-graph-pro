import { Setting } from "obsidian";
import { LayoutPattern, LayoutSettings } from "../../../settings/categories/LayoutSettings";
import SimpleSliderSetting, { SliderOptions } from "../../atomics/SimpleSliderSetting";
import State from "../../../util/State";

const PATTERN_LABELS: Record<LayoutPattern, string> = {
	physics: "Physics (force-directed)",
	sphere: "Sphere",
	spiral: "Spiral / helix",
	sunflower: "Sunflower (phyllotaxis)",
	flower: "Flower of Life",
	grid: "Grid / cube",
	torus: "Torus",
};

const LayoutSettingsView = (
	layoutSettings: State<LayoutSettings>,
	containerEl: HTMLElement
) => {
	EnabledSetting(layoutSettings, containerEl);
	PatternSetting(layoutSettings, containerEl);
	PatternScaleSetting(layoutSettings, containerEl);
	AnchorStrengthSetting(layoutSettings, containerEl);
	CenterForceSetting(layoutSettings, containerEl);
	RepelForceSetting(layoutSettings, containerEl);
	LinkDistanceSetting(layoutSettings, containerEl);
	LinkForceSetting(layoutSettings, containerEl);
	ConfineSetting(layoutSettings, containerEl, "Confine X", "confineX");
	ConfineSetting(layoutSettings, containerEl, "Confine Y", "confineY");
	ConfineSetting(layoutSettings, containerEl, "Confine Z", "confineZ");
};

const EnabledSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	new Setting(containerEl)
		.setName("Enable layout")
		.setDesc("Off = plain force-directed graph (no patterns or plane confinement)")
		.addToggle((toggle) => {
			toggle.setValue(layoutSettings.value.enabled).onChange((value) => {
				layoutSettings.value.enabled = value;
			});
		});
};

const AnchorStrengthSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Anchor strength",
		value: layoutSettings.value.anchorStrength,
		stepOptions: { min: 0, max: 2, step: 0.05 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.anchorStrength = value;
	});
};

const PatternSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	new Setting(containerEl).setName("Pattern").addDropdown((dd) => {
		(Object.keys(PATTERN_LABELS) as LayoutPattern[]).forEach((key) => {
			dd.addOption(key, PATTERN_LABELS[key]);
		});
		dd.setValue(layoutSettings.value.pattern).onChange((value) => {
			layoutSettings.value.pattern = value as LayoutPattern;
		});
	});
};

const PatternScaleSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Pattern scale",
		value: layoutSettings.value.patternScale,
		stepOptions: { min: 0.25, max: 6, step: 0.25 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.patternScale = value;
	});
};

const CenterForceSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Center force",
		value: layoutSettings.value.centerForce,
		stepOptions: { min: 0, max: 5, step: 0.1 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.centerForce = value;
	});
};

const RepelForceSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Repel force",
		value: layoutSettings.value.repelForce,
		stepOptions: { min: 0, max: 600, step: 10 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.repelForce = value;
	});
};

const LinkDistanceSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Link distance",
		value: layoutSettings.value.linkDistance,
		stepOptions: { min: 1, max: 500, step: 5 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.linkDistance = value;
	});
};

const LinkForceSetting = (layoutSettings: State<LayoutSettings>, containerEl: HTMLElement) => {
	const options: SliderOptions = {
		name: "Link force",
		value: layoutSettings.value.linkForce,
		stepOptions: { min: 0, max: 2, step: 0.05 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value.linkForce = value;
	});
};

const ConfineSetting = (
	layoutSettings: State<LayoutSettings>,
	containerEl: HTMLElement,
	name: string,
	key: "confineX" | "confineY" | "confineZ"
) => {
	const options: SliderOptions = {
		name,
		value: layoutSettings.value[key],
		stepOptions: { min: 0, max: 3, step: 0.05 },
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
		layoutSettings.value[key] = value;
	});
};

export default LayoutSettingsView;
