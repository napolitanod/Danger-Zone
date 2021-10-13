import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {triggerManager} from './trigger-handler.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {DangerZoneForm} from './zone-form.js';

export function addTriggersToSceneNavigation(app, html, options) {
	if(game.user.isGM && game.user.viewedScene === game.scenes.find(scene => scene.data.active)?.id) {
        const activeNav = $('#scene-list > li.active', html);
        const scene = game.scenes.get(activeNav.data('sceneId')); 
        if(!scene?.data?.gridType){return dangerZone.log(false,'No scene navigation when gridless ', {"scene": scene, "nav": activeNav});}
        const zonesInit = dangerZone.getTriggerZonesFromScene(scene.id);
        if (zonesInit.size) {
            const zones = Array.from(zonesInit, ([name, value]) => (value)).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
            let triggerList = $('<li>').addClass('danger-zone-scene-trigger');
            let randomSet = 0;
            for (let i = 0; i < zones.length; i++){
                let zn = zones[i];
                const zoneType = dangerZoneType.getDangerZoneType(zn.type)
                if(zoneType){
                    let active = ''; 
                    if(zn.enabled && zn.trigger !== 'manual'){
                        active = ' active '
                    } 
                    if(zn.enabled && zn.trigger === 'manual' && zn.random && !randomSet) {
                        let btn = $('<div>').addClass(`danger-zone-scene-trigger-button .random`).append($('<i class="fas fa-radiation"></i>')).data("data-id", {zone: 'random', scene: zn.scene.sceneId}).prop('title', game.i18n.localize("DANGERZONE.scene.random-trigger.label"))
                        btn.click(_handleTriggerClick);
                        triggerList.prepend(btn);
                        randomSet = 1; 
                    } else if(!zn.random || zn.trigger !== 'manual') {
                        let url = `url(${zoneType.icon})`;
                        let btn = $('<div>').addClass(`danger-zone-scene-trigger-button${active}`).css({"background-image": url}).data("data-id", {zone: zn.id, scene: zn.scene.sceneId}).prop('title', zn.title + ' ' + game.i18n.localize(DANGERZONETRIGGERS[zn.trigger])+ ' ' + game.i18n.localize("DANGERZONE.scene.trigger"))
                        btn.click(_handleTriggerClick).hover(_showZoneHighlight, _hideZoneHighlight).contextmenu(_contextMenu)
                        triggerList.append(btn);
                    }
                }
            }
            triggerList.insertAfter(activeNav);
        }
        dangerZone.log(false,'Update scene navigation ', {"scene": scene, "nav": activeNav, "zones": zonesInit});
    }
}

async function _handleTriggerClick(event) {
    await triggerManager.manualTrigger(event);
}

function _showZoneHighlight(event){
    const data = $(event.currentTarget).data("data-id");
    dangerZoneDimensions.addHighlightZone(data.zone, data.scene);
} 

function _hideZoneHighlight(event){
    const data = $(event.currentTarget).data("data-id");
    dangerZoneDimensions.destroyHighlightZone(data.zone);
}

function _contextMenu(event){
    const data = $(event.currentTarget).data("data-id");
    new DangerZoneForm(null, data.zone, data.scene).render(true);
}