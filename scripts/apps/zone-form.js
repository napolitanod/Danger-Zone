import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {getSceneRegionList} from './helpers.js';
import {COMBAT_EVENTS, COMBAT_PERIOD_INITIATIVE_EVENTS, EVENT_OPTIONS, TOKENDISPOSITION, DANGERZONEREPLACE, DANGERZONEREGIONREPLACE, DANGERZONESOUNDREPLACE, DANGERZONEWALLREPLACE, DANGERZONELIGHTREPLACE, DANGERZONEWEATHERREPLACE, SOURCEAREA, SOURCEAREATARGET, STRETCH, SOURCETRIGGERS, TRIGGEROPERATION, actorOps, ZONEEXTENSIONINTERACTIONOPTIONS, ZONEEXTENSIONSEQUENCEOPTIONS} from './constants.js';

export class DangerZoneForm extends FormApplication {
  constructor(app, zoneId, sceneId, dangerId, ...args) {
      super(...args);
      this.parent = app,
      this.dangerId = dangerId,
      this.zoneId = zoneId,
      this.sceneId = sceneId,
      this.pickerStart = null,
      this.pickerEnd = null;

      this.extensions = this.zone.extensions;
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.edit-form.name"),
      id : "danger-zone",
      classes: ["sheet","danger-zone-record"],
      template : dangerZone.TEMPLATES.DANGERZONECONFIG,
      width : 500,
      height : "auto",
      closeOnSubmit: true,
      tabs : [
        {navSelector: ".tabs", contentSelector: "form", initial: "basics"}
      ]   
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
  }

  get scene(){
    return game.scenes.get(this.sceneId)
  }

  get zone(){
    return this.zoneId ? (this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId)) : new zone(this.sceneId);
  }

  getData(){
     return {
      zone: this.zone,
      actorOps: actorOps(),
      hideElevationPrompt: !this.zone.target.choose.enable,
      hideInit: this.zone.hasCombatInitiativeEvent ? false : true,
      hideOperation: this.zone.trigger.loop > 1 ? false : true,
      hideTargetCombatant: this.zone.hasCombatEvent ? false : true,
      hideWeight: !this.zone.trigger.random,
      hideWorld: this.dangerId ? false : true,
      replaceOps: DANGERZONEREPLACE,
      lightReplaceOps: DANGERZONELIGHTREPLACE,
      operationOps: TRIGGEROPERATION,
      regionOps: getSceneRegionList(this.sceneId),
      regionReplaceOps: DANGERZONEREGIONREPLACE,
      soundReplaceOps: DANGERZONESOUNDREPLACE,
      sourceAreaOps: SOURCEAREA,
      sourceTargetOps: SOURCEAREATARGET,
      sourceTriggerOps: SOURCETRIGGERS,
      stretchOps: STRETCH,
      tokenDispositionOps: TOKENDISPOSITION,
      eventOps: EVENT_OPTIONS,
      zoneOps: dangerZone.getZoneList(this.sceneId),
      zoneTypeOps: dangerZoneType.dangerList,
      wallReplaceOps: DANGERZONEWALLREPLACE,
      weatherReplaceOps: DANGERZONEWEATHERREPLACE,
      sceneInactive: (this.scene?.active && this.scene.grid.type) ? false : true,
      extensionsListHTML: this._createExtendsListHTML()
    } 
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('change', "[data-action]", this._handleChange.bind(this));
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const id = clickedElement.parents('[data-id]')?.data()?.id;
    switch (action) {
      case 'add-extension': {
        new DangerZoneExtensionForm({}, this).render(true);
        break;
      }
      case 'delete-extension': {
        this.extensions = this.extensions.filter(e => e.id !== id);
        this._setExtendsList();
        break;
      }
      case 'edit-extension': {
        new DangerZoneExtensionForm(this.extensions.find(e => e.id === id), this).render(true);
        break;
      }
      case 'render-zone-types': {
        dangerZone.DangerZoneTypesForm.render(true);
        break;
      }
    }
  }

  async _handleChange(event) {
    const action = $(event.currentTarget).data().action, val = event.currentTarget.value, checked = event.currentTarget.checked;
    switch (action) {
      case 'trigger-select': {
        const targetCom = document.getElementById(`dz-target-combatant`);
        const triggerCom = document.getElementById(`dz-combatantInZone`);
        const init = document.getElementById(`dz-initiative`);
        if(COMBAT_EVENTS.find(e => val.includes(e))){
           targetCom.classList.remove('dz-hidden')
           triggerCom.classList.remove('dz-hidden')
        } else{
          targetCom.classList.add('dz-hidden')
          triggerCom.classList.add('dz-hidden')
        }
        console.log(COMBAT_PERIOD_INITIATIVE_EVENTS.find(e => val.includes(e)), val, event, init)
        if(COMBAT_PERIOD_INITIATIVE_EVENTS.find(e => val.includes(e))){
          init.classList.remove('dz-hidden')
        } else {
          init.classList.add('dz-hidden')
          init.children[1].children[0].value=0;
        }
        this.setPosition()
        break;
      }
      case 'loop-change': 
        const op = document.getElementById(`dz-operation`);
        val > 1 ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
        this.setPosition()
        break;
      case 'random-toggle': 
        const rando = document.getElementById(`dz-random-weight`);
        checked ? rando.classList.remove('dz-hidden') : rando.classList.add('dz-hidden')
        break;
      case 'source-area':
        this._handleSourceTag(val)
        break;
          
      case 'template-toggle': 
        const templt = document.getElementById(`dz-elevation-prompt`);
        checked ? templt.classList.remove('dz-hidden') : templt.classList.add('dz-hidden')
        this.setPosition()
        break;
    }
  }

  _handleSourceTag(sourceArea = this.zone.source.area){
    const tag = $(this.form).find('#dz-source-tag')
    const sourceT = $(this.form).find('#dz-source-tag-tag')
    const sourceD = $(this.form).find('#dz-source-tag-danger')
    const sourceZ = $(this.form).find('#dz-source-tag-zone')
    switch(sourceArea){
      case 'C':
      case 'D':
        tag.removeClass('dz-hidden');
        sourceD.removeClass('dz-hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.danger.label'))
        $(this.form).find('#dz-source-tag-danger').attr('name', 'source.tags')
        break;
      case 'T':
        tag.removeClass('dz-hidden');
        sourceT.removeClass('dz-hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.tag.label'))
        $(this.form).find('#dz-source-tag-tag').attr('name', 'source.tags')
        break;
      case 'Y':
      case 'Z':
        tag.removeClass('dz-hidden');
        sourceZ.removeClass('dz-hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.zone.label'))
        $(this.form).find('#dz-source-tag-zone').attr('name', 'source.tags')
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
    if(!['Y','Z'].includes(sourceArea)){
      sourceZ.addClass('dz-hidden')
      sourceZ.removeAttr('name')
      sourceZ.val([])
    }
    this.setPosition()
  }

  partialRender(){
    this._setExtendsList()
  }

  _setExtendsList(){
    const ins = document.getElementById(`danger-zone-zone-form-extend`);
    ins.innerHTML = this._createExtendsListHTML();
    this.setPosition();
  }

  _createExtendsListHTML() {
    let finalHTML = ''; 
    const znlist = dangerZone.getExtendedZones(this.sceneId)
    for(let item of this.extensions) {
      const zone = znlist.find(z => z.id === item.zoneId)
      finalHTML += `<li class="flexrow extension-record" data-container="types" draggable="true"><div class="flexrow danger-zone-extends-details"><div class="title">${zone ? zone.title : ''}</div><div class="interaction">${game.i18n.localize(ZONEEXTENSIONINTERACTIONOPTIONS[item.interaction])}</div></div><div class="danger-zone-controls flexrow" data-id="${item.id}"><a class="danger-zone-edit" title="${game.i18n.localize('DANGERZONE.edit')}" data-action="edit-extension"><i class="fas fa-edit"></i></a>&nbsp;&nbsp;&nbsp;<a class="danger-zone-delete" title="${game.i18n.localize('DANGERZONE.delete')}" data-action="delete-extension"><i class="fas fa-trash"></i></a></div></li>`;
    }
    return finalHTML
  }

  updateExtension(extension){
    this.extensions.find(e => e.id === extension.id) ? this.extensions.map(e => {if(e.id === extension.id) {return Object.assign(e, extension)} return e}) : this.extensions.push(extension)
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData); 
    expandedData['extensions'] = this.extensions;
    await dangerZone.updateSceneZone(expandedData.zoneId, expandedData);
    if(this.parent){this.parent.render(true)}
  }
  
} 

export class DangerZoneExtensionForm extends FormApplication {
  constructor(extension = {}, app, ...args) {
      super(...args);

      this.parent = app,
      this.extension = extension;
      this.zones = dangerZone.getExtendedZones(this.scene.id, this.triggeringZone.id);

      if(!this.extension.id) this.extension.id = foundry.utils.randomID(16)
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.edit-form.extension.add"),
      id : "danger-zone-extension",
      classes: ["sheet","danger-zone-record"],
      template : dangerZone.TEMPLATES.DANGERZONEEXTENSION,
      width : 450,
      height : "auto",
      closeOnSubmit: true
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
  }

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


  async _handleChange(event) {
    const action = $(event.currentTarget).data().action, val = event.currentTarget.value;
    switch (action) {         
      case 'interaction': 
        const tfId = document.getElementById(`danger-zone-extension-trigger-fields`);
        val === 'T' ? tfId.classList.remove('dz-hidden') : tfId.classList.add('dz-hidden')
        const sFld = document.getElementById(`danger-zone-extension-interaction-shape`);
        val === 'R' ? sFld.classList.remove('dz-hidden') : sFld.classList.add('dz-hidden')
        this.setPosition()
        break;
      case 'zone':
        const iFld = document.getElementById(`danger-zone-extension-interaction-warning`);
        this.sceneZones.find(z=>z.id === val) ? iFld.classList.add('dz-hidden') : iFld.classList.remove('dz-hidden')
        this.setPosition()
        break;
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('change', "[data-action]", this._handleChange.bind(this));
  }

  getData(){
     return {
      data: this.extension,
      interactionOps: ZONEEXTENSIONINTERACTIONOPTIONS,
      sequenceOps: ZONEEXTENSIONSEQUENCEOPTIONS,
      dangerOps: this.dangerOps,
      worldZoneOps: this.worldZoneOps,
      zoneOps: this.zoneOps,
      isTrigger: (!this.extension.interaction || this.extension.interaction === 'T') ? true : false,
      isSceneZone: (!this.extension.zoneId || this.sceneZones.find(z=>z.id === this.extension.zoneId)) ? true : false
     } 
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData); 
    this.parent.updateExtension(expandedData)
    this.parent.partialRender()
  }
  
} 