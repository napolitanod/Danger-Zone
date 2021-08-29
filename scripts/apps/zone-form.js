import { dangerZone, zone } from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {DANGERZONETRIGGERS} from './trigger-handler.js';
import {DANGERZONEREPLACE} from './workflow.js';

export class DangerZoneForm extends FormApplication {
  constructor(app, zoneId, sceneId, ...args) {
      super(...args);
      this.parent = app;
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
      width : 500,
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

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
  }

  getData(options){
    let zoneId = this.zoneId, instance;

    if(!zoneId){
      instance = new zone(this.sceneId);
    } else {
      instance = dangerZone.getZoneFromScene(zoneId, this.sceneId);
    }

    return {
      "zone": instance,
      replaceOps: DANGERZONEREPLACE,
      triggerOps: DANGERZONETRIGGERS,
      zoneTypeOps: dangerZoneType.dangerZoneTypeList
    } 
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData); 
    await dangerZone.updateSceneZone(expandedData.zoneId, expandedData);
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
      this.pickerStart = selection;
      let y = new Promise(function(resolve, reject){
        ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-zone-end"));
        canvas.app.stage.once('pointerdown', event => {
          let selection = event.data.getLocalPosition(canvas.app.stage); 
          resolve(selection);
          });
      }).then((selection)=>{
        this.pickerEnd = selection;
        currentLayer.activate();
        this.maximizeForms();
        this.pickToForm();
      });
    });  
  }

  async minimizeForms(){
    if (!this._minimized){await this.minimize()}
    if (!this.parent?._minimized){await this.parent?.minimize()}
  }

  async maximizeForms(){
    if (!this.parent?._maximized){await this.parent?.maximize()}
    if (!this._maximized){await this.maximize()}  
  }

  pickToForm(){
    let pick = dangerZoneDimensions.conformBoundary(this.pickerStart.x, this.pickerStart.y, this.pickerEnd.x, this.pickerEnd.y);
    let size = game.scenes.get(this.sceneId).dimensions.size;
    pick.end.x = pick.end.x + size;
    pick.end.y = pick.end.y + size;
    $(this.form).find("input[name='scene.start.x']").val(pick.start.x);
    $(this.form).find("input[name='scene.start.y']").val(pick.start.y);
    $(this.form).find("input[name='scene.end.x']").val(pick.end.x);
    $(this.form).find("input[name='scene.end.y']").val(pick.end.y);
  
    dangerZone.log(false, 'User zone selection recorded', {pick: {start: this.pickerStart, end: this.pickerEnd}, final: pick});
  }
  
}
