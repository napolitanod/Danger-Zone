import {dangerZoneDimensions} from './apps/dimensions.js';
import {DangerZoneTypesForm} from './apps/zone-type-list-form.js';

/**
 * A class which holds some constants for dangerZone
 */
export class dangerZone {
  static ID = 'danger-zone';
  
  static FLAGS = {
    SCENEZONE: 'sceneZone',
    SCENETILE: 'sceneTile',
    ZONETYPE: 'zoneTypeEffect'
  }
 
  static TEMPLATES = {
    DANGERZONECONFIG: `modules/${this.ID}/templates/danger-zone-form.hbs`,
    DANGERZONETYPESCONFIG: `modules/${this.ID}/templates/danger-zone-types.hbs`,
    DANGERZONETYPE: `modules/${this.ID}/templates/danger-zone-type-form.hbs`,
    DANGERZONEACTIVEEFFECT: `modules/${this.ID}/templates/active-effect-form.hbs`
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
   * Returns a specific zone from the given scene
   * @param {string} zoneId the danger zone id
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getZoneFromScene(zoneId, sceneId) {
    let flag = game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE + `.${zoneId}`);
    if(!flag){return}
    const zn = this._toClass(flag);
    dangerZone.log(false,'Zone Got Got ', {"zone": zn, zoneId, sceneId});
    return zn
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

  /**
   * Returns all zones on a given scene
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getAllZonesFromScene(sceneId){
    const flags = game.scenes.get(sceneId).getFlag(this.ID, this.FLAGS.SCENEZONE); 
    if(!flags){return new Map}
    return new Map(Object.entries(flags).map(([k,v]) => [k, this._toClass(v)])) 
  }

  /**
   * Returns all zones on a given scene that automatically triggered during combat
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getCombatZonesFromScene(sceneId) {
    let mp = new Map
    let zones = this.getAllZonesFromScene(sceneId); 
    for (let [k,zn] of zones) {
      if(zn.trigger !== "manual" && zn.enabled && zn.type){mp.set(k, zn)}
    }
    return mp
  }
  
  /**
   * Returns all zones on a given scene that are either manual and enabled or triggered in an automated fashion
   * @param {string} sceneId  the scene id
   * @returns 
   */
  static getTriggerZonesFromScene(sceneId) {
    let mp = new Map
    let zones = this.getAllZonesFromScene(sceneId); 
    for (let [k,zn] of zones) {
      if(zn.trigger && zn.type && zn.scene?.sceneId && (zn.enabled || zn.trigger !== 'manual')){mp.set(k, zn)}
    }
    return mp
  }

  /**
   * returns a random zone for a given scene and trigger, accounting for weight.
   * @param {*} sceneId 
   * @param {*} trigger 
   * @returns 
   */
  static async getRandomZoneFromScene(sceneId, trigger) {
    let keptZones = [], max = 0;
    let zones = this.getAllZonesFromScene(sceneId);
    if(!zones.size){return false}
    for (let [k,zn] of zones) {
      if(zn.trigger===trigger && zn.random && zn.type && zn.scene?.sceneId && zn.enabled){
        let min = max + 1;
        max += zn.weight;
        keptZones.push({zone: zn, min: min, max: max});
      }
    }

    if(!keptZones){return dangerZone.log(false,'Random Zone Get Failed ', {sceneZones: zones, eligibleZones: keptZones, range: {min: 1, max:max}});}
    const maybe = new Roll(`1d${max}`);
    const randomResult = await maybe.roll().result;

    for (let i = 0; i < keptZones.length; i++) {
      let zn = keptZones[i];
      if(randomResult >= zn.min && randomResult <= zn.max){
        dangerZone.log(false,'Random Zone Identified ', {zone: zn.zone, zones:keptZones, roll: randomResult, range: {min: 1, max:max}});
        return zn.zone
      }
    }
    dangerZone.log(false,'Random Zone Not Identified ', {sceneZones: zones, eligibleZones: keptZones, roll: randomResult, range: {min: 1, max:max}});
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
    this.likelihood = 100,
    this.options = {
      allInArea: false,
      bleed: true,
      placeTemplate:false,
      runUntilTokenFound: false,
      deleteAfter: {turns: 0, rounds: 0, seconds: 0}
    },
    this.random = false,
    this.replace = 'N',
    this.scene = new dangerZoneDimensions(sceneId, this.id),
    this.title = '',
    this.tokenDisposition = '',
    this.trigger = 'manual',
    this.type = '',
    this.weight = 1
  }

  /**
   * sets the flag data for the module on the scene for this zone, effectively saving the zone 
   * @returns module flag on the scene
   */
  async _setFlag(){
    await game.scenes.get(this.scene.sceneId).setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, {[this.id]: this});
  }

  /**
   * public method to save the zone data
   * @param {object} updateData 
   * @returns returns the zone after update
   */
  async update(updateData){
    return await this._update(updateData);
  }

  /**
   * private method to save the zone data
   * @param {object} updateData 
   */
  async _update(updateData){
    mergeObject(this, updateData, {insertKeys: false, enforceTypes: true});
    await this._setFlag();
  }

  /**
   * unsets this id and zone json from the scene's module's flag
   * @returns the remaining flag data
   */
  async delete(){
    return await game.scenes.get(this.scene.sceneId).unsetFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE + `.${this.id}`);
  }

  /**
   * enables or disables the zone
   * @returns zone
   */
  async toggleZoneActive() {
    if(this.enabled){this.enabled = false} else {this.enabled = true}
    return await this._setFlag();
  }

  zoneTokens(tokens){
    if(!tokens){tokens = game.scenes.get(this.scene.sceneId).tokens}
    return dangerZoneDimensions.tokensInBoundary(tokens, {start: this.scene.start, end: this.scene.end});
  }

  zoneEligibleTokens(tokens){
    const inBoundary = this.zoneTokens(tokens);
    let kept = [];
    if(this.actor || this.tokenDisposition){
      for(let token of inBoundary){
        let keep = 1;
        if(this.actor && token.data.actorId !== this.actor){
          keep = 0;
        }
        if(this.tokenDisposition && parseInt(this.tokenDisposition) !== token.data.disposition){
          keep = 0;
        }
        if(keep){kept.push(token)}
      }
    } else {kept = inBoundary}
    return kept
  }
}


