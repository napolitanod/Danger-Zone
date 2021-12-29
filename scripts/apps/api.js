import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {boundary, dangerZoneDimensions} from './dimensions.js';
import {triggerManager} from './trigger-handler.js';
import {dangerZoneSocket} from '../index.js';

export class api {
    static register() {
        api.set();
    }
    
    static settings() {

    }

    static set() {
        window[dangerZone.NAME] = {
            addHighlightZone : api._addHighlightZone,
            destroyHighlightZone : api._destroyHighlightZone,
            triggerZone : api._triggerZone,
            toggleZone: api._toggleZone,
            enableZone: api._enableZone,
            disableZone: api._disableZone,
            tokensInBoundary: api._tokensInBoundary
        }

        game.modules.get(dangerZone.ID).api = {
            addHighlightZone : api._addHighlightZone,
            destroyHighlightZone : api._destroyHighlightZone,
            triggerZone: api._triggerZone,
            toggleZone: api._toggleZone,
            enableZone: api._enableZone,
            disableZone: api._disableZone,
            tokensInBoundary: api._tokensInBoundary
        }
    }

    
    /**
     * Adds the highlight of the zone to the given scene within the highlight layer
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * @param {string} identifier - an identifier that user provides that differentiates this highlight layer from other highlight layers created for this zone
     */
    static async _addHighlightZone(zoneName, sceneId, identifier = ''){
        if(!sceneId){sceneId = canvas.scene?.id}
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        zn ? await dangerZoneDimensions.addHighlightZone(zn.id, sceneId, identifier) : console.log(`A zone with the name provided was not found on scene ${sceneId}`)
    }

    /**
     * Deletes the highlight of the zone from the given scene within the highlight layer
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * @param {string} identifier - an identifier that user provided when highlight was created that differentiates this highlight layer from other highlight layers created for this zone
     */
    static _destroyHighlightZone(zoneName, sceneId, identifier = ''){
        if(!sceneId){sceneId = canvas.scene?.id}
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        zn ? dangerZoneDimensions.destroyHighlightZone(zn.id, identifier) : console.log(`A scene zone with the name provided was not found on scene ${sceneId}`)
    }

    /**
     * toggles the active indicator for the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _toggleZone(zoneName, sceneId) {
        if(!sceneId){sceneId = canvas.scene?.id}
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        zn ? await zn.toggleZoneActive() : console.log(`A zone with the name provided was not found on scene ${sceneId}`)
    }

    /**
     * activates the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _enableZone(zoneName, sceneId){
        if(!sceneId){sceneId = canvas.scene?.id}
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(!zn) return console.log(`A zone with the name provided was not found on scene ${sceneId}`);
        if(zn && !zn.enabled) await zn.toggleZoneActive();
    }

    /**
     * deactivates the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _disableZone(zoneName, sceneId){
        if(!sceneId){sceneId = canvas.scene?.id}
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(!zn) return console.log(`A zone with the name provided was not found on scene ${sceneId}`)
        if(zn.enabled) await zn.toggleZoneActive()
    }

    static _tokensInBoundary(A,B){
        const b = new boundary(A,B);
        return b.tokensIn(canvas.scene.tokens);
    }
    
    /**
     * triggers the given zone on the given scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id. If left blank, defaults to canvas scene
     * @param {object} options - object with options - 
     *                          {activeOnly: , location: , scope: }
     *                          activeOnly {boolean} to only trigger if zone is active; 
     *                          location {object} {x:,y:,z:} bypasses zone targeting. Provide x,y pixel and z elevation for danger to target
     *                          scope {string} limit to trigger only scene zone or global zone. If left blank, will check for both. Options: 'world', 'scene'
     */
     static async _triggerZone(zoneName, sceneId, options = {activeOnly: false, scope: '', location: {}}){
        if (!game.user.isGM){
            if( game.modules.get("socketlib")?.active && dangerZoneSocket){
                if(game.settings.get(dangerZone.ID, 'open-socket')) return dangerZoneSocket.executeAsGM("_triggerZone", zoneName, sceneId, options)
                return console.log("The GM does not allow players to trigger Danger Zones in this world.")
            }
            return console.log("Socketlib module is required in order to run Danger Zone api as a non-GM.");
        } 
        if(!sceneId){sceneId = canvas.scene?.id}
        if(!zoneName) return console.log('Zone name is required');
        let zn; const opts = {}; 
        if(options === true || options === false) opts['activeOnly'] = options;
        if(options.location && Object.keys(options.location).length) opts['location'] = options.location

        if(options.scope !== 'world') zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if (!zn && options.scope !== 'scene') {
            const danger = dangerZoneType.getDangerName(zoneName);
            if(danger){
                zn = dangerZone.getGlobalZone(danger.id, sceneId);
                opts['dangerId'] = zn?.id;
            }
        } 
    
        if(!zn){return console.log(`A zone with the name provided was not found on scene ${sceneId}`)}
        await triggerManager.apiDirectTrigger(zn, sceneId, options);
    }
}

export async function _triggerZone(zoneName, sceneId, options){
    api._triggerZone( zoneName, sceneId, options)
}
