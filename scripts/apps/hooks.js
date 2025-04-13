import {api, _triggerZone} from "./api.js";
import {setExecutableOptions, setModOptions, WIPEABLES} from './constants.js';
import {dangerZone} from '../danger-zone.js';
import {requestSavingThrow} from './helpers.js';
import {addTriggersToHotbar} from './hotbar.js';
import {migrateDanger, migrateScene} from './migration.js';
import {DangerZoneScene} from "./scene-form.js";
import {DangerZoneSceneForm} from './scene-zone-list-form.js';
import {triggerManager}  from './trigger-handler.js';

export function setHooks(){
    /**
     * sets global variables when all modules are ready
     */
    Hooks.once('ready', async function() { 

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
            } else if(request.weather && (!request.weather.sceneId || request.weather.sceneId === canvas.scene.id)){
                if(request.weather.stop){canvas.weather.clearEffects()}
                if(request.weather.play){canvas.weather.initializeEffects(CONFIG.weatherEffects[request.weather.play])}
            }
        });

        Hooks.on('closeDangerZoneForm', (form, app) => {
            dangerZone.initializeTriggerButtons()
        });
        
        Hooks.on("renderDangerZoneForm", (app, html, options) => {
            app._handleSourceTag();
        });

        Hooks.on("renderDangerZoneDangerFormGlobalZone", (app, html, options) => {
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

        Hooks.on("token-says.sayingComplete", (saying) => {
            if(!saying.table?.id || !saying.scene?.id) return
            const chatMessage = {
                results: [saying.message],
                speaker: saying.speaker
            };
            const options = {table: saying.table};
            triggerManager.findChatEvents(chatMessage, "tokenSaysTrigger", options)
        })

        setExecutableOptions();
        setModOptions();
        await migrateDanger.migrate();
        await migrateScene.migrate();
        dangerZone.initializeTriggerButtons()
    });

    /**
     * Registers the api and makes available
     */
    Hooks.once('setup', async function() {
        api.register();
    });

    /**
     * Register sockets
     */
    Hooks.once("socketlib.ready", () => {
        dangerZone.dangerZoneSocket = socketlib.registerModule(dangerZone.ID);
        dangerZone.dangerZoneSocket.register("_triggerZone", _triggerZone);
        dangerZone.dangerZoneSocket.register("requestSavingThrow", requestSavingThrow);
    });

    /**
     * in combat hook for when combat ends. Used for managing in combat zone events
     */
    Hooks.on('combatStart', async(combat, options) => {
        triggerManager.findcombatEvents(combat, 'combatStart', options)
    });

    /**
     * Hook for creating the chat message
     */
    Hooks.on("createChatMessage", async(chatMessage, updates, id) => {
        //right now only rolltables generate triggers, so eject if not rolltable
        const rollTableId = chatMessage?.flags?.core?.RollTable
        if(!rollTableId) return
        if(!chatMessage.rolls?.length) return
        const options = {rollTableId: rollTableId}
        triggerManager.findChatEvents(chatMessage, "createChatMessage", options)
    })

    Hooks.on('createScene', async (scene, options, userId) => {
        if(scene?.flags?.[dangerZone.ID]){
            await migrateScene.migrate(scene)
        }
    });

    /**
     * in combat hook for when combat ends. Used for managing in combat zone events
     */
    Hooks.on('deleteCombat', async(combat, options, id) => {
        triggerManager.findcombatEvents(combat, 'deleteCombat', options)
    });

    /**
     * add zone clear button to canvas controls
     */
    Hooks.on("getSceneControlButtons", (controls) => {
        if(!game.user.isActiveGM) return
        for (const key of Object.keys(WIPEABLES)) {
            dangerZone._insertClearButton(key, controls[key])
        }
    });

    Hooks.on('getSceneDirectoryEntryContext', function (app, html, data) {
        if (game.user.isActiveGM) {
        html.push(
            {
            name: game.i18n.localize('DANGERZONE.zones'),
            icon: '<i class="fas fa-radiation"></i>',
            condition: (li) => {
                return game.user.isActiveGM
            },
            callback: async (li) => {
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
        if (game.user.isActiveGM) {
        html.push(
            {
            name: game.i18n.localize('DANGERZONE.zones'),
            icon: '<i class="fas fa-radiation"></i>',
            condition: (li) => {
                return game.user.isActiveGM
            },
            callback: async (li) => {
                let scene = game.scenes.get(li.data('sceneId'));
                if(scene){
                    new DangerZoneSceneForm( '', scene.id).render(true);
                }
            },
            },
        );
        }
    });

    /**
     * Hook for rendering the scene form. Adds zone list and CRUD to scene form
     */
    Hooks.on('renderSceneConfig', async (app, html, options) => {
        DangerZoneScene._init(app, html, options);
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
    /**
     * Hook for the rendering of the scene list at top of canvas display. Adds zone trigger buttons to scene navigation bar on canvas
     */
    Hooks.on('renderSceneDirectory', async(app, html, options) => {
        dangerZone.initializeTriggerButtons()
    });

    Hooks.on("renderSidebarTab", async(app,options,update) => {
        if(update?.tabName ==='scenes') dangerZone._addQuickZonesLaunch(app);
    }); 

    /**
     * in combat hook for when combat begins or round/turn changes. Used for managing in combat zone events
     */
    Hooks.on('updateCombat', async(combat, round, options, id) => {
        if(options.advanceTime || options.direction === 1) triggerManager.findcombatEvents(combat, 'updateCombat', options)
    });

    Hooks.on("updateToken", async (token, update, options, userId) => {
        if (game.user.isActiveGM && ("x" in update || "y" in update || "elevation" in update) && !options.dangerZoneMove && dangerZone.getMovementZonesFromScene(token.parent?.id).length) {
            triggerManager.zoneMovement(token, update, token?.object?.animationName)
        }
    });
}
