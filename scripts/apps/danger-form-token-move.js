import {dangerZone} from "../danger-zone.js";
import {VERTICALMOVEMENT, HORIZONTALMOVEMENT} from "./constants.js";
export class DangerZoneDangerFormTokenMove extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenMove.label"),
          id : "danger-zone-danger-token-effect",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENMOVE,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return{
        data: this.data,
        horizontalDirOps: HORIZONTALMOVEMENT,
        verticalDirOps: VERTICALMOVEMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenMove = expandedData;
      if(expandedData.v.dir || expandedData.hz.dir){this.eventParent.addClass('active')};
    }
}