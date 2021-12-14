import {dangerZone} from "../danger-zone.js";
import {monksActiveTilesOn} from '../index.js';
import {determineMacroList, TILEOCCLUSIONMODES} from './constants.js';
export class DangerZoneDangerFormLastingEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tile.label"),
          id : "danger-zone-danger-lasting-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERLASTINGEFFECT,
          height : "auto",
          width: 425,
          closeOnSubmit: true,
          tabs : [
            {navSelector: ".tabs", contentSelector: "form", initial: "main"}
          ]
        });
      }

    getData(options) {
      return {
        lastingEffect: this.data.lastingEffect,
        macroOps: determineMacroList(),
        monksActiveTiles: this.data.monksActiveTiles,
        monksActiveTilesOnNot: !monksActiveTilesOn,
        occlusionModesOps: TILEOCCLUSIONMODES
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.lastingEffect = expandedData.lastingEffect;
      this.parent.monksActiveTiles = (expandedData.monksActiveTiles && Object.keys(expandedData.monksActiveTiles).length) ? expandedData.monksActiveTiles : {}
    
      if(expandedData.lastingEffect.file){this.eventParent.addClass('active')};
    }
}