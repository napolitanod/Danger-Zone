import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {boundary, point} from './dimensions.js';
import {DANGERZONETRIGGERS} from './constants.js';
import {TOKENDISPOSITION, DANGERZONEREPLACE, DANGERZONEWALLREPLACE, DANGERZONELIGHTREPLACE, STRETCH, SOURCETRIGGERS, actorOps} from './constants.js';

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
      template : dangerZone.TEMPLATES.DANGERZONECONFIG,
      width : 450,
      height : "auto",
      closeOnSubmit: true      
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
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
    const action = $(event.currentTarget).data().action;
    switch (action) {
      case 'trigger-select': {
        const initLabel = document.getElementById(`dz-initiative-label`);
        const init = document.getElementById(`dz-initiative`);
        const val = document.getElementById(`dz-trigger-value`).value
        if(val === 'initiative-start' || val === 'initiative-end'){
          initLabel.classList.remove('hidden')
          init.classList.remove('hidden')
        } else {
          initLabel.classList.add('hidden')
          init.classList.add('hidden')
          init.children[0].value=0;
        }
        break;
      }
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('change', "[data-action]", this._handleChange.bind(this));
  }

  getData(options){
    let zoneId = this.zoneId, instance;
    let scene = game.scenes.get(this.sceneId);

    if(!zoneId){
      instance = new zone(this.sceneId);
    } else {
      instance = this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(zoneId, this.sceneId);
    }

    const hideInit = (instance.trigger === 'initiative-start' || instance.trigger === 'initiative-end') ? false : true

    return {
      "zone": instance,
      actorOps: actorOps(),
      hideInit: hideInit,
      replaceOps: DANGERZONEREPLACE,
      lightReplaceOps: DANGERZONELIGHTREPLACE,
      sourceTriggerOps: SOURCETRIGGERS,
      stretchOps: STRETCH,
      tokenDispositionOps: TOKENDISPOSITION,
      triggerOps: DANGERZONETRIGGERS,
      zoneTypeOps: dangerZoneType.dangerList,
      wallReplaceOps: DANGERZONEWALLREPLACE,
      sceneInactive: scene?.data?.active ? false : true
    } 
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
    let size = game.scenes.get(this.sceneId).dimensions.size;
    pick.B.x = pick.B.x + size;
    pick.B.y = pick.B.y + size;
    $(this.form).find("input[name='scene.start.x']").val(pick.A.x);
    $(this.form).find("input[name='scene.start.y']").val(pick.A.y);
    $(this.form).find("input[name='scene.end.x']").val(pick.B.x);
    $(this.form).find("input[name='scene.end.y']").val(pick.B.y);
  
    dangerZone.log(false, 'User zone selection recorded', {pick: {start: this.pickerStart, end: this.pickerEnd}, final: pick});
  }
  
}
