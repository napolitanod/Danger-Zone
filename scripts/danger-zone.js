import {dangerZoneDimensions} from './apps/dimensions.js';
import {DangerZoneTypesForm} from './apps/danger-list-form.js';
import {dangerZoneType} from './apps/zone-type.js';
import {addTriggersToSceneNavigation} from './apps/scene-navigation.js';
import {addTriggersToHotbar} from './apps/hotbar.js';
import {COMBATTRIGGERS, DANGERZONETRIGGERS,  PLACEABLESBYDOCUMENT, WORLDZONE} from './apps/constants.js';
import {executor} from './apps/workflow.js';
import {ExecutorForm} from './apps/executor-form.js';
import {wait, getTagEntities, stringToArray} from './apps/helpers.js';
import { fxMasterOn} from './index.js';

/**
 * A class which holds some constants for dangerZone
 */
export class dangerZone {
  static ID = 'danger-zone';

  static NAME = 'dangerZone';
  
  static FLAGS = {
    SCENEZONE: 'sceneZone',
    SCENETILE: 'sceneTile',
    ZONETYPE: 'zoneTypeEffect'
  }
 
  static TEMPLATES = {
    DANGERZONECONFIG: `modules/${this.ID}/templates/danger-zone-form.hbs`,
    DANGERZONEEXTENSION: `modules/${this.ID}/templates/danger-zone-extension-form.hbs`,
    DANGERZONEEXECUTOR: `modules/${this.ID}/templates/danger-zone-executor-form.hbs`,
    DANGERZONESCENE: `modules/${this.ID}/templates/danger-zone-scene-form.hbs`,
    DANGERZONETYPESCONFIG: `modules/${this.ID}/templates/danger-zone-types.hbs`,
    DANGERZONETYPE: `modules/${this.ID}/templates/danger-form.hbs`,
    DANGERZONEACTIVEEFFECT: `modules/${this.ID}/templates/active-effect-form.hbs`,
    DANGERZONEDANGERACTIVEEFFECT: `modules/${this.ID}/templates/danger-form-active-effect.hbs`,
    DANGERZONEDANGERAUDIO: `modules/${this.ID}/templates/danger-form-audio.hbs`,
    DANGERZONEDANGERBACKGROUNDEFFECT: `modules/${this.ID}/templates/danger-form-background-effect.hbs`,
    DANGERZONEDANGERCOMBAT: `modules/${this.ID}/templates/danger-form-combat.hbs`,
    DANGERZONEDANGERCANVAS: `modules/${this.ID}/templates/danger-form-canvas.hbs`,
    DANGERZONEDANGERFOREGROUNDEFFECT: `modules/${this.ID}/templates/danger-form-foreground-effect.hbs`,
    DANGERZONEDANGERGLOBALZONE: `modules/${this.ID}/templates/danger-form-global-zone.hbs`,
    DANGERZONEDANGERITEM: `modules/${this.ID}/templates/danger-form-item.hbs`,
    DANGERZONEDANGERLASTINGEFFECT: `modules/${this.ID}/templates/danger-form-lasting-effect.hbs`,
    DANGERZONEDANGERLIGHT: `modules/${this.ID}/templates/danger-form-light.hbs`,
    DANGERZONEDANGERMUTATE: `modules/${this.ID}/templates/danger-form-mutate.hbs`,
    DANGERZONEDANGERREGION: `modules/${this.ID}/templates/danger-form-region.hbs`,
    DANGERZONEDANGERSCENE: `modules/${this.ID}/templates/danger-form-scene.hbs`,
    DANGERZONEDANGERSOUND: `modules/${this.ID}/templates/danger-form-sound.hbs`,
    DANGERZONEDANGERSOURCEEFFECT: `modules/${this.ID}/templates/danger-form-source-effect.hbs`,
    DANGERZONEDANGERTOKENRESPONSE: `modules/${this.ID}/templates/danger-form-token-response.hbs`,
    DANGERZONEDANGERTOKENSAYS: `modules/${this.ID}/templates/danger-form-token-says.hbs`,
    DANGERZONEDANGERTOKENEFFECT: `modules/${this.ID}/templates/danger-form-token-effect.hbs`,
    DANGERZONEDANGERTOKENMOVE: `modules/${this.ID}/templates/danger-form-token-move.hbs`,
    DANGERZONEDANGERWALL: `modules/${this.ID}/templates/danger-form-wall.hbs`,
    DANGERZONEDANGERWARPGATE: `modules/${this.ID}/templates/danger-form-warpgate.hbs`,
    DANGERZONEDANGERWEATHER: `modules/${this.ID}/templates/danger-form-weather.hbs`,
    DANGERZONEZONECOPY: `modules/${this.ID}/templates/danger-zone-scene-zone-copy.hbs`
  }

  static initialize() {
    this.DangerZoneTypesForm = new DangerZoneTypesForm();
    this.executorForm = new ExecutorForm();
  }

  /**
   * A small helper function which leverages developer mode flags to gate debug logs.
   * @param {boolean} force - forces the log even if the debug flag is not on
   * @param  {...any} args - what to log
  */
  static log(force, ...args) {  
     // const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
  
      if (force || (game.user.isGM && game.settings.get(dangerZone.ID, 'logging'))) {
        console.log(this.ID, '|', ...args);
      }
  }

  static async _migrate(){
    
	  //data migrations
	  if(game.user.isGM && game.settings.get('danger-zone', 'region-migration-complete') === false){
      ui.notifications?.info('Danger Zone migration of zone dimensions to regions started')
      for (const scene of game.scenes) {
         await dangerZone.migrate(scene)
      }
      game.settings.set(dangerZone.ID, 'region-migration-complete', true);
      ui.notifications?.info('Danger Zone migration of zone dimensions to regions completed!')
    }
  }

  /**
   * converts a JSON object to a zone class
   * @param {object} flag 
   * @returns 
   */
  static _toClass(flag){
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
        if((!options.enabled || flag[zn].enabled) && (!options.triggerRequired || flag[zn].triggers.trigger) && flag[zn].scene?.sceneId) ar.push(this._toClass(flag[zn]));
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

  /**
   * Returns all zones on a given scene that automatically triggered during combat
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getCombatZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => COMBATTRIGGERS.includes(zn.trigger))
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
    return this.getAllZonesFromScene(sceneId).filter(zn => ["move","aura"].includes(zn.trigger))
  }

  /**
   * Returns all zones on a given scene that are either manual and enabled or triggered in an automated fashion
   * @param {string} sceneId  the scene id
   * @returns array of zones
   */
  static getTriggerZonesFromScene(sceneId) {
      return this.getAllZonesFromScene(sceneId, {enabled: false, typeRequired: true}).filter(zn => zn.enabled || zn.trigger !== 'manual').concat(this.getGlobalZones(sceneId))
  }
  
  static getRandomZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.random)
  }
  
  static getAllDangersAsGlobalZones(sceneId) {
    return dangerZoneType.allDangers.map(danger => {
      return this._convertZoneGlobalToScene(danger, sceneId);
      }
    )
  }

  static getGlobalZones(sceneId) {
    return dangerZoneType.allGlobalZones.map(danger => {
      return this._convertZoneGlobalToScene(danger, sceneId);
      }
    )
  }

  static getZonesToMigrate(sceneId, zoneId = ''){
    return dangerZone.getAllZonesFromScene(sceneId, {enabled: false, typeRequired: false, triggerRequired: false})?.filter(zn => (!zoneId || zn.id ===zoneId) && !zn.scene.regionId && zn.scene.start) ?? []
  }

 /**
   * Returns a specific zone from the given scene
   * @param {string} zoneId the danger zone id
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getZoneFromScene(zoneId, sceneId) {
    let flag = game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE + `.${zoneId}`);
    return flag ? this._toClass(flag) : undefined
  } 
  
  static getGlobalZone(dangerId, sceneId){
    return this._convertZoneGlobalToScene(dangerZoneType.getDanger(dangerId), sceneId);
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

  /**
   * adds a new zone to a scene
   * @param {string} sceneId 
   * @returns the new zone
   */
  static async addZone(sceneId) {
    const instance = new zone(sceneId);
    await scene.setFlag(this.ID, this.FLAGS.SCENEZONE, {[instance.id]: instance});
    return instance
  } 

  static async copyZone(sourceSceneId, sourceZoneId, targetSceneId){
    const source = foundry.utils.deepClone(this.getZoneFromScene(sourceZoneId,sourceSceneId));
    delete source['id']; delete source['scene'];
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
   * @returns 
   */
  static async deleteZoneFromScene(zoneId, sceneId) {
    return await this.getZoneFromScene(zoneId, sceneId).delete();
  }

  static _convertZoneGlobalToScene(danger, sceneId){
    const zn = danger?.options?.globalZone;
    let worldZone = false;
    !zn ? zn = WORLDZONE : worldZone = true;
    zn.scene = {sceneId: sceneId, dangerId: danger.id};
    zn.type= danger.id;
    zn.title = danger.name;
    worldZone ? zn.id = 'w_' + danger.id : zn.id = 'd_' + danger.id
    return this._toClass(zn);
  }

  static async getRandomZoneFromScene(sceneId, trigger, eligibaleZones = []) {
    let keptZones = [], max = 0;
    let zones = this.getRandomZonesFromScene(sceneId);
    for (const zn of zones) {
      if(zn.triggerWithInitiative === trigger && (!eligibaleZones.length || eligibaleZones.find(z => z.id === zn.id))){
        let min = max + 1;
        max += zn.weight;
        keptZones.push({zone: zn, min: min, max: max});
      }
    }

    if(!keptZones) return
    const maybe = await new Roll(`1d${max}`).evaluate({async: true})
    const randomResult = maybe.result;

    this.log(false,'Random Zone Search ', {zones:keptZones, roll: randomResult, range: {min: 1, max:max}});
    return keptZones.find(zn => randomResult >= zn.min && randomResult <= zn.max).zone
  }

  static async migrate(scene, zoneId = ''){
    if(!scene) return
    const zones = dangerZone.getZonesToMigrate(scene.id, zoneId)
    if(!zones.length) return;
    let regions = [], regionsData = [];

    regionsData = zones.filter(zn => !zn.scene.hasFullSceneDimensions && !zn.scene._migrateRegionMatch(regionsData)).map(zn => zn.scene._migrationData.regionData)
    
    if (regionsData.length) regions = await scene.createEmbeddedDocuments("Region", regionsData)

    dangerZone.log(false, 'Check migration to region', {zones: zones, scene: scene, regions: regions, regionsData: regionsData})

    for (const zn of zones) {
      await zn.scene.convertToRegion(zn.scene._migrateRegionMatch(regions)?.id)
    }
  }
  
  static async updateAllSceneZones(sceneId,flag){
    const updt = await game.scenes.get(sceneId).setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, flag);
    return updt
  }

  static validatePreupdateZones(scene){
    const flag = scene.flags?.[this.ID]?.[this.FLAGS.SCENEZONE];
    let b = false;
    if(flag){
      Object.keys(flag).forEach(function(key) {
        if(flag[key].scene.sceneId !== scene.id){
          flag[key].scene.sceneId = scene.id
          b=true;
        }
      });
    }
    return b ? flag : b
  }

  static initializeTriggerButtons(){
    switch(game.settings.get(this.ID, 'scene-trigger-button-display')){
      case "S":
        addTriggersToSceneNavigation();
        break
      case "H":
        addTriggersToHotbar();
        break
    }
  }

  static async wipe(documentName){
    const ids=canvas.scene[PLACEABLESBYDOCUMENT[documentName]].filter(t => t.flags[dangerZone.ID]).map(t => t.id);
    if(ids.length) await canvas.scene.deleteEmbeddedDocuments(documentName, ids)
  }

  static async wipeAll(){
    for (var documentName in PLACEABLESBYDOCUMENT) {
      if(documentName === 'fxmaster-particle'){
        if(fxMasterOn) await Hooks.call("fxmaster.updateParticleEffects", []); break;
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
    this.actor = '',
    this.enabled = game.settings.get('danger-zone', 'scene-enabled-default'),
    this.extensions = [],
    this.flavor = '',
    this.initiative = 0,
    this.lightReplace = 'N',
    this.likelihood = 100,
    this.loop = 1,
    this.operation = "Q",
    this.options = {
      allInArea: false,
      bleed: true,
      combatantInZone: false,
      delay: {min: 0, max: 0},
      noPrompt:false,
      placeTemplate:false,
      promptTrigger: false,
      runUntilTokenFound: false,
      stretch: '',
      targetCombatant: false,
      deleteAfter: {turns: 0, rounds: 0, seconds: 0}
    },
    this.random = false,
    this.regionReplace = 'N',
    this.replace = 'N',
    this.scene = new dangerZoneDimensions(sceneId, this.id, regionId),
    this.soundReplace = 'N',
    this.source = {
      area: '',
      actor: '',
      limit: {
        min: 0,
        max: 0
      },
      tag: '',
      target: '',
      trigger: ''
    },
    this.title = '',
    this.tokenDisposition = '',
    this.tokenExCon = '',
    this.trigger = 'manual',
    this.type = '',
    this.wallReplace = 'N',
    this.weatherReplace = 'N',
    this.weight = 1
  }

  get conditionEscape(){
    return stringToArray(this.tokenExCon)
  }

  get danger(){
    return dangerZoneType.getDanger(this.type)
  }

  get hasSourcing(){
    return this.source.actor ? true : false
  }

  delay(){
    return zone.delay(this.options.delay)
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

  get sources(){
    return this.scene.scene.tokens.filter(t => t.actor?.id === this.source.actor) 
  }

  get triggerDescription(){
    return this.trigger ? game.i18n.localize(DANGERZONETRIGGERS[this.trigger]) : ''
  }

  get triggerWithInitiative(){
    return (this.trigger === 'initiative-start' || this.trigger === 'initiative-end') ? (this.trigger + '-' + (this.initiative ? this.initiative.toString() : '0')) : this.trigger
  }

  /**
   * sets the flag data for the module on the scene for this zone, effectively saving the zone 
   * @returns module flag on the scene
   */
  async _setFlag(){
    const updt = await game.scenes.get(this.scene.sceneId).setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, {[this.id]: this});
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

  /**
   * private method to save the zone data
   * @param {object} updateData 
   */
  async _update(updateData, options = {insertKeys: false, enforceTypes: true}){
    foundry.utils.mergeObject(this, updateData, options);
    const updt = await this._setFlag();
    return updt
  }

  /**
   * deletes this id and zone json from the scene's module's flag
   * @returns the remaining flag data
   */
  async delete(){
    await this.scene.scene.update({[`flags.${dangerZone.ID}.${dangerZone.FLAGS.SCENEZONE}.-=${this.id}`]: null})
  }

  get _executor(){
    return new executor(this)
  }

  async executor(options={}){
    const ex = new executor(this, options);
    await ex.set(false);
    return ex
  }

  get flaggablePlaceables(){
    return this.scene.scene.walls.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE])
      .concat(this.scene.scene.lights.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]))
      .concat(this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]))
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

  /**
   * enables or disables the zone
   * @returns zone
   */
  async toggleZoneActive() {
    if(this.enabled){this.enabled = false} else {this.enabled = true}
    return await this._setFlag();
  }

  async sourceArea(){
    const obj = {documents: [], target: this.source.target}
    switch(this.source.area){
        case 'A':
          obj['documents'] = this.scene.scene.tokens.filter(t => t.actor?.id === this.source.actor);
          break;
        case 'C':
          obj['documents'] = this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.source.tag);
          break;
        case 'D':
          obj['documents'] = this.flaggablePlaceables.filter(t => t.flags[dangerZone.ID][dangerZone.FLAGS.SCENETILE].type === this.source.tag);
          break;
        case 'T':
          obj['documents'] = await getTagEntities(this.source.tag, this.scene.scene)
          break;
        case 'Y':
          obj['documents'] = this.scene.scene.tiles.filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.source.tag);
          break;
        case 'Z':
          obj['documents'] = this.flaggablePlaceables.filter(t => t.flags[dangerZone.ID][dangerZone.FLAGS.SCENETILE].zoneId === this.source.tag);
          break;
    }
    return obj
  }

  generateSourceCount(){
    if(!this.source.limit.max && !this.source.limit.min) return -1
    return this.source.limit.max === this.source.limit.min ? this.source.limit.max : Math.floor(Math.random() * (this.source.limit.max - this.source.limit.min + 1))
  }

  async tokensInZone(tokens){
    if(!tokens?.length) return false
    const b = await this.scene.getZoneBoundary();
    return this.zoneEligibleTokens(b.tokensIn(tokens)).length ? true : false
  }

  async sourceOnScene(){
    if(this.source.actor && this.scene.scene.tokens.find(t => t.actor?.id === this.source.actor)) return true
    const area = await this.sourceArea()
    return area.documents.length ? true : false
  }

  async sourceTrigger(actorIds){
    const trigger = this.source.trigger ? (this.source.trigger === 'C' ? await this.sourceOnScene() : actorIds.includes(this.source.actor)) : true;
    dangerZone.log(false,'Determining Source Trigger ', {zone: this, triggerActors: actorIds, trigger: trigger});
    return trigger
  }

  isSource(token, sources = []){
    return sources.length ? sources.filter(s => s.id === token.id).length > 0 : token.actor?.id === this.source.actor
  }

  sourceTreatment(treatment, tokens, sources = []){
    if(!treatment || !sources.length) return tokens
    switch(treatment){
      case "I":
        return tokens.filter(t => !sources.find(s => s.id === t.id))
      case "S":
        return tokens.filter(t => t.actor?.id !== this.source.actor).concat(sources)
      case "O":
        return sources
      default:
        return tokens
    }
  }

  sourceAdd(tokens){
    return this.sources.concat(tokens.filter(t => t.actor?.id !== this.source.actor))
  }

  stretch(options){
    switch(this.options.stretch){
      case "B":
          options.bottom = this.scene.bottom
          break;
      case "G":
          options.bottom = 0
          break;
      case "S":
          options.top = null
          break;
      case "T":
          options.top = this.scene.top
          break;
    }
    return options
  }

  async triggerCheck(){
    if(!this.options.promptTrigger) return true
    const choice = await new Promise((resolve, reject) => {
        new Dialog({
        title: game.i18n.localize("DANGERZONE.alerts.trigger-zone"),
        content: `<p>${game.i18n.localize("DANGERZONE.alerts.trigger-zone-confirm")} ${this.title}?</p>`,
        buttons: {
            one: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("DANGERZONE.continue"),
                callback: () => resolve(true)
            },
            two: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("DANGERZONE.cancel"),
                callback: () => {resolve(false)}
            }
        },
        default: "two"
        }).render(true);
    });
    return choice
  }

  async wipe(document, replace = ''){
      let ids = []; const data = this._wipeData(document); const rep = replace ? replace : data.replace;
      if(document === 'fxmaster-particle'){ 
        switch (rep) {
          case 'A': 
              await this.clearWeather({includeFXMaster: fxMasterOn, includeFoundry: !this.danger.weatherIsFoundry})
          break;
          case 'T': 
              await this.clearWeather({includeFXMaster: fxMasterOn, includeFoundry: false, effect: this.type})
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
            ids=this.scene.scene[data.placeable].filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.type).map(t => t.id);
              break;
          case 'R':
            ids=this.scene.scene[data.placeable].filter(t => t.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.trigger).map(t => t.id);
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
    if(this.actor || this.tokenDisposition || this.tokenExCon){
      for(let token of tokens){
        let keep = 1;
        if(this.actor && token.actorId !== this.actor){
          keep = 0;
        }
        else if(this.tokenDisposition && parseInt(this.tokenDisposition) !== token.disposition){
          keep = 0;
        }
        else if(this.tokenExCon && token.actor?.effects?.find(e => !e.disabled && this.conditionEscape.includes(e.label))){
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
        return {replace: this.replace, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'Wall':
        return {replace: this.wallReplace, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'AmbientLight':
        return {replace: this.lightReplace, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'AmbientSound':
        return {replace: this.soundReplace, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'Region':
        return {replace: this.regionReplace, placeable: PLACEABLESBYDOCUMENT[document]}
      case 'fxmaster-particle':
        return {replace: this.weatherReplace}
    }
  }

  /*prompts the user to select the zone location point (top left grid location) and captures the location*/
  async promptTemplate() {
    const elevation = (this.options.noPrompt) ? 0 : await this._promptElevation() ;
    const xy = await this._promptXY();
    return (xy ? {coords: {x: xy.x, y: xy.y}, elevation: elevation} : {})
  }

  async _promptElevation(){
    const elevation = await new Promise((resolve, reject) => {
      new Dialog({
          title: game.i18n.localize("DANGERZONE.alerts.input-z"),
          content: `<p>${game.i18n.localize("DANGERZONE.alerts.enter-z")}</p><center><input type="number" id="zInput" min="0" steps="1" value="0"></center><br>`,
          buttons: {
              submit: {
                  label: game.i18n.localize("DANGERZONE.yes"),
                  icon: '<i class="fas fa-check"></i>',
                  callback: async (html) => {
                      const elevation = parseInt(html.find("#zInput")[0].value);
                      resolve(elevation)
                      }
                  },
              cancel:  {
                  label: game.i18n.localize("DANGERZONE.cancel"),
                  icon: '<i class="fas fa-times"></i>',
                  callback: () => {
                      resolve(0)
                      }
                  }
              },
          default: 'submit'
          }, {width: 75}).render(true);
    });  
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