import {dangerZone} from '../danger-zone.js';

export class dangerZoneType {
    constructor() {
      this.dimensions = {
        units: {
          x: 1, 
          y: 1
        }
      },
      this.icon = '',
      this.id = foundry.utils.randomID(16),
      this.name = '',
      this.options = {
        audio: {
          file:'',
          delay: 0,
          volume: 0.50
        },
        backgroundEffect: {
          file: '',
          scale: 1,
          repeat: 0,
          duration: 30
        },
        effect: {},
        flags: {},
        foregroundEffect: {
          file: '',
          scale: 1,
          repeat: 0,
          duration: 0
        },
        lastingEffect: {
          delay: 0,
          file: '',
          scale: 1,
          loop: true
        },
        macro: ''
      }
    }

  async _update(){
    let allTypes = dangerZoneType.allDangerZoneTypes; 
    if(allTypes[this.id].options.effect){
      this.options.effect = allTypes[this.id].options.effect
    }
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

  static getDangerZoneTypeActiveEffect(zoneTypeId) {
    const type = this.getDangerZoneType(zoneTypeId);
    let aEff = type.options.effect;
    if(!aEff){aEff = {}}
    dangerZone.log(false,'Zone Type Active Effect Got ', {"effect": aEff, "zoneType": type, "zoneTypeId": zoneTypeId});
    return aEff;
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

  static async deleteActiveEffect(zoneTypeId) {
    await this.updateActiveEffect(zoneTypeId, {})
    dangerZone.log(false,'Zone Type Active Effect Deleted ', {"zoneTypeId": zoneTypeId});
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

  static async updateActiveEffect(id, updateData) {
    let allTypes = this.allDangerZoneTypes;
    let typeToUpdate = allTypes[id];
    typeToUpdate.options['effect'] = updateData;
    allTypes[id] = typeToUpdate;
    await game.settings.set('danger-zone', 'zone-types', allTypes);
    dangerZone.log(false,'Zone Type Active Effect Updated ', {"effect": updateData});
    return true
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
              allTypes[record.id]=this.toClass(record, true);
              added.push(record);
            }
        }
    } else{inError.push(json)}
    await this.updateDangerZoneTypes(allTypes);
    return {"added": added, "skipped": alreadyExists, "error": inError}
  }

}
  