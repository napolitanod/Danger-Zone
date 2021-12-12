import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {DangerZoneTypeActiveEffectForm} from "./active-effect-form.js";
import {DangerZoneDangerFormAudio} from "./danger-form-audio.js";
import {DangerZoneDangerFormLastingEffect} from "./danger-form-lasting-effect.js";
import {DangerZoneDangerFormBackgroundEffect} from "./danger-form-background-effect.js";
import {DangerZoneDangerFormFluidCanvas} from "./danger-form-fluid-canvas.js";
import {DangerZoneDangerFormForegroundEffect} from "./danger-form-foreground-effect.js";
import {DangerZoneDangerFormLight} from "./danger-form-light.js";
import {DangerZoneDangerFormTokenEffect} from "./danger-form-token-effect.js";
import {DangerZoneDangerFormTokenMove} from "./danger-form-token-move.js";
import {DangerZoneDangerFormTokenResponse} from "./danger-form-token-response.js";
import {DangerZoneDangerFormTokenSays} from "./danger-form-token-says.js";
import {DangerZoneDangerFormWall} from "./danger-form-wall.js";
import {DangerZoneDangerFormWarpgate} from "./danger-form-warpgate.js";
import {sequencerOn,tokenSaysOn, warpgateOn, fluidCanvasOn, taggerOn} from '../index.js';
import {determineMacroList, saveTypes} from './constants.js';

export class DangerZoneTypeForm extends FormApplication {
  constructor(zoneTypeId, ...args) {
    super(...args);
    this.audio,
    this.effect,
    this.backgroundEffect,
    this.system,
    this.fluidCanvas = {},
    this.foregroundEffect,
    this.lastingEffect,
    this.light,
    this.monksActiveTiles,
    this.tokenEffect,
    this.tokenMove,
    this.tokenResponse = {},
    this.tokenSays = {},
    this.wall,
    this.warpgate = {},
    this.zoneTypeId = zoneTypeId;
  }

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.zone-type-form.form-name"),
      id : "danger-zone-type-form",
      template : dangerZone.TEMPLATES.DANGERZONETYPE,
      width : 450,
      height : "auto",
      closeOnSubmit: true
    };
  
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const parent =  clickedElement.parents('[data-id]');
    const partId = parent?.data()?.id;
    let label = '';

    switch (action) {
      case 'edit': {
        label = clickedElement.next().text();
        this._editDangerPart(event, parent, partId, label);
        break;
      }
      case 'delete': {
        label = clickedElement.prev().text();
        new Dialog({
          title: `${game.i18n.localize("DANGERZONE.type-form.clear")} ${label}`,
          content: `${game.i18n.localize("DANGERZONE.type-form.confirm")} ${label}?`,
          buttons: {
            yes: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize("DANGERZONE.yes"),
              callback: async () => {
                parent.removeClass('active');
                await this._deleteDangerPart(event, parent, partId, label);
              }
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
        break;
      }
      default:
        dangerZone.log(false, 'Invalid action detected', action);
    }
  }

  _editDangerPart(event, eventParent, partId, label) {
    event.preventDefault();
    switch(partId){
      case 'active-effect':
        this._activeEffectConfig(event, eventParent)
        break;
      case 'audio':
        new DangerZoneDangerFormAudio(this, eventParent, this.audio).render(true);
        break;
      case 'background-effect':
        new DangerZoneDangerFormBackgroundEffect(this, eventParent, this.backgroundEffect).render(true);
        break;
      case 'fluid-canvas':
        new DangerZoneDangerFormFluidCanvas(this, eventParent, this.fluidCanvas).render(true);
        break;
      case 'foreground-effect':
        new DangerZoneDangerFormForegroundEffect(this, eventParent, this.foregroundEffect).render(true);
        break;
      case 'lasting-effect':
        new DangerZoneDangerFormLastingEffect(this, eventParent, {lastingEffect: this.lastingEffect, monksActiveTiles: this.monksActiveTiles}).render(true);
        break;
      case 'light':
        new DangerZoneDangerFormLight(this, eventParent, this.light).render(true);
        break;
      case 'token-effect':
        new DangerZoneDangerFormTokenEffect(this, eventParent, this.tokenEffect).render(true);
        break;
      case 'token-move':
        new DangerZoneDangerFormTokenMove(this, eventParent, this.tokenMove).render(true);
        break;
      case 'token-response':
        new DangerZoneDangerFormTokenResponse(this, eventParent, this.tokenResponse).render(true);
        break;
      case 'token-says':
        new DangerZoneDangerFormTokenSays(this, eventParent, this.tokenSays).render(true);
        break;
      case 'wall':
        new DangerZoneDangerFormWall(this, eventParent, this.wall).render(true);
        break;
      case 'warpgate':
        new DangerZoneDangerFormWarpgate(this, eventParent, this.warpgate).render(true);
        break;
    }
  }

  _deleteDangerPart(event, eventParent, partId, label) {
    event.preventDefault();
    const danger = new dangerZoneType;
    switch(partId){
      case 'active-effect':
        this.effect = Object.assign(this.effect, danger.options.effect);
        break;
      case 'audio':
        this.audio = Object.assign(this.audio, danger.options.audio)
        break;
      case 'background-effect':
        this.backgroundEffect = Object.assign(this.backgroundEffect, danger.options.backgroundEffect);
        break;
      case 'fluid-canvas':
        this.fluidCanvas = {};
        break;
      case 'foreground-effect':
        this.foregroundEffect = Object.assign(this.foregroundEffect, danger.options.foregroundEffect);
        break;
      case 'lasting-effect':
        this.lastingEffect = Object.assign(this.lastingEffect, danger.options.lastingEffect)
        this.monksActiveTiles = {}
        break;
      case 'light':
        this.light = Object.assign(this.light, danger.options.ambientLight)
        break;
      case 'token-effect':
        this.tokenEffect = Object.assign(this.tokenEffect, danger.options.tokenEffect)
        break;
      case 'token-move':
        this.tokenMove = Object.assign(this.tokenMove, danger.options.tokenMove)
        break;
      case 'token-response':
        this.tokenResponse = {}
        break;
      case 'token-says':
        this.tokenSays = {}
        break;
      case 'wall':
        this.wall = Object.assign(this.wall, danger.options.wall)
        break;
      case 'warpgate':
        this.warpgate = {}
        break;
    }
    eventParent.removeClass('active')
    ui.notifications?.info(`${label} ${game.i18n.localize("DANGERZONE.type-form.cleared.info")}`);
  }

  async _activeEffectConfig(event, eventParent) {
    if (!Object.keys(this.effect).length){  
      const zoneName = $(event.delegateTarget).find('input[name="name"]').val();
      const icon = $(event.delegateTarget).find('input[name="icon"]').val();
      this.effect = {
        label: zoneName,
        icon: icon,
        changes: [],
        disable: false,
        transfer: false,
        origin: this.zoneTypeId
      }
    }

    const effect = {
      documentName: "ActiveEffect",
      data: this.effect,
      testUserPermission: (...args) => { return true},
      parent: {documentName: "Actor"},
      apps: {},
      isOwner: true
    }
    new DangerZoneTypeActiveEffectForm(this, eventParent, effect).render(true);
  }


  getData(options){
    let instance;

    if(!this.zoneTypeId){
      instance = new dangerZoneType;
    } else {
      instance = dangerZoneType.getDangerZoneType(this.zoneTypeId)
    }

    this.effect = instance.options.effect;
    this.audio = instance.options.audio;
    this.backgroundEffect = instance.options.backgroundEffect;
    this.fluidCanvas = instance.options.flags.fluidCanvas ? instance.options.flags.fluidCanvas : {};
    this.foregroundEffect = instance.options.foregroundEffect;
    this.lastingEffect = instance.options.lastingEffect;
    this.light = instance.options.ambientLight;
    this.monksActiveTiles = instance.options.flags?.['monks-active-tiles'] ? instance.options.flags['monks-active-tiles'] : {};
    this.tokenEffect = instance.options.tokenEffect;
    this.tokenMove = instance.options.tokenMove;
    this.tokenResponse = instance.options.flags?.tokenResponse ? instance.options.flags.tokenResponse : {};
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
    this.wall = instance.options.wall;
    this.warpgate = instance.options.flags.warpgate ? instance.options.flags.warpgate : {};

    const dataToSend =  {
      zone: instance,
      macroOps: determineMacroList(),
      hasActiveEffect: Object.keys(this.effect).length ? true : false,
      hasAudio: this.audio?.file ? true : false,
      hasBackgroundEffect: this.backgroundEffect?.file ? true : false,
      hasFluidCanvas: this.fluidCanvas?.type ? true : false,
      hasForegroundEffect: this.foregroundEffect?.file ? true : false,
      hasLastingEffect: this.lastingEffect?.file ? true : false,
      hasLight: (this.light.bright || this.light.dim) ? true : false,
      hasTokenEffect: this.tokenEffect?.file ? true : false,
      hasTokenMove: (this.tokenMove.v.dir || this.tokenMove.hz.dir || this.tokenMove.e.type) ? true : false,
      hasTokenResponse: (this.tokenResponse?.save?.enable || this.tokenResponse?.damage?.enable) ? true : false,
      hasTokenSays: this.tokenSays?.fileType ? true : false,
      hasWall: (this.wall?.top || this.wall?.bottom || this.wall?.left || this.wall?.right) ? true : false,
      hasWarpgate: this.warpgate?.actor ? true : false,
      tokenSaysOnNot: !tokenSaysOn, 
      sequencerOnNot: !sequencerOn,
      warpgateOnNot: !warpgateOn, 
      fluidCanvasOnNot: !fluidCanvasOn, 
      taggerOnNot: !taggerOn,
      tokenResponseOnNot: Object.keys(saveTypes()).length ? false : true
    } 
    return dataToSend
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);

    expandedData.options.audio = this.audio; 
    expandedData.options.effect = this.effect; 
    expandedData.options.backgroundEffect = this.backgroundEffect;
    expandedData.options.foregroundEffect = this.foregroundEffect;
    expandedData.options.lastingEffect = this.lastingEffect;
    expandedData.options.ambientLight = this.light;
    expandedData.options.tokenEffect = this.tokenEffect;
    expandedData.options.tokenMove = this.tokenMove;
    expandedData.options.wall = this.wall;
    //set integrations
    expandedData.options['flags']={};
    if(Object.keys(this.fluidCanvas).length) {expandedData.options.flags['fluidCanvas'] = this.fluidCanvas}
    if(Object.keys(this.monksActiveTiles).length) {expandedData.options.flags['monks-active-tiles'] = this.monksActiveTiles}
    if(Object.keys(this.tokenResponse).length) {expandedData.options.flags['tokenResponse'] = this.tokenResponse}
    if(Object.keys(this.tokenSays).length) {expandedData.options.flags['tokenSays'] = this.tokenSays}
    if(Object.keys(this.warpgate).length) {expandedData.options.flags['warpgate'] = this.warpgate}

    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
    dangerZone.DangerZoneTypesForm.refresh();
  }

}
