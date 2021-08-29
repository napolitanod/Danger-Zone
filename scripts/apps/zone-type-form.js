import { dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {DangerZoneTypeActiveEffectForm} from "./active-effect-form.js"
import {sequencerOn,tokenSaysOn, monksActiveTilesOn, warpgateOn, fluidCanvasOn} from '../index.js';

export class DangerZoneTypeForm extends FormApplication {
  constructor(zoneTypeId, ...args) {
    super(...args);
    this.zoneTypeId = zoneTypeId;
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.zone-type-form.form-name"),
      id : "danger-zone-type-form",
      template : dangerZone.TEMPLATES.DANGERZONETYPE,
      width : 800,
      height : "auto",
      closeOnSubmit: true,
      tabs : [
        {navSelector: ".tabs", contentSelector: ".content", initial: ".main"}
      ],
    };
  
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click',"#danger-zone-type-active-effect-edit", this._activeEffectConfig.bind(this))
    html.on('click',"#danger-zone-type-active-effect-delete", this._activeEffectConfirmClear.bind(this))
  }

  async _activeEffectClear() {
    let response = await dangerZoneType.deleteActiveEffect(this.options.zoneTypeId);
    if(response) {
      let info = game.i18n.localize("DANGERZONE.zone-type-form.active-effect.cleared.info") ;
      ui.notifications?.info(info)
      }
  }

  async _activeEffectConfirmClear(event) {
    event.preventDefault();
    new Dialog({
      title: game.i18n.localize("DANGERZONE.type-form.active-effect.clear"),
      content: game.i18n.localize("DANGERZONE.type-form.active-effect.confirm"),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("DANGERZONE.yes"),
          callback: this._activeEffectClear.bind(this)
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("DANGERZONE.cancel")
        }
      },
      default: "no"
    }, {
      width: 400
    }).render(true);
  }

  async _activeEffectConfig(event) {
    event.preventDefault();
    let effectdata = dangerZoneType.getDangerZoneTypeActiveEffect(this.options.zoneTypeId);

    if (!effectdata || !Object.keys(effectdata).length){
      const zoneName = $(event.delegateTarget).find('input[name="name"]').val();
      const icon = $(event.delegateTarget).find('input[name="icon"]').val();
      effectdata = {
        label: zoneName,
        icon: icon,
        changes: [],
        disable: false,
        transfer: false,
        origin: this.options.zoneTypeId
      }
    }

    if (
      !hasProperty(effectdata, `flags.${dangerZone.ID}.${dangerZone.ID}.${dangerZone.FLAGS.ZONETYPE}`)) {
      setProperty(effectdata, `flags.${dangerZone.ID}.${dangerZone.FLAGS.ZONETYPE}`, this.options.zoneTypeId);
    } 
    
    const effect = {
      documentName: "ActiveEffect",
      data: effectdata,
      testUserPermission: (...args) => { return true},
      parent: {documentName: "Actor"},
      apps: {},
      isOwner: true
    }
    new DangerZoneTypeActiveEffectForm(effect).render(true);
  }

  _determineTokenSaysTypes() {
    return {
      "audio":  "DANGERZONE.type-form.token-says.rule-type-option.playlist",
      "rollTable":  "DANGERZONE.type-form.token-says.rule-type-option.roll-table"
    }
  }

  _determineFluidCanvasTypes() {
    return {
      "black":"Black",
      "blur":"Blur",
      "drug":"Drug",
      "earthquake":"Earthquake",
      "heartbeat":"Heart Beat",
      "negative":"Negative",
      "sepia":"Sepia",
      "spin":"Spin"
    }
  }

  _determineMacroList() {
    let list = {};
    for (let macro of game.macros.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
      list[macro.id] = macro.name;
    }
    return list;
  }

  getData(options){
    let instance;

    if(!this.zoneTypeId){
      instance = new dangerZoneType;
    } else {
      instance = dangerZoneType.getDangerZoneType(this.zoneTypeId)
    }

    const dataToSend =  {
      zone: instance,
      fluidCanvasOps: this._determineFluidCanvasTypes(),
      tokenSaysOps: this._determineTokenSaysTypes(),
      macroOps: this._determineMacroList(),
      tokenSaysOnNot: !tokenSaysOn, 
      monksActiveTilesOnNot: !monksActiveTilesOn,
      sequencerOnNot: !sequencerOn,
      warpgateOnNot: !warpgateOn, 
      fluidCanvasOnNot: !fluidCanvasOn
    } 
    return dataToSend
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData); 
    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
    dangerZone.DangerZoneTypesForm.refresh();
  }

}
