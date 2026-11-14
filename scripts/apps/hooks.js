import {api, _triggerZone} from "./api.js";
import {runOnSetup, setExecutableOptions} from './constants.js';
import {dangerZone} from '../danger-zone.js';
import {requestSavingThrow} from './helpers.js';
import {migrateDanger, migrateScene} from './migration.js';
import {triggerManager}  from './trigger-handler.js';


/** v13
 * Adds the dangers launch button to the Scenes sidebar
 * @param {object} app 
 * @param {object} html 
 * @param {object} updates 
 */
function addDangerButton(app, html, updates) {
  dangerZone.addDangersLaunch(app, html);
} 



/** V13
 * Adds to the controls for the given appliactiona launch for zones form
 */
function addSceneFormLaunch(application, controls){
  const scene = application?.document?.documentName === 'Scene' ? application?.document : canvas.scene
  if(!game.user.isActiveGM) return
  controls.push({
      onClick: (event) => {
          launchSceneForm(scene, application)
      },
      icon: 'fas fa-radiation',
      label: 'DANGERZONE.zones'
  })
}



/**v13
 * Launches the form that lists all zones associated to the given scene.
 * @param {object} scene the scene class
 * @param {object} application 
 */
function launchSceneForm(scene, application = ''){ 
  application ? application.renderChild(new ZoneListForm(scene.id)) : new ZoneListForm(scene.id).render(true)
}




export function setHooks(){
    /**
     * sets global variables when all modules are ready
     */
    Hooks.once('ready', async function() { 

        Hooks.on("canvasReady", async(app) => {
            if(game.user.isActiveGM && app.scene?.id){
               await dangerZone.executorForm.renderOnScene(app.scene.id, '', false);
            }
        });

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
        
        Hooks.on("renderZoneForm", (app, html, options) => {
            app.handleSourceTag();
        });

        Hooks.on("renderGlobalZoneDangerPartConfig", (app, html, options) => {
            app.handleSourceTag();
        });

        //hook to ensure that, on settings render, the search is applied to the list
        Hooks.on("renderDangerListForm", (app, html, options) => {
            app.filter();
        });

        //hook to ensure that, on executor form render, appropriate field flagging is done
        Hooks.on("dangerZone.deleteZone", (zone) => {
            dangerZone.log(false, 'Zone delete hook...', zone)
            if(game.user.isActiveGM && canvas.scene?.id === zone.scene.sceneId) dangerZone.executorForm.renderOnScene(zone.scene.sceneId);
        })

        //hook to ensure that, on executor form render, appropriate field flagging is done
        Hooks.on("dangerZone.updateZone", (zone) => {
            dangerZone.log(false, 'Zone update hook...', zone)
            if(game.user.isActiveGM && canvas.scene?.id === zone.scene.sceneId) dangerZone.executorForm.renderOnScene(zone.scene.sceneId, zone.id, false);
        })

        //hook to ensure that, on executor form render, appropriate field flagging is done
        Hooks.on("dangerZone.updateDanger", (dangers) => {
            dangerZone.log(false, 'Danger update hook...', dangers)
            if(game.user.isActiveGM && canvas.scene?.id) dangerZone.executorForm.renderOnScene(canvas.scene.id, '', false);
        })

        /**
         * Hooks on rendering the scene directory on the right side bar
         */
        Hooks.on("renderSceneDirectory", addDangerButton); 

        Hooks.on("token-says.sayingComplete", (saying) => {
            
             //right now only rolltables generate triggers, so eject if not rolltable
            if(!saying.table?.id || !saying.scene?.id) return

            //build a quasi chat message and pass in the rolltable id as data
            const chatMessage = {
                results: [saying.message],
                speaker: saying.speaker
            };
            const data = {table: saying.table};

            //no blocking for gm only - this hook should only call on a single session
            triggerManager.findChatEvents(chatMessage, "tokenSaysTrigger", data)
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
        if(game.user.isActiveGM) triggerManager.findCombatEvents(combat, 'combatStart', options)
    });

    /**
     * Hook for creating the chat message
     */
    Hooks.on("createChatMessage", async(chatMessage, updates, id) => {

        //right now only rolltables generate triggers, so eject if not rolltable
        const rollTableId = chatMessage?.flags?.core?.RollTable
        if(!rollTableId || !chatMessage.rolls?.length) return

        //trigger manager uses the roll table id
        const data = {rollTableId: rollTableId}

        //activate the trigger manager if this is the gm's session
        if(game.user.isActiveGM) triggerManager.findChatEvents(chatMessage, "createChatMessage", data)
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
        if(game.user.isActiveGM) triggerManager.findCombatEvents(combat, 'deleteCombat', options)
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
        if(!game.user.isActiveGM) return
        if(options.advanceTime || options.direction === 1) triggerManager.findCombatEvents(combat, 'updateCombat', options)
    });

    Hooks.on("updateToken", async (token, update, options, userId) => {
        if (game.user.isActiveGM && ("x" in update || "y" in update || "elevation" in update) && !options.dangerZoneMove && dangerZone.getMovementZonesFromScene(token.parent?.id).length) {
            triggerManager.zoneMovement(token, update)
        }
    });
}
