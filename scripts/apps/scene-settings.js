import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {DangerZoneForm} from './zone-form.js';
export function initializeScene(app, html, options) {
    if(!app.object?.data?.gridType){return dangerZone.log(false,'No Danger Zone Scene List When Gridless ', {app, html, options})};
    //location
    let weatherParent = $('select[name="weather"]', html).parent();
    if(!weatherParent){return}
    
    //elements
    let label = $('<legend>').append($('<i>').addClass("fas fa-radiation")).append($('<span>').text(game.i18n.localize("DANGERZONE.scene.label")));
    let header = $('<div>').addClass("flexrow danger-zone-scene-header");
    let details = $('<div>').addClass("danger-zone-details flexrow").append(
            $('<div>').addClass("title").text(game.i18n.localize("DANGERZONE.scene.title"))
        ).append(
            $('<div>').addClass("type").text(game.i18n.localize("DANGERZONE.scene.type"))
        ).append(
            $('<div>').addClass("trigger").text(game.i18n.localize("DANGERZONE.scene.trigger"))
        ).append(
            $('<div>').addClass("random").text(game.i18n.localize("DANGERZONE.scene.random"))
        );
    let controls = $('<div>').addClass("danger-zone-controls").attr("data-id", app.document.id);
    let addSection = $('<a>').addClass("danger-zone-add").attr("title", game.i18n.localize("DANGERZONE.scene.add-danger-zone"));
    let icon = $('<i>').addClass("fas fa-plus");
    let notes = $('<p>').addClass("notes").text(game.i18n.localize("DANGERZONE.scene.description"));

    //dynamic list
    let list = _setList(app, html, options);

    //build and append
    addSection.append(icon).append(game.i18n.localize("DANGERZONE.add")).click((event) => {event.preventDefault();_handleAddClick(event, app)});
    controls.append(addSection);
    header.append(details).append(controls);
    $('<fieldset>').addClass('danger-zone-scene').append(label).append($('<div>').addClass('form-group').append(header).append(list).append(notes)).insertAfter(weatherParent);
}

function _setList (app, html, options) {
    const list = $('<ol>').addClass("danger-zone-scene-list flexrow");
    const scene = app.object;
    const zonesInit = dangerZone.getAllZonesFromScene(scene.id);
    if(zonesInit.size){
        const zones = Array.from(zonesInit, ([name, value]) => (value)).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
        for (let i = 0; i < zones.length; i++){
            let zn = zones[i];
            let typeDisplay = '', randomIcn = ''; 
            const zoneType = dangerZoneType.getDangerZoneType(zn.type);
            if(zoneType) {typeDisplay = zoneType.name}
            if(zn.random){randomIcn = '<i class="fas fa-radiation"></i>'}
            let row = $('<li>').addClass('flexrow scene-config');
            let title = $('<div>').addClass('title').text(zn.title);
            let type = $('<div>').addClass('type').text(typeDisplay);
            let trigger = $('<div>').addClass('trigger').text(game.i18n.localize(DANGERZONETRIGGERS[zn.trigger]));
            let random = $('<div>').addClass('random').append($(randomIcn));
            let editSection = $('<a>').addClass("danger-zone-edit").attr("title", game.i18n.localize("DANGERZONE.scene.edit-danger-zone")).append($('<i>').addClass("fas fa-edit")).append($('<span>').html('&nbsp;&nbsp;&nbsp;')).click((event) => {event.preventDefault(); _handleEditClick(event, app)});
            let deleteSection = $('<a>').addClass("danger-zone-delete").attr("title", game.i18n.localize("DANGERZONE.scene.delete-danger-zone")).append($('<i>').addClass("fas fa-trash")).click(_handleDeleteClick);
            let details = $('<div>').data("data-id", {"zone": zn.id, "scene": scene.id}).addClass("danger-zone-details flexrow").hover(_showZoneHighlight, _hideZoneHighlight).append(title).append(type).append(trigger).append(random); 
            let controls = $('<div>').data("data-id", {"zone": zn.id, "scene": scene.id}).addClass("danger-zone-controls").append(editSection).append(deleteSection);
            row.append(details).append(controls);
            list.append(row);
        }
    }
    dangerZone.log(false,'Danger Zone Scene List Built ', {app, html, options, "list": list});
    return list
}

async function _handleAddClick(event, app) {
    const sceneId = $(event.currentTarget).parents('[data-id]')?.data()?.id;
    new DangerZoneForm(app, '', sceneId).render(true);
}

async function _handleEditClick(event, app) {
    const ids = $(event.currentTarget).parent().data("data-id");
    new DangerZoneForm(app, ids.zone, ids.scene).render(true);
}

async function _handleDeleteClick(event) {
    const ids = $(event.currentTarget).parent().data("data-id");
    return await dangerZone.deleteZoneFromScene(ids.zone, ids.scene)
}

function _showZoneHighlight(event){
    const data = $(event.currentTarget).data("data-id");
    if(data.scene === canvas.scene.id){
        dangerZoneDimensions.addHighlightZone(data.zone, data.scene);
    }
} 

function _hideZoneHighlight(event){
    const data = $(event.currentTarget).data("data-id");
    if(data.scene === canvas.scene.id){
        dangerZoneDimensions.destroyHighlightZone(data.zone);
    }
}

