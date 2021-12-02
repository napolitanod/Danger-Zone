import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {DangerZoneForm} from './zone-form.js';

export class DangerZoneSceneForm extends FormApplication {
  constructor(app, sceneId, ...args) {
      super(...args);
      this.parent = app,
      this.sceneId = sceneId
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.scene.header.name"),
      id : "danger-zone-scene",
      template : dangerZone.TEMPLATES.DANGERZONESCENE,
      width : 800,
      height : "auto",
      closeOnSubmit: false,
      submitOnChange: true, 
      tabs:[]
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const zoneId = clickedElement.parents('[data-id]')?.data()?.id;

    switch (action) {
      case 'add': {
          new DangerZoneForm(this, '', this.sceneId).render(true);
          this.refresh();
          break;
      }
      case 'edit': {
        new DangerZoneForm(this, zoneId, this.sceneId).render(true);
        break;
      }
      case 'delete': {
        new Dialog({
          title: game.i18n.localize("DANGERZONE.types-form.clear"),
          content: game.i18n.localize("DANGERZONE.types-form.confirm"),
          buttons: {
            yes: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize("DANGERZONE.yes"),
              callback: async () => {
                await dangerZone.deleteZoneFromScene(zoneId, this.sceneId)
                this.refresh();
              }
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize("DANGERZONE.cancel")
            }
          },
          default: "no"
        }, {
          width: 400
        }).render(true);
        break;
      }
      default:
        dangerZone.log(false, 'Invalid action detected', action);
    }
  }

  refresh() {
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('mouseenter', ".scene-config .danger-zone-details", this._showZoneHighlight.bind(this));
    html.on('mouseleave', ".scene-config .danger-zone-details", this._hideZoneHighlight.bind(this));
   }

  getData(options){
    const zonesInit = dangerZone.getAllZonesFromScene(this.sceneId);
    const dangerZones = [];
    if(zonesInit.size){
        const zones = Array.from(zonesInit, ([name, value]) => (value)).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)});
        zonesInit.forEach(function(zn) {
            let typeDisplay = '';
            const zoneType = dangerZoneType.getDangerZoneType(zn.type);
            if(zoneType) {typeDisplay = zoneType.name}
            dangerZones.push({
                id: zn.id,
                icon: zoneType.icon,
                title: zn.title, 
                trigger: game.i18n.localize(DANGERZONETRIGGERS[zn.trigger]),
                typeDisplay: typeDisplay, 
                random: zn.random
            })
        });
    }
    return {
        dangerZones: dangerZones.sort((a, b) => a.title.localeCompare(b.title)),
        sceneId: this.sceneId
    }
  }

  async _updateObject(event, formData) {
    return
  }

  _showZoneHighlight(event){
    const hov = $(event.currentTarget);
    const zoneId = hov.parents('[data-id]')?.data()?.id;
    if(zoneId && this.sceneId === canvas.scene.id){
        dangerZoneDimensions.addHighlightZone(zoneId, this.sceneId);
      }
  } 

  _hideZoneHighlight(event){
    const hov = $(event.currentTarget);
    const zoneId = hov.parents('[data-id]')?.data()?.id;
      if(zoneId && this.sceneId === canvas.scene.id){
          dangerZoneDimensions.destroyHighlightZone(zoneId);
      }
  }
}