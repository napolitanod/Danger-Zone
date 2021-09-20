import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions} from './dimensions.js';
import {triggerManager} from './trigger-handler.js';

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
            disableZone: api._disableZone
        }

        game.modules.get(dangerZone.ID).api = {
            addHighlightZone : api._addHighlightZone,
            destroyHighlightZone : api._destroyHighlightZone,
            triggerZone: api._triggerZone,
            toggleZone: api._toggleZone,
            enableZone: api._enableZone,
            disableZone: api._disableZone
        }
    }

    /**
     * Adds the highlight of the zone to the given scene within the highlight layer
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * @param {string} identifier - an identifier that user provides that differentiates this highlight layer from other highlight layers created for this zone
     */
    static _addHighlightZone(zoneName, sceneId, identifier){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn){
            dangerZoneDimensions.addHighlightZone(zn.id, sceneId, identifier);
        }
    }

    /**
     * Deletes the highlight of the zone from the given scene within the highlight layer
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * @param {string} identifier - an identifier that user provided when highlight was created that differentiates this highlight layer from other highlight layers created for this zone
     */
    static _destroyHighlightZone(zoneName, sceneId, identifier){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn){
            dangerZoneDimensions.destroyHighlightZone(zn.id, identifier);
        }
    }

    /**
     * triggers the given zone on the given scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * @param {boolean} restrictToActive - optional boolean that can be used to restrict the zone trigger only if the zone is active
     */
    static async _triggerZone(zoneName, sceneId, restrictToActive = false){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        await triggerManager.apiDirectTrigger(zn, sceneId, restrictToActive);
    }

    /**
     * toggles the active indicator for the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _toggleZone(zoneName, sceneId) {
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        await zn.toggleZoneActive();
    }

    /**
     * activates the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _enableZone(zoneName, sceneId){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(!zn.enabled){
            await zn.toggleZoneActive();
        }
    }

    /**
     * deactivates the given zone on the scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id
     * */
    static async _disableZone(zoneName, sceneId){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn.enabled){
           await zn.toggleZoneActive();
        }
    }
    
}