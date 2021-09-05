import {dangerZone} from '../danger-zone.js';

export class dangerZoneType {
    constructor() {
      this.dimensions = {
        units: {
          w: 1, 
          h: 1
        }
      },
      this.icon = '',
      this.id = foundry.utils.randomID(16),
      this.name = '',
      this.options = {
        audio: {
          file:'',
          delay: 0,
          volume: 0.5
        },
        backgroundEffect: {
          delay: 0,
          file: '',
          scale: 1.0,
          repeat: 0,
          duration: 30
        },
        effect: {},
        flags: {},
        foregroundEffect: {
          delay: 0,
          file: '',
          scale: 1.0,
          repeat: 0,
          duration: 0
        },
        lastingEffect: {
          delay: 0,
          file: '',
          scale: 1.0,
          loop: true
        },
        macro: ''
      }
    }

  async _update(){
    let allTypes = dangerZoneType.allDangerZoneTypes; 
    allTypes[this.id] = this;
    await dangerZoneType.setZoneTypes(allTypes);
    return this
  }
  
  static get allDangerZoneTypes() {
    const flags = game.settings.get('danger-zone', 'zone-types');
    if(!flags){return{}}
    return flags
  }
  
  static get dangerZoneTypeList() {    
    const flags = game.settings.get('danger-zone', 'zone-types'); 
    let list = {};
    for (var f in flags) {
      if(flags[f].name && flags[f].icon){
        list[f]=flags[f].name;
      }
    }
    return list;
  }

  static getDangerZoneType(id) {
    return this.allDangerZoneTypes[id];
  }

  /**
   * converts a JSON object to a zone class
   * @param {object} flag 
   * @returns 
   */
  static toClass(obj, enforceTypes = false){
    if(obj){
      let type =  new dangerZoneType;
      mergeObject(type, obj, {insertKeys: false, enforceTypes: enforceTypes});
      if(obj.flags){mergeObject(type.flags, obj.flags, {insertKeys: true})}
      return type;
    }
  }

  static async deleteZoneType(id) {
    let allTypes = this.allDangerZoneTypes; 
    delete allTypes[id];
    await this.setZoneTypes(allTypes);
    dangerZone.log(false,'Zone Type Deleted ', {deleted: id, remaining: allTypes});
    return id
  } 
  
  static async addZoneType() {
    const newType = new dangerZoneType; 
    const allTypes = this.allDangerZoneTypes;
    allTypes[newType.id] = newType;
    await this.setZoneTypes(allTypes);
    return newType;
  }

  static async setZoneTypes(dangerZoneTypes) {
    return await game.settings.set('danger-zone', 'zone-types', dangerZoneTypes);
  }

  static async updateDangerZoneType(id, updateData) {
    let type = this.toClass(updateData);
    if(!type){return allTypes}
    await type._update();
    dangerZone.log(false,'Zone Type Updated ', {"type": type});
    return 
  }

  static async importFromJSON(json){
    const allTypes = this.allDangerZoneTypes;
    let added = [], alreadyExists = [], inError = [];
    if(json){
        for (var addId in json) {
            let record = json[addId];
            if(!record || addId===undefined || !record.id || !record.name || !record.icon){
                inError.push(record)
            } else if (allTypes[addId]) {
              alreadyExists.push(record);
            } else{
              allTypes[record.id]=this.toClass(record, false);
              added.push(record);
            }
        }
    } else{inError.push(json)}
    await this.setZoneTypes(allTypes);
    return {"added": added, "skipped": alreadyExists, "error": inError}
  }

}
  