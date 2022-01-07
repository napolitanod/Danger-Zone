import {dangerZone} from '../danger-zone.js';
import {WORLDZONE} from './constants.js';
import {monksActiveTilesOn} from '../index.js';

export class dangerZoneType {
    constructor() {
      this.dimensions = {
        units: {
          w: 1, 
          h: 1,
          d: 0
        }
      },
      this.icon = 'icons/svg/biohazard.svg',
      this.id = foundry.utils.randomID(16),
      this.name = 'New Danger',
      this.options = {
        ambientLight: {
          active: 0,
          angle: 360,
          bright: 0,
          dim: 0,
          lightAnimation: {
              speed: 5,
              intensity: 5,
              type: ""
          },
          rotation: 0,
          tag: "",
          tintColor: "",
          tintAlpha: 0.5
        },
        audio: {
          file:'',
          delay: 0,
          duration: 0,
          volume: 0.5
        },
        backgroundEffect: {
          delay: 0,
          file: '',
          randomFile: false,
          scale: 1.0,
          repeat: 0,
          rotate: false,
          duration: 30
        },
        effect: {},
        flags: {},
        foregroundEffect: {
          delay: 0,
          file: '',
          randomFile: false,
          scale: 1.0,
          source: {
            enabled: false,
            name: '',
            swap: false
          },
          repeat: 0,
          duration: 0
        },
        globalZone : {},
        lastingEffect: {
          alpha: 1,
          delay: 0,
          file: '',
          hidden: false,
          occlusion: {
            alpha: 0,
            mode: 'FADE'
          },
          overhead: false,
          randomFile: false,
          scale: 1.0,
          loop: true,
          tag: '',
          z: 0
        },
        tokenEffect: {
          below: 0,
          delay: 0,
          duration: 0,
          file: '',
          randomFile: false,
          source: '',
          scale: 1.0
        },
        tokenMove: {
          delay: 0,
          e: {max:0, min:0},
          flag: true,
          hz: {dir:'', max:0, min:0},
          source:'',
          sToT: false,
          tiles: '',
          walls: '',
          v: {dir:'', max:0, min:0}
        },
        wall: {
          bottom:false,
          dir: 0,
          door: 0,
          left: false,
          light: 1,
          move: 1,
          random: false,
          right: false,
          sense: 1,
          sound: 1,
          tag: '',
          top: false
        },
        macro: ''
      }
    }

  get effect(){
    return this.options.effect
  }

  get ambientLight(){
    return this.options.ambientLight ? this.options.ambientLight : {}
  }

  get audio(){
    return this.options.audio
  }

  get backgroundEffect(){
    return this.options.backgroundEffect
  }

  get canvas(){
    return this.options.flags.fluidCanvas ? this.options.flags.fluidCanvas : {}
  }

  get damage(){
    return this.options.flags.tokenResponse?.damage ? this.options.flags.tokenResponse.damage : {}
  }

  get foregroundEffect(){
    return this.options.foregroundEffect
  }

  get globalZone(){
    return this.options.globalZone
  }

  get hasGlobalZone(){
    return Object.keys(this.options.globalZone).length ? true : false
  }

  get hasTwinBoundary(){
    return (monksActiveTilesOn && this.lastingEffect.flags?.['monks-active-tiles']?.teleport) ? true : false
  }

  get lastingEffect(){
    return this.options.lastingEffect
  }

  get macro(){
    return this.options.macro 
  }

  get mutate(){
    return this.options.flags.mutate ? this.options.flags.mutate : {}
  }

  get save(){
    return this.options.flags.tokenResponse?.save ? this.options.flags.tokenResponse.save : {}
  }

  get tokenEffect(){
    return this.options.tokenEffect
  }

  get tokenMove(){
    return this.options.tokenMove
  }

  get tokenSays(){
    return this.options.flags.tokenSays ? this.options.flags.tokenSays : {}
  }

  get wall(){
    return this.options.wall
  }

  get warpgate(){
    return this.options.flags.warpgate ? this.options.flags.warpgate : {}
  }

  static get _allDangers() {
    const flags = game.settings.get(dangerZone.ID, 'zone-types');
    return flags ? flags : {}
  }
  
  static get allDangers() {
    const flag = this._allDangers;
    const ar = [];
    for (var danger in flag) {
        ar.push(this._toClass(flag[danger]));
    }
    return ar
  }

  static get dangerList() {    
    const flags = this._allDangers; 
    let list = {};
    for (var f in flags) {
      if(flags[f].name && flags[f].icon){
        list[f]=flags[f].name;
      }
    }
    return list;
  }

  static get allGlobalZones() {
    return this.allDangers.filter(d => d.globalZone?.enabled)
  }

  static getDanger(id) {
    return this._toClass(this._allDangers[id]);
  }

  static getDangerName(name){
    return this.allDangers.find(d => d.name === name);
  }

  /**
   * converts a JSON object to a zone class
   * @param {object} flag 
   * @returns 
   */
  static _toClass(obj, enforceTypes = false){
    if(obj){
      let type =  new dangerZoneType;
      mergeObject(type, obj, {insertKeys: false, enforceTypes: enforceTypes});
      if(obj.flags){mergeObject(type.flags, obj.flags, {insertKeys: true})}
      return type;
    }
  }

  static async deleteZoneType(id) {
    let allTypes = this._allDangers; 
    delete allTypes[id];
    await this.setZoneTypes(allTypes);
    dangerZone.log(false,'Zone Type Deleted ', {deleted: id, remaining: allTypes});
    return id
  } 
  
  static async addZoneType() {
    const newType = new dangerZoneType; 
    const allTypes = this._allDangers;
    allTypes[newType.id] = newType;
    await this.setZoneTypes(allTypes);
    return newType;
  }

  static async setZoneTypes(dangerZoneTypes) {
    return await game.settings.set(dangerZone.ID, 'zone-types', dangerZoneTypes);
  }

  async _update(){
    let allTypes = dangerZoneType._allDangers; 
    allTypes[this.id] = this;
    await dangerZoneType.setZoneTypes(allTypes);
    return this
  }

  static async updateDangerZoneType(id, updateData) {
    let type = this._toClass(updateData);
    if(!type){return allTypes}
    await type._update();
    dangerZone.log(false,'Zone Type Updated ', {"type": type});
    return 
  }

  async toggleWorldZone(){
    this.options.globalZone.enabled ? this.options.globalZone.enabled = false : this.options.globalZone.enabled = true
    await this._update();
  }

  async activateWorldZone(){
    this.options.globalZone = WORLDZONE;
    await this._update();
  }

  static async importFromJSON(json){
    const allTypes = this._allDangers;
    let added = [], alreadyExists = [], inError = [];
    if(json){
        for (var addId in json) {
            let record = json[addId];
            if(!record || addId===undefined || !record.id || !record.name || !record.icon){
                inError.push(record)
            } else if (allTypes[addId]) {
              alreadyExists.push(record);
            } else{
              allTypes[record.id]=this._toClass(record, false);
              added.push(record);
            }
        }
    } else{inError.push(json)}
    await this.setZoneTypes(allTypes);
    return {"added": added, "skipped": alreadyExists, "error": inError}
  }
}
  