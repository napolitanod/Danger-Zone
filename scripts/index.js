import {dangerZone} from './danger-zone.js';
import {DangerZoneTypesForm} from './apps/danger-list-form.js';

/**
 * Issues from V13


 css cleanup
 */

/**
 * global variables
 */

Hooks.once('init', async function() {  
    
	let modulename = "danger-zone";

	game.settings.registerMenu(modulename, "danger-zone-types-config", {
        name: game.i18n.localize("DANGERZONE.setting.danger-zone-types-config.name"),
        label: game.i18n.localize("DANGERZONE.setting.danger-zone-types-config.label"),
        icon: "fas fa-radiation",
        type: DangerZoneTypesForm,
        restricted: true
    });

	game.settings.register(modulename, "display-danger-boundary", {
		name: game.i18n.localize("DANGERZONE.setting.display-danger-boundary.label"),
		hint: game.i18n.localize("DANGERZONE.setting.display-danger-boundary.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "scene-enabled-default", {
		name: game.i18n.localize("DANGERZONE.setting.scene-enabled-default.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-enabled-default.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "display-executor", {
		name: game.i18n.localize("DANGERZONE.setting.display-executor.label"),
		hint: game.i18n.localize("DANGERZONE.setting.display-executor.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-clear-all-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-clear-all-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-clear-all-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-light-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-sound-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-sound-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-sound-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-region-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-region-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-region-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "scene-control-wall-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-wall-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-wall-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "types-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.types-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.types-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register(modulename, "chat-details-to-gm", {
		name: game.i18n.localize("DANGERZONE.setting.chat-details-to-gm.label"),
		hint: game.i18n.localize("DANGERZONE.setting.chat-details-to-gm.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(modulename, "open-socket", {
		name: game.i18n.localize("DANGERZONE.setting.open-socket.label"),
		hint: game.i18n.localize("DANGERZONE.setting.open-socket.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "token-depth-multiplier", {
		name: game.i18n.localize("DANGERZONE.setting.token-depth-multiplier.label"),
		hint: game.i18n.localize("DANGERZONE.setting.token-depth-multiplier.description"),
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0.1,
			max: 10,
			step: 0.1
		}
	});

	game.settings.register(modulename, "zone-exclusion-tag", {
		name: game.i18n.localize("DANGERZONE.setting.zone-exclusion-tag.label"),
		hint: game.i18n.localize("DANGERZONE.setting.zone-exclusion-tag.description"),
		scope: "world",
		config: true,
		default: "xZone",
		type: String,
	});

	game.settings.register(modulename, 'zone-types', {
        name: game.i18n.localize('DANGERZONE.setting.zone-types.label'),
        hint: game.i18n.localize('DANGERZONE.setting.zone-types.description'),
        scope: 'world',
        config: false,
        default: {},
        type: Object
    }); 

	game.settings.register('danger-zone', 'region-migration-complete', {
		name: 'Region Migration Complete Flag',
		scope: 'world',
		config: false,
		default: false,
		type: Boolean
	}); 

	if(game.world.system === 'dnd5e'){
		game.settings.register('danger-zone', 'saving-throw-fast-forward', {
			name: game.i18n.localize('DANGERZONE.setting.saving-throw-fast-forward.label'),
			hint: game.i18n.localize('DANGERZONE.setting.saving-throw-fast-forward.description'),
			scope: 'world',
			config: true,
			default: false,
			type: Boolean
		}); 

		game.settings.register('danger-zone', 'saving-throw-delay', {
			name: game.i18n.localize('DANGERZONE.setting.saving-throw-delay.label'),
			hint: game.i18n.localize('DANGERZONE.setting.saving-throw-delay.description'),
			scope: 'world',
			config: true,
			default: 20,
			type: Number,
			range: {
				min: 0,
				max: 60,
				step: 1
			}
		}); 

		game.settings.register('danger-zone', 'apply-damage', {
			name: game.i18n.localize('DANGERZONE.setting.apply-damage.label'),
			hint: game.i18n.localize('DANGERZONE.setting.apply-damage.description'),
			scope: 'world',
			config: true,
			default: false,
			type: Boolean
		}); 
	}
	
	game.settings.register('danger-zone', 'logging', {
		name: 'Console Logging',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	}); 

	dangerZone._initialize();
});