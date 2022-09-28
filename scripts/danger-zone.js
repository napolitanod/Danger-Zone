import {dangerZoneDimensions} from './apps/dimensions.js';
import {DangerZoneTypesForm} from './apps/danger-list-form.js';
import {dangerZoneType} from './apps/zone-type.js';
import {addTriggersToSceneNavigation} from './apps/scene-navigation.js';
import {addTriggersToHotbar} from './apps/hotbar.js';
import {COMBATTRIGGERS, DANGERZONETRIGGERS,  PLACEABLESBYDOCUMENT, WORLDZONE} from './apps/constants.js';
import {executor} from './apps/workflow.js';
import {ExecutorForm} from './apps/executor-form.js';
import {wait, getTagEntities} from './apps/helpers.js';
import { fxMasterOn, warpgateOn } from './index.js';

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
    DANGERZONEDANGERFLUIDCANVAS: `modules/${this.ID}/templates/danger-form-fluid-canvas.hbs`,
    DANGERZONEDANGERFOREGROUNDEFFECT: `modules/${this.ID}/templates/danger-form-foreground-effect.hbs`,
    DANGERZONEDANGERGLOBALZONE: `modules/${this.ID}/templates/danger-form-global-zone.hbs`,
    DANGERZONEDANGERITEM: `modules/${this.ID}/templates/danger-form-item.hbs`,
    DANGERZONEDANGERLASTINGEFFECT: `modules/${this.ID}/templates/danger-form-lasting-effect.hbs`,
    DANGERZONEDANGERLIGHT: `modules/${this.ID}/templates/danger-form-light.hbs`,
    DANGERZONEDANGERMUTATE: `modules/${this.ID}/templates/danger-form-mutate.hbs`,
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
      const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
  
      if (shouldLog) {
        console.log(this.ID, '|', ...args);
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
    return mergeObject(zn, flag, {insertKeys: false, enforceTypes: true})
  }

  static sceneHasZone(sceneId){
    return game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE) ? true : false 
  }

  static getAllZonesFromScene(sceneId, options = {enabled: true, typeRequired: true, triggerRequired: true}){
    const ar = [];
    const flag = sceneId ? game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE) : ar; 
    for (var zn in flag) {
        if((!options.enabled || flag[zn].enabled) && (!options.triggerRequired || flag[zn].trigger) && flag[zn].scene?.sceneId) ar.push(this._toClass(flag[zn]));
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
    const source = deepClone(this.getZoneFromScene(sourceZoneId,sourceSceneId));
    delete source['id']; delete source['scene'];
    const zn = new zone(targetSceneId);
    const updt = await zn.update(source); 
    updt.data.flags?.[this.ID]?.[this.FLAGS.SCENEZONE]?.[zn.id] ? ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.zone-copied")) : ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.zone-copy-fail"));
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
  constructor (sceneId) {
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
    this.replace = 'N',
    this.scene = new dangerZoneDimensions(sceneId, this.id),
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
    return this.tokenExCon ? this.tokenExCon.split('|').map(n => n.trim()).filter(n => n !== "") : ''
  }

  get danger(){
    return dangerZoneType.getDanger(this.type)
  }

  get delay(){
    const del = this.options.delay.max - this.options.delay.min
    return del > 0 ? del : 0
  }

  get hasSourcing(){
    return this.source.actor ? true : false
  }

  get randomDelay(){
    return Math.floor(Math.random() * this.delay)
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

  /**
   * public method to save the zone data
   * @param {object} updateData 
   * @returns returns the zone after update
   */
  async update(updateData){
    const updt = await this._update(updateData);
    return updt
  }

  /**
   * private method to save the zone data
   * @param {object} updateData 
   */
  async _update(updateData){
    mergeObject(this, updateData, {insertKeys: false, enforceTypes: true});
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
    const b = await this.scene.boundary();
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

  static sourceTreatment(treatment, tokens, sources = []){
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
          options.bottom = this.scene.start.z
          break;
      case "G":
          options.bottom = 0
          break;
      case "S":
          options.top = 99999
          break;
      case "T":
          options.top = this.scene.end.z
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
        if(fxMasterOn) {
          switch (rep) {
            case 'A': Hooks.call("fxmaster.updateParticleEffects", []); break;
            case 'T': Hooks.call("fxmaster.switchParticleEffect", {name: this.type, type: this.danger.weather?.type}); break;
            default: return false
          }
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
      case 'fxmaster-particle':
        return {replace: this.weatherReplace}
    }
  }

  /*prompts the user to select the zone location point (top left grid location) and captures the location*/
  async promptTemplate() {
    const z = (this.options.noPrompt) ? 0 : await this._promptZ() 
    const xy = await this._promptXY(z);
    return xy ? {x: xy.x, y: xy.y, z: z} : {}
  }

  async _promptZ(){
    const z = await new Promise((resolve, reject) => {
      new Dialog({
          title: game.i18n.localize("DANGERZONE.alerts.input-z"),
          content: `<p>${game.i18n.localize("DANGERZONE.alerts.enter-z")}</p><center><input type="number" id="zInput" min="0" steps="1" value="0"></center><br>`,
          buttons: {
              submit: {
                  label: game.i18n.localize("DANGERZONE.yes"),
                  icon: '<i class="fas fa-check"></i>',
                  callback: async (html) => {
                      const z = parseInt(html.find("#zInput")[0].value);
                      resolve(z)
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
    return z
  }

  async _promptXY(){ 
    let xy
    dangerZoneDimensions.destroyHighlightZone(this.id, '', this.scene.dangerId);
    await dangerZoneDimensions.addHighlightZone(this.id, this.scene.sceneId, '_wf', this.scene.dangerId);

    if(warpgateOn && this.danger.dimensions.units.w === this.danger.dimensions.units.h){
      ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-warpgate-target"));
      const size = canvas.grid.type === 1 ? this.danger.dimensions.units.w : 1
      xy = await warpgate.crosshairs.show({icon: this.danger.icon, fillAlpha: 0.1, fillColor: '#000000', size: size, interval: (size % 2) > 0 ? -1 : 1 })
      let tg = canvas.grid.grid.getGridPositionFromPixels(xy.x, xy.y)
      let tl = canvas.grid.grid.getPixelsFromGridPosition(tg[0]-Math.floor(size/2), tg[1]-Math.floor(size/2))
      xy.x = tl[0], xy.y = tl[1]
    } else {
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
    }
      
    dangerZoneDimensions.destroyHighlightZone(this.id, '_wf', this.scene.dangerId); 
    return xy
  }
}