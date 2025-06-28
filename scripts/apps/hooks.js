import {api, _triggerZone} from "./api.js";
import {runOnSetup, setExecutableOptions} from './constants.js';
import {dangerZone} from '../danger-zone.js';
import {addSceneFormLaunch, addDangerButton, requestSavingThrow} from './helpers.js';
import {migrateDanger, migrateScene} from './migration.js';
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
        
        Hooks.on("renderDangerZoneForm", (app, html, options) => {
            app._handleSourceTag();
        });

        Hooks.on("renderGlobalZoneDangerPartConfig", (app, html, options) => {
            app.handleSourceTag();
        });

        //hook to ensure that, on settings render, the search is applied to the list
        Hooks.on("renderDangerZoneTypesForm", (app, html, options) => {
            app._filter();
        });

        //hook to ensure that, on executor form render, appropriate field flagging is done
        Hooks.on("dangerZone.updateZone", (zone) => {
            dangerZone.log(false, 'Zone update hook...', zone)
            dangerZone.executorForm.renderOnScene(zone.scene.sceneId, zone.id, false);
        })

        //hook to ensure that, on executor form render, appropriate field flagging is done
        Hooks.on("dangerZone.updateDanger", (dangers) => {
            dangerZone.log(false, 'Danger update hook...', dangers)
            dangerZone.executorForm.renderOnScene(canvas.scene.id, '', false);
        })

        /**
         * Hooks on rendering the scene directory on the right side bar
         */
        Hooks.on("renderSceneDirectory", addDangerButton); 

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
        await migrateDanger.migrate();
        await migrateScene.migrate();
        
    });

    /**
     * Registers the api and makes available
     */
    Hooks.once('setup', async function() {
        runOnSetup();
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

    /** V13
     * Adds to the config menu of the Regions form a launch for zones
     */
    Hooks.on("getHeaderControlsRegionConfig", addSceneFormLaunch); 

    /** V13
     * Adds to the config menu of the Scenes configuration form a launch for zones
     */
    Hooks.on ("getHeaderControlsSceneConfig", addSceneFormLaunch);

    /**
     * add zone clear button to canvas controls
     */
    Hooks.on("getSceneControlButtons", (controls) => {
        if(!game.user.isActiveGM) return
        if(!canvas.scene?.grid?.type) return dangerZone.log(false,'No scene navigation when gridless ', {"scene": canvas.scene});
        dangerZone.insertZoneButtons(controls)
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
