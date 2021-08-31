import {dangerZone} from './danger-zone.js';
import {initializeScene} from './apps/scene-settings.js';
import {DangerZoneTypesForm} from './apps/zone-type-list-form.js'
import {addTriggersToSceneNavigation} from './apps/scene-navigation.js';
import {triggerManager}  from './apps/trigger-handler.js';

/**
 * global variables
 */
export var sequencerOn = false, warpgateOn = false, monksActiveTilesOn = false, tokenSaysOn = false, fluidCanvasOn = false; //active modules

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

	game.settings.register(modulename, "types-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.types-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.types-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
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
});

/**
 * Hook for rendering the scene form. Adds zone list and CRUD to scene form
 */
Hooks.on('renderSceneConfig', async (app, html, options) => {
	initializeScene(app, html, options);
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
	if (game.modules.get("monks-active-tiles")?.active){monksActiveTilesOn = true} ;
	if (game.modules.get("token-says")?.active){tokenSaysOn = true} ;
	if (game.modules.get("warpgate")?.active){warpgateOn = true} ;
	if (game.modules.get("kandashis-fluid-canvas")?.active){fluidCanvasOn = true} ;
	if (game.modules.get("sequencer")?.active){sequencerOn = true} ;
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
					let tileIds=canvas.background.tiles.filter(t => t.data.flags[dangerZone.ID]).map(t => t.id);
					await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
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

