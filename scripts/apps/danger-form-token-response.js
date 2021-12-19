import {dangerZone} from "../danger-zone.js";
import {midiQolOn, sequencerOn, tokenSaysOn} from '../index.js';
import {saveTypes, damageTypes, DAMAGEONSAVE, SAVERESULT, SOURCETREATMENT} from "./constants.js";
export class DangerZoneDangerFormTokenResponse extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenResponse.label"),
          id : "danger-zone-danger-token-response",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENRESPONSE,
          classes: ["sheet","danger-part-form"],
          height : "auto",
          width: 425,
          closeOnSubmit: true,
          tabs : [
            {navSelector: ".tabs", contentSelector: "form", initial: "save"}
          ]
        });
      }

    getData(options) {
      return {
        data: this.data,
        damageOps: damageTypes(),
        damageOnSaveOps: DAMAGEONSAVE,
        saveOps: saveTypes(),
        saveResultOps: SAVERESULT,
        sourceOps: SOURCETREATMENT,
        tokenSaysOnNot: !tokenSaysOn, 
        sequencerOnNot: !sequencerOn,
        midiQolOnNot: !midiQolOn
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenResponse = expandedData;
      if(expandedData.save?.enable || expandedData.damage?.enable){this.eventParent.addClass('active')};
    }
}