import {dangerZone} from "../danger-zone.js";
import {animationTypes} from "./constants.js";

export class DangerZoneDangerFormLight extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.light.label"),
          id : "danger-zone-danger-light",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERLIGHT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        lightAnimations: animationTypes()
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.light = expandedData;
      if(expandedData.dim || expandedData.bright){this.eventParent.addClass('active')};
    }
}