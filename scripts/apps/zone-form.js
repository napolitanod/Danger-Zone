import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {boundary, point} from './dimensions.js';
import {COMBATTRIGGERS, DANGERZONETRIGGERS} from './constants.js';
import {TOKENDISPOSITION, DANGERZONEREPLACE, DANGERZONEWALLREPLACE, DANGERZONELIGHTREPLACE, SOURCEAREA, SOURCEAREATARGET, STRETCH, SOURCETRIGGERS, TRIGGEROPERATION, actorOps} from './constants.js';

export class DangerZoneForm extends FormApplication {
  constructor(app, zoneId, sceneId, dangerId, ...args) {
      super(...args);
      this.parent = app;
      this.dangerId = dangerId,
      this.zoneId = zoneId;
      this.sceneId = sceneId;
      this.pickerStart = null;
      this.pickerEnd = null;
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.edit-form.name"),
      id : "danger-zone",
      classes: ["sheet","danger-zone-record"],
      template : dangerZone.TEMPLATES.DANGERZONECONFIG,
      width : 450,
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

  async _handleButtonClick(event) {
    const action = $(event.currentTarget).data().action;
    switch (action) {
      case 'render-zone-types': {
        dangerZone.DangerZoneTypesForm.render(true);
        break;
      }
      case 'location-picker':{
        this.promptSelectZoneBoundary();
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
        if(COMBATTRIGGERS.includes(val)){
           targetCom.classList.remove('hidden')
           triggerCom.classList.remove('hidden')
        } else{
          targetCom.classList.add('hidden')
          triggerCom.classList.add('hidden')
        }
        const init = document.getElementById(`dz-initiative`);
        if(['initiative-start', 'initiative-end'].includes(val)){
          init.classList.remove('hidden')
        } else {
          init.classList.add('hidden')
          init.children[1].children[0].value=0;
        }
        this.setPosition()
        break;
      }
      case 'loop-change': 
        const op = document.getElementById(`dz-operation`);
        val > 1 ? op.classList.remove('hidden') : op.classList.add('hidden')
        this.setPosition()
        break;
      case 'random-toggle': 
        const rando = document.getElementById(`dz-random-weight`);
        checked ? rando.classList.remove('hidden') : rando.classList.add('hidden')
        break;
      case 'source-area':
        this._handleSourceTag(val)
        break;
          
      case 'template-toggle': 
        const templt = document.getElementById(`dz-elevation-prompt`);
        checked ? templt.classList.remove('hidden') : templt.classList.add('hidden')
        this.setPosition()
        break;
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('change', "[data-action]", this._handleChange.bind(this));
  }

  getData(){
    const instance = this.zoneId ? (this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId)) : new zone(this.sceneId);
    return {
      "zone": this.zone,
      actorOps: actorOps(),
      hideElevationPrompt: !instance.options.placeTemplate,
      hideInit: ['initiative-start','initiative-end'].includes(instance.trigger) ? false : true,
      hideOperation: instance.loop > 1 ? false : true,
      hideTargetCombatant: COMBATTRIGGERS.includes(instance.trigger) ? false : true,
      hideWeight: !instance.random,
      hideWorld: this.dangerId ? false : true,
      replaceOps: DANGERZONEREPLACE,
      lightReplaceOps: DANGERZONELIGHTREPLACE,
      operationOps: TRIGGEROPERATION,
      sourceAreaOps: SOURCEAREA,
      sourceTargetOps: SOURCEAREATARGET,
      sourceTriggerOps: SOURCETRIGGERS,
      stretchOps: STRETCH,
      tokenDispositionOps: TOKENDISPOSITION,
      triggerOps: DANGERZONETRIGGERS,
      zoneOps: dangerZone.getZoneList(this.sceneId),
      zoneTypeOps: dangerZoneType.dangerList,
      wallReplaceOps: DANGERZONEWALLREPLACE,
      sceneInactive: (this.scene?.data?.active && this.scene.data.gridType) ? false : true
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
        tag.removeClass('hidden');
        sourceD.removeClass('hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.danger.label'))
        $(this.form).find('#dz-source-tag-danger').attr('name', 'source.tag')
        break;
      case 'T':
        tag.removeClass('hidden');
        sourceT.removeClass('hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.tag.label'))
        $(this.form).find('#dz-source-tag-tag').attr('name', 'source.tag')
        break;
      case 'Y':
      case 'Z':
        tag.removeClass('hidden');
        sourceZ.removeClass('hidden');
        tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.zone.label'))
        $(this.form).find('#dz-source-tag-zone').attr('name', 'source.tag')
        break;
      default:
        tag.addClass('hidden');
        break;
    }
    if(!['C','D'].includes(sourceArea)){
      sourceD.addClass('hidden')
      sourceD.removeAttr('name')
      sourceD.val('')
    }
    if(sourceArea !=='T'){
      sourceT.addClass('hidden')
      sourceT.removeAttr('name')
      sourceT.val('')
    }
    if(!['Y','Z'].includes(sourceArea)){
      sourceZ.addClass('hidden')
      sourceZ.removeAttr('name')
      sourceZ.val('')
    }
    this.setPosition()
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData); 
    await dangerZone.updateSceneZone(expandedData.zoneId, expandedData);
    if(this.parent){this.parent.render(true)}
  }

  async promptSelectZoneBoundary() {
    let currentLayer = canvas.activeLayer;
    canvas.activateLayer('grid');
    await this.minimizeForms();

    let x = new Promise(function(resolve, reject){
      ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-zone-start"));
      canvas.app.stage.once('pointerdown', event => {
        let selection = event.data.getLocalPosition(canvas.app.stage); 
        resolve(selection);
        });
    }).then((selection)=>{
      this.pickerStart = new point(selection);
      let y = new Promise(function(resolve, reject){
        ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-zone-end"));
        canvas.app.stage.once('pointerdown', event => {
          let selection = event.data.getLocalPosition(canvas.app.stage); 
          resolve(selection);
          });
      }).then((selection)=>{
        this.pickerEnd = new point(selection);
        currentLayer.activate();
        this.maximizeForms();
        this.pickToForm();
      });
    });  
  }

  async minimizeForms(){
    if (!this._minimized){await this.minimize()}
    if (!this.parent?._minimized){await this.parent?.minimize()}
    if (this.parent?.parent && !this.parent.parent._minimized){await this.parent.parent.minimize()}
  }

  async maximizeForms(){
    if (this.parent?.parent && !this.parent.parent._maximized){await this.parent.parent.maximize()}
    if (!this.parent?._maximized){await this.parent?.maximize()}
    if (!this._maximized){await this.maximize()}  
  }

  pickToForm(){
    const pick = new boundary(this.pickerStart, this.pickerEnd);
    let size = this.scene.dimensions.size;
    pick.B.x = pick.B.x + size;
    pick.B.y = pick.B.y + size;
    $(this.form).find("input[name='scene.start.x']").val(pick.A.x);
    $(this.form).find("input[name='scene.start.y']").val(pick.A.y);
    $(this.form).find("input[name='scene.end.x']").val(pick.B.x);
    $(this.form).find("input[name='scene.end.y']").val(pick.B.y);
  
    dangerZone.log(false, 'User zone selection recorded', {pick: {start: this.pickerStart, end: this.pickerEnd}, final: pick});
  }
  
}
