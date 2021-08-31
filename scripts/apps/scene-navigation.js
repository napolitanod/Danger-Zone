import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {triggerManager, DANGERZONETRIGGERS} from './trigger-handler.js';
import {DangerZoneForm} from './zone-form.js';

export function addTriggersToSceneNavigation(app, html, options) {
	if(game.user.isGM && game.user.viewedScene === game.scenes.find(scene => scene.data.active)?.id) {
        let activeNav = $('#scene-list > li.active', html);
        let scene = game.scenes.get(activeNav.data('sceneId')); 
        if(!scene?.data?.gridType){return dangerZone.log(false,'No scene navigation when gridless ', {"scene": scene, "nav": activeNav});}
        let zones = dangerZone.getTriggerZonesFromScene(scene.id);
        if (zones.size) {
            let triggerList = $('<li>').addClass('danger-zone-scene-trigger');
            let randomSet = 0;
            for (const [id, zn] of zones) {
                const zoneType = dangerZoneType.getDangerZoneType(zn.type)
                if(zoneType){
                    let active = ''; 
                    if(zn.enabled && zn.trigger !== 'manual'){
                        active = ' active '
                    } 
                    if(zn.enabled && zn.random && !randomSet) {
                        let btn = $('<div>').addClass(`danger-zone-scene-trigger-button .random`).append($('<i class="fas fa-radiation"></i>')).data("data-id", {zone: 'random', scene: zn.scene.sceneId}).prop('title', game.i18n.localize("DANGERZONE.scene.random-trigger.label"))
                        btn.click(_handleTriggerClick);
                        triggerList.prepend(btn);
                        randomSet = 1; 
                    } else if(!zn.random) {
                        let url = `url(${zoneType.icon})`;
                        let btn = $('<div>').addClass(`danger-zone-scene-trigger-button${active}`).css({"background-image": url}).data("data-id", {zone: id, scene: zn.scene.sceneId}).prop('title', zn.title + ' ' + game.i18n.localize(DANGERZONETRIGGERS[zn.trigger])+ ' ' + game.i18n.localize("DANGERZONE.scene.trigger"))
                        btn.click(_handleTriggerClick).hover(_showZoneHighlight, _hideZoneHighlight).contextmenu(_contextMenu)
                        triggerList.append(btn);
                    }
                }
            }
            triggerList.insertAfter(activeNav);
        }
        dangerZone.log(false,'Update scene navigation ', {"scene": scene, "nav": activeNav, "zones": zones});
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