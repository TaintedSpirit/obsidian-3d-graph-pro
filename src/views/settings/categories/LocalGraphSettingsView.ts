import { LocalGraphSettings } from "src/settings/categories/LocalGraphSettings";
import SimpleSliderSetting from "src/views/atomics/SimpleSliderSetting";
import State from "src/util/State";

const LocalGraphSettingsView = (
	localGraphSettings: State<LocalGraphSettings>,
	containerEl: HTMLElement
) => {
	SimpleSliderSetting(
		containerEl,
		{
			name: "Depth",
			value: localGraphSettings.value.depth,
			stepOptions: { min: 1, max: 5, step: 1 },
		},
		(value) => {
			localGraphSettings.value.depth = value;
		}
	);
};

export default LocalGraphSettingsView;
