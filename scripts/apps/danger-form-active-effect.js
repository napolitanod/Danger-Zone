import {dangerZone} from "../danger-zone.js";
import {timesUpOn, daeOn} from "../index.js";
import {DangerZoneTypeActiveEffectForm} from "./active-effect-form.js";
import {SOURCETREATMENT, TIMESUPMACROREPEAT} from "./constants.js";
export class DangerZoneDangerFormActiveEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.active-effect.label"),
          id : "danger-zone-danger-form-active-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERACTIVEEFFECT,
          height : "auto",
          width: 375,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        origin: this.parent.zoneTypeId,
        sourceOps: SOURCETREATMENT,
        timesUpOn: daeOn ? timesUpOn : false,
        macroRepeatOps: TIMESUPMACROREPEAT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    async _handleButtonClick(event) {
      const clickedElement = $(event.currentTarget);
      const action = clickedElement.data().action;
      const parent =  clickedElement.parents('[data-id]');
  
      switch (action) {
        case 'edit': {
          event.preventDefault();
          this._activeEffectConfig(event, parent)
          break;
        }
      }
    }

    async _activeEffectConfig(event, eventParent) {
      if (!this.data.hasOwnProperty('label')){
        const zoneName = $(this.parent.form).find('input[name="name"]').val();
        const icon = $(this.parent.form).find('input[name="icon"]').val();
        this.data = {
          label: zoneName,
          icon: icon,
          changes: [],
          disabled: false,
          transfer: false,
          origin: this.parent.zoneTypeId
        }
      }
  
      const effect = {
        documentName: "ActiveEffect",
        data: this.data,
        testUserPermission: (...args) => { return true},
        parent: {documentName: "Actor"},
        apps: {},
        isOwner: true
      }
      new DangerZoneTypeActiveEffectForm(this, eventParent, this.parent.zoneTypeId, effect).render(true);
    }

    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.data = Object.assign(this.data, expandedData);
      this.parent.effect = this.data;
      this.eventParent.addClass('active');
    }
}