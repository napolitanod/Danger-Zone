import {dangerZone} from "../danger-zone.js";
import {TOKENSAYSTYPES, SOURCETREATMENT} from "./constants.js";
export class DangerZoneDangerFormTokenSays extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenSays.label"),
          id : "danger-zone-danger-token-says",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENSAYS,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        tokenSaysOps: TOKENSAYSTYPES,
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenSays = expandedData;
      if(expandedData.fileType){this.eventParent.addClass('active')};
    }
}