import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {triggerManager} from './trigger-handler.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {DangerZoneForm} from './zone-form.js';

export function addTriggersToSceneNavigation() {
	if(game.user.isGM && game.user.viewedScene === game.scenes.find(scene => scene.data.active)?.id) {
        const activeNav = $('#scene-list > li.active');
        $('#scene-list > li.danger-zone-scene-trigger').remove();
        const scene = game.scenes.get(activeNav.data('sceneId')); 
        if(!scene?.data?.gridType){return dangerZone.log(false,'No scene navigation when gridless ', {"scene": scene, "nav": activeNav});}
        const zones = dangerZone.getTriggerZonesFromScene(scene.id).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
        if (zones.length) {
            let triggerList = $('<li>').addClass('danger-zone-scene-trigger');
            let randomSet = 0;
            for (const zn of zones){
                const zoneType = dangerZoneType.getDanger(zn.type)
                if(zoneType){
                    if(zn.enabled && zn.trigger === 'manual' && zn.random && !randomSet) {
                        let btn = $('<ol>').addClass(`danger-zone-scene-trigger-button .random`).append($('<i class="fas fa-radiation-alt"></i>')).data("data-id", {zone: 'random', scene: zn.scene.sceneId}).prop('title', game.i18n.localize("DANGERZONE.scene.random-trigger.label"))
                        btn.click(_handleTriggerClick);
                        triggerList.prepend(btn);
                        randomSet = 1; 
                    } else if(!zn.random || zn.trigger !== 'manual') {
                        let url = `url(${zoneType.icon})`;
                        let btn = $('<ol>').addClass(`danger-zone-scene-trigger-button${(zn.enabled && zn.trigger !== 'manual') ? ' active' : ''}${zn.scene.dangerId ? ' global-zone' : ''}`).css({"background-image": url}).data("data-id", {zone: zn.id, scene: zn.scene.sceneId, dangerId: zn.scene.dangerId}).prop('title', zn.title + (zn.scene.dangerId ? ' (' + game.i18n.localize("DANGERZONE.type-form.global-zone.label") + ') ' :' ') + game.i18n.localize(DANGERZONETRIGGERS[zn.trigger])+ ' ' + game.i18n.localize("DANGERZONE.scene.trigger"))
                        btn.click(_handleTriggerClick).hover(_showZoneHighlight, _hideZoneHighlight).contextmenu(_contextMenu)
                        triggerList.append(btn);
                    }
                }
            }
            if(game.settings.get(dangerZone.ID, 'display-executor')){
                let btn = $('<ol>').addClass(`danger-zone-scene-trigger-button`).append($('<i class="fas fa-list-alt"></i>')).data("data-id", {scene: scene.id}).prop('title', game.i18n.localize("DANGERZONE.scene.executor.label"))
                btn.click(_executor);
                triggerList.prepend(btn);
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
    dangerZoneDimensions.addHighlightZone(data.zone, data.scene, '', data.dangerId);
} 

function _hideZoneHighlight(event){
    const data = $(event.currentTarget).data("data-id");
    dangerZoneDimensions.destroyHighlightZone(data.zone, '', data.dangerId);
}

function _contextMenu(event){
    const data = $(event.currentTarget).data("data-id");
    new DangerZoneForm(null, data.zone, data.scene, data.dangerId).render(true);
}

async function _executor(event){
    const data = $(event.currentTarget).data("data-id");
    dangerZone.executorForm.renderOnScene();
}