import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {daeOn, fluidCanvasOn, fxMasterOn, itemPileOn, midiQolOn, monksActiveTilesOn, perfectVisionOn, sequencerOn, taggerOn, timesUpOn, tokenSaysOn, warpgateOn} from '../index.js';
import {actorOps, AMBIENTLIGHTCLEAROPS, animationTypes, COMBATINITIATIVE, DAMAGEONSAVE, damageTypes, DANGERZONELIGHTREPLACE, DANGERZONEREPLACE, DANGERZONESOUNDREPLACE, DANGERZONEWEATHERREPLACE, ITEMTARGET, TRIGGEROPERATION, DANGERZONEWALLREPLACE, determineMacroList,  dirTypes, doorTypes, ELEVATIONMOVEMENT, FLUIDCANVASTYPES, getCompendiumOps, HORIZONTALMOVEMENT, MOVETYPES, SAVERESULT, saveTypes, SCENEFOREGROUNDELEVATIONMOVEMENT, SCENEGLOBALILLUMINATION, SENSETYPES, SOURCEDANGERLOCATION, SOURCETREATMENT, STRETCH, TILESBLOCK, TILEOCCLUSIONMODES, TIMESUPMACROREPEAT, TOKENDISPOSITION, TOKENSAYSTYPES, VERTICALMOVEMENT, WALLSBLOCK, weatherTypes, weatherParameters} from './constants.js';
import {stringToObj} from './helpers.js';

export class DangerForm extends FormApplication {
  constructor(dangerId, parent, ...args) {
    super(...args);
    this.parent = parent,
    this.audio,
    this.combat,
    this.effect,
    this.backgroundEffect,
    this.system,
    this.fluidCanvas = {},
    this.foregroundEffect,
    this.globalZone = {},
    this.item = {},
    this.lastingEffect,
    this.light,
    this.monksActiveTiles,
    this.mutate,
    this.scene,
    this.sound,
    this.sourceEffect,
    this.tokenEffect,
    this.tokenMove,
    this.tokenResponse = {},
    this.tokenSays = {},
    this.wall,
    this.warpgate = {},
    this.weather = {},
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
      case 'combat':
        new DangerZoneDangerFormCombat(this, eventParent, this.combat).render(true);
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
      case 'item':
        new DangerZoneDangerFormItem(this, eventParent, this.item).render(true);
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
      case 'scene':
        new DangerZoneDangerFormScene(this, eventParent, this.scene).render(true);
        break;
      case 'sound':
        new DangerZoneDangerFormSound(this, eventParent, this.sound).render(true);
        break;
      case 'source-effect':
        new DangerZoneDangerFormSourceEffect(this, eventParent, this.sourceEffect).render(true);
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
      case 'weather':
        new DangerZoneDangerFormWeather(this, eventParent, this.weather).render(true);
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
      case 'combat':
        this.combat = Object.assign(this.combat, danger.options.combat)
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
      case 'item':
        this.item = Object.assign(this.item, danger.options.item)
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
      case 'scene':
        this.scene = Object.assign(this.scene, danger.options.scene)
        break;
      case 'sound':
        this.sound = Object.assign(this.sound, danger.options.sound)
        break;
      case 'source-effect':
        this.sourceEffect = Object.assign(this.sourceEffect, danger.options.sourceEffect);
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
      case 'weather':
        this.weather = {}
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
    this.combat = instance.options.combat;
    this.fluidCanvas = instance.options.flags.fluidCanvas ? instance.options.flags.fluidCanvas : {};
    this.foregroundEffect = instance.options.foregroundEffect;
    this.globalZone = instance.options.globalZone ? instance.options.globalZone : {};
    this.item = instance.options.item;
    this.lastingEffect = instance.options.lastingEffect;
    this.light = instance.options.ambientLight;
    this.monksActiveTiles = instance.options.flags?.['monks-active-tiles'] ? instance.options.flags['monks-active-tiles'] : {};
    this.mutate = instance.options.flags?.mutate ? instance.options.flags.mutate : {};
    this.scene = instance.options.scene;
    this.sound = instance.options.sound;
    this.sourceEffect = instance.options.sourceEffect;
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
    this.tokenEffect = instance.options.tokenEffect;
    this.tokenMove = instance.options.tokenMove;
    this.tokenResponse = instance.options.flags?.tokenResponse ? instance.options.flags.tokenResponse : {};
    this.tokenSays = instance.options.flags.tokenSays ? instance.options.flags.tokenSays : {};
    this.wall = instance.options.wall;
    this.warpgate = instance.options.flags.warpgate ? instance.options.flags.warpgate : {};
    this.weather = instance.options.flags.weather ? instance.options.flags.weather : {};

    const dataToSend =  {
      zone: instance,
      macroOps: determineMacroList(),
      hasActiveEffect: Object.keys(this.effect).length ? true : false,
      hasAudio: this.audio?.file ? true : false,
      hasBackgroundEffect: this.backgroundEffect?.file ? true : false,
      hasCombat: instance.hasCombat ? true : false,
      hasFluidCanvas: this.fluidCanvas?.type ? true : false,
      hasForegroundEffect: this.foregroundEffect?.file ? true : false,
      hasGlobalZone: Object.keys(this.globalZone).length ? true : false,
      hasItem: this.item?.name ? true : false,
      hasLastingEffect: this.lastingEffect?.file ? true : false,
      hasLight: (this.light.bright || this.light.dim) ? true : false,
      hasMutate: Object.keys(this.mutate).length ? true : false,
      hasScene: this.scene.active ? true : false,
      hasSound: this.sound?.file ? true : false,
      hasSourceEffect: this.sourceEffect?.file ? true : false,
      hasTokenEffect: this.tokenEffect?.file ? true : false,
      hasTokenMove: (this.tokenMove.v.dir || this.tokenMove.hz.dir || this.tokenMove.e.type || this.tokenMove.sToT) ? true : false,
      hasTokenResponse: (this.tokenResponse?.save?.enable || this.tokenResponse?.damage?.enable) ? true : false,
      hasTokenSays: this.tokenSays?.fileType ? true : false,
      hasWall: (this.wall?.top || this.wall?.bottom || this.wall?.left || this.wall?.right) ? true : false,
      hasWarpgate: this.warpgate?.actor ? true : false,
      hasWeather: this.weather.type ? true : false,
      tokenSaysOnNot: !tokenSaysOn, 
      sequencerOnNot: !sequencerOn,
      warpgateOnNot: !warpgateOn, 
      fluidCanvasOnNot: !fluidCanvasOn, 
      fxMasterOnNot: !fxMasterOn, 
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
    expandedData.options.combat = this.combat; 
    expandedData.options.foregroundEffect = this.foregroundEffect;
    expandedData.options.globalZone = this.globalZone;
    expandedData.options.item = this.item;
    expandedData.options.lastingEffect = this.lastingEffect;
    expandedData.options.ambientLight = this.light;
    expandedData.options.scene = this.scene;
    expandedData.options.sound = this.sound;
    expandedData.options.sourceEffect = this.sourceEffect;
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
    if(Object.keys(this.weather).length) {expandedData.options.flags['weather'] = this.weather}

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
      return {
        data: this.object,
        isActorEffect: true,
        isItemEffect: false,
        submitText: "EFFECT.Submit",
        modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
          obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
          return obj;
        }, {})
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
  
      const effect = Object.assign(this.data, {
        documentName: "ActiveEffect",
        testUserPermission: (...args) => { return true},
        parent: {documentName: "Actor"},
        apps: {},
        isOwner: true,
        uuid: `ActiveEffect.${this.parent.dangerId}`
      });

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
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
    }
}

class DangerZoneDangerFormCombat extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.combat.label"),
          id : "danger-zone-danger-combat",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERCOMBAT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        initiativeOps: COMBATINITIATIVE,
        isInitiativeRoll: this.data.initiative.type === 'R' ? true : false,
        isInitiativeSet: this.data.initiative.type === 'S' ? true : false,
        warpgateOnNot: !warpgateOn
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('change', "[data-action]", this._handleChange.bind(this));
    }

    async _handleChange(event) {
      const action = $(event.currentTarget).data().action, value = event.currentTarget.value;
      switch (action) {
        case 'initiative-change': 
          const op = document.getElementById(`dz-initiative-value`);
          value === 'S' ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
          const pc = document.getElementById(`dz-initiative-player`);
          value === 'R' ? pc.classList.remove('dz-hidden') : pc.classList.add('dz-hidden')
          this.setPosition()
          break;
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.combat = expandedData;
      (expandedData.targets.add || expandedData.source.add || expandedData.spawn || expandedData.new || expandedData.initiative.type || expandedData.start) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    _random(checked){
      const group = $(this.form).find("#dz-backgroundEffect-audio-file")
      if(checked){
        group.addClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.backgroundEffect.audio.playlist.label"))
        group.find('input').attr("placeholder", "")
      } else {
        group.removeClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.backgroundEffect.audio.file.label"))
        group.find('input').attr("placeholder", game.i18n.localize("DANGERZONE.type-form.backgroundEffect.audio.file.placeholder"))
      }
    }

    async _handleButtonClick(event) {
      const clickedElement = $(event.currentTarget);
      const action = clickedElement.data().action;  
      switch (action) {
        case 'audio.random': {
          this._random(event.currentTarget.checked)
          break;
        }
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.backgroundEffect = expandedData;
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      expandedData.type ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      return {
        data: this.data,
        taggerOnNot: !taggerOn,
        targetOps: SOURCEDANGERLOCATION
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.foregroundEffect = expandedData;
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      return {
        "zone": this.data,
        actorOps: actorOps(),
        replaceOps: DANGERZONEREPLACE,
        lightReplaceOps: DANGERZONELIGHTREPLACE,
        stretchOps: STRETCH,
        tokenDispositionOps: TOKENDISPOSITION,
        operationOps: TRIGGEROPERATION,
        soundReplaceOps: DANGERZONESOUNDREPLACE,
        wallReplaceOps: DANGERZONEWALLREPLACE,
        weatherReplaceOps: DANGERZONEWEATHERREPLACE
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
          const op = document.getElementById(`dz-operation`);
          val > 1 ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
          this.setPosition()
          break;
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.globalZone = expandedData;
      this.eventParent.addClass('active');
    }
}

class DangerZoneDangerFormItem extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.item.label"),
          id : "danger-zone-danger-item",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERITEM,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        actionOps: ITEMTARGET,
        compendiumOps: getCompendiumOps('item'),
        data: this.data,
        itemPileOnNot: !itemPileOn,
        sourceOps: SOURCETREATMENT,
        taggerOnNot: !taggerOn
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('change', "[data-action]", this._handleChange.bind(this));
    }

    async _handleChange(event) {
      const action = $(event.currentTarget).data().action, checked = event.currentTarget.checked;
      switch (action) {
        case 'pile-change': 
          const op = document.getElementById(`dz-token-fields`);
          !checked ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
          this.setPosition()
          break;
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.item = expandedData;
      expandedData.name ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
        occlusionModesOps: TILEOCCLUSIONMODES,
        taggerOnNot: !taggerOn
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.lastingEffect = expandedData.lastingEffect;
      this.parent.monksActiveTiles = (expandedData.monksActiveTiles && Object.keys(expandedData.monksActiveTiles).length) ? expandedData.monksActiveTiles : {}
      expandedData.lastingEffect.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
        colorationOps: AdaptiveLightingShader.SHADER_TECHNIQUES,
        data: this.data,
        hasPerfectVision: perfectVisionOn,
        lightAnimations: animationTypes(),
        taggerOnNot: !taggerOn
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.light = expandedData;
      if(expandedData.flags?.['perfect-vision']?.priority === undefined && !expandedData.flags?.['perfect-vision']?.sightLimit) this.parent.light.flags = {}
      (expandedData.dim || expandedData.bright) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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

class DangerZoneDangerFormScene extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.scene.label"),
          id : "danger-zone-danger-scene",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERSCENE,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return{
        data: this.data,
        foregroundElevationTypeOps: SCENEFOREGROUNDELEVATIONMOVEMENT,
        globalIlluminationOps: SCENEGLOBALILLUMINATION
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.scene = expandedData;
      expandedData.active ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
    }
}

class DangerZoneDangerFormSound extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.sound.label"),
          id : "danger-zone-danger-form-sound",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERSOUND,
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
      const group = $(this.form).find("#dz-sound-file")
      if(checked){
        group.addClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.sound.playlist.label"))
        group.find('input').attr("placeholder", "")
      } else {
        group.removeClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.sound.file.label"))
        group.find('input').attr("placeholder", game.i18n.localize("DANGERZONE.type-form.sound.file.placeholder"))
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
      this.parent.sound = expandedData;
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
    }
}

class DangerZoneDangerFormSourceEffect extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.sourceEffect.label"),
          id : "danger-zone-danger-source-effect",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERSOURCEEFFECT,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data,
        taggerOnNot: !taggerOn,
        targetOps: SOURCEDANGERLOCATION
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    _random(checked){
      const group = $(this.form).find("#dz-sourceEffect-audio-file")
      if(checked){
        group.addClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.sourceEffect.audio.playlist.label"))
        group.find('input').attr("placeholder", "")
      } else {
        group.removeClass('hidden-picker')
        group.children('label').html(game.i18n.localize("DANGERZONE.type-form.sourceEffect.audio.file.label"))
        group.find('input').attr("placeholder", game.i18n.localize("DANGERZONE.type-form.sourceEffect.audio.file.placeholder"))
      }
    }

    async _handleButtonClick(event) {
      const clickedElement = $(event.currentTarget);
      const action = clickedElement.data().action;  
      switch (action) {
        case 'audio.random': {
          this._random(event.currentTarget.checked)
          break;
        }
      }
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.sourceEffect = expandedData;
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      expandedData.file ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      (expandedData.v.dir || expandedData.hz.dir || expandedData.e.type || expandedData.sToT) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      (expandedData.save?.enable || expandedData.damage?.enable) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
        sourceOps: SOURCETREATMENT,
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
      expandedData.fileType ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      expandedData.actor ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      (expandedData.top ||expandedData.left ||expandedData.right ||expandedData.bottom) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      expandedData.type ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
    }
}