import {dangerZone} from "../danger-zone.js";
import {VERTICALMOVEMENT, HORIZONTALMOVEMENT, ELEVATIONMOVEMENT, SOURCETREATMENT, WALLSBLOCK, TILESBLOCK} from "./constants.js";
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
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENMOVE,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return{
        data: this.data,
        elevationTypeOps: ELEVATIONMOVEMENT,
        horizontalDirOps: HORIZONTALMOVEMENT,
        tilesBlockOps: TILESBLOCK,
        wallsBlockOps: WALLSBLOCK,
        verticalDirOps: VERTICALMOVEMENT,
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenMove = expandedData;
      if(expandedData.v.dir || expandedData.hz.dir || expandedData.e.type || expandedData.sToT){this.eventParent.addClass('active')};
    }
}