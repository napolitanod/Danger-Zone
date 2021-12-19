import {dangerZone} from "../danger-zone.js";
import {SOURCETREATMENT} from "./constants.js";
export class DangerZoneDangerFormTokenEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenEffect.label"),
          id : "danger-zone-danger-token-effect",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENEFFECT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenEffect = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
    }
}