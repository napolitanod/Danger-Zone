import {dangerZone} from '../danger-zone.js';
import {boundary, dangerZoneDimensions} from './dimensions.js';
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
    static async _addHighlightZone(zoneName, sceneId, identifier){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn){
            await dangerZoneDimensions.addHighlightZone(zn.id, sceneId, identifier);
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
     * @param {object} options - object with options - 
     *                          {activeOnly: , location: }
     *                          activeOnly {boolean} to only trigger if zone is active; 
     *                          location {object} {x:,y:,z:} bypasses zone targeting. Provide x,y pixel and z elevation for danger to target
     */
    static async _triggerZone(zoneName, sceneId, options = {}){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        await triggerManager.apiDirectTrigger(zn, sceneId, options);
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

    static _tokensInBoundary(A,B){
        const b = new boundary(A,B);
        return b.tokensIn(canvas.scene.tokens);
    }
    
}
