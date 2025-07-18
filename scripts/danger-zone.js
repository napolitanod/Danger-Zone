import {dangerZoneDimensions} from './apps/dimensions.js';
import {DangerListForm} from './apps/danger-list-form.js';
import {dangerZoneType} from './apps/zone-type.js';
import {AUTOMATED_EVENTS, CHAT_EVENTS, COMBAT_EVENTS, COMBAT_PERIOD_INITIATIVE_EVENTS, CONTROLTRIGGERS, DANGERZONECONFIG, EVENTS, MANUAL_EVENTS, MOVEMENT_EVENTS, PLACEABLESBYDOCUMENT, WORLDZONE} from './apps/constants.js';
import {executor} from './apps/workflow.js';
import {ExecutorForm} from './apps/executor-form.js';
import {wait, getTagEntities, joinWithAnd} from './apps/helpers.js';
import {setHooks} from './apps/hooks.js';
import {AmbientLightDangerPartConfig, AudioDangerPartConfig, BackgroundEffectDangerPartConfig, CanvasDangerPartConfig, CombatDangerPartConfig, EffectDangerPartConfig, ForegroundEffectDangerPartConfig, GlobalZoneDangerPartConfig, ItemDangerPartConfig, LastingEffectDangerPartConfig, MutateDangerPartConfig, RegionDangerPartConfig, RolltableDangerPartConfig, SceneDangerPartConfig, SoundDangerPartConfig, SourceEffectDangerPartConfig, TokenEffectDangerPartConfig, TokenMoveDangerPartConfig, TokenResponseDangerPartConfig, TokenSaysDangerPartConfig, WallDangerPartConfig, WarpgateDangerPartConfig, WeatherDangerPartConfig} from './apps/danger-form.js';

/**
 * A class which holds some constants for dangerZone
 */
export class dangerZone {
  static ID = 'danger-zone';

  /**v13
   * holds the terms last used when searching the danger list form
   */
  static LASTSEARCH = '';

  static NAME = 'dangerZone';

  static dangerZoneSocket = '';
  
  static FLAGS = {
    SCENEZONE: 'sceneZone',
    SCENETILE: 'sceneTile',
    ZONETYPE: 'zoneTypeEffect',
    MIGRATION: 'migration'
  }

  static MODULES = {
    activeEffectOn: true, 
    timesUpOn: false, 
    daeOn: false, 
    socketLibOn: false, 
    taggerOn: false, 
    sequencerOn: false, 
    wallHeightOn: false, 
    portalOn: false, 
    tokenSaysOn: false, 
    fxMasterOn: false, 
    itemPileOn: false
  }

  static MIGRATION = {
    ZONE: 2,
    DANGER: 2
  }

  /**v13
   * outputs the danger list form last search term in lower case
   */
  static get lastSearchLower(){
    return dangerZone.LASTSEARCH.toLowerCase()
  }

  /** V13
   * Adds the Dangers button to the scenes side menu if the user settings allows for this.
   * @param {object} app 
   * @param {object} html 
   * @returns 
   */
  static addDangersLaunch(app, html) {
    if (!game.user.isActiveGM 
        || app.options.id !== "scenes" 
        || game.settings.get('danger-zone', 'types-button-display') === false
      ) return;
    //create the button  
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("danger-zone-types-launcher");
    button.innerHTML = `<i class="fas fa-radiation"></i>${game.i18n.localize("DANGERZONE.setting.danger-zone-types-config.name")}`;
    button.addEventListener("click", async (_event) => {
      dangerZone.DangerListForm.render(true);
    });
    //append the button to footer
    const header = html.querySelector(".header-actions");
    header.append(button);
  }

  /**v13
   * Performs routines to initialize resources used by module
   */
  static initialize() {
    dangerZone.#setModsAvailable();
    dangerZone.#setDangerZoneConfig()
    this.DangerListForm = new DangerListForm();
    this.executorForm = new ExecutorForm();
    setHooks()
  }

  /**V13
 * adds the Danger Zone buttons to the controls on the canvas
 * @param {object} controls 
    */
  static insertZoneButtons(controls){
    dangerZone.log(false, 'Adding control buttons', controls)
    controls[dangerZone.ID] = CONTROLTRIGGERS.controls
  }
  
  /** V13
   * Used to generate debug logs.
   * @param {boolean} force - forces the log even if the debug flag is not on
   * @param  {...any} args - what to log
  */
  static log(force, ...args) {  
     // const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
  
      if (force || (game.user.isActiveGM && game.settings.get(dangerZone.ID, 'logging'))) {
        console.log(this.ID, '|', ...args);
      }
  }

  /**v13
   * loads the constant with classes after initialization has completed
   */
  static #setDangerZoneConfig() {
    DANGERZONECONFIG.CLASSES.DANGERPART = {
        ambientLight: AmbientLightDangerPartConfig,
        audio: AudioDangerPartConfig,
        backgroundEffect: BackgroundEffectDangerPartConfig,
        canvas: CanvasDangerPartConfig,
        combat: CombatDangerPartConfig,
        effect: EffectDangerPartConfig,
        foregroundEffect: ForegroundEffectDangerPartConfig,
        globalZone: GlobalZoneDangerPartConfig,
        item: ItemDangerPartConfig,
        lastingEffect: LastingEffectDangerPartConfig,
        mutate: MutateDangerPartConfig,
        region: RegionDangerPartConfig,
        rolltable: RolltableDangerPartConfig,
        scene: SceneDangerPartConfig,
        sound: SoundDangerPartConfig,
        sourceEffect: SourceEffectDangerPartConfig,
        tokenEffect: TokenEffectDangerPartConfig,
        tokenMove: TokenMoveDangerPartConfig,
        tokenResponse: TokenResponseDangerPartConfig,
        tokenSays: TokenSaysDangerPartConfig,
        wall: WallDangerPartConfig,
        warpgate: WarpgateDangerPartConfig,
        weather: WeatherDangerPartConfig
    }
  }

  /**
   * sets global variables that indicate which modules that danger zone integrates with are available
   */
  static #setModsAvailable () {
    if (game.modules.get("dae")?.active){dangerZone.MODULES.daeOn = true} ;
    if (game.modules.get("item-piles")?.active){dangerZone.MODULES.itemPileOn = true};
    if (game.modules.get("token-says")?.active){dangerZone.MODULES.tokenSaysOn = true} ;
    if (game.modules.get("portal-lib")?.active){dangerZone.MODULES.portalOn = true} ;
    if (game.modules.get("fxmaster")?.active){dangerZone.MODULES.fxMasterOn = true} ;
    if (game.modules.get("sequencer")?.active){dangerZone.MODULES.sequencerOn = true} ;
    if (game.modules.get("tagger")?.active){dangerZone.MODULES.taggerOn = true} ;
    if (game.modules.get("wall-height")?.active){dangerZone.MODULES.wallHeightOn = true} ;
    if (game.modules.get("times-up")?.active && dangerZone.MODULES.daeOn === true){dangerZone.MODULES.timesUpOn = true};
    if (game.modules.get("socketlib")?.active) dangerZone.MODULES.socketLibOn = true
    if(['pf1', 'pf2e'].includes(game.world.system)) dangerZone.MODULES.activeEffectOn = false
  }


  /**v13
   * converts a JSON object to a zone class
   * @param {object} flag 
   * @returns 
   */
  static #toClass(flag){
    if(!flag.scene?.sceneId){return {}}
    let zn =  new zone(flag.scene.sceneId);
    return foundry.utils.mergeObject(zn, flag, {insertKeys: false, enforceTypes: true})
  }

  static sceneHasZone(sceneId){
    return game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE) ? true : false 
  }

  static getAllZonesFromScene(sceneId, options = {enabled: true, typeRequired: true, triggerRequired: true}){
    const ar = [];
    const scene = game.scenes?.get(sceneId);
    const flag = scene ? scene.getFlag(this.ID, this.FLAGS.SCENEZONE) : ar; 
    for (var zn in flag) {
        if((!options.enabled || flag[zn].enabled) && (!options.triggerRequired || flag[zn].trigger.events.length) && flag[zn].scene?.sceneId) ar.push(dangerZone.#toClass(flag[zn]));
    }
    return ar.filter(z => !options.typeRequired || z.danger)
  }
  
  static getZoneList(sceneId, zoneId = ''){
    const list = {};
    for (const zn of this.getAllZonesFromScene(sceneId).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)})) {
      if(zn.id !== zoneId) list[zn.id] = zn.title;
    }
    return list;
  }

  static getRolltableZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.hasChatEvent)
  }  

  /**
   * Returns all zones on a given scene that automatically triggered during combat
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getCombatZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.hasCombatEvent)
  }  

  static getExtendedZones(sceneId){
    return this.getAllZonesFromScene(sceneId, {enabled: false, typeRequired: true}).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)})
      .concat(this.getGlobalZones(sceneId).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)}))
      .concat(this.getAllDangersAsGlobalZones(sceneId).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)}))
  }

    /**
  * Returns all zones on a given scene that are enabled and that are triggered by movement
  * @param {string} sceneId  the scene id
  * @returns array of zones
  */
  static getMovementZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.hasMovementEvent)
  }

  static getMovementCompleteZonesFromScene(sceneId) {
    return this.getMovementZonesFromScene(sceneId).filter(zn => zn.hasMovementComplete)
  }

  static getMovementNotCompleteZonesFromScene(sceneId) {
    return this.getMovementZonesFromScene(sceneId).filter(zn => !zn.hasMovementComplete)
  }

  
  /**V13
   * fall all dangers, makes a call to convert each to a zone on the scene
   * @param {string} sceneId 
   * @returns array of zones
   */
  static getAllDangersAsGlobalZones(sceneId) {
    return dangerZoneType.allDangers.map(danger => {
      return this._convertZoneGlobalToScene(danger, sceneId, false);
      }
    )
  }
  
  /**V13
   * for a single instance of a danger with a global zone, makes call to convert the danger into a zone on scene
   * @param {string} dangerId 
   * @param {string} sceneId 
   * @returns a zone
   */
  static getGlobalZone(dangerId, sceneId){
    return this._convertZoneGlobalToScene(dangerZoneType.getDanger(dangerId), sceneId, true);
  }

  /**V13
   * for all instances of a danger with a global zone, makes call to convert the danger into a zone on scene
   * @param {string} dangerId 
   * @param {string} sceneId 
   * @returns 
   */
  static getGlobalZones(sceneId) {
    return dangerZoneType.allGlobalZones.map(danger => {
      return this._convertZoneGlobalToScene(danger, sceneId, true);
      }
    )
  }

  /**V13
   * for the given scene and zone event, returns a zone from the list of eligible random zones
   * @param {string} sceneId 
   * @param {string} event 
   * @param {array} eligibaleZones 
   * returns a zone
   */
  static async getRandomZoneFromScene(sceneId, event, eligibaleZones = []) {
    let keptZones = [], max = 0;
    let zones = this.getRandomZonesFromScene(sceneId);
    for (const zn of zones) {
      if(zn.eventsIncludingInitiative.includes(event) && (!eligibaleZones.length || eligibaleZones.find(z => z.id === zn.id))){
        let min = max + 1;
        max += zn.trigger?.weight ?? 0;
        keptZones.push({zone: zn, min: min, max: max});
      }
    }
    if(!keptZones.length) return
    const maybe = await new Roll(`1d${max}`).evaluate()
    const randomResult = maybe.result;

    this.log(false,'Random Zone Search ', {zones:keptZones, roll: randomResult, range: {min: 1, max:max}});
    return keptZones.find(zn => randomResult >= zn.min && randomResult <= zn.max).zone
  }
  

  /**V13
   * returns an array of zones on the scene that have the random field set to true (zones that trigger randomly from the set of zones)
   * @param {string} sceneId 
   * @returns array of zones
   */
  static getRandomZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.trigger?.random)
  }

  /**V13
   * Returns all zones on a given scene that are either manual and enabled or triggered in an automated fashion
   * @param {string} sceneId  the scene id
   * @returns array of zones
   */
  static getTriggerZonesFromScene(sceneId) {
      return this.getAllZonesFromScene(sceneId, {enabled: false, typeRequired: true}).filter(zn => zn.enabled || zn.hasAutomatedEvent).concat(this.getGlobalZones(sceneId))
  }

 /**V13
   * Returns a specific zone from the given scene
   * @param {string} zoneId the danger zone id
   * @param {string} sceneId  the scene id
   * @returns zone
   */
  static getZoneFromScene(zoneId, sceneId) {
    let flag = game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE + `.${zoneId}`);
    return flag ? dangerZone.#toClass(flag) : undefined
  } 

   /**
   * Returns a specific zone from the given scene using its name
   * @param {string} zoneName the danger zone name
   * @param {string} sceneId  the scene id
   * @returns 
   */
    static getZoneNameFromScene(zoneName, sceneId) {
      return this.getAllZonesFromScene(sceneId, false, false).find(zn => zn.title === zoneName)
    }

  /**v13
   * launches dialog confirming they want to delete all DZ placeables
   * @param {*} event 
   */
  static async handleClear(event) {
    const proceed = await foundry.applications.api.DialogV2.confirm({
      content: game.i18n.localize("DANGERZONE.controls.clear.description"),
      rejectClose: false,
      modal: true
    });
    if ( proceed ) await dangerZone.wipeAll();;
  }

  static async checkSetMigration(scene){
    const hasMigration = scene.getFlag(this.ID, this.FLAGS.MIGRATION) ? true : false 
    if(!hasMigration) await scene.setFlag(dangerZone.ID, dangerZone.FLAGS.MIGRATION, dangerZone.MIGRATION.ZONE);
  }

  /**V13
   * method supporting the copy of a zone on a scene
   * @param {string} sourceSceneId 
   * @param {string} sourceZoneId 
   * @param {string} targetSceneId 
   * @returns 
   */
  static async copyZone(sourceSceneId, sourceZoneId, targetSceneId){
    const source = foundry.utils.deepClone(this.getZoneFromScene(sourceZoneId,sourceSceneId));
    delete source['id']; 
    delete source['scene'];
    const zn = new zone(targetSceneId);
    const updt = await zn.update(source); 
    dangerZone.log(false,'Copying Zone ', {update: updt, zone: zn})
    updt.flags?.[this.ID]?.[this.FLAGS.SCENEZONE]?.[zn.id] ? ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.zone-copied")) : ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.zone-copy-fail"));
    return updt    
  }

  /**
   * performs an update attempt on the zone. If zone isn't found, creates a new one.
   * @param {string} zoneId 
   * @param {string} updateData 
   * @returns 
   */
  static async updateSceneZone(zoneId, updateData) {
    let zn = this.getZoneFromScene(zoneId, updateData.scene.sceneId);
    if(!zn){zn = new zone(updateData.scene.sceneId)} 
    return await zn.update(updateData);
  }

  /**
   * deletes the given flag for this zone from a zone, effectively deleting it
   * @param {string} zoneId the id of the zone class to be deleted 
   * @param {string} sceneId the id of the scene that holds the zone as a flag
   * @param {boolen} isGlobal indicates that the danger being converted is being treated as a global zone
   * @returns 
   */
  static async deleteZoneFromScene(zoneId, sceneId) {
    return await this.getZoneFromScene(zoneId, sceneId).delete();
  }

  static _convertZoneGlobalToScene(danger, sceneId, isGlobal = true){
    const zn = danger.hasGlobalZone ? danger.options.globalZone : WORLDZONE;
    zn.scene = {sceneId: sceneId, dangerId: danger.id, isPseudoZone: !isGlobal};
    zn.dangerId = danger.id;
    zn.title = danger.name;
    isGlobal ? zn.id = 'w_' + danger.id : zn.id = 'd_' + danger.id
    return dangerZone.#toClass(zn);
  }

  static async updateAllSceneZones(sceneId,flag){
    const scene = game.scenes.get(sceneId)
    const updt = await scene.setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, flag);
    await dangerZone.checkSetMigration(scene)
    return updt
  }

  /**v13
   * @param {string} searchTerm     the danger list form search term to set as the last search
   */
  static updateLastSearch(searchTerm){
    dangerZone.LASTSEARCH = searchTerm
  }

  static async wipe(documentName, confirm = false){
    if(confirm){
      const proceed = await foundry.applications.api.DialogV2.confirm({
        content: game.i18n.localize(`DANGERZONE.controls.clear${documentName}.description`),
        rejectClose: false,
        modal: true
      });
      if (!proceed) return 
    }
    const ids=canvas.scene[PLACEABLESBYDOCUMENT[documentName]].filter(t => t.flags[dangerZone.ID]).map(t => t.id);
    if(ids.length) await canvas.scene.deleteEmbeddedDocuments(documentName, ids)
  }

  static async wipeAll(){
    for (var documentName in PLACEABLESBYDOCUMENT) {
      if(documentName === 'fxmaster-particle'){
        if(dangerZone.MODULES.fxMasterOn) await Hooks.call("fxmaster.updateParticleEffects", []); break;
      } else {
        await dangerZone.wipe(documentName)
      }
    }
  }


}

/**
 * class which holds the specific zone data. These are stored on the scene flags
 */
export class zone {

  /**
   * 
   * @param {string} sceneId the scene id 
   */
  constructor (sceneId, regionId = '') {
    this.id = foundry.utils.randomID(16);
    this.dangerId = '',
    this.enabled = game.settings.get('danger-zone', 'scene-enabled-default'),
    this.extensions = [],
    this.flavor = '',
    this.dimensions = {
      bleed: false,
      stretch: ''
    },
    this.trigger = {
      chat: {
        phrases: []
      },
      combatantInZone: false,
      delay: {min: 0, max: 0},
      initiative: 0,
      likelihood: 100,
      loop: 1,
      movement: {
        wait: false
      },
      operation: "Q",
      prompt: false,
      random: false,
      events: ['manual'],
      weight: 1
    },
    this.replace = {
      light: 'N',
      region: 'N',
      sound: 'N',
      tile: 'N',
      wall: 'N',
      weather: 'N'
    },
    this.scene = new dangerZoneDimensions(sceneId, this.id, regionId),
    this.source = {
      area: '',
      actors: [],
      dispositions: [],
      limit: {
        min: 0,
        max: 0
      },
      exclusion: {
        conditions: []
      },
      tags: [],
      target: '',
      trigger: ''
    },
    this.target = {
      actors: [],
      all: false,
      always: false,
      choose:{
        enable: false,
        prompt: true
      },
      isCombatant: false,
      dispositions: [],
      exclusion: {
        conditions: []
      }//,
      //movement: {
        //start: false
     // }
    },
    this.title = ''
  }

  get chatEvents(){
    return this.trigger.events.filter(e => CHAT_EVENTS.includes(e)) 
  }

  get combatEvents(){
    return this.trigger.events.filter(e => COMBAT_EVENTS.includes(e)) 
  }

  get danger(){
    return dangerZoneType.getDanger(this.dangerId)
  }

  get eventsDescription(){
    return this.hasEvents ? joinWithAnd(this.trigger.events.map(e => game.i18n.localize(EVENTS[e]?.label))) : ''
  }

  get eventsIncludingInitiative(){
    return this.trigger.events.map(i => COMBAT_PERIOD_INITIATIVE_EVENTS.includes(i) ? (i + '-' + (this.trigger.initiative ? this.trigger.initiative.toString() : '0')) : i)
  }

  get flaggablePlaceables(){
    return this.scene.scene.walls.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE])
      .concat(this.scene.scene.lights.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]))
      .concat(this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]))
      .concat(this.scene.scene.regions.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]))
  }

  get hasAuraEvent(){
    return this.trigger.events.includes('aura') ? true : false
  }

  get hasAutomatedEvent(){
    return this.trigger.events.find(e => AUTOMATED_EVENTS.includes(e)) ? true : false 
  }

  get hasChatEvent(){
    return this.trigger.events.find(e => CHAT_EVENTS.includes(e)) ? true : false
  }

  get hasCombatEvent(){
    return this.trigger.events.find(e => COMBAT_EVENTS.includes(e)) ? true : false
  }

  get hasCombatInitiativeEvent(){
    return this.trigger.events.find(e => COMBAT_PERIOD_INITIATIVE_EVENTS.includes(e)) ? true : false
  }

  get hasEvents(){
    return this.trigger.events.length ? true : false
  }

  get hasManualEvent(){
    return this.trigger.events.find(e => MANUAL_EVENTS.includes(e)) ? true : false 
  }

  get hasMovementEvent(){
    return this.trigger.events.find(e => MOVEMENT_EVENTS.includes(e)) ? true : false
  }

/*   get hasMovementStartLocation(){
    return this.hasAuraEvent && this.target.movement?.start ? true : false
  } */

  get hasMovementComplete(){
    return this.trigger.movement?.wait ? true : false
  }
  
  get hasSourceActor(){
    return this.source.actors.length  ? true : false
  }

  get hasSourceTags(){
    return this.source.tags.length  ? true : false
  }

  get hasSourceArea(){
    switch(this.source.area){
      case 'A':
        if(this.hasSourceTokenDefined) return true
        break;
      case 'C':
      case 'D':
      case 'T':
      case 'Y':
      case 'Z':
        if(this.hasSourceTags) return true
        break;
    }
    return false 
  }

  get hasSourceTokenDefined(){
    return (this.hasSourceActor || this.hasSourceDisposition || this.hasSourceExclusionCondition) ? true : false
  }

  get hasSourceDisposition(){
    return this.source.dispositions.length ? true : false
  }

  get hasSourceExclusionCondition(){
    return this.source?.exclusion?.conditions?.length ? true : false
  }

  get hasTargetActor(){
    return this.target.actors.length ? true : false
  }

  get hasTargetDisposition(){
    return this.target.dispositions.length ? true : false
  }

  get hasTargetExclusionCondition(){
    return this.target.exclusion.conditions.length ? true : false
  }
  
  get movementEvents(){
    return this.trigger.events.filter(e => MOVEMENT_EVENTS.includes(e)) 
  }

  get sources(){
    return this.scene.scene.tokens.filter(t => this.isSourceActor(t)) 
  }

  get titleLong(){
      return this.title + (this.scene.dangerId ? ' (' + game.i18n.localize("DANGERZONE.type-form.globalZone.label") + ') ' :' ') + this.eventsDescription + ' ' + game.i18n.localize("DANGERZONE.scene.trigger")
  }

  /**
   * sets the flag data for the module on the scene for this zone, effectively saving the zone 
   * @returns module flag on the scene
   */
  async _setFlag(){
    const scene = game.scenes.get(this.scene.sceneId)
    const updt = await scene.setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, {[this.id]: this});
    await dangerZone.checkSetMigration(scene)
    Hooks.call("dangerZone.updateZone", this);
    return updt
  }

  /**
   * private method to save the zone data
   * @param {object} updateData 
   */
  async _update(updateData, options = {insertKeys: false, enforceTypes: true}){
    foundry.utils.mergeObject(this, updateData, options);
    const updt = await this._setFlag();
    return updt
  }

  async addShapesToRegion(shapes){
      if(shapes?.length && this.scene.hasRegion){
          await this.scene.region.update({shapes: this.scene.region.shapes.concat(shapes)})
      }
  }

  async clearWeather({includeFXMaster = false, includeFoundry = false, effect = ''} = {}){     
    dangerZone.log(false,'Clearing Weather ', {includeFXMaster: includeFXMaster, includeFoundry: includeFoundry, effect: effect, scene: this.scene.scene})
    if(!this.scene?.scene || (!includeFXMaster && !includeFoundry)) return

    if(includeFXMaster) {
      if(!effect){
        await this.scene.scene.unsetFlag('fxmaster', "effects");
      } else{
        const currentEffects = this.scene.scene.getFlag('fxmaster', "effects") ?? {}
        delete currentEffects[effect]
        await this.scene.scene.setFlag('fxmaster', 'effects', currentEffects);
      }
    }
    
    if(includeFoundry){
      let hookId;
      const render = new Promise(resolve => {
        hookId = Hooks.once("renderApplication", rendered => {
          resolve(rendered);
        });
      });
  
      await this.scene.scene.update({weather: ''});
  
      // Timeout after 5 seconds
      const timeout = new Promise(resolve => window.setTimeout(() => {
        Hooks.off("renderApplication", hookId);
        resolve();
      }, 3000));
  
      await Promise.race([render, timeout]);
    }
  }

  delay(){
    return zone.delay(this.trigger.delay)
  }

  static delay(delay){ 
    if(typeof delay === 'object' ){
      const min = delay.min ?? 0, max = delay.max ?? 0;
      const del = max - min
      if(del <= 0) return min
      return Math.floor(Math.random() * del)
    } else {
      return delay
    }
  }

  /**
   * deletes this id and zone json from the scene's module's flag
   * @returns the remaining flag data
   */
  async delete(){
    await this.scene.scene.update({[`flags.${dangerZone.ID}.${dangerZone.FLAGS.SCENEZONE}.-=${this.id}`]: null})
    Hooks.call("dangerZone.deleteZone", this);
  }

  async executor(options={}){
    const ex = new executor(this, options);
    await ex.set(false);
    return ex
  }

  generateSourceCount(){
    if(!this.source.limit.max && !this.source.limit.min) return -1
    return this.source.limit.max === this.source.limit.min ? this.source.limit.max : Math.floor(Math.random() * (this.source.limit.max - this.source.limit.min + 1))
  }

  getExtension(extensionId){
    return this.extensions.find(e => e.id === extensionId)
  }
  
  async highlightZone(){
    if(this.scene.sceneId === canvas.scene?.id && canvas.scene?.grid?.type){
      dangerZoneDimensions.destroyHighlightZone(this.id, '_tzHL', this.scene.dangerId); 
      await dangerZoneDimensions.addHighlightZone(this.id, this.scene.sceneId, '_tzHL', this.scene.dangerId);
      await wait(750)
      dangerZoneDimensions.destroyHighlightZone(this.id, '_tzHL', this.scene.dangerId); 
    }
  }

  isEvent(event){
    return (event && this.trigger.events.includes(event)) ? true : false
  } 

  isSourceActor(token){
    if(!this.hasSourceTokenDefined) return false
    const id = token?.actor?.id; 
    if(this.hasSourceActor && id && !this.source.actors.includes(id)) return false
    if(this.hasSourceDisposition && !this.tokenHasDisposition(token, 'source')) return false
    if(this.hasSourceExclusionCondition && this.tokenHasExclusion(token, 'source')) return false
    return true 
  }

  isTargetActor(id){
    return (id && this.target.actors.includes(id)) ? true : false
  }

  async sourceOnScene(){
    if(this.scene.scene.tokens.find(t => this.isSourceActor(t))) return true
    const area = await this.sourceArea()
    return area.documents.length ? true : false
  }


  /**V13
   * called by zone to collect a source area
   * @returns object holding eligible documents for the given source area and the source target
   */
  async sourceArea(){
    const obj = {documents: [], target: ''}
    if(this.hasSourceArea){
      obj.target = this.source.target
      switch(this.source.area){
        case 'A':
          obj['documents'] = this.scene.scene.tokens.filter(t => this.isSourceActor(t));
          break;
        case 'C':
          obj['documents'] = this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type && this.source.tags.includes(t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type));
          break;
        case 'D':
          obj['documents'] = this.flaggablePlaceables.filter(t => t.flags[dangerZone.ID][dangerZone.FLAGS.SCENETILE].type && this.source.tags.includes(t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type));
          break;
        case 'T':
          if(this.hasSourceTags) obj['documents'] = await getTagEntities(this.source.tags, this.scene.scene)
          break;
        case 'Y':
          obj['documents'] = this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId && this.source.tags.includes(t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId));
          break;
        case 'Z':
          obj['documents'] = this.flaggablePlaceables.filter(t => t.flags[dangerZone.ID][dangerZone.FLAGS.SCENETILE].zoneId && this.source.tags.includes(t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId));
          break;
      }
    }    
    return obj
  }

  sourceTreatment(treatment, tokens, sources = []){
    if(!treatment || !sources.length) return tokens
    switch(treatment){
      case "I":
        return tokens.filter(t => !sources.find(s => s.id === t.id))
      case "S":
        return tokens.filter(t => !this.isSourceActor(t)).concat(sources)
      case "O":
        return sources
      default:
        return tokens
    }
  }

  async sourceTrigger(tokens){
    const trigger = this.source.trigger ? (this.source.trigger === 'C' ? await this.sourceOnScene() : tokens.find(token => this.isSourceActor(token))) : true;
    dangerZone.log(false,'Determining Source Trigger ', {zone: this, triggeTokens: tokens, trigger: trigger});
    return trigger
  }

  stretch(options){
    switch(this.dimensions.stretch){
      case "B":
          options.bottom = this.scene.bottom
          break;
      case "G":
          options.bottom = 0
          break;
      case "S":
          options.top = Infinity
          break;
      case "T":
          options.top = this.scene.top
          break;
    }
    return options
  }

  /**
   * enables or disables the zone
   * @returns zone
   */
  async toggleZoneActive() {
    if(this.enabled){this.enabled = false} else {this.enabled = true}
    await this._setFlag();
    return
  }

  tokenHasDisposition(token, type = 'target'){
    return this[type].dispositions.includes(token.disposition.toString())
  }

  tokenHasExclusion(token, type = 'target'){
    return token.actor?.appliedEffects?.find(e => this[type].exclusion.conditions.includes(e.name)) ? true : false
  }

  async tokensInZone(tokens){
    if(!tokens?.length) return false
    const b = await this.scene.getZoneBoundary();
    const eligible = this.zoneEligibleTokens(b.tokensIn(tokens));
    dangerZone.log(false, 'Finding tokens in zone...', {boundary: b, tokens: tokens, eligible: eligible})
    return eligible.length ? true : false
  }

  /**v13
   * Launches the confirmation dialog for checking if trigger should proceed.
   * @returns choice
   */
  async triggerCheck(){
    if(!this.trigger.prompt) return true
    const choice = await foundry.applications.api.DialogV2.confirm({
      content: `${game.i18n.localize("DANGERZONE.alerts.trigger-zone")} ${this.title}?`,
      rejectClose: false,
      modal: true
    });
    return choice
  }

  /**
   * public method to save the zone data
   * @param {object} updateData 
   * @returns returns the zone after update
   */
  async update(updateData, options = {insertKeys: false, enforceTypes: true}){
    const updt = await this._update(updateData, options);
    return updt
  }

  async updateRegion(regionId = ''){
    await this.update({scene: {regionId: regionId}})
  }

  async wipe(document, replace = ''){
      let ids = []; const data = this._wipeData(document); const rep = replace ? replace : data.replace;
      if(document === 'fxmaster-particle'){ 
        switch (rep) {
          case 'A': 
              await this.clearWeather({includeFXMaster: dangerZone.MODULES.fxMasterOn, includeFoundry: !this.danger.weatherIsFoundry})
          break;
          case 'T': 
              await this.clearWeather({includeFXMaster: dangerZone.MODULES.fxMasterOn, includeFoundry: false, effect: this.dangerId})
          break;
          default: return false
        }
        return true
      }
      switch (rep) {
          case 'Z':
            ids=this.scene.scene[data.placeable].filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.id).map(t => t.id);
              break;
          case 'T':
            ids=this.scene.scene[data.placeable].filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.dangerId).map(t => t.id);
              break;
          case 'R':
            ids=this.scene.scene[data.placeable].filter(t => this.isEvent(t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger)).map(t => t.id);
              break;
          case 'A':
            ids=this.scene.scene[data.placeable].filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
              break;
          default:
            return false;
      }
      if(ids.length) await this.scene.scene.deleteEmbeddedDocuments(document, ids)
      return true
 }

  zoneEligibleTokens(tokens){
    let kept = [];
    if(this.hasTargetActor || this.hasTargetDisposition || this.hasTargetExclusionCondition){
      for(let token of tokens){
        let keep = 1;
        if(this.hasTargetActor && !this.isTargetActor(token.actor?.id)){
          dangerZone.log(false, 'Token not eligible not a target actor...', {zone: this, token: token})
          keep = 0;
        }
        else if(this.hasTargetDisposition && !this.tokenHasDisposition(token, 'target')){
          dangerZone.log(false, 'Token not eligible not a target disposition...', {zone: this, token: token})
          keep = 0;
        }
        else if(this.hasTargetExclusionCondition && this.tokenHasExclusion(token, 'target')){
          dangerZone.log(false, 'Token not eligible has an exclusion...', {zone: this, token: token})
          keep = 0;      
        }
        if(keep){kept.push(token)}
      }
    } else {kept = tokens}
    return kept
  }

  _wipeData(document){
    switch(document){
      case 'Tile':
        return {replace: this.replace.tile, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'Wall':
        return {replace: this.replace.wall, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'AmbientLight':
        return {replace: this.replace.light, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'AmbientSound':
        return {replace: this.replace.sound, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'Region':
        return {replace: this.replace.region, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'fxmaster-particle':
        return {replace: this.replace.weather}
    }
  }

  /*prompts the user to select the zone location point (top left grid location) and captures the location*/
  async promptTemplate() {
    const elevation = (this.target.choose.prompt) ? await this._promptElevation() : 0 ;
    const xy = await this._promptXY();
    return (xy ? {coords: {x: xy.x, y: xy.y}, elevation: elevation} : {})
  }

  async _promptElevation(){
    let elevation
    try{
        elevation = await foundry.applications.api.DialogV2.prompt({
          window: {title: game.i18n.localize("DANGERZONE.alerts.enter-z")},
          content: `<input name="elevation" type="number" id="zInput" min="0" steps="1" value="0">`,
          ok: {
                label: game.i18n.localize("DANGERZONE.yes"),
                icon: '<i class="fas fa-check"></i>',
                callback: (event, button, dialog) => button.form.elements.elevation.valueAsNumber 
                }
      });  
    } catch {
      dangerZone.log(false, `No value entered.`)
    }
    return elevation
  }

  async _promptXY(){ 
    let xy
    dangerZoneDimensions.destroyHighlightZone(this.id, '', this.scene.dangerId);
    await dangerZoneDimensions.addHighlightZone(this.id, this.scene.sceneId, '_wf', this.scene.dangerId);

    let currentLayer = canvas.activeLayer;
    currentLayer.deactivate();
    ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-target"));
    
    xy = await new Promise((resolve, reject)=>{
      function _cancel(event){
        ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.cancel-target-select"));
        window.removeEventListener('auxclick', _cancel);
        resolve(false)
      }
      window.addEventListener('auxclick', _cancel);
      canvas.app.stage.once('mousedown', event => {
        let selected = event.data.getLocalPosition(canvas.app.stage);
        window.removeEventListener('auxclick', _cancel);
        resolve(selected)
      });
    });   
    currentLayer.activate();
    
    dangerZoneDimensions.destroyHighlightZone(this.id, '_wf', this.scene.dangerId); 
    return xy
  }
}