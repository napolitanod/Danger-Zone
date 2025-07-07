import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {DangerForm} from './danger-form.js';
import {getEventData, getSceneRegionList} from './helpers.js';
import {actorOps, CHAT_EVENTS, COMBAT_EVENTS, COMBAT_PERIOD_INITIATIVE_EVENTS, DANGERZONECONFIG, EVENT_OPTIONS, MOVEMENT_EVENTS, ZONEFORMOPTIONS} from './constants.js';

export class ZoneForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(app, zoneId, sceneId, dangerId, ...args) {
      super(...args);
      this.parent = app,
      this.dangerId = dangerId,
      this.zoneId = zoneId,
      this.sceneId = sceneId;
      this.extensions = this.zone.extensions;
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.ZONE,
    actions: {
      'add-extension': ZoneForm.#addExtension,
      'delete-extension': ZoneForm.#deleteExtension,
      'edit-extension': ZoneForm.#editExtension,
      'render-danger': ZoneForm.#renderDanger
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: ZoneForm.#onSubmit
    },
    position: {
      width: 500
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-record", "sheet"],
      title : DANGERZONECONFIG.LABEL.ZONE,
      icon: DANGERZONECONFIG.ICON.ZONE
    }
  }

  /** @override */
  static PARTS = 
      {
        tabs: {template: DANGERZONECONFIG.TEMPLATE.TABNAV},
        basics: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.BASICS},
        dimensions: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.DIMENSIONS},
        trigger: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.TRIGGER},
        source: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.SOURCE},
        target: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.TARGET},
        clear: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.CLEAR},
        extend: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONECONFIG.EXTEND},
        footer: {template: DANGERZONECONFIG.TEMPLATE.FOOTER}
      }

  /** @override */
  static TABS = {
    sheet: {
      initial: "basics", 
      tabs: DANGERZONECONFIG.TAB.ZONECONFIG
    }
  }

     /** @override */
  async _prepareContext() {
    return {
      zone: this.zone,
      actorOps: actorOps(),
      hideOperation: this.zone.trigger.loop > 1 ? false : true,
      options: ZONEFORMOPTIONS,
      regionOps: getSceneRegionList(this.sceneId),
      eventOps: EVENT_OPTIONS,
      zoneOps: dangerZone.getZoneList(this.sceneId),
      zoneTypeOps: dangerZoneType.dangerList,
      sceneInactive: (this.scene?.active && this.scene.grid.type) ? false : true,
      extensionsListHTML: this.#createExtendsListHTML(),
      tabs: this._prepareTabs("sheet"),
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save.label" }]
    }
  }

  /*******           custom            ********/

  /**         GETTERS         **/
  get scene(){
    return game.scenes.get(this.sceneId)
  }

  get zone(){
    return this.zoneId ? (this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId)) : new zone(this.sceneId);
  }

  /**         STATIC PRIVATE METHODS         **/

  /**v13
   * Add a zone extension.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #addExtension(event) {
    new ZoneExtensionForm({}, this).render(true)
  }

  /**v13
   * Delete a zone extension.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #deleteExtension(event) {
    const data = getEventData(event)
    this.extensions = this.extensions.filter(e => e.id !== data.parentId);
    this.#renderExtendsList()
  }

  /**v13
   * Edit a zone extension.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #editExtension(event) {
    const data = getEventData(event)
    new ZoneExtensionForm(this.extensions.find(e => e.id === data.parentId), this).render(true);
  }

  /**v13
   * Save the changes to the zone.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object);
    expandedData['extensions'] = this.extensions;
    await dangerZone.updateSceneZone(expandedData.zoneId, expandedData);
    if(this.parent){this.parent.render(true)}
  }

  /**v13
   * Render the dangers list.
   * @this {ApplicationV2}
   * @param {SubmitEvent} event         The pointer event.
   */
  static async #renderDanger(event) {
    const selectedDanger = this.element.querySelector(`select[name="dangerId"]`).value 
    selectedDanger ?  new DangerForm(selectedDanger).render(true) : dangerZone.DangerListForm.render(true)
  }
  

  /************ PRIVATE METHODS  ***************/

  /**v13
   * generates the html needed to render the extensions lsit
   * @returns string of html
   */
  #createExtendsListHTML() {
    let finalHTML = ''; 
    const znlist = dangerZone.getExtendedZones(this.sceneId)
    for(let item of this.extensions) {
      const zone = znlist.find(z => z.id === item.zoneId)
      finalHTML += `<li class="flexrow extension-record" data-container="types" draggable="true"><div class="flexrow danger-zone-extends-details"><div class="title">${zone ? zone.title : ''}</div><div class="interaction">${game.i18n.localize(ZONEFORMOPTIONS.ZONEEXTENSION.INTERACTIONOPTIONS[item.interaction])}</div></div><div class="danger-zone-controls flexrow" data-id="${item.id}"><a class="danger-zone-edit" title="${game.i18n.localize('DANGERZONE.edit')}" data-action="edit-extension"><i class="fas fa-edit"></i></a>&nbsp;&nbsp;&nbsp;<a class="danger-zone-delete" title="${game.i18n.localize('DANGERZONE.delete')}" data-action="delete-extension"><i class="fas fa-trash"></i></a></div></li>`;
    }
    return finalHTML
  }

  /**
   * 
   * @param {event} event 
   */
  #loopChange(event){
    const data = getEventData(event)
    const op = this.element.querySelector(`#dz-operation`);
    data.target.value > 1 ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
    this.setPosition()
  }

  /**v13
   * Form handling to show/hide weight field depending on random setting
   * @param {event} event 
   */
  #randomToggle(event){
    const data = getEventData(event)
    const rando = this.element.querySelector(`#dz-random-weight`);
    data.target.checked ? rando.classList.remove('dz-hidden') : rando.classList.add('dz-hidden')
  }

  /**v13
   * renders the extends list into the form
   */
  #renderExtendsList(){
    const ins = this.element.querySelector(`#danger-zone-zone-form-extend`);
    ins.innerHTML = this.#createExtendsListHTML();
    this.setPosition();
  }
  
  /**v13
   * Dynamic form handling for showing or hiding for prompt elevaton based on prompt selection
   * @param {event} event 
  */
  #templateToggle(event){
    const data = getEventData(event)
    const templt = this.element.querySelector(`#dz-elevation-prompt`);
    data.target.checked ? templt.classList.remove('dz-hidden') : templt.classList.add('dz-hidden')
    this.setPosition()
  }

  /**v13
  * Dynamic form handling in response to trigger value change
  * @param {event} event 
  */
  #triggerSelect(event) {
    const data = getEventData(event)

    const targetCom = this.element.querySelector(`#dz-target-combatant`);
    const triggerCom = this.element.querySelector(`#dz-combatantInZone`);
    const targetMvWait = this.element.querySelector(`#dz-trigger-movement-wait`);
    const triggerChatPhrase = this.element.querySelector(`#dz-trigger-chat-phrases`);
    const init = this.element.querySelector(`#dz-initiative`);
    
    CHAT_EVENTS.find(e => val.includes(e)) ? triggerChatPhrase.classList.remove('dz-hidden') : triggerChatPhrase.classList.add('dz-hidden');

    if(COMBAT_EVENTS.find(e => val.includes(e))){
      targetCom.classList.remove('dz-hidden')
      triggerCom.classList.remove('dz-hidden')
    } else{
      targetCom.classList.add('dz-hidden')
      triggerCom.classList.add('dz-hidden')
    }

    if(COMBAT_PERIOD_INITIATIVE_EVENTS.find(e => data.target.value.includes(e))){
      init.classList.remove('dz-hidden')
    } else {
      init.classList.add('dz-hidden')
      init.children[1].children[0].value=0;
    }
    
    MOVEMENT_EVENTS.find(e => data.target.value.includes(e)) ? targetMvWait.classList.remove('dz-hidden') : targetMvWait.classList.add('dz-hidden')
    
    this.setPosition()
  }

  /**         METHODS         **/
    /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(`[data-action="loop-change"]`).addEventListener("change", (event => {this.#loopChange(event)}))
    this.element.querySelector(`[data-action="source-area"]`).addEventListener("change", (event => {this.handleSourceTag(event)}))
    this.element.querySelector(`[data-action="template-toggle"]`).addEventListener("change", (event => {this.#templateToggle(event)}))
    this.element.querySelector(`[data-action="random-toggle"]`).addEventListener("change", (event => {this.#randomToggle(event)}))
    this.element.querySelector(`[data-action="trigger-select"]`).addEventListener("change", (event => {this.#triggerSelect(event)}))
  }

  /**v13
   * form dynamic handling when source area is changed
   * @param {event} event 
  */
  handleSourceTag(event){
    const data = getEventData(event)
    const sourceArea = data.target.value ?? this.zone.source.area
    const tag = this.element.querySelector('#dz-source-tag')
    const sourceT = this.element.querySelector('#dz-source-tag-tag')
    const sourceD = this.element.querySelector('#dz-source-tag-danger')
    const sourceZ = this.element.querySelector('#dz-source-tag-zone')
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
      case 'Y':
      case 'Z':
        tag.classList.remove('dz-hidden');
        sourceZ.classList.remove('dz-hidden');
        tag.querySelector('label').innerHTML = game.i18n.localize('DANGERZONE.edit-form.source.tag.zone.label')
        sourceZ.setAttribute("name",  'source.tags')
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
    if(!['Y','Z'].includes(sourceArea)){
      sourceZ.classList.add('dz-hidden')
      sourceZ.removeAttribute('name')
      sourceZ.value = []
    }
    this.setPosition()
  }

  /**v13
   * called by extension app to update extension then re-render that list on this form
   */
  updateExtension(extension){
    this.extensions.find(e => e.id === extension.id) ? this.extensions.map(e => {if(e.id === extension.id) {return Object.assign(e, extension)} return e}) : this.extensions.push(extension)
    this.#renderExtendsList()
  }
  
} 

export class ZoneExtensionForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(extension = {}, app, ...args) {
      super(...args);
      this.parent = app,
      this.extension = extension;
      this.zones = dangerZone.getExtendedZones(this.scene.id, this.triggeringZone.id);
      if(!this.extension.id) this.extension.id = foundry.utils.randomID(16)
  }

    /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.ZONEEXTENSION,
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: ZoneExtensionForm.#onSubmit
    },
    position: {
      width: 500
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-record", "sheet"],
      title : DANGERZONECONFIG.LABEL.ZONEEXTENSION,
      icon: DANGERZONECONFIG.ICON.ZONEEXTENSION
    }
  }

 /** @override */
  static PARTS = {
      sheet: {template: DANGERZONECONFIG.TEMPLATE.ZONEEXTENSION},
      footer: {template: DANGERZONECONFIG.TEMPLATE.FOOTER}
    }

 /** @override */
  async _prepareContext() {
    return {
      data: this.extension,
      dangerOps: this.dangerOps,
      options: ZONEFORMOPTIONS,
      worldZoneOps: this.worldZoneOps,
      zoneOps: this.zoneOps,
      isTrigger: (!this.extension.interaction || this.extension.interaction === 'T') ? true : false,
      isSceneZone: (!this.extension.zoneId || this.sceneZones.find(z=>z.id === this.extension.zoneId)) ? true : false,
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save.label" }]
    }
  }

  /*******           custom            ********/

  /**         GETTERS         **/
  get dangerOps(){
      return this.zones.filter(z => z.scene.dangerId).reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
  }

  get scene(){
    return this.parent.scene
  }

  get sceneZones(){
      return this.zones.filter(z => !z.scene.dangerId && z.id !== this.triggeringZone.id)
  }

  get triggeringZone(){
    return this.parent.zone;
  }

  get worldZoneOps(){
      return this.zones.filter(z => z.danger.hasGlobalZone).reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
  }

  get zoneOps(){
      return this.sceneZones.reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
  }

  /************ PRIVATE METHODS  ***************/

  /**v13
   * 
   * @param {event} event 
   */
  #interaction(event){
    const data = getEventData(event)
    const tfId = this.element.querySelector(`#danger-zone-extension-trigger-fields`);
    const sFld = this.element.querySelector(`#danger-zone-extension-interaction-shape`);
    switch(data.target.value){
      case 'T':
        tfId.classList.remove('dz-hidden') 
        sFld.classList.add('dz-hidden')
        break;
      case 'R': 
        tfId.classList.add('dz-hidden')
        sFld.classList.remove('dz-hidden') 
        break;
    }
    this.setPosition()
  }

  /**v13
   * Save the changes to the zone.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object); 
    this.parent.updateExtension(expandedData)
  }

  /**v13
   * 
   * @param {event} event 
   */
  #zone(event){
    const data = getEventData(event)
    const iFld = this.element.querySelector(`#danger-zone-extension-interaction-warning`);
    this.sceneZones.find(z=>z.id === data.target.value) ? iFld.classList.add('dz-hidden') : iFld.classList.remove('dz-hidden')
    this.setPosition()
  }

  /**         METHODS         **/
    /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(`[data-action="interaction"]`).addEventListener("change", (event => {this.#interaction(event)}))
    this.element.querySelector(`[data-action="zone"]`).addEventListener("change", (event => {this.#zone(event)}))
  }

} 