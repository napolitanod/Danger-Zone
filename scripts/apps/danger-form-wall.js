import {dangerZone} from "../danger-zone.js";
import {moveTypes, senseTypes, dirTypes, doorTypes} from './constants.js';

export class DangerZoneDangerFormWall extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.wall.label"),
          id : "danger-zone-danger-wall",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERWALL,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        moveTypes: moveTypes(),
        senseTypes: senseTypes(),
        dirTypes: dirTypes(),
        doorTypes: doorTypes()
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.wall = expandedData;
      if(expandedData.top ||expandedData.left ||expandedData.right ||expandedData.bottom){this.eventParent.addClass('active')};
    }
}