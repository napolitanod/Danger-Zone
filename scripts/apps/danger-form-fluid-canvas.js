import {dangerZone} from "../danger-zone.js";
import {FLUIDCANVASTYPES} from "./constants.js";
export class DangerZoneDangerFormFluidCanvas extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.fluidCanvas.label"),
          id : "danger-zone-danger-fluid-canvas",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERFLUIDCANVAS,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        fluidCanvasOps: FLUIDCANVASTYPES
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.fluidCanvas = expandedData;
      if(expandedData.type){this.eventParent.addClass('active')};
    }
}