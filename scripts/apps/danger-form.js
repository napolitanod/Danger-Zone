import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {actorOps,  DANGERZONEPARTS, DANGERZONECONFIG, DANGERFORMOPTIONS,determineMacroList,  getCompendiumOps, weatherParameters, WORLDZONE, ZONEFORMOPTIONS} from './constants.js';
import { helper, getEventData, stringToObj} from './helpers.js';

/**v13
 * The main danger form from which danger part forms are launched. Used to configure a danger.
 */
export class DangerForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(dangerId, parent = '', ...args) {
    super(...args);

    this._data = {flags:{}},
    this.dangerId = dangerId,
    this.parent = parent;
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
  async _prepareContext() {
    const danger = this.dangerId ? dangerZoneType.getDanger(this.dangerId) : new dangerZoneType  
    const has = {}
    DANGERZONEPARTS.forEach((part, key, map)=> {
      if(this.#isFlag(key)){
        this._data.flags[key] = danger.options.flags[key] ?? {};
        has[key] =  this.#isActive(key, this._data.flags[key]) ? true : false;
      } else {
        this._data[key] = danger.options[key] ?? {};
        has[key] =  this.#isActive(key, this._data[key]) ? true : false;
      }
    })
    

    this.globalZone = danger.options.globalZone ?? {};

    const dataToSend =  {
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save.label" }],
      danger: danger,
      has: has,
      icons: DANGERZONECONFIG.ICON,
      labels: DANGERZONECONFIG.LABEL,
      macroOps: determineMacroList(),
      migration: dangerZone.MIGRATION.DANGER,
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
      data: (this.#isFlag(data.parentId) ? this._data.flags[data.parentId] : this._data[data.parentId])
    }

    DangerForm.#dynamicDangerPart(options.partId, options).render(true)
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
   
    if(this.#isFlag(data.parentId)){
      this._data.flags[data.parentId] = Object.assign(this._data.flags[data.parentId], danger.options.flags[data.parentId])
    } else {
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
    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
    if(this.parent) this.parent.refresh();
  }

  #isActive(partId, part){
    switch(partId){
      case 'effect':
        return Object.keys(part).length
      case 'audio': 
      case 'foregroundEffect':
      case 'lastingEffect':
      case 'sound':
      case 'tokenEffect':
        return part.file ? true : false
      case 'sourceEffect':
      case 'backgroundEffect':
        return (part.file || part.audio.file) ? true : false
      case 'combat': return (part.targets.add || part.source.add || part.spawn || part.new || part.initiative.type || part.start) ? true : false
      case 'canvas': return (part.effect.type || part.pan.active) 
      case 'item': 
      case 'rolltable':
        return  part.name?.length ? true : false
      case 'ambientLight': return (part.dim || part.bright) ? true : false
      case 'mutate': return part.permanent
      case 'region':
      case 'scene': 
        return part.active ? true : false
      case 'globalZone': return part.enabled ? true : false
      case 'tokenMove': return (part.v.dir || part.hz.dir || part.e.type || part.sToT) ? true : false
      case 'tokenResponse': return (part.save?.enable || part.damage?.enable) ? true : false
      case 'tokenSays': return part.fileType ? true : false
      case 'wall': return (part.top || part.bottom || part.left || part.right) ? true : false
      case 'warpgate': return part.actor ? true : false
      case 'weather': return part.type ? true : false
    }
  }

  #isFlag(id){
    return DANGERZONEPARTS.get(id).flag ? true : false
  }

  /**         PUBLIC METHODS         **/
  updatePart(partId, updateData, html){
    if(this.#isFlag(partId)){
      this._data.flags[partId] = updateData  
    } else {
      this._data[partId] = updateData  
    } 
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
        ITEM: getCompendiumOps('item'),
        AUDIO: getCompendiumOps('audio'),
        ROLLTABLE: getCompendiumOps('rollTable')
      },
      data: this.data,
      icons: DANGERZONECONFIG.ICON,
      macros: determineMacroList(true),
      modules: dangerZone.MODULES,
      options: DANGERFORMOPTIONS,
      random: DANGERZONECONFIG.RANDOM,
      tabs: this._prepareTabs("sheet"),
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save.label" }],
      zoneOptions: ZONEFORMOPTIONS
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
  
  /**         METHODS         **/
  _mergeData(data){
    Object.assign(this.#data.data, data);
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

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(`#danger-zone-ambient-light-darkness`).addEventListener("change", (event => {this.#setAnimationType(event)}));
  }

  #setAnimationType(event){
    const ins = this.element.querySelector(`#danger-zone-ambient-light-animation`);
    const obj = {
      name: 'lightAnimation.type',
      type: 'options',
      options: event.target.checked ? DANGERFORMOPTIONS.AMBIENTLIGHT.DARKNESSANIMATION : DANGERFORMOPTIONS.AMBIENTLIGHT.ANIMATION,
      value: ''
    }
    ins.innerHTML = helper.htmlBuildInput(obj)
    this.setPosition();
  }
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

  
   /** @override */
  _onRender(context, options) {
      super._onRender(context, options);
      this.element.querySelector(`[data-action="duration-change"]`).addEventListener("change", (event => {this.#toggleFadeDisplay(event)}));
  }

  /*******           CUSTOM             ********/

  /*******          PRIVATE METHODS *************/
  /**v13
   * Dynamic handling of input pertaining to fade
   * @param {SubmitEvent} event         The pointer event.
   */
  #toggleFadeDisplay(event) {
    helper.htmlToggleElement(this, {event: event, condition: 'less_than', test: 1, type: 'hide', html: this.element, id: `dz-part-audio-fade`})
  }
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
    helper.htmlToggleElement(this, {event: event, condition: 'eq', test: 'R', type: 'show', html: this.element, id: `dz-initiative-player`})
    helper.htmlToggleElement(this, {event: event, condition: 'eq', test: 'S', type: 'show', html: this.element, id: `dz-initiative-value`})
  }
}

/**v13
 * Configures the combat danger part
 */
export class EffectDangerPartConfig extends DangerPartConfig {
  static #partId = 'effect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId, {actions: {'edit': this.#activeEffectConfig}, form: {handler: this.#onSubmit}})

  /** @override */
  static PARTS = this._parts(this.#partId)

  async _prepareContext() {
    const parentData = await super._prepareContext();
    const origin = this.parentApp.dangerId;
    const merged = foundry.utils.mergeObject(parentData, {origin: origin})
    return merged
  }

  static #activeEffectConfig(event) {
    const data = getEventData(event)
    if (!this.data.hasOwnProperty('name') && !this.data.hasOwnProperty('label')){
      this._mergeData( {
        name: this.parentApp.element.querySelector('input[name="name"]').value,
        icon: this.parentApp.element.querySelector('file-picker').value,
        origin: this.parentApp.dangerId
      })
    }
  
    const effect = Object.assign(this.data, {
      documentName: "ActiveEffect",
      testUserPermission: (...args) => { return true},
      parent: {documentName: "Actor"},
      apps: {},
      isOwner: true,
      uuid: `ActiveEffect.${this.parentApp.dangerId}`
    });
    
    const doc = new ActiveEffect(effect, {})
    new DangerZoneActiveEffectForm(this, data.parent, this.parentApp.dangerId, doc).render(true);
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
    this._mergeData(expandedData)
    this.parentApp.updatePart(this.partId, this.data, this.parentHtml);
  }
}

/**v13
 * form that extends the activeeffectconfig form to collect active effect data
 */
class DangerZoneActiveEffectForm extends foundry.applications.sheets.ActiveEffectConfig {
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
   * Dynamic handling of fields associated with item pile
   * @param {SubmitEvent} event         The pointer event.
   */
  static #pile(event) {
    helper.htmlToggleElement(this, {event: event, condition: 'check', type: 'hide', html: this.element, id: `dz-token-fields`})
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
 * Configures the world zone danger part
 */
export class GlobalZoneDangerPartConfig extends DangerPartConfig {
  static #partId = 'globalZone'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 

  /** @override */
  async _prepareContext() {
    const parentData = await super._prepareContext();
    const obj = foundry.utils.mergeObject(WORLDZONE, this.data)
    return foundry.utils.mergeObject(parentData, {
        zone: obj,
        actorOps: actorOps(),
        hideOperation: obj.trigger.loop > 1 ? false : true,
        zoneTypeOps: dangerZoneType.dangerList
      } )
  }


  /******* STATIC METHODS *************/
  

  /******* METHODS *************/
    /** @override */
  _onRender(context, options) {
      super._onRender(context, options);
      this.element.querySelector(`[data-action="loop-change"]`).addEventListener("change", (event => {this.#loopChange(event)}))
      this.element.querySelector(`[data-action="source-area"]`).addEventListener("change", (event => {this.handleSourceTag(event)}))
      this.element.querySelector(`[data-action="template-toggle"]`).addEventListener("change", (event => {this.#templateToggle(event)}))
  }

  handleSourceTag(event){
    const data = getEventData(event)
    const sourceArea = data.target.value ?? this.data?.source?.area ?? ''
    const tag = this.element.querySelector('#dz-source-tag-global')
    const sourceT = this.element.querySelector('#dz-source-tag-tag-global')
    const sourceD = this.element.querySelector('#dz-source-tag-danger-global')
    switch(sourceArea){
      case 'C':
      case 'D':
        tag.classList.remove('dz-hidden');
        sourceD.classList.remove('dz-hidden');
        tag.querySelector('label').innerHTML = game.i18n.localize('DANGERZONE.edit-form.source.tag.danger.label')
        sourceD.setAttribute("name", 'source.tags')
        break;
      case 'T':
        tag.classList.remove('dz-hidden');
        sourceT.classList.remove('dz-hidden');
        tag.querySelector('label').innerHTML = game.i18n.localize('DANGERZONE.edit-form.source.tag.tag.label')
        sourceD.setAttribute("name", 'source.tags')
        break;
      default:
        tag.classList.add('dz-hidden');
        break;
    }
    if(!['C','D'].includes(sourceArea)){
      sourceD.classList.add('dz-hidden')
      sourceD.removeAttribute('name')
      sourceD.value = []
    }
    if(sourceArea !=='T'){
      sourceT.classList.add('dz-hidden')
      sourceT.removeAttribute('name')
      sourceT.value = []
    }
    this.setPosition()
  }

  #loopChange(event){
    helper.htmlToggleElement(this, {event: event, condition: 'less_than', test: 2, type: 'hide', html: this.element, id: `dz-operation-global`})
  }

  #templateToggle(event){
    helper.htmlToggleElement(this, {event: event, condition: 'check', type: 'hide', html: this.element, id: `dz-elevation-prompt-global`})
  }
  
}

/**v13
 * Configures the mutate danger part
 */
export class MutateDangerPartConfig extends DangerPartConfig {
  static #partId = 'mutate'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId, {form: {handler: this.#onSubmit}})

  /** @override */
  static PARTS = this._parts(this.#partId)

  /**v13
   * Save the changes to the danger part.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object);
    if (expandedData.token) stringToObj(expandedData.token, {type: 'Token', notify: true})
    if (expandedData.actor) stringToObj(expandedData.actor, {type: 'Actor', notify: true})
    if (expandedData.embedded) stringToObj(expandedData.embedded, {type:'Embedded', notify:true})
    this.parentApp.updatePart(this.partId, expandedData, this.parentHtml);
  }
}

/**v13
 * Configures the lasting effect danger part
 */
export class LastingEffectDangerPartConfig extends DangerPartConfig {
  static #partId = 'lastingEffect'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId)

  /** @override */
  static PARTS = this._parts(this.#partId)

  /** @override */
  static TABS = this._tabs(this.#partId) 
}

/**v13
 * Configures the region danger part
 */
export class RegionDangerPartConfig extends DangerPartConfig {
  static #partId = 'region'

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
 * Configures the token says danger part
 */
export class TokenSaysDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'tokenSays'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId) 

  /** @override */
  static TABS = this._tabs(this.#partId) 

    /** @override */
  async _prepareContext() {
    const parentData = await super._prepareContext();
    const isChat = this.data.fileType === 'rollTable' ? true : false
    const merged = foundry.utils.mergeObject(parentData, {isChat: isChat})
    return merged
    }
}

/**v13
 * Configures the token response danger part
 */
export class TokenResponseDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'tokenResponse'

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

/**v13
 * Configures the token spawn part
 */
export class WarpgateDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'warpgate'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)

}

/**v13
 * Configures the token spawn part
 */
export class WeatherDangerPartConfig extends DangerPartConfig {
  
  static #partId = 'weather'

  /** @inheritDoc */
  static DEFAULT_OPTIONS = this._defaultOptions(this.#partId);

  /** @override */
  static PARTS = this._parts(this.#partId)

     /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(`#danger-zone-weather-type`).addEventListener("change", (event => {this.#setParameters(event)}));
  }
  
    /** @override */
  async _prepareContext() {
    const parentData = await super._prepareContext();
    return foundry.utils.mergeObject(parentData, {parameters: this.#createParametersHTML(this.data.type, this.data)})
  }

  #setParameters(event){
      const ins = this.element.querySelector(`#danger-zone-weather-parameters`);
      ins.innerHTML = this.#createParametersHTML(event.target.value);
      this.setPosition();
    }

  #createParametersHTML(type, values = {}) {
    const pObj = weatherParameters(type)
    let finalHTML = '';
    if (!pObj) return finalHTML;
    if (pObj.animations) finalHTML += helper.htmlBuildInput(Object.assign(pObj.animations, {name: 'animations', inputValue: values.animations}));
    if (pObj.density) finalHTML += helper.htmlBuildInput(Object.assign(pObj.density, {name: 'density', inputValue: values.density}));
    if (pObj.direction) finalHTML += helper.htmlBuildInput(Object.assign(pObj.direction,{name: 'direction', inputValue: values.direction}));
    if (pObj.lifetime) finalHTML += helper.htmlBuildInput(Object.assign(pObj.lifetime,{name: 'lifetime', inputValue: values.lifetime}));
    if (pObj.scale) finalHTML += helper.htmlBuildInput(Object.assign(pObj.scale, {name: 'scale', inputValue: values.scale}));
    if (pObj.alpha) finalHTML += helper.htmlBuildInput(Object.assign(pObj.alpha,{name: 'alpha', inputValue: values.alpha}));
    if (pObj.speed) finalHTML += helper.htmlBuildInput(Object.assign(pObj.speed,{name: 'speed', inputValue: values.speed}));
    if (pObj.tint) {
      pObj.tint.value = (pObj.tint.value.apply ? pObj.tint.value.value : '')
      finalHTML += helper.htmlBuildInput(Object.assign(pObj.tint,{name: 'tint', inputValue: values.tint}));
    }
    return finalHTML
  }
}