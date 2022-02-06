import {dangerZone} from './danger-zone.js';
import {TRIGGERDISPLAYOPTIONS, SCENEFORMICONDISPLAYOPTIONS, setExecutableOptions, setModOptions} from './apps/constants.js';
import {DangerZoneTypesForm} from './apps/danger-list-form.js';
import {addTriggersToHotbar} from './apps/hotbar.js';
import {triggerManager}  from './apps/trigger-handler.js';
import {api, _triggerZone} from "./apps/api.js";
import {DangerZoneScene} from "./apps/scene-form.js";
import {DangerZoneSceneForm} from './apps/scene-zone-list-form.js';

/**
 * global variables
 */
export var timesUpOn = false, midiQolOn = false, daeOn = false, perfectVisionOn = false, taggerOn = false, sequencerOn = false, wallHeightOn = false, warpgateOn = false, monksSceneOn = false, monksActiveTilesOn = false, tokenSaysOn = false, fluidCanvasOn = false, betterRoofsOn = false, levelsOn = false; //active modules
export var dzMActive = false; 
export let dangerZoneSocket; //var for socketlib

Hooks.once('init', async function() {  
    
	let modulename = "danger-zone";
    const debouncedReload = foundry.utils.debounce(() => {
        window.location.reload();
      }, 100);

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
        onChange: debouncedReload
	});

    game.settings.register(modulename, 'scene-header', {
		name: game.i18n.localize('DANGERZONE.setting.scene-header.display.label'),
		hint: game.i18n.localize('DANGERZONE.setting.scene-header.display.description'),
		scope: 'world',
		config: true,
		default: 'B',
		type: String,
		choices: SCENEFORMICONDISPLAYOPTIONS
	});

	game.settings.register(modulename, "scene-trigger-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-trigger-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-trigger-button-display.description"),
		scope: "world",
		config: true,
		default: 'S',
        type: String,
        choices: TRIGGERDISPLAYOPTIONS,
        onChange: debouncedReload
	});

	game.settings.register(modulename, "scene-control-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
        onChange: debouncedReload,
	});

	game.settings.register(modulename, "scene-control-light-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-light-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
        onChange: debouncedReload,
	});

	game.settings.register(modulename, "scene-control-wall-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.scene-control-wall-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.scene-control-wall-button-display.description"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
        onChange: debouncedReload,
	});

	game.settings.register(modulename, "types-button-display", {
		name: game.i18n.localize("DANGERZONE.setting.types-button-display.label"),
		hint: game.i18n.localize("DANGERZONE.setting.types-button-display.description"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
        onChange: debouncedReload,
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

	dangerZone.initialize();

	Hooks.on("renderDangerZoneForm", (app, html, options) => {
		app._handleSourceTag();
	});

    //hook to ensure that, on settings render, the search is applied to the list
	Hooks.on("renderDangerZoneTypesForm", (app, html, options) => {
        app._filter();
	});
	
	//hook to ensure that, on executor form render, appropriate field flagging is done
	Hooks.on("renderExecutorForm", (app, html, options) => {
        app._handleSuppress(html);
	});
});

/**
 * sets global variables when all modules are ready
 */
Hooks.once('ready', async function() { 
	setModsAvailable();

	game.socket.on("module.danger-zone", async (request) => {
        if(request.stop){
            //dangerZone.log(false,'Socket Call... ', {sound: request.stop});
            const sounds = game.audio.playing.values();
            for (const s of sounds){
                if(s.id === request.stop) {
                    await s.fade(0, {duration: 250})
                    s.stop();
                    break;
                }
            }
        }
      });

	  setExecutableOptions();
	  setModOptions();
});

/**
 * Registers the api and makes available
 */
Hooks.once('setup', async function() {
    api.register();

	Hooks.on('getSceneDirectoryEntryContext', function (app, html, data) {
		if (game.user.isGM) {
		  html.push(
			{
			  name: game.i18n.localize('DANGERZONE.zones'),
			  icon: '<i class="fas fa-radiation"></i>',
			  condition: (li) => {
				return game.user.isGM
			  },
			  callback: (li) => {
				let scene = game.scenes.get(li.data('documentId'));
				if(scene){
					new DangerZoneSceneForm('', scene.id).render(true);
				}
			  },
			},
		  );
		}
	  });

	  Hooks.on('getSceneNavigationContext', function (app, html) {
		if (game.user.isGM) {
		  html.push(
			{
			  name: game.i18n.localize('DANGERZONE.zones'),
			  icon: '<i class="fas fa-radiation"></i>',
			  condition: (li) => {
				return game.user.isGM
			  },
			  callback: (li) => {
				let scene = game.scenes.get(li.data('sceneId'));
				if(scene){
					new DangerZoneSceneForm( '', scene.id).render(true);
				}
			  },
			},
		  );
		}
	  });
 });

/**
 * Register debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
    registerPackageDebugFlag(dangerZone.ID);
});

/**
 * Register sockets
 */
Hooks.once("socketlib.ready", () => {
	dangerZoneSocket = socketlib.registerModule(dangerZone.ID);
	dangerZoneSocket.register("_triggerZone", _triggerZone);
});

/**
 * add zone clear button to canvas controls
 */
Hooks.on("getSceneControlButtons", (controls, b, c) => {
	insertTileEffectsClearButton(controls, b, c);
	insertAmbientLightClearButton(controls, b, c);
	insertWallClearButton(controls, b, c);
});

/**
 * Hook for rendering the scene form. Adds zone list and CRUD to scene form
 */
Hooks.on('renderSceneConfig', async (app, html, options) => {
    DangerZoneScene._init(app, html, options);
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
	dangerZone.initializeTriggerButtons()
});

/**
* Hook for the rendering of the hotbar, such as toggling it. 
*/
Hooks.on('renderSceneControls', async(app, html, options) => {
   switch(game.settings.get('danger-zone', 'scene-trigger-button-display')){
	   case "H":
		   addTriggersToHotbar();
		   break
   }
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

Hooks.on("updateToken", async (token, update, options, userId) => {
    if (game.user.isGM && ("x" in update || "y" in update || "elevation" in update) && !options.dangerZoneMove && dangerZone.getMovementZonesFromScene(token.parent?.id).length) {
		triggerManager.findMovementTriggers(token, update)
    }
});

/**
 * sets global variables that indicate which modules that danger zone integrates with are available
 */
function setModsAvailable () {
	if (game.modules.get("betterroofs")?.active){betterRoofsOn = true} ;
	if (game.modules.get("dae")?.active){daeOn = true} ;
	if (game.modules.get("levels")?.active){levelsOn = true} ;
	if (game.modules.get("midi-qol")?.active){midiQolOn = true} ;
	if (game.modules.get("monks-active-tiles")?.active){monksActiveTilesOn = true} ;
	if (game.modules.get("monks-scene-navigation")?.active){monksSceneOn = true}
	if (game.modules.get("token-says")?.active){tokenSaysOn = true} ;
	if (game.modules.get("warpgate")?.active){warpgateOn = true} ;
	if (game.modules.get("kandashis-fluid-canvas")?.active){fluidCanvasOn = true} ;
	if (game.modules.get("sequencer")?.active){sequencerOn = true} ;
	if (game.modules.get("tagger")?.active){taggerOn = true} ;
	if (game.modules.get("wall-height")?.active){wallHeightOn = true} ;
	if (game.modules.get("times-up")?.active){timesUpOn = true};
	if (game.modules.get("perfect-vision")?.active) perfectVisionOn = true;
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

/**
 * adds the wall clear button to the controls on the canvas
 * @param {object} controls 
 * @param {*} b 
 * @param {*} c 
 */
function insertWallClearButton (controls, b, c) {
	if(game.user.isGM && game.settings.get('danger-zone', 'scene-control-wall-button-display') === true){
		const lightingButton = controls.find(b => b.name == "walls")

		if (lightingButton) {
			lightingButton.tools.push({
				name: "danger-zone-wall-effects-clear",
				title:  game.i18n.localize("DANGERZONE.controls.clearWall.label"),
				icon: "fas fa-radiation",
				visible: game.user.isGM,
				onClick: async () => {
					let lightIds=canvas.scene.walls.filter(t => t.data.flags[dangerZone.ID]).map(t => t.id);
					await canvas.scene.deleteEmbeddedDocuments("Wall", lightIds);
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

export function toggleMasterButtonActive(){
    dzMActive ? dzMActive = false : dzMActive = true
}