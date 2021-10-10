import {dangerZone} from './danger-zone.js';
import {initializeScene} from './apps/scene-settings.js';
import {DangerZoneTypesForm} from './apps/zone-type-list-form.js'
import {addTriggersToSceneNavigation} from './apps/scene-navigation.js';
import {triggerManager}  from './apps/trigger-handler.js';
import {api} from "./apps/api.js";

/**
 * global variables
 */
export var taggerOn = false, sequencerOn = false, warpgateOn = false, monksActiveTilesOn = false, tokenSaysOn = false, fluidCanvasOn = false, betterRoofsOn = false, levelsOn = false; //active modules

/**
 * retains the most recent search term while in session for the danger zone type list form
 * @param {string} inSearch - most recent term
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

	game.settings.register(modulename, "scene-control-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "scene-control-light-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(modulename, "types-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.types-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.types-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "chat-details-to-gm", {
		name: game.i18n.localize("DANGERZONE.setting.chat-details-to-gm.label"),
		hint: game.i18n.localize("DANGERZONE.setting.chat-details-to-gm.description"),
		scope: "world",
		config: true,
		default: false,
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

	dangerZone.initialize();

    //hook to ensure that, on settings render, the search is applied to the list
	Hooks.on("renderDangerZoneTypesForm", (app, html, options) => {
        app._filter();
	});
});

/**
 * sets global variables when all modules are ready
 */
Hooks.once('ready', async function() { 
	setModsAvailable();
});

/**
 * Registers the api and makes available
 */
Hooks.once('setup', async function() {
    api.register();
 });

/**
 * Register debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
    registerPackageDebugFlag(dangerZone.ID);
});

/**
 * add zone clear button to canvas controls
 */
Hooks.on("getSceneControlButtons", (controls, b, c) => {
	insertTileEffectsClearButton(controls, b, c);
	insertAmbientLightClearButton(controls, b, c);
});

/**
 * Hook for rendering the scene form. Adds zone list and CRUD to scene form
 */
Hooks.on('renderSceneConfig', async (app, html, options) => {
	initializeScene(app, html, options);
});

/**
 * Hook for preupdating the scene form. Confirms compatibility of zone scene ids in update with current scene 
 */
Hooks.on('preUpdateScene', (scene, change, options, userId) => {
	const flag = dangerZone.validatePreupdateZones(scene);
	if(flag){
		change[`flags.${dangerZone.ID}.${dangerZone.FLAGS.SCENEZONE}`] = flag;
	}
});

/**
 * Hook for the rendering of the scene list at top of canvas display. Adds zone trigger buttons to scene navigation bar on canvas
 */
Hooks.on('renderSceneNavigation', async(app, html, options) => {
	addTriggersToSceneNavigation(app, html, options);
});


Hooks.on("renderSidebarTab", async(app, html) => {
	addQuickZonesLaunch(app, html);
});

/**
 * in combat hook for when combat ends. Used for managing in combat zone triggers
 */
Hooks.on('deleteCombat', async(combat, round, options, id) => {
	triggerManager.findCombatTriggers(combat, 'deleteCombat')
});

/**
 * in combat hook for when combat begins or round/turn changes. Used for managing in combat zone triggers
 */
Hooks.on('updateCombat', async(combat, round, options, id) => {
	triggerManager.findCombatTriggers(combat, 'updateCombat')
});

/**
 * sets global variables that indicate which modules that danger zone integrates with are available
 */
function setModsAvailable () {
	if (game.modules.get("betterroofs")?.active){betterRoofsOn = true} ;
	if (game.modules.get("levels")?.active){levelsOn = true} ;
	if (game.modules.get("monks-active-tiles")?.active){monksActiveTilesOn = true} ;
	if (game.modules.get("token-says")?.active){tokenSaysOn = true} ;
	if (game.modules.get("warpgate")?.active){warpgateOn = true} ;
	if (game.modules.get("kandashis-fluid-canvas")?.active){fluidCanvasOn = true} ;
	if (game.modules.get("sequencer")?.active){sequencerOn = true} ;
	if (game.modules.get("tagger")?.active){taggerOn = true} ;
}

/**
 * adds the tile clear button to the controls on the canvas
 * @param {object} controls 
 * @param {*} b 
 * @param {*} c 
 */
function insertTileEffectsClearButton (controls, b, c) {
	if(game.user.isGM && game.settings.get('danger-zone', 'scene-control-button-display') === true){
		const tileButton = controls.find(b => b.name == "tiles")

		if (tileButton) {
			tileButton.tools.push({
				name: "danger-zone-tile-effects-clear",
				title:  game.i18n.localize("DANGERZONE.controls.clearEffectsTile.label"),
				icon: "fas fa-radiation",
				visible: game.user.isGM,
				onClick: async () => {
					let tileIds=canvas.scene.tiles.filter(t => t.data.flags[dangerZone.ID]).map(t => t.id);
					await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
				},
				button: true
			});
		}
	}
}

/**
 * adds the ambient light clear button to the controls on the canvas
 * @param {object} controls 
 * @param {*} b 
 * @param {*} c 
 */
 function insertAmbientLightClearButton (controls, b, c) {
	if(game.user.isGM && game.settings.get('danger-zone', 'scene-control-light-button-display') === true){
		const lightingButton = controls.find(b => b.name == "lighting")

		if (lightingButton) {
			lightingButton.tools.push({
				name: "danger-zone-lighting-effects-clear",
				title:  game.i18n.localize("DANGERZONE.controls.clearAmbientLight.label"),
				icon: "fas fa-radiation",
				visible: game.user.isGM,
				onClick: async () => {
					let lightIds=canvas.scene.lights.filter(t => t.data.flags[dangerZone.ID]).map(t => t.id);
					await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightIds);
				},
				button: true
			});
		}
	}
}

export function addQuickZonesLaunch(app, html) {
	if (game.user.isGM && app.options.id == "scenes" && game.settings.get('danger-zone', 'types-button-display') === true) {
		let button = $('<div class="header-actions action-buttons flexrow"><button class="danger-zone-types-launcher"><i class="fas fa-radiation"></i> ' + game.i18n.localize("DANGERZONE.setting.danger-zone-types-config.name")+ '</button></div>');
	
		button.click(async () => {
			dangerZone.DangerZoneTypesForm.render(true);
		});
		$(html).find(".directory-footer").append(button);
	}
}

