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
            boundary: api._boundary,
            tokensInBoundary: api._tokensInBoundary,
            getExecutor: api._getExecutor
        }

        game.modules.get(dangerZone.ID).api = {
            addHighlightZone : api._addHighlightZone,
            destroyHighlightZone : api._destroyHighlightZone,
            triggerZone: api._triggerZone,
            toggleZone: api._toggleZone,
            enableZone: api._enableZone,
            disableZone: api._disableZone,
            boundary: api._boundary,
            tokensInBoundary: api._tokensInBoundary,
            getExecutor: api._getExecutor
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
     * Generate a danger zone rectangle boundary from a Foundary document (supports tokens, ambient lights, walls, drawings, tiles)
     * @param {object} document - a Foundry document (e.g. token document) 
     * @returns a danger zone boundary
     */
    static _boundary(document){
        return boundary.documentBoundary(document.documentName, document);
    }
    
    /**
     * triggers the given zone on the given scene
     * @param {string} zoneName - the zone's title
     * @param {string} sceneId - the scene id. If left blank, defaults to canvas scene
     * @param {object} options - object with options - 
     *                          {activeOnly: , location: , scope: }
     *                          activeOnly {boolean} to only trigger if zone is active; 
     *                          boundary {boundary}: bypass zone location targeting and danger dimensions. A dangerZone boundary defining the target boundary. Create a danger zone boundary from a document by using the dangerZone.boundary() api call
     *                          location {object} {x:,y:,z:} bypasses zone location targeting while keeping danger dimensions. Provide x,y pixel and z elevation for where danger targets (this represents the top left of danger boundary)
     *                          scope {string} limit to trigger only scene zone or global zone. If left blank, will check for both. Options: 'world', 'scene'
     *                          sources {array} an array of token documents that represent zone sources (this overrides and source defined in the zone for purposes of this method)
     *                          targets {array} an array of token documents that will be the targets (overrides any zone targeting)
     */
     static async _triggerZone(zoneName, sceneId, options = {activeOnly: false, scope: '', location: {}, targets: [], sources: [], boundary: {}}){
        if (!game.user.isGM){
            if( game.modules.get("socketlib")?.active && dangerZoneSocket){
                if(game.settings.get(dangerZone.ID, 'open-socket')) {
                    await dangerZoneSocket.executeAsGM("_triggerZone", zoneName, sceneId, options)
                    return
                }
                return console.log("The GM does not allow players to trigger Danger Zones in this world.")
            }
            return console.log("Socketlib module is required in order to run Danger Zone api as a non-GM.");
        } 
        if(!sceneId){sceneId = canvas.scene?.id}
        if(!zoneName) return console.log('Zone name is required');
        let zn; const opts = {}; 
        if(options === true || options === false) opts['activeOnly'] = options;
        if(options.boundary && Object.keys(options.boundary).length) opts['boundary'] = options.boundary;
        if(options.location && Object.keys(options.location).length) opts['location'] = options.location;
        if(options.targets?.length) opts['targets'] = options.targets;
        if(options.sources?.length) opts['sources'] = options.sources;

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

    static async _getExecutor(zoneName, sceneId){
        const zn = dangerZone.getZoneNameFromScene(zoneName, sceneId)
        const ex = await zn.executor()
        return ex
    }
}

export async function _triggerZone(zoneName, sceneId, options){
    await api._triggerZone( zoneName, sceneId, options)
}
