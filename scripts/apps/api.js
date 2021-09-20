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

    static _addHighlightZone(zoneName, sceneId, identifier){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn){
            dangerZoneDimensions.addHighlightZone(zn.id, sceneId, identifier);
        }
    }

    static _destroyHighlightZone(zoneName, sceneId, identifier){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn){
            dangerZoneDimensions.destroyHighlightZone(zn.id, identifier);
        }
    }

    static async _triggerZone(zoneName, sceneId, restrictToActive = false){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        await triggerManager.apiDirectTrigger(zn, sceneId, restrictToActive);
    }

    static async _toggleZone(zoneName, sceneId) {
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        await zn.toggleZoneActive();
    }

    static async _enableZone(zoneName, sceneId){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(!zn.enabled){
            await zn.toggleZoneActive();
        }
    }

    static async _disableZone(zoneName, sceneId){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId);
        if(zn.enabled){
           await zn.toggleZoneActive();
        }
    }
    
}
