import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions} from './dimensions.js';
import {DANGERZONECONFIG, sceneOps, regionOps} from './constants.js';
import {DangerZoneForm} from './zone-form.js';

export class DangerZoneSceneForm extends FormApplication {
  constructor(app, sceneId, ...args) {
      super(...args);
      this.parent = app,
      this.sceneId = sceneId;
      
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.scene.header.name"),
      id : "danger-zone-scene",
      template : DANGERZONECONFIG.TEMPLATE.ZONESCENE,
      width : 800,
      height : "auto",
      closeOnSubmit: false,
      submitOnChange: true, 
      tabs:[]
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const zoneId = clickedElement.parents('[data-id]')?.data()?.id;

    switch (action) {
      case 'add': {
          new DangerZoneForm(this, '', this.sceneId,'').render(true);
          this.refresh();
          break;
      }
      case 'copy': {
        new DangerZoneZoneCopyForm(this, this.sceneId, '').render(true);
        break;
      }
      case 'edit': {
        new DangerZoneForm(this, zoneId, this.sceneId, '').render(true);
        break;
      }
      case 'delete': {
        const choice = await foundry.applications.api.DialogV2.confirm({
          content: `${game.i18n.localize("DANGERZONE.delete")}?`,
          rejectClose: false,
          modal: true
        });
        if(choice){
          await dangerZone.deleteZoneFromScene(zoneId, this.sceneId)
          this.refresh();
        }
        break;
      }
      default:
        dangerZone.log(false, 'Invalid action detected', action);
    }
  }

  refresh() {
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('mouseenter', ".scene-config .danger-zone-details", this._showZoneHighlight.bind(this));
    html.on('mouseleave', ".scene-config .danger-zone-details", this._hideZoneHighlight.bind(this));
   }

  getData(options){
    return {
        dangerZones: dangerZone.getAllZonesFromScene(this.sceneId, {enabled: false, typeRequired: false, triggerRequired: false}).sort((a, b) => a.title.localeCompare(b.title)),
        sceneId: this.sceneId,
        regions: regionOps(this.sceneId)
    }
  }

  async _updateObject(event, formData) {
    return
  }

  _showZoneHighlight(event){
    const hov = $(event.currentTarget);
    const zoneId = hov.parents('[data-id]')?.data()?.id;
    if(zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.grid?.type){
        dangerZoneDimensions.addHighlightZone(zoneId, this.sceneId);
      }
  } 

  _hideZoneHighlight(event){
    const hov = $(event.currentTarget);
    const zoneId = hov.parents('[data-id]')?.data()?.id;
      if(zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.grid?.type){
          dangerZoneDimensions.destroyHighlightZone(zoneId);
      }
  }
}

export class DangerZoneZoneCopyForm extends FormApplication {
  constructor(app, sceneId, sourceSceneId, ...args) {
    super(...args);
    this.sceneId = sceneId,
    this.sourceSceneId = sourceSceneId,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.copy-zone.label"),
          id : "danger-zone-zone-copy",
          template : DANGERZONECONFIG.TEMPLATE.ZONECOPY,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        sceneId: this.sceneId,
        sourceSceneId: this.sourceSceneId,
        sceneOps: sceneOps(),
        zoneOps: dangerZone.getZoneList(this.sourceSceneId)
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('change', '#danger-zone-copy-source-scene',(event) => {
        this.sourceSceneId = event.currentTarget.value;
        this.render(true);
      });
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      if(expandedData.targetSceneId && expandedData.sceneId && expandedData.zoneId){
        await dangerZone.copyZone(expandedData.sceneId, expandedData.zoneId, expandedData.targetSceneId)
      }
      if(this.parent){this.parent.render(true)}
    }
}