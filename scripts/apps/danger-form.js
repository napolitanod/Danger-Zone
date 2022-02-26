import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {daeOn, fluidCanvasOn, midiQolOn, monksActiveTilesOn, perfectVisionOn, sequencerOn, taggerOn, timesUpOn, tokenSaysOn, warpgateOn} from '../index.js';
import {actorOps, AMBIENTLIGHTCLEAROPS, animationTypes, DAMAGEONSAVE, damageTypes, DANGERZONELIGHTREPLACE, DANGERZONEREPLACE, DANGERZONEWALLREPLACE, determineMacroList,  dirTypes, doorTypes, ELEVATIONMOVEMENT, FLUIDCANVASTYPES, HORIZONTALMOVEMENT, MOVETYPES, SAVERESULT, saveTypes, SENSETYPES, SOURCETREATMENT, STRETCH, TILESBLOCK, TILEOCCLUSIONMODES, TIMESUPMACROREPEAT, TOKENDISPOSITION, TOKENSAYSTYPES, VERTICALMOVEMENT, WALLSBLOCK} from './constants.js';
import {stringToObj} from './helpers.js';

export class DangerForm extends FormApplication {
  constructor(dangerId, parent, ...args) {
    super(...args);
    this.parent = parent,
    this.audio,
    this.effect,
    this.backgroundEffect,
    this.system,
    this.fluidCanvas = {},
    this.foregroundEffect,
    this.globalZone = {},
    this.lastingEffect,
    this.light,
    this.monksActiveTiles,
    this.mutate,
    this.tokenEffect,
    this.tokenMove,
    this.tokenResponse = {},
    this.tokenSays = {},
    this.wall,
    this.warpgate = {},
    this.dangerId = dangerId;
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
        new DangerZoneDangerFormActiveEffect(this, eventParent, this.effect).render(true);
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
      case 'global-zone':
        new DangerZoneDangerFormGlobalZone(this, eventParent, this.globalZone).render(true);
        break;
      case 'lasting-effect':
        new DangerZoneDangerFormLastingEffect(this, eventParent, {lastingEffect: this.lastingEffect, monksActiveTiles: this.monksActiveTiles}).render(true);
        break;
      case 'light':
        new DangerZoneDangerFormLight(this, eventParent, this.light).render(true);
        break;
      case 'mutate':
        new DangerZoneDangerFormMutate(this, eventParent, this.mutate).render(true);
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
        this.effect = {};
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
      case 'global-zone':
        this.globalZone = {};
        break;
      case 'lasting-effect':
        this.lastingEffect = Object.assign(this.lastingEffect, danger.options.lastingEffect)
        this.monksActiveTiles = {}
        break;
      case 'light':
        this.light = Object.assign(this.light, danger.options.ambientLight)
        break;
      case 'mutate':
        this.mutate = {}
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

  getData(options){
    let instance;

    if(!this.dangerId){
      instance = new dangerZoneType;
    } else {
      instance = dangerZoneType.getDanger(this.dangerId)
    }

    this.effect = instance.options.effect;
    this.audio = instance.options.audio;
    this.backgroundEffect = instance.options.backgroundEffect;
    this.fluidCanvas = instance.options.flags.fluidCanvas ? instance.options.flags.fluidCanvas : {};
    this.foregroundEffect = instance.options.foregroundEffect;
    this.globalZone = instance.options.globalZone ? instance.options.globalZone : {};
    this.lastingEffect = instance.options.lastingEffect;
    this.light = instance.options.ambientLight;
    this.monksActiveTiles = instance.options.flags?.['monks-active-tiles'] ? instance.options.flags['monks-active-tiles'] : {};
    this.mutate = instance.options.flags?.mutate ? instance.options.flags.mutate : {};
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
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
      hasGlobalZone: Object.keys(this.globalZone).length ? true : false,
      hasLastingEffect: this.lastingEffect?.file ? true : false,
      hasLight: (this.light.bright || this.light.dim) ? true : false,
      hasMutate: Object.keys(this.mutate).length ? true : false,
      hasTokenEffect: this.tokenEffect?.file ? true : false,
      hasTokenMove: (this.tokenMove.v.dir || this.tokenMove.hz.dir || this.tokenMove.e.type || this.tokenMove.sToT) ? true : false,
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
    expandedData.options.globalZone = this.globalZone;
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
    if(Object.keys(this.mutate).length) {expandedData.options.flags['mutate'] = this.mutate}
    if(Object.keys(this.warpgate).length) {expandedData.options.flags['warpgate'] = this.warpgate}

    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
    dangerZone.initializeTriggerButtons();
    this.parent.refresh();
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
          height: "600px",
          title : game.i18n.localize("DANGERZONE.zone-active-effect-form.form-name")
        });
      }

    getData(options) {
      const data = super.getData(options);
      return data
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
        sourceOps: SOURCETREATMENT,
        timesUpOn: daeOn ? timesUpOn : false,
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
      if (!this.data.hasOwnProperty('label')){
        const zoneName = $(this.parent.form).find('input[name="name"]').val();
        const icon = $(this.parent.form).find('input[name="icon"]').val();
        this.data = {
          label: zoneName,
          icon: icon,
          changes: [],
          disabled: false,
          transfer: false,
          origin: this.parent.dangerId
        }
      }
  
      const effect = {
        documentName: "ActiveEffect",
        data: this.data,
        testUserPermission: (...args) => { return true},
        parent: {documentName: "Actor"},
        apps: {},
        isOwner: true
      }
      new DangerZoneActiveEffectForm(this, eventParent, this.parent.dangerId, effect).render(true);
    }

    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.data = Object.assign(this.data, expandedData);
      this.parent.effect = this.data;
      this.eventParent.addClass('active');
    }
}

class DangerZoneDangerFormAudio extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.audio.label"),
          id : "danger-zone-danger-form-audio",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERAUDIO,
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
      html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    _random(checked){
      const group = $(this.form).find("#dz-audio-file")
      if(checked){
        group.addClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.audio.playlist.label"))
        group.find('input').attr("placeholder", "")
      } else {
        group.removeClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.audio.file.label"))
        group.find('input').attr("placeholder", game.i18n.localize("DANGERZONE.type-form.audio.file.placeholder"))
      }
    }

    async _handleButtonClick(event) {
      const clickedElement = $(event.currentTarget);
      const action = clickedElement.data().action;  
      switch (action) {
        case 'random': {
          this._random(event.currentTarget.checked)
          break;
        }
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.audio = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormBackgroundEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.backgroundEffect.label"),
          id : "danger-zone-danger-background-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERBACKGROUNDEFFECT,
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
      this.parent.backgroundEffect = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormFluidCanvas extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.fluidCanvas.label"),
          id : "danger-zone-danger-fluid-canvas",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERFLUIDCANVAS,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        fluidCanvasOps: FLUIDCANVASTYPES
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.fluidCanvas = expandedData;
      if(expandedData.type){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormForegroundEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.foregroundEffect.label"),
          id : "danger-zone-danger-foreground-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERFOREGROUNDEFFECT,
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
      this.parent.foregroundEffect = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
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
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        "zone": this.data,
        actorOps: actorOps(),
        replaceOps: DANGERZONEREPLACE,
        lightReplaceOps: DANGERZONELIGHTREPLACE,
        stretchOps: STRETCH,
        tokenDispositionOps: TOKENDISPOSITION,
        wallReplaceOps: DANGERZONEWALLREPLACE
      } 
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.globalZone = expandedData;
      this.eventParent.addClass('active');
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
      return {
        lastingEffect: this.data.lastingEffect,
        macroOps: determineMacroList(),
        monksActiveTiles: this.data.monksActiveTiles,
        monksActiveTilesOnNot: !monksActiveTilesOn,
        occlusionModesOps: TILEOCCLUSIONMODES
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.lastingEffect = expandedData.lastingEffect;
      this.parent.monksActiveTiles = (expandedData.monksActiveTiles && Object.keys(expandedData.monksActiveTiles).length) ? expandedData.monksActiveTiles : {}
    
      if(expandedData.lastingEffect.file){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormLight extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.light.label"),
          id : "danger-zone-danger-light",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERLIGHT,
          height : "auto",
          width: 425,
          closeOnSubmit: true,
          tabs : [
            {navSelector: ".tabs", contentSelector: "form", initial: "basic"}
          ]
        });
      }

    getData(options) {
      return {
        clearOps: AMBIENTLIGHTCLEAROPS,
        colorationOps: AdaptiveLightingShader.COLORATION_TECHNIQUES,
        data: this.data,
        hasPerfectVision: perfectVisionOn,
        lightAnimations: animationTypes()
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.light = expandedData;
      if(expandedData.flags?.['perfect-vision']?.priority === undefined && !expandedData.flags?.['perfect-vision']?.sightLimit) this.parent.light.flags = {}
      if(expandedData.dim || expandedData.bright){this.eventParent.addClass('active')};
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
      if (expandedData.token) stringToObj(expandedData.token, 'Token', true)
      if (expandedData.actor) stringToObj(expandedData.actor, 'Actor', true)
      if (expandedData.embedded) stringToObj(expandedData.embedded, 'Embedded', true)
      this.parent.mutate = expandedData;
      this.eventParent.addClass('active');
    }
}

class DangerZoneDangerFormTokenEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenEffect.label"),
          id : "danger-zone-danger-token-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENEFFECT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenEffect = expandedData;
      if(expandedData.file){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormTokenMove extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.tokenMove.label"),
          id : "danger-zone-danger-token-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERTOKENMOVE,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return{
        data: this.data,
        elevationTypeOps: ELEVATIONMOVEMENT,
        horizontalDirOps: HORIZONTALMOVEMENT,
        tilesBlockOps: TILESBLOCK,
        wallsBlockOps: WALLSBLOCK,
        verticalDirOps: VERTICALMOVEMENT,
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenMove = expandedData;
      if(expandedData.v.dir || expandedData.hz.dir || expandedData.e.type || expandedData.sToT){this.eventParent.addClass('active')};
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
        sourceOps: SOURCETREATMENT,
        tokenSaysOnNot: !tokenSaysOn, 
        sequencerOnNot: !sequencerOn,
        midiQolOnNot: !midiQolOn
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenResponse = expandedData;
      if(expandedData.save?.enable || expandedData.damage?.enable){this.eventParent.addClass('active')};
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
        sourceOps: SOURCETREATMENT
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.tokenSays = expandedData;
      if(expandedData.fileType){this.eventParent.addClass('active')};
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
      if(expandedData.actor){this.eventParent.addClass('active')};
    }
}

class DangerZoneDangerFormWall extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.wall.label"),
          id : "danger-zone-danger-wall",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERWALL,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        moveTypes: MOVETYPES,
        senseTypes: SENSETYPES,
        dirTypes: dirTypes(),
        doorTypes: doorTypes()
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.wall = expandedData;
      if(expandedData.top ||expandedData.left ||expandedData.right ||expandedData.bottom){this.eventParent.addClass('active')};
    }
}