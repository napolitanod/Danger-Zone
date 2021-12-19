import {dangerZone} from "../danger-zone.js";
export class DangerZoneDangerFormForegroundEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.foregroundEffect.label"),
          id : "danger-zone-danger-foreground-effect",
          template : dangerZone.TEMPLATES.DANGERZONEDANGERFOREGROUNDEFFECT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return this.data
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.foregroundEffect = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
    }
}