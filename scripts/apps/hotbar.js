import {dangerZone} from '../danger-zone.js';
import {toggleMasterButtonActive, dzMActive} from '../index.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {triggerManager} from './trigger-handler.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {DangerZoneForm} from './zone-form.js';

export function addTriggersToHotbar() {
    if(game.user.isGM){
        const scene = game.scenes.find(scene => scene.data.active);
        const id = 'danger-zone-hotbar-trigger';
        $('#ui-middle').find(`#${id}`).remove();
        if(game.user.viewedScene === scene?.id) {
            const html = $('#ui-middle');
            if(!scene?.data?.gridType){return dangerZone.log(false,'No scene navigation when gridless ', {"scene": scene, "nav": html});}
            _setDangerZoneButton(html, scene, id)
        }
    }
}

function _setDangerZoneButton(html, scene, clss) {
    const hasEx = game.settings.get(dangerZone.ID, 'display-executor');
    const zones = dangerZone.getTriggerZonesFromScene(scene.id).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
    if(zones.length) {
        let triggerList = $('<ol>').attr('id', 'danger-zone-hotbar-trigger').addClass(clss);
        let btnWrap = $('<ol>').append($('<li>'));
        let randomSet = 0;
        const hidden = (hasEx ? zones.length : zones.length > 1) ? ' hidden ' : '';
        for (const zn of zones){
            const zoneType = dangerZoneType.getDanger(zn.type)
            if(zoneType){
                if(zn.enabled && zn.trigger === 'manual' && zn.random && !randomSet) {
                    let btn = $('<li>').addClass(`danger-zone-scene-trigger-button .random${hidden}`).append($('<i class="fas fa-radiation-alt"></i>')).data("data-id", {zone: 'random', scene: zn.scene.sceneId}).prop('title', game.i18n.localize("DANGERZONE.scene.random-trigger.label"))
                    btn.click(_handleTriggerClick);
                    btnWrap.prepend(btn);
                    randomSet = 1; 
                } else if(!zn.random || zn.trigger !== 'manual') {
                    let url = `url(${zoneType.icon})`;
                    let btn = $('<li>').addClass(`danger-zone-scene-trigger-button${(zn.enabled && zn.trigger !== 'manual') ? ' active' : ''}${hidden}${zn.scene.dangerId ? ' global-zone' : ''}`).css({"background-image": url}).data("data-id", {zone: zn.id, scene: zn.scene.sceneId, dangerId: zn.scene.dangerId}).prop('title', zn.title + (zn.scene.dangerId ? ' (' + game.i18n.localize("DANGERZONE.type-form.global-zone.label") + ') ' :' ') + game.i18n.localize(DANGERZONETRIGGERS[zn.trigger])+ ' ' + game.i18n.localize("DANGERZONE.scene.trigger"))
                    btn.click(_handleTriggerClick).hover(_showZoneHighlight, _hideZoneHighlight).contextmenu(_contextMenu)
                    btnWrap.append(btn);
                }
            }
        }
        if(hasEx){
            let btn = $('<li>').addClass(`danger-zone-scene-trigger-button${hidden}`).append($('<i class="fas fa-list-alt"></i>')).data("data-id", {scene: scene.id}).prop('title', game.i18n.localize("DANGERZONE.scene.executor.label"))
            btn.click(_executor);
            btnWrap.prepend(btn);
        }
        if(hasEx ? zones.length : zones.length > 1){
            let btn = $('<li>').addClass(`danger-zone-scene-trigger-master`).append($('<i class="fas fa-radiation"></i>')).click(_handleMasterClick)
            if(dzMActive){btn.addClass('active')}
            triggerList.prepend(btn);
        }
        triggerList.append(btnWrap);
        html.append(triggerList);
    }
    dangerZone.log(false,'Update scene navigation ', {"scene": scene, "nav": html, "zones": zones});
}

async function _handleTriggerClick(event) {
    await triggerManager.manualTrigger(event);
}

function _handleMasterClick(event){
    $(event.currentTarget).toggleClass('active')
    toggleMasterButtonActive()
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