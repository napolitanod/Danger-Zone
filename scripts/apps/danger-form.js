import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {actorOps, AMBIENTLIGHTCLEAROPS, animationTypes, CANVASTYPES, COMBATINITIATIVE, DAMAGEONSAVE, damageTypes, DANGERZONELIGHTREPLACE, DANGERZONEREPLACE, DANGERZONEREGIONREPLACE, DANGERZONESOUNDREPLACE, DANGERZONEWEATHERREPLACE, DOORSTATES, ITEMTARGET, TRIGGEROPERATION, DANGERZONEWALLREPLACE,determineMacroList, determineMacroListUuid,  REGIONSHAPETYPEOPTIONS, dirTypes, doorTypes, ELEVATIONMOVEMENT, getCompendiumOps, HORIZONTALMOVEMENT, MIRRORIMAGEOPTIONS, MIRRORROTATIONOPTIONS, MOVETYPES, OFFSETOPTIONS, regionEvents, REGIONVISIBILITY, SAVERESULT, saveTypes, SCENEFOREGROUNDELEVATIONMOVEMENT, SCENEGLOBALILLUMINATION, SENSETYPES, SOURCEDANGERLOCATION, SOURCEAREATARGET, SOURCEAREAGLOBALZONE, SOURCETREATMENT, STRETCH, TILESBLOCK, TILEOCCLUSIONMODES, TIMESUPMACROREPEAT, TOKENDISPOSITION, TOKENSAYSTYPES, VERTICALMOVEMENT, WALLSBLOCK, weatherTypes, weatherParameters, WORLDZONE} from './constants.js';
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
    this.canvas = {},
    this.foregroundEffect,
    this.globalZone = {},
    this.item = {},
    this.lastingEffect,
    this.light,
    this.monksActiveTiles,
    this.mutate,
    this.region,
    this.rolltable,
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
        const choice = await foundry.applications.api.DialogV2.confirm({
          content: `${game.i18n.localize("DANGERZONE.type-form.clear")} ${label}?`,
          rejectClose: false,
          modal: true
        });
        if(choice){
          parent.removeClass('active');
          this._deleteDangerPart(event, parent, partId, label);
        }
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
      case 'canvas':
        new DangerZoneDangerFormCanvas(this, eventParent, this.canvas).render(true);
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
      case 'region':
        new DangerZoneDangerFormRegion(this, eventParent, this.region).render(true);
        break;
      case 'rolltable':
        new DangerZoneDangerFormRolltable(this, eventParent, this.rolltable).render(true);
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
      case 'canvas':
        this.canvas = Object.assign(this.canvas, danger.options.canvas);
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
      case 'region':
        this.region = Object.assign(this.region, danger.options.region)
        break;
      case 'rolltable':
        this.rolltable = Object.assign(this.rolltable, danger.options.rolltable)
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
    this.canvas = instance.options.canvas;
    this.foregroundEffect = instance.options.foregroundEffect;
    this.globalZone = instance.options.globalZone ?? {};
    this.item = instance.options.item;
    this.lastingEffect = instance.options.lastingEffect;
    this.light = instance.options.ambientLight;
    this.monksActiveTiles = instance.options.flags?.['monks-active-tiles'] ? instance.options.flags['monks-active-tiles'] : {};
    this.mutate = instance.options.flags?.mutate ? instance.options.flags.mutate : {};
    this.region = instance.options.region;
    this.rolltable = instance.options.rolltable;
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
      migration: dangerZone.MIGRATION.DANGER,
      macroOps: determineMacroList(),
      hasActiveEffect: Object.keys(this.effect).length ? true : false,
      hasAudio: this.audio?.file ? true : false,
      hasBackgroundEffect: this.backgroundEffect?.file ? true : false,
      hasCombat: instance.hasCombat ? true : false,
      hasCanvas: (this.canvas.effect.type || this.canvas.pan.active) ? true : false,
      hasForegroundEffect: this.foregroundEffect?.file ? true : false,
      hasGlobalZone: Object.keys(this.globalZone).length && this.globalZone?.enabled ? true : false,
      hasItem: this.item?.name?.length ? true : false,
      hasLastingEffect: this.lastingEffect?.file ? true : false,
      hasLight: (this.light.bright || this.light.dim) ? true : false,
      hasMutate: this.mutate?.permanent,
      hasRegion: this.region?.active ? true : false,
      hasRolltable: this.rolltable.name ? true : false,
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
      activeEffectOnNot: !dangerZone.MODULES.activeEffectOn,
      tokenSaysOnNot: !dangerZone.MODULES.tokenSaysOn, 
      sequencerOnNot: !dangerZone.MODULES.sequencerOn,
      portalOnNot: !dangerZone.MODULES.portalOn, 
      canvasOnNot: !dangerZone.MODULES.sequencerOn, 
      taggerOnNot: !dangerZone.MODULES.taggerOn,
      tokenResponseOnNot: Object.keys(saveTypes()).length ? false : true
    } 
    
    dangerZone.log(false, 'Danger Form Rendered', this);
    return dataToSend
  }
  
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);

    expandedData.options.audio = this.audio; 
    expandedData.options.effect = this.effect; 
    expandedData.options.backgroundEffect = this.backgroundEffect;
    expandedData.options.canvas = this.canvas;
    expandedData.options.combat = this.combat; 
    expandedData.options.foregroundEffect = this.foregroundEffect;
    expandedData.options.globalZone = this.globalZone;
    expandedData.options.item = this.item;
    expandedData.options.lastingEffect = this.lastingEffect;
    expandedData.options.ambientLight = this.light;
    expandedData.options.region = this.region;
    expandedData.options.rolltable = this.rolltable;
    expandedData.options.scene = this.scene;
    expandedData.options.sound = this.sound;
    expandedData.options.sourceEffect = this.sourceEffect;
    expandedData.options.tokenEffect = this.tokenEffect;
    expandedData.options.tokenMove = this.tokenMove;
    expandedData.options.wall = this.wall;
    //set integrations
    expandedData.options['flags']={};
    if(Object.keys(this.monksActiveTiles).length) {expandedData.options.flags['monks-active-tiles'] = this.monksActiveTiles}
    if(Object.keys(this.tokenResponse).length) {expandedData.options.flags['tokenResponse'] = this.tokenResponse}
    if(Object.keys(this.tokenSays).length) {expandedData.options.flags['tokenSays'] = this.tokenSays}
    if(Object.keys(this.mutate).length) {expandedData.options.flags['mutate'] = this.mutate}
    if(Object.keys(this.warpgate).length) {expandedData.options.flags['warpgate'] = this.warpgate}
    if(Object.keys(this.weather).length) {expandedData.options.flags['weather'] = this.weather}

    await dangerZoneType.updateDangerZoneType(expandedData.id, expandedData);
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
        timesUpOn: dangerZone.MODULES.daeOn ? dangerZone.MODULES.timesUpOn : false,
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
      if (!this.data.hasOwnProperty('name') && !this.data.hasOwnProperty('label')){
        this.data = {
          name: $(this.parent.form).find('input[name="name"]').val(),
          icon: $(this.parent.form).find('input[name="icon"]').val(),
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
      
      const doc = new ActiveEffect(effect, {})
      new DangerZoneActiveEffectForm(this, eventParent, this.parent.dangerId, doc).render(true);
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
        portalOnNot: !dangerZone.MODULES.portalOn
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
      return {
        data: this.data,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS
      }
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

class DangerZoneDangerFormCanvas extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.canvas.label"),
          id : "danger-zone-danger-canvas",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERCANVAS,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      const types = CANVASTYPES;
      return {
        data: this.data,
        canvasOps: CANVASTYPES,
        hasSequencer: dangerZone.MODULES.sequencerOn
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.canvas = expandedData;
      (expandedData.effect.type || expandedData.pan.active) ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        targetOps: SOURCEDANGERLOCATION,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS
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
      const obj = foundry.utils.mergeObject(WORLDZONE, this.data)
      return {
        zone: obj,
        actorOps: actorOps(),
        hideElevationPrompt: !obj.target.choose.enable,
        hideOperation: obj.trigger.loop > 1 ? false : true,
        replaceOps: DANGERZONEREPLACE,
        lightReplaceOps: DANGERZONELIGHTREPLACE,
        stretchOps: STRETCH,
        tokenDispositionOps: TOKENDISPOSITION,
        operationOps: TRIGGEROPERATION,
        regionReplaceOps: DANGERZONEREGIONREPLACE,
        soundReplaceOps: DANGERZONESOUNDREPLACE,
        sourceAreaOps: SOURCEAREAGLOBALZONE,
        sourceTargetOps: SOURCEAREATARGET,
        wallReplaceOps: DANGERZONEWALLREPLACE,
        weatherReplaceOps: DANGERZONEWEATHERREPLACE,
        zoneTypeOps: dangerZoneType.dangerList
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
          const op = document.getElementById(`dz-operation-global`);
          val > 1 ? op.classList.remove('dz-hidden') : op.classList.add('dz-hidden')
          this.setPosition()
          break;
        case 'source-area':
          this._handleSourceTag(val)
          break;  
        case 'template-toggle': 
          const templt = document.getElementById(`dz-elevation-prompt-global`);
          checked ? templt.classList.remove('dz-hidden') : templt.classList.add('dz-hidden')
          this.setPosition()
          break;
      }
    }
  
    _handleSourceTag(sourceArea = this.data?.source?.area ?? ''){
      const tag = $(this.form).find('#dz-source-tag-global')
      const sourceT = $(this.form).find('#dz-source-tag-tag-global')
      const sourceD = $(this.form).find('#dz-source-tag-danger-global')
      switch(sourceArea){
        case 'C':
        case 'D':
          tag.removeClass('dz-hidden');
          sourceD.removeClass('dz-hidden');
          tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.danger.label'))
          $(this.form).find('#dz-source-tag-danger-global').attr('name', 'source.tags')
          break;
        case 'T':
          tag.removeClass('dz-hidden');
          sourceT.removeClass('dz-hidden');
          tag.children('label').html(game.i18n.localize('DANGERZONE.edit-form.source.tag.tag.label'))
          $(this.form).find('#dz-source-tag-tag-global').attr('name', 'source.tags')
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
      this.setPosition()
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
        itemPileOnNot: !dangerZone.MODULES.itemPileOn,
        sourceOps: SOURCETREATMENT,
        taggerOnNot: !dangerZone.MODULES.taggerOn
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
      if(this.data.lastingEffect.roof) {//FvTT 11 and backwards compat
        this.data.lastingEffect.restrictions = {light: true, weather: true}
      }

      return {
        lastingEffect: this.data.lastingEffect,
        macroOps: determineMacroList(),
        monksActiveTiles: this.data.monksActiveTiles,
        monksActiveTilesOnNot: !dangerZone.MODULES.monksActiveTilesOn,
        occlusionModesOps: TILEOCCLUSIONMODES,
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS
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
      if(this.data.luminosity < 0) {//FvTT 11 and backwards compat
        this.data.negative = true;
        this.data.luminosity = 0
      }

      return {
        clearOps: AMBIENTLIGHTCLEAROPS,
        colorationOps: AdaptiveLightingShader.SHADER_TECHNIQUES,
        data: this.data,
        hasPerfectVision: dangerZone.MODULES.perfectVisionOn,
        lightAnimations: animationTypes(),
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORROTATIONOPTIONS
        }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.light = expandedData;
      if(expandedData.flags?.['perfect-vision']?.priority === undefined && !expandedData.flags?.['perfect-vision']?.sightLimit) this.parent.light.flags = {}
      if(expandedData.dim || expandedData.bright) {this.eventParent.addClass('active')} else {this.eventParent.removeClass('active')}
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
      if (expandedData.token) stringToObj(expandedData.token, {type: 'Token', notify: true})
      if (expandedData.actor) stringToObj(expandedData.actor, {type: 'Actor', notify: true})
      if (expandedData.embedded) stringToObj(expandedData.embedded, {type:'Embedded', notify:true})
      this.parent.mutate = expandedData;
      if(expandedData.permanent) this.eventParent.addClass('active');
    }
}

class DangerZoneDangerFormRegion extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.region.label"),
          id : "danger-zone-danger-region",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERREGION,
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
        data: this.data,
        eventOps: regionEvents(),
        macroOps: determineMacroListUuid(),
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        visibilityOps: REGIONVISIBILITY,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS,
        shapeTypeOps: REGIONSHAPETYPEOPTIONS
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.region = expandedData;
      expandedData.active ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
    }
}


class DangerZoneDangerFormRolltable extends FormApplication {
  constructor(app, eventParent, data, ...args) {
    super(...args);
    this.data = data,
    this.eventParent = eventParent,
    this.parent = app;
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          title : game.i18n.localize("DANGERZONE.type-form.rolltable.label"),
          id : "danger-zone-danger-rolltable",
          classes: ["sheet","danger-part-form"],
          template : dangerZone.TEMPLATES.DANGERZONEDANGERROLLTABLE,
          height : "auto",
          width: 425,
          closeOnSubmit: true
        });
      }

    getData(options) {
      return {
        data: this.data
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.rolltable = expandedData;
      expandedData.name ? this.eventParent.addClass('active') : this.eventParent.removeClass('active');
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
      return {
        data: this.data,
        offsetOps: OFFSETOPTIONS
       }
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
        taggerOnNot: !dangerZone.MODULES.taggerOn,
        targetOps: SOURCEDANGERLOCATION,
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS
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
        tokenSaysOnNot: !dangerZone.MODULES.tokenSaysOn, 
        sequencerOnNot: !dangerZone.MODULES.sequencerOn,
        socketLibOn: dangerZone.MODULES.socketLibOn
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
        doorSounds: CONFIG.Wall.doorSounds,
        doorStates: DOORSTATES,
        suppressDoorOptions: this.data.door ? false : true,
        suppressLightProx : this._notProximity(this.data.light),
        suppressSenseProx : this._notProximity(this.data.sense),
        suppressSoundProx : this._notProximity(this.data.sound),
        moveTypes: MOVETYPES,
        senseTypes: SENSETYPES,
        dirTypes: dirTypes(),
        doorTypes: doorTypes(),
        offsetOps: OFFSETOPTIONS,
        mirrorOps: MIRRORIMAGEOPTIONS
        }
    }

    activateListeners(html) {
      html.on('change', "[data-action]", this._handleChange.bind(this));
      super.activateListeners(html);
    }

    async _handleChange(event) {
      const changedElement = $(event.currentTarget);
      const action = changedElement.data().action;
      switch(action){
        case "door":
          this.form.querySelector(".door-options").classList.toggle("hidden", event.currentTarget.value === '0' ? true : false)
          this.setPosition({height: "auto"});
          break;
        case "light":
        case "sense":
        case "sound":
          this.form.querySelector(`.${action}-proximity`).classList.toggle("hidden", this._notProximity(event.currentTarget.value)) 
        break;
      }
    }

    _notProximity(test){
      return Number(test) < 3
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