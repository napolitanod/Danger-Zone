import {dangerZoneDimensions} from './apps/dimensions.js';
import {DangerZoneTypesForm} from './apps/danger-list-form.js';
import {dangerZoneType} from './apps/zone-type.js';
import {addTriggersToSceneNavigation} from './apps/scene-navigation.js';
import {addTriggersToHotbar} from './apps/hotbar.js';
import { WORLDZONE } from './apps/constants.js';
import {executor} from './apps/workflow.js';
import {wait} from './apps/helpers.js';

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
    DANGERZONEEXECUTOR: `modules/${this.ID}/templates/danger-zone-executor-form.hbs`,
    DANGERZONESCENE: `modules/${this.ID}/templates/danger-zone-scene-form.hbs`,
    DANGERZONETYPESCONFIG: `modules/${this.ID}/templates/danger-zone-types.hbs`,
    DANGERZONETYPE: `modules/${this.ID}/templates/danger-form.hbs`,
    DANGERZONEACTIVEEFFECT: `modules/${this.ID}/templates/active-effect-form.hbs`,
    DANGERZONEDANGERACTIVEEFFECT: `modules/${this.ID}/templates/danger-form-active-effect.hbs`,
    DANGERZONEDANGERAUDIO: `modules/${this.ID}/templates/danger-form-audio.hbs`,
    DANGERZONEDANGERBACKGROUNDEFFECT: `modules/${this.ID}/templates/danger-form-background-effect.hbs`,
    DANGERZONEDANGERFLUIDCANVAS: `modules/${this.ID}/templates/danger-form-fluid-canvas.hbs`,
    DANGERZONEDANGERFOREGROUNDEFFECT: `modules/${this.ID}/templates/danger-form-foreground-effect.hbs`,
    DANGERZONEDANGERGLOBALZONE: `modules/${this.ID}/templates/danger-form-global-zone.hbs`,
    DANGERZONEDANGERLASTINGEFFECT: `modules/${this.ID}/templates/danger-form-lasting-effect.hbs`,
    DANGERZONEDANGERLIGHT: `modules/${this.ID}/templates/danger-form-light.hbs`,
    DANGERZONEDANGERMUTATE: `modules/${this.ID}/templates/danger-form-mutate.hbs`,
    DANGERZONEDANGERTOKENRESPONSE: `modules/${this.ID}/templates/danger-form-token-response.hbs`,
    DANGERZONEDANGERTOKENSAYS: `modules/${this.ID}/templates/danger-form-token-says.hbs`,
    DANGERZONEDANGERTOKENEFFECT: `modules/${this.ID}/templates/danger-form-token-effect.hbs`,
    DANGERZONEDANGERTOKENMOVE: `modules/${this.ID}/templates/danger-form-token-move.hbs`,
    DANGERZONEDANGERWALL: `modules/${this.ID}/templates/danger-form-wall.hbs`,
    DANGERZONEDANGERWARPGATE: `modules/${this.ID}/templates/danger-form-warpgate.hbs`,
    DANGERZONEZONECOPY: `modules/${this.ID}/templates/danger-zone-scene-zone-copy.hbs`
  }

  static initialize() {
    this.DangerZoneTypesForm = new DangerZoneTypesForm();
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
        if((!options.enabled || flag[zn].enabled) && (!options.typeRequired || flag[zn].type) && (!options.triggerRequired || flag[zn].trigger) && flag[zn].scene?.sceneId) ar.push(this._toClass(flag[zn]));
    }
    return ar
  }
  
  static getZoneList(sceneId){
    const list = {};
    for (const zn of this.getAllZonesFromScene(sceneId).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)})) {
      list[zn.id] = zn.title;
    }
    return list;
  }

  /**
   * Returns all zones on a given scene that automatically triggered during combat
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getCombatZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => !["manual","aura","move"].includes(zn.trigger))
  }  

  static getExecutorZones(sceneId){
    return this.getAllZonesFromScene(sceneId, {enabled: false}).concat(this.getGlobalZones(sceneId))
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
      return this.getAllZonesFromScene(sceneId, {enabled: false}).filter(zn => zn.enabled || zn.trigger !== 'manual').concat(this.getGlobalZones(sceneId))
  }
  
  static getRandomZonesFromScene(sceneId) {
    return this.getAllZonesFromScene(sceneId).filter(zn => zn.random)
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
   * unsets the given flag for this zone from a zone, effectively deleting it
   * @param {string} zoneId the id of the zone class to be deleted 
   * @param {string} sceneId the id of the scene that holds the zone as a flag
   * @returns 
   */
  static async deleteZoneFromScene(zoneId, sceneId) {
    return await this.getZoneFromScene(zoneId, sceneId).delete();
  }

  static _convertZoneGlobalToScene(danger, sceneId){
    const zn = danger?.options?.globalZone;
    if(!zn)  zn = WORLDZONE;
    zn.scene = {sceneId: sceneId, dangerId: danger.id};
    zn.type= danger.id;
    zn.title = danger.name;
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
    const maybe = await new Roll(`1d${max}`).roll();
    const randomResult = maybe.result;

    this.log(false,'Random Zone Search ', {zones:keptZones, roll: randomResult, range: {min: 1, max:max}});
    return keptZones.find(zn => randomResult >= zn.min && randomResult <= zn.max).zone
  }

  static validatePreupdateZones(scene){
    const flag = scene.data.flags?.[this.ID]?.[this.FLAGS.SCENEZONE];
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
    this.flavor = '',
    this.initiative = 0,
    this.lightReplace = 'N',
    this.likelihood = 100,
    this.loop = 1,
    this.options = {
      allInArea: false,
      bleed: true,
      delay: {min: 0, max: 0},
      noPrompt:false,
      placeTemplate:false,
      runUntilTokenFound: false,
      stretch: '',
      deleteAfter: {turns: 0, rounds: 0, seconds: 0}
    },
    this.random = false,
    this.replace = 'N',
    this.scene = new dangerZoneDimensions(sceneId, this.id),
    this.source = {
      actor: '',
      trigger: ''
    },
    this.title = '',
    this.tokenDisposition = '',
    this.trigger = 'manual',
    this.type = '',
    this.wallReplace = 'N',
    this.weight = 1
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

  get sourceOnScene(){
    return this.scene.scene.tokens.find(t => t.actor?.id === this.source.actor) ? true : false
  }

  get sources(){
    return this.scene.scene.tokens.filter(t => t.actor?.id === this.source.actor) 
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
   * unsets this id and zone json from the scene's module's flag
   * @returns the remaining flag data
   */
  async delete(){
    return await game.scenes.get(this.scene.sceneId).unsetFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE + `.${this.id}`);
  }

  get _executor(){
    return new executor(this)
  }

  async executor(options={}){
    const ex = new executor(this, options);
    await ex.set();
    return ex
  }

  
  async highlightZone(){
    if(this.scene.sceneId === canvas.scene?.id && canvas.scene?.data?.gridType){
      dangerZoneDimensions.destroyHighlightZone(this.id, '_tzHL', this.scene.dangerId); 
      await dangerZoneDimensions.addHighlightZone(this.id, this.scene.sceneId, '_tzHL', this.scene.dangerId);
      await wait(2500)
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

  sourceTrigger(actorIds){
    dangerZone.log(false,'Determining Source Trigger ', {zone: this, triggerActors: actorIds});
    if(this.source.trigger && this.source.actor){
        return (this.source.trigger === 'C' ? this.sourceOnScene : actorIds.includes(this.source.actor));
    }
    return true
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

  async wipe(document, replace = ''){
      let ids = []; const data = this._wipeData(document);
      switch (replace ? replace : data.replace) {
          case 'Z':
            ids=this.scene.scene[data.placeable].filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.id).map(t => t.id);
              break;
          case 'T':
            ids=this.scene.scene[data.placeable].filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.type).map(t => t.id);
              break;
          case 'R':
            ids=this.scene.scene[data.placeable].filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.trigger).map(t => t.id);
              break;
          case 'A':
            ids=this.scene.scene[data.placeable].filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
              break;
          default:
            return false;
      }
      if(ids.length) await this.scene.scene.deleteEmbeddedDocuments(document, ids)
      return true
 }

  zoneEligibleTokens(tokens){
    let kept = [];
    if(this.actor || this.tokenDisposition){
      for(let token of tokens){
        let keep = 1;
        if(this.actor && token.data.actorId !== this.actor){
          keep = 0;
        }
        if(this.tokenDisposition && parseInt(this.tokenDisposition) !== token.data.disposition){
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
        return {replace: this.replace, placeable: 'tiles'}
      case 'Wall':
        return {replace: this.wallReplace, placeable: 'walls'}
      case 'AmbientLight':
        return {replace: this.lightReplace, placeable: 'lights'}
    }
  }

  /*prompts the user to select the zone location point (top left grid location) and captures the location*/
  async promptTemplate() {
    const z = (this.options.noPrompt) ? 0 : await this._promptZ() 
    const {x,y} = await this._promptXY(z);
    return {x: x, y: y, z: z}
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
    let currentLayer = canvas.activeLayer;
    canvas.activateLayer('grid');
    
    dangerZoneDimensions.destroyHighlightZone(this.id, '', this.scene.dangerId);
    await dangerZoneDimensions.addHighlightZone(this.id, this.scene.sceneId, '_wf', this.scene.dangerId);

    const xy = await new Promise((resolve, reject)=>{
        ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-target"));
        canvas.app.stage.once('pointerdown', event => {
            let selected = event.data.getLocalPosition(canvas.app.stage);
            resolve(selected);
        })
    });
      
    dangerZoneDimensions.destroyHighlightZone(this.id, '_wf', this.scene.dangerId);    
    currentLayer.activate();
    return xy
  }
}


