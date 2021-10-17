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
        const clss = 'danger-zone-hotbar-trigger';
        $('#hotbar').find(`.${clss}`).remove();
        if(game.user.viewedScene === scene?.id) {
            const html = $('#action-bar');
            if(!scene?.data?.gridType){return dangerZone.log(false,'No scene navigation when gridless ', {"scene": scene, "nav": html});}
            _setDangerZoneButton(html, scene, clss)
        }
    }
}

function _setDangerZoneButton(html, scene, clss) {
    const zonesInit = dangerZone.getTriggerZonesFromScene(scene.id);

    if(zonesInit.size) {
        const zones = Array.from(zonesInit, ([name, value]) => (value)).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
        let triggerList = $('<ol>').addClass(clss);
        
        let randomSet = 0;
        const hidden = zonesInit.size > 1 ? ' hidden ' : '';
        for (let i = 0; i < zones.length; i++){
            let zn = zones[i];
            const zoneType = dangerZoneType.getDangerZoneType(zn.type)
            if(zoneType){
                let active = ''; 
                if(zn.enabled && zn.trigger !== 'manual'){
                    active = ' active '
                } 
                if(zn.enabled && zn.trigger === 'manual' && zn.random && !randomSet) {
                    let btn = $('<li>').addClass(`danger-zone-scene-trigger-button .random${hidden}`).append($('<i class="fas fa-radiation-alt"></i>')).data("data-id", {zone: 'random', scene: zn.scene.sceneId}).prop('title', game.i18n.localize("DANGERZONE.scene.random-trigger.label"))
                    btn.click(_handleTriggerClick);
                    triggerList.prepend(btn);
                    randomSet = 1; 
                } else if(!zn.random || zn.trigger !== 'manual') {
                    let url = `url(${zoneType.icon})`;
                    let btn = $('<li>').addClass(`danger-zone-scene-trigger-button${active}${hidden}`).css({"background-image": url}).data("data-id", {zone: zn.id, scene: zn.scene.sceneId}).prop('title', zn.title + ' ' + game.i18n.localize(DANGERZONETRIGGERS[zn.trigger])+ ' ' + game.i18n.localize("DANGERZONE.scene.trigger"))
                    btn.click(_handleTriggerClick).hover(_showZoneHighlight, _hideZoneHighlight).contextmenu(_contextMenu)
                    triggerList.append(btn);
                }
            }
        }
        if(zonesInit.size > 1){
            let btn = $('<li>').addClass(`danger-zone-scene-trigger-master`).append($('<i class="fas fa-radiation"></i>')).click(_handleMasterClick)
            if(dzMActive){btn.addClass('active')}
            triggerList.prepend(btn);
        }
        triggerList.insertAfter(html);
    }
    dangerZone.log(false,'Update scene navigation ', {"scene": scene, "nav": html, "zones": zonesInit});
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