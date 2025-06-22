import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {actorOps, DAMAGEONSAVE, damageTypes, DANGERZONEPARTS, DANGERZONECONFIG, DANGERZONEFORMOPTIONS, DANGERZONELIGHTREPLACE, DANGERZONEREPLACE, DANGERZONEREGIONREPLACE, DANGERZONESOUNDREPLACE, DANGERZONEWEATHERREPLACE, TRIGGEROPERATION, DANGERZONEWALLREPLACE,determineMacroList, determineMacroListUuid,  REGIONSHAPETYPEOPTIONS, getCompendiumOps,  regionEvents, REGIONVISIBILITY, SAVERESULT, saveTypes, SOURCEAREATARGET, SOURCEAREAGLOBALZONE, STRETCH, TILEOCCLUSIONMODES, TIMESUPMACROREPEAT, TOKENDISPOSITION, TOKENSAYSTYPES, weatherTypes, weatherParameters, WORLDZONE} from './constants.js';
import {getEventData, stringToObj} from './helpers.js';

/**v13
 * The main danger form from which danger part forms are launched. Used to configure a danger.
 */
export class DangerForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(dangerId, parent, ...args) {
    super(...args);
    this.parent = parent,
    this._data = {},
    this.effect,
    this.system,
    this.globalZone = {},
    this.lastingEffect,
    this.monksActiveTiles,
    this.mutate,
    this.region,
    this.tokenResponse = {},
    this.tokenSays = {},
    this.warpgate = {},
    this.weather = {},
    this.dangerId = dangerId;
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.DANGER,
    actions: {
      'delete': DangerForm.#delete,
      'edit': DangerForm.#edit
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: DangerForm.#onSubmit
    },
    position: {
      width : 600
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-type-form", "sheet"],
      title : DANGERZONECONFIG.LABEL.DANGER,
      icon: DANGERZONECONFIG.ICON.DANGER
    }
  };

  /** @override */
  static PARTS = {
    body: {
      classes: ["standard-form"],
      template: DANGERZONECONFIG.TEMPLATE.DANGERCONFIG, 
      scrollable: [""]
    },
    footer: {
      template: DANGERZONECONFIG.TEMPLATE.FOOTER
    }
  };

  /** @override */
  static TABS = {};

  /** @override */
  async _prepareContext() {
    const instance = this.dangerId ? dangerZoneType.getDanger(this.dangerId) : new dangerZoneType  
    const has = {}
    DANGERZONEPARTS.forEach((part, key, map)=> {
      this._data[key] = instance.options[key] ?? {};
      has[key] =  this.#isActive(key, this._data[key]) ? true : false;
    })
    

    this.effect = instance.options.effect;
    this.globalZone = instance.options.globalZone ?? {};
    this.lastingEffect = instance.options.lastingEffect;
    this.monksActiveTiles = instance.options.flags?.['monks-active-tiles'] ? instance.options.flags['monks-active-tiles'] : {};
    this.mutate = instance.options.flags?.mutate ? instance.options.flags.mutate : {};
    this.region = instance.options.region;
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
    this.tokenResponse = instance.options.flags?.tokenResponse ? instance.options.flags.tokenResponse : {};
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
    this.warpgate = instance.options.flags.warpgate ? instance.options.flags.warpgate : {};
    this.weather = instance.options.flags.weather ? instance.options.flags.weather : {};

    const dataToSend =  {
      danger: instance,
      has: has,
      migration: dangerZone.MIGRATION.DANGER,
      macroOps: determineMacroList(),
      hasActiveEffect: Object.keys(this.effect).length ? true : false,
      hasGlobalZone: Object.keys(this.globalZone).length && this.globalZone?.enabled ? true : false,
      hasLastingEffect: this.lastingEffect?.file ? true : false,
      hasMutate: this.mutate?.permanent,
      hasRegion: this.region?.active ? true : false,
      hasTokenResponse: (this.tokenResponse?.save?.enable || this.tokenResponse?.damage?.enable) ? true : false,
      hasTokenSays: this.tokenSays?.fileType ? true : false,
      hasWarpgate: this.warpgate?.actor ? true : false,
      hasWeather: this.weather.type ? true : false,
      activeEffectOnNot: !dangerZone.MODULES.activeEffectOn,
      tokenSaysOnNot: !dangerZone.MODULES.tokenSaysOn, 
      sequencerOnNot: !dangerZone.MODULES.sequencerOn,
      taggerOnNot: !dangerZone.MODULES.taggerOn,
      tokenResponseOnNot: Object.keys(saveTypes()).length ? false : true,
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save" }],
      icons: DANGERZONECONFIG.ICON,
      labels: DANGERZONECONFIG.LABEL,
      modules: dangerZone.MODULES
    } 
    
    dangerZone.log(false, 'Danger Form Rendered', this);
    return dataToSend
  }

  /*******           custom            ********/

  /**         STATIC PRIVATE METHODS         **/

  static #dynamicDangerPartClass(partID) {
    return DANGERZONECONFIG.CLASSES.DANGERPART[partID];
  }

  static #dynamicDangerPart(partID, options) {
    const formClass = DangerForm.#dynamicDangerPartClass(partID) // Get the ClassOne class
    return new formClass(options)
  }

  /**v13
   * Edit a danger part.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #edit(event) {
    event.preventDefault();
    const data = getEventData(event)
    const options = {
      partId: data.parentId,
      parentApp: this, 
      parentHtml: data.parent, 
      data: this._data[data.parentId]
    }
    switch(options.partId){
      case 'active-effect':
        new DangerZoneDangerFormActiveEffect(this, data.parent, this.effect).render(true);
        break;
      case 'global-zone':
        new DangerZoneDangerFormGlobalZone(this, data.parent, this.globalZone).render(true);
        break;
      case 'lasting-effect':
        new DangerZoneDangerFormLastingEffect(this, data.parent, {lastingEffect: this.lastingEffect, monksActiveTiles: this.monksActiveTiles}).render(true);
        break;
      case 'mutate':
        new DangerZoneDangerFormMutate(this, data.parent, this.mutate).render(true);
        break;
      case 'region':
        new DangerZoneDangerFormRegion(this, data.parent, this.region).render(true);
        break;
      case 'token-response':
        new DangerZoneDangerFormTokenResponse(this, data.parent, this.tokenResponse).render(true);
        break;
      case 'token-says':
        new DangerZoneDangerFormTokenSays(this, data.parent, this.tokenSays).render(true);
        break;
      case 'warpgate':
        new DangerZoneDangerFormWarpgate(this, data.parent, this.warpgate).render(true);
        break;
      case 'weather':
        new DangerZoneDangerFormWeather(this, data.parent, this.weather).render(true);
        break;
      default: 
        DangerForm.#dynamicDangerPart(options.partId, options).render(true)
    }
  }

  /**v13
   * Delete a danger part.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #delete(event) {
    event.preventDefault();
    const data = getEventData(event)
  
    const choice = await foundry.applications.api.DialogV2.confirm({
      content: `${game.i18n.localize("DANGERZONE.type-form.clear")} ${data.label}?`,
      rejectClose: false,
      modal: true
    });
    if(!choice) return

    const danger = new dangerZoneType;
    switch(data.parentId){
      case 'active-effect':
        this.effect = {};
        break;
      case 'global-zone':
        this.globalZone = {};
        break;
      case 'lasting-effect':
        this.lastingEffect = Object.assign(this.lastingEffect, danger.options.lastingEffect)
        this.monksActiveTiles = {}
        break;
      case 'mutate':
        this.mutate = {}
        break;
      case 'region':
        this.region = Object.assign(this.region, danger.options.region)
        break;
      case 'token-response':
        this.tokenResponse = {}
        break;
      case 'token-says':
        this.tokenSays = {}
        break;
      case 'warpgate':
        this.warpgate = {}
        break;
      case 'weather':
        this.weather = {}
        break;
      default:
        this._data[data.parentId] = Object.assign(this._data[data.parentId], danger.options[data.parentId])
    }
    data.parent.classList.remove('active')
    ui.notifications?.info(`${data.label} ${game.i18n.localize("DANGERZONE.type-form.cleared.info")}`);
  }

  /**v13
   * Save the changes to the danger.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object);
    expandedData.options = this._data 

    expandedData.options.effect = this.effect; 
    expandedData.options.globalZone = this.globalZone;
    expandedData.options.lastingEffect = this.lastingEffect;
    expandedData.options.region = this.region;
    //set integrations
    expandedData.options['flags']={};
    if(Object.keys(this.monksActiveTiles).length) {expandedData.options.flags['monks-active-tiles'] = this.monksActiveTiles}
    if(Object.keys(this.tokenResponse).length) {expandedData.options.flags['tokenResponse'] = this.tokenResponse}
    if(Object.keys(this.tokenSays).length) {expandedData.options.flags['tokenSays'] = this.tokenSays}
    if(Object.keys(this.mutate).length) {expandedData.options.flags['mutate'] = this.mutate}
    if(Object.keys(this.warpgate).length) {expandedData.options.flags['warpgate'] = this.warpgate}
    if(Object.keys(this.weather).length) {expandedData.options.flags['weather'] = this.weather}

    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
    this.parent.refresh();
  }

  #isActive(partId, part){
    switch(partId){
      case 'active-effect':
        break;
      case 'audio': 
      case 'backgroundEffect':
      case 'foregroundEffect':
      case 'sound':
      case 'sourceEffect':
      case 'tokenEffect':
        return part.file ? true : false
      case 'combat': return (part.targets.add || part.source.add || part.spawn || part.new || part.initiative.type || part.start) ? true : false
      case 'canvas': return (part.effect.type || part.pan.active) 
      case 'global-zone':
        break;
      case 'item': 
      case 'rolltable':
        return  part.name?.length ? true : false
      case 'lasting-effect':
        break;
      case 'ambientLight': return (part.dim || part.bright) ? true : false
      case 'mutate':
        break;
      case 'region':
        break;
      case 'scene': return part.active ? true : false
      case 'tokenMove': return (part.v.dir || part.hz.dir || part.e.type || part.sToT) ? true : false
      case 'token-response':
        break;
      case 'token-says':
        break;
      case 'wall': return (part.top || part.bottom || part.left || part.right) ? true : false
      case 'warpgate':
        break;
      case 'weather':
        break;
    }
  }

  /**         PUBLIC METHODS         **/
  updatePart(partId, updateData, html){
    this._data[partId] = updateData;
    this.#isActive(partId, updateData) ? html.classList.add('active') : html.classList.remove('active');
  }
}


/**v13
 * Configures the audio danger part
 * options: (object) {
 *  partId: partId     //the common key used for this danger part
 *  parentApp: parentApp    //the parent form that this form launched from
 *  parentHtml: eventParent     //the parent html within the parent form 
 *  data: data  //data for the part
 * }
 */
export class DangerPartConfig extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(_data = {}, ...args) {
      super(...args);
      this.#data = _data;
  }

   static #partId = '_default';
  
   #data;

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.DANGERPART[DangerPartConfig.#partId],
    actions: {
      'random': DangerPartConfig.#random
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: this.#onSubmit
    },
    position: {
      width : 550
    },
    tag: "form",
    window: {
      contentClasses: ["danger-part-form", "sheet"],
      title : DANGERZONECONFIG.LABEL.DANGERPART[DangerPartConfig.#partId],
      icon: DANGERZONECONFIG.ICON.DANGERPART[DangerPartConfig.#partId]
    }
  };

  /** @override */
  static PARTS = {};

  /** @override */
  static TABS = {};

   /** @override */
  async _prepareContext() {
    return {
      compendiums: {
        ITEM: getCompendiumOps('item')
      },
      data: this.data,
      icons: DANGERZONECONFIG.ICON,
      modules: dangerZone.MODULES,
      options: DANGERZONEFORMOPTIONS,
      random: DANGERZONECONFIG.RANDOM,
      tabs: this._prepareTabs("sheet"),
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save" }]
    }
  }

  /*******          custom             ********/

  /**         GETTERS         **/
  get data() {
    return this.#data.data
  }

  get parentHtml() {
    return this.#data.parentHtml
  }

  get parentApp() {
    return this.#data.parentApp
  }

  get partId() {
    return this.#data.partId
  }

  /**         STATIC PRIVATE METHODS         **/
  /**v13
   * Edit a danger part.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static #random(event){
    const data = getEventData(event)
    const meta = DANGERZONECONFIG.RANDOM[data.targetId]
    const filepicker = this.element.querySelector([`[data-id='${meta.SELECTOR}']`])
    if(data.target.checked){
      filepicker.classList.add('hidden-picker')
      filepicker.querySelector('label').innerHTML = game.i18n.localize(meta.CHECKED.LABEL)
      filepicker.querySelector('input').setAttribute("placeholder", game.i18n.localize(meta.CHECKED.PLACEHOLDER))
    } else {
      filepicker.classList.remove('hidden-picker')
      filepicker.querySelector('label').innerHTML = game.i18n.localize(meta.NOTCHECKED.LABEL)
      filepicker.querySelector('input').setAttribute("placeholder", game.i18n.localize(meta.NOTCHECKED.PLACEHOLDER))
    }
  }

  /**v13
   * Save the changes to the danger part.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object);
    this.parentApp.updatePart(this.partId, expandedData, this.parentHtml);
  }

  /**         STATIC METHODS         **/
  /**v13
   * for the given danger part id, outputs standard DEFAULT_OPTIONS
   * @param {string} id 
   * @returns 
   */
  static _defaultOptions(id, mergeObject = {}){
    return foundry.utils.mergeObject({
        id : DANGERZONECONFIG.ID.FORM.DANGERPART[id],
        window: {
          title : DANGERZONECONFIG.LABEL.DANGERPART[id],
          icon: DANGERZONECONFIG.ICON.DANGERPART[id]
        }
      }, mergeObject)
  }

  /**v13
   * for the given danger part id, outputs standard PARTS
   * @param {string} id 
   * @returns 
   */
  static _parts(id){
    const parts = {}

    const tabs = DANGERZONEPARTS.get(id);

    if(tabs?.templates){
      parts['tabs'] = {template: DANGERZONECONFIG.TEMPLATE.TABNAV},
      tabs.templates.forEach((tab, key, map) => {
        parts[tab] = {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.DANGERPART[id][tab]} 
        })
    } else {
      parts['body'] = {classes: ["standard-form"], scrollable: [""], template:DANGERZONECONFIG.TEMPLATE.DANGERPART[id]}
    }

    parts['footer'] = {template: DANGERZONECONFIG.TEMPLATE.FOOTER}

    return parts
  }

  /**v13
   * for the given array of tabs, outputs standard TABS
   * @param {array} tabs     the keys for each tab 
   * @param {string} initial    the key for the initial tab on form load
   * @returns object in format expected by mixin TABS 
   */
  static _tabs(id){
    const tabs = DANGERZONEPARTS.get(id).templates.values()
    const initial = DANGERZONEPARTS.get(id).templates.get(1)
    const _obj = {sheet: {initial: initial, tabs: []}}
    for(let tab of tabs){_obj.sheet.tabs.push(DANGERZONECONFIG.TAB[tab])}
    return _obj
  }
}

/**v13
 * Configures the ambient light danger part
 */
export class AmbientLightDangerPartConfig extends DangerPartConfig {
  static #partId = 'ambientLight'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 
}

/**v13
 * Configures the audio danger part
 */
export class AudioDangerPartConfig extends DangerPartConfig {
  static #partId = 'audio'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);  

  /** @override */
  static PARTS = this._parts(this.#partId)
}

export class BackgroundEffectDangerPartConfig extends DangerPartConfig {
  static #partId = 'backgroundEffect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 
}

/**v13
 * Configures the canvas danger part
 */
export class CanvasDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'canvas'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)
}

/**v13
 * Configures the combat danger part
 */
export class CombatDangerPartConfig extends DangerPartConfig {
  static #partId = 'combat'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)

   /** @override */
  _onRender(context, options) {
      super._onRender(context, options);
      this.element.querySelector(`#dz-initiative-type`).addEventListener("change", (event => {this.#toggleInitiativeFieldsDisplay(event)}));
  }

  /*******           CUSTOM             ********/

  /*******          PRIVATE METHODS *************/
  /**v13
   * Dynamic handling of dropdowns pertaining to initiative
   * @param {SubmitEvent} event         The pointer event.
   */
  #toggleInitiativeFieldsDisplay(event) {
    const data = getEventData(event)
    const op = this.element.querySelector(`#dz-initiative-value`)
    const pc = this.element.querySelector(`#dz-initiative-player`)
    switch (data.target.value) {
      case 'S' : 
          op.classList.remove('dz-hidden')
          pc.classList.add('dz-hidden')
        break;
      case 'R':
        op.classList.add('dz-hidden')
        pc.classList.remove('dz-hidden')
        break;
    }
    this.setPosition()
  }
}

/**v13
 * Configures the item danger part
 */
export class ItemDangerPartConfig extends DangerPartConfig {
  static #partId = 'item'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId, {actions: {'pile': ItemDangerPartConfig.#pile}})

  /** @override */
  static PARTS = this._parts(this.#partId)

  /*******           CUSTOM             ********/

  /*******          STATIC METHODS *************/
  /**v13
   * Dynamic handling of dropdowns pertaining to initiative
   * @param {SubmitEvent} event         The pointer event.
   */
  static #pile(event) {
    const data = getEventData(event)
    const target = this.element.querySelector(`#dz-token-fields`)
    data.target.checked ? target.classList.add('dz-hidden') : target.classList.remove('dz-hidden')
    this.setPosition()
  }
}

/**v13
 * Configures the foreground effect danger part
 */
export class ForegroundEffectDangerPartConfig extends DangerPartConfig {
  static #partId = 'foregroundEffect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 
}

/**v13
 * Configures the rolltable danger part
 */
export class RolltableDangerPartConfig extends DangerPartConfig {
  static #partId = 'rolltable'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)
}

/**v13
 * Configures the scene danger part
 */
export class SceneDangerPartConfig extends DangerPartConfig {
static #partId = 'scene'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 
}
    
/**v13
 * Configures the sound danger part
 */
export class SoundDangerPartConfig extends DangerPartConfig {
static #partId = 'sound'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 

}

/**v13
 * Configures the source effect danger part
 */
export class SourceEffectDangerPartConfig extends DangerPartConfig {
static #partId = 'sourceEffect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 

}

/**v13
 * Configures the token effect danger part
 */
export class TokenEffectDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'tokenEffect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)
}

/**v13
 * Configures the token move danger part
 */
export class TokenMoveDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'tokenMove'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)
  
  /** @override */
  static TABS = this._tabs(this.#partId) 
}

/**v13
 * Configures the wall danger part
 */
export class WallDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'wall'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)
  
  /** @override */
  static TABS = this._tabs(this.#partId) 

  /** @override */
  _onRender(context, options) {
      super._onRender(context, options);
      this.element.querySelectorAll(`[data-action]`).forEach((el) => {
        el.addEventListener("change", (event => {this.#toggleProximity(event)}))
      });
  }

  /** @override */
  async _prepareContext() {
    const parentData = await super._prepareContext();
      return foundry.utils.mergeObject(parentData,
        {
          suppress: {
            lightProx : this.#notProximity(this.data.light),
            senseProx : this.#notProximity(this.data.sense),
            soundProx : this.#notProximity(this.data.sound)
         }
        }  
      )
    }
  /*******           CUSTOM             ********/

  /*******          PRIVATE METHODS *************/

  /**v13
   * Test for element proximity value
   * @param {Boolean} test 
   * @returns true if not a proximity value
   */
  #notProximity(test){
    return Number(test) < 3
  }

  /**v13
   * Dynamic handling of display of proximity fields related to the given wall setting
   * @param {SubmitEvent} event         The pointer event.
   */
  #toggleProximity(event) {
    const data = getEventData(event)
    switch(data.action){
      case "door":
        this.element.querySelector(".door-options").classList.toggle("hidden", data.target.value === '0' ? true : false)
        this.setPosition({height: "auto"});
        break;
      case "light":
      case "sense":
      case "sound":
        this.element.querySelector(`.${data.action}-proximity`).classList.toggle("hidden", this.#notProximity(data.target.value)) 
      break;
    }
    this.setPosition()
  }

}




class DangerZoneActiveEffectForm extends ActiveEffectConfig {
  constructor(app, eventParent, origin, ...args) {
    super(...args);
    this.parent = app,
    this.eventParent = eventParent,
    this.origin = origin
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          sheetConfig: false,
          height: "600px"
        });
      }

    get title() {
      const reference = this.document.name ? ` ${this.document.name}` : "";
      return `${game.i18n.localize("DANGERZONE.zone-active-effect-form.form-name")}${reference}`;
    }

    getData(options) {
      const d = this.parent.data
      const data = {
        changes: d.changes ?? [],
        description: d.description ?? "",
        disabled: d.disabled ?? false,
        duration: d.duration ?? {},
        flags: d.flags ?? {},
        img: d.icon,
        isSuppressed: false,
        name: d.name ?? d.label ?? "",
        origin: this.origin,
        tint: d.tint,
        transfer: true
      }
      return {
        cssClass: "editable",
        data: data,
        editable: true,
        isActorEffect: true,
        isItemEffect: false,
        limited: false,
        owner: true, 
        submitText: "EFFECT.Submit",
        modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
          obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
          return obj;
        }, {}),
        title: this.title
      };
    }

    render(force=false, options={}) {
      super.render(force, options)
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
    

    _onEffectControl(event) {
      event.preventDefault();
      const button = event.currentTarget;
      switch (button.dataset.action) {
        case "add":
          this._addEffectChange(button);
          break;
        case "delete":
          button.closest(".effect-change").remove();
          this.setPosition()
          break;
      }
    }
  
   _addEffectChange(button) {
      super._addEffectChange(button)
      const changes = button.closest(".tab").querySelector(".changes-list");
      const last = changes.lastElementChild;
      const idx = last ? last.dataset.index + + 1 : 0;
      const change = $(`<li class="effect-change flexrow" data-index="${idx}"><div class="key"><input type="text" name="changes.${idx}.key" value=""/></div><div class="mode"><select name="changes.${idx}.mode" data-dtype="Number">
        <option value="0">Custom</option><option value="1">Multiply</option><option value="2" selected="">Add</option><option value="3">Downgrade</option><option value="4">Upgrade</option><option value="5">Override</option></select></div>
        <div class="value"><input type="text" name="changes.${idx}.value" value="0"/></div>
      </li>`);
      let del = $('<div>').addClass("effect-controls").append($('<a>').addClass("effect-control").attr("data-action", "delete").click(this._onEffectControl).append($('<i>').addClass("fas fa-trash")))
      change.append(del);
      changes.appendChild(change[0]);
      this.setPosition()
    }  
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.data = expandedData;
      this.parent.data['icon'] = this.parent.data['img']; delete this.parent.data['img'];//v12 compat
    }
}

class DangerZoneDangerFormActiveEffect extends FormApplication {
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
        origin: this.parent.dangerId,
        sourceOps: DANGERZONEFORMOPTIONS.SOURCETREATMENT,
        timesUpOn: dangerZone.MODULES.daeOn ? dangerZone.MODULES.timesUpOn : false,
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
      if (!this.data.hasOwnProperty('name') && !this.data.hasOwnProperty('label')){
        this.data = {
          name: $(this.parent.form).find('input[name="name"]').val(),
          icon: $(this.parent.form).find('input[name="icon"]').val(),
          origin: this.parent.dangerId
        }
      }
  
      const effect = Object.assign(this.data, {
        documentName: "ActiveEffect",
        testUserPermission: (...args) => { return true},
        parent: {documentName: "Actor"},
        apps: {},
        isOwner: true,
        uuid: `ActiveEffect.${this.parent.dangerId}`
      });
      
      const doc = new ActiveEffect(effect, {})
      new DangerZoneActiveEffectForm(this, eventParent, this.parent.dangerId, doc).render(true);
    }

    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.data = Object.assign(this.data, expandedData);
      this.parent.effect = this.data;
      this.eventParent.classList.add('active');
    }
}

class DangerZoneDangerFormGlobalZone extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.global-zone.label"),
          id : "danger-zone-danger-global-zone",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERGLOBALZONE,
          height : "auto",
          width: 475,
          tabs : [
            {navSelector: ".tabs", contentSelector: "form", initial: "basics"}
          ],
          closeOnSubmit: true
        });
      }

    getData(options) {
      const obj = foundry.utils.mergeObject(WORLDZONE, this.data)
      return {
        zone: obj,
        actorOps: actorOps(),
        hideElevationPrompt: !obj.target.choose.enable,
        hideOperation: obj.trigger.loop > 1 ? false : true,
        replaceOps: DANGERZONEREPLACE,
        lightReplaceOps: DANGERZONELIGHTREPLACE,
        stretchOps: STRETCH,
        tokenDispositionOps: TOKENDISPOSITION,
        operationOps: TRIGGEROPERATION,
        regionReplaceOps: DANGERZONEREGIONREPLACE,
        soundReplaceOps: DANGERZONESOUNDREPLACE,
        sourceAreaOps: SOURCEAREAGLOBALZONE,
        sourceTargetOps: SOURCEAREATARGET,
        wallReplaceOps: DANGERZONEWALLREPLACE,
        weatherReplaceOps: DANGERZONEWEATHERREPLACE,
        zoneTypeOps: dangerZoneType.dangerList
      } 
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('change', "[data-action]", this._handleChange.bind(this));
    }

    async _handleChange(event) {
      const action = $(event.currentTarget).data().action, val = event.currentTarget.value, checked = event.currentTarget.checked;
      switch (action) {
        case 'loop-change': 
          const op = document.getElementById(`dz-operation-global`);
          val > 1 ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
          this.setPosition()
          break;
        case 'source-area':
          this._handleSourceTag(val)
          break;  
        case 'template-toggle': 
          const templt = document.getElementById(`dz-elevation-prompt-global`);
          checked ? templt.classList.remove('dz-hidden') : templt.classList.add('dz-hidden')
          this.setPosition()
          break;
      }
    }
  
    _handleSourceTag(sourceArea = this.data?.source?.area ?? ''){
      const tag = $(this.form).find('#dz-source-tag-global')
      const sourceT = $(this.form).find('#dz-source-tag-tag-global')
      const sourceD = $(this.form).find('#dz-source-tag-danger-global')
      switch(sourceArea){
        case 'C':
        case 'D':
          tag.removeClass('dz-hidden');
          sourceD.removeClass('dz-hidden');
          tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.danger.label'))
          $(this.form).find('#dz-source-tag-danger-global').attr('name', 'source.tags')
          break;
        case 'T':
          tag.removeClass('dz-hidden');
          sourceT.removeClass('dz-hidden');
          tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.tag.label'))
          $(this.form).find('#dz-source-tag-tag-global').attr('name', 'source.tags')
          break;
        default:
          tag.addClass('dz-hidden');
          break;
      }
      if(!['C','D'].includes(sourceArea)){
        sourceD.addClass('dz-hidden')
        sourceD.removeAttr('name')
        sourceD.val([])
      }
      if(sourceArea !=='T'){
        sourceT.addClass('dz-hidden')
        sourceT.removeAttr('name')
        sourceT.val([])
      }
      this.setPosition()
    }

    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.globalZone = expandedData;
      this.eventParent.classList.add('active');
    }
}

class DangerZoneDangerFormLastingEffect extends FormApplication {
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
      if(this.data.lastingEffect.roof) {//FvTT 11 and backwards compat
        this.data.lastingEffect.restrictions = {light: true, weather: true}
      }

      return {
        lastingEffect: this.data.lastingEffect,
        macroOps: determineMacroList(),
        monksActiveTiles: this.data.monksActiveTiles,
        monksActiveTilesOnNot: !dangerZone.MODULES.monksActiveTilesOn,
        occlusionModesOps: TILEOCCLUSIONMODES,
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        offsetOps: DANGERZONEFORMOPTIONS.OFFSETOPTIONS,
        mirrorOps: DANGERZONEFORMOPTIONS.MIRRORIMAGEOPTIONS
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.lastingEffect = expandedData.lastingEffect;
      this.parent.monksActiveTiles = (expandedData.monksActiveTiles && Object.keys(expandedData.monksActiveTiles).length) ? expandedData.monksActiveTiles : {}
      expandedData.lastingEffect.file ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}


class DangerZoneDangerFormMutate extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.mutate.label"),
          id : "danger-zone-danger-mutate",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERMUTATE,
          height : "auto",
          width: 425,
          height: 595,
          closeOnSubmit: true,
          resizable: true
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
      if (expandedData.token) stringToObj(expandedData.token, {type: 'Token', notify: true})
      if (expandedData.actor) stringToObj(expandedData.actor, {type: 'Actor', notify: true})
      if (expandedData.embedded) stringToObj(expandedData.embedded, {type:'Embedded', notify:true})
      this.parent.mutate = expandedData;
      if(expandedData.permanent) this.eventParent.classList.add('active');
    }
}

class DangerZoneDangerFormRegion extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.region.label"),
          id : "danger-zone-danger-region",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERREGION,
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
        data: this.data,
        eventOps: regionEvents(),
        macroOps: determineMacroListUuid(),
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        visibilityOps: REGIONVISIBILITY,
        offsetOps: DANGERZONEFORMOPTIONS.OFFSETOPTIONS,
        mirrorOps: DANGERZONEFORMOPTIONS.MIRRORIMAGEOPTIONS,
        shapeTypeOps: REGIONSHAPETYPEOPTIONS
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.region = expandedData;
      expandedData.active ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}










class DangerZoneDangerFormTokenResponse extends FormApplication {
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
        sourceOps: DANGERZONEFORMOPTIONS.SOURCETREATMENT,
        tokenSaysOnNot: !dangerZone.MODULES.tokenSaysOn, 
        sequencerOnNot: !dangerZone.MODULES.sequencerOn,
        socketLibOn: dangerZone.MODULES.socketLibOn
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenResponse = expandedData;
      (expandedData.save?.enable || expandedData.damage?.enable) ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}

class DangerZoneDangerFormTokenSays extends FormApplication {
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
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENSAYS,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        isChat: this.data?.fileType === 'rollTable' ? true : false,
        tokenSaysOps: TOKENSAYSTYPES,
        sourceOps: DANGERZONEFORMOPTIONS.SOURCETREATMENT,
        compendiumListRollTable: getCompendiumOps('rollTable'),
        compendiumListAudio: getCompendiumOps('audio')
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenSays = expandedData;
      expandedData.fileType ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}

class DangerZoneDangerFormWarpgate extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.warpgate.label"),
          id : "danger-zone-danger-warpgate",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERWARPGATE,
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
      this.parent.warpgate = expandedData;
      expandedData.actor ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}

class DangerZoneDangerFormWeather extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.weather.label"),
          id : "danger-zone-danger-weather",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERWEATHER,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        parameters: this._createParametersHTML(this.data.type, this.data),
        typeOps: weatherTypes()
      }
    }

    activateListeners(html) {
      super.activateListeners(html)
      html.on('change', "#danger-zone-weather-type", this._setParameters.bind(this));
    }

    _setParameters(event){
      const ins = document.getElementById(`danger-zone-weather-parameters`);
      ins.innerHTML = this._createParametersHTML(event.currentTarget.value);
      this.setPosition();
    }

    _createParametersHTML(type, values = {}) {
      const pObj = weatherParameters(type)
      let finalHTML = '';
      if (!pObj) return finalHTML;
      if (pObj.animations) finalHTML += this._buildSelect('animations', pObj.animations, values.animations);
      if (pObj.density) finalHTML += this._buildRange('density', pObj.density, values.density);
      if (pObj.direction) finalHTML += this._buildRange('direction', pObj.direction, values.direction);
      if (pObj.lifetime) finalHTML += this._buildRange('lifetime', pObj.lifetime, values.lifetime);
      if (pObj.scale) finalHTML += this._buildRange('scale', pObj.scale, values.scale);
      if (pObj.speed) finalHTML += this._buildRange('speed', pObj.speed, values.speed);
      if (pObj.tint) finalHTML += this._buildColor('tint', pObj.tint, values.tint);
      return finalHTML
    }

    _buildColor(name, obj, val = ''){
      return `<div class="form-group"><label>${game.i18n.localize(obj.label)}</label><div class="form-fields"><input type="text" name="${name}"  min="0.00" step="0.01"  value=${val}><input type="color" value="${val ? val : obj.value.value}" data-edit="${name}"></div></div>`
    }

    _buildRange(name, obj, val = obj.value){
      return `<div class="form-group"><label>${game.i18n.localize(obj.label)}</label><div class="form-fields"><input type="range" data-dtype="Number" name="${name}" min="${obj.min}" max="${obj.max}" step="${obj.step}" value="${val}"><span class="range-value">${val}</span></div></div>`
    }

    _buildSelect(name, obj, val = obj.value){
      const sortedList = Object.entries(obj.options).sort(([,a],[,b]) => a.localeCompare(b))
      let optionList = '<option value=""></option>';
      for(let i = 0; i < sortedList.length; i++) {
        let selected = '';
        if (sortedList[i][0] === val) selected = ' selected '
        optionList += `<option value="${sortedList[i][0]}"${selected}>${game.i18n.localize(sortedList[i][1])}</option>`;
      }
      return `<div class="form-group"><label>${game.i18n.localize(obj.label)}</label><div class="form-fields"><select name="${name}" value="${val}">${optionList}</select></div></div>`    
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.weather = expandedData;
      expandedData.type ? this.eventParent.classList.add('active') : this.eventParent.classList.remove('active');
    }
}