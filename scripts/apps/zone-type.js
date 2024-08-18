import {dangerZone} from '../danger-zone.js';
import {MIGRATION_DANGER, WORLDZONE, saveTypes} from './constants.js';
import {migrateDanger} from './migration.js';

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
      this.migration = MIGRATION_DANGER.INITIAL,
      this.name = 'New Danger',
      this.options = {
        ambientLight: {
          active: 0,
          angle: 360,
          attenuation: 0.5,
          bright: 0,
          clear: {
            delay: 0,
            type: ''  
          },
          coloration: 1,
          contrast: 0,
          darkness: {
            min: 0,
            max: 1
          },
          delay: 0,
          dim: 0,
          flags: {},
          lightAnimation: {
            reverse: false,
            speed: 5,
            intensity: 5,
            type: ""
          },
          luminosity: 0.5,
          negative: false,
          offset: {
            x: {
              adj: 0,
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              adj: 0,
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          rotation: 0,
          saturation: 0,
          shadows: 0,
          tag: "",
          tintColor: "",
          tintAlpha: 0.5,
          walls: true
        },
        audio: {
          file:'',
          delay: 0,
          duration: 0,
          randomFile: false,
          volume: 0.5
        },
        backgroundEffect: {
          audio: {
            file:'',
            randomFile: false,
            volume: 0.5
          },
          below: true,
          delay: 0,
          file: '',
          offset: {
            x: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          randomFile: false,
          scale: 1.0,
          repeat: 0,
          rotate: false,
          duration: 0
        },
        canvas: {
          effect: {
            type: '',
            iteration: 0,
            intensity: 0,
            duration: 0
          },
          pan: {
            active: false,
            lock: 0,
            scale: 0,
            speed: 0
          },
          delay: 0
        },
        combat: {
          targets: {
            add: false
          },
          delay: 0,
          initiative: {
            player: false,
            type: '',
            value: 0 
          },
          new: false,
          spawn: false,
          source: {
            add: false
          },
          start: false
        },
        effect: {},
        flags: {},
        foregroundEffect: {
          delay: 0,
          file: '',
          offset: {
            x: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          randomFile: false,
          scale: 1.0,
          source: {
            enabled: false,
            name: '',
            swap: false,
            target: ''
          },
          repeat: 0,
          duration: 0
        },
        globalZone : {},
        item: {
          action: '',
          compendiumName: '',
          delay: '',
          name: [],
          source: '',
          tag: '',
          updates: ''
        },
        lastingEffect: {
          alpha: 1,
          delay: 0,
          file: '',
          hidden: false,
          occlusion: {
            alpha: 0,
            mode: 'FADE'
          },
          offset: {
            x: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          randomFile: false,
          restrictions: {
            light: false,
            weather: false
          },
          scale: 1.0,
          loop: true,
          tag: '',
          z: 0
        },
        region: {
          active: false,
          behavior: {
            macro: {
              everyone: false,
              uuid: '',
              events: []
            },
            pause: {
              enable: false,
              once: false
            },
            script: {
              source: '',
              events: []
            },
            suppressWeather: {
              enable: false
            },
            teleport: {
              choice: false,
              enable: false,
              name: '',
              twin: false
            }
          },
          color: '',
          delay: 0,
          hole: false,
          name: '',
          offset: {
            x: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          scale: 1.0,
          tag: '',
          type: 'rectangle',
          visibility: 'LAYER'
        },
        scene:{
          active: false,
          background: {
            randomFile: false,
            file: ''
          },
          darkness: {
            animate: 0,
            enable: false,
            value: 0
          },
          delay: 0,
          foreground: {
            e: {max:0, min:0, type: ''},
            randomFile: false,
            file: ''
          },
          globalLight: ''
        },
        sound: {
          file:'',
          delay: 0,
          easing: true,
          offset: {
            x: {
              flip: false,
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: false,
              min: 0,
              max: 0,
              type: ''
            }
          },
          radius: 0,
          randomFile: false,
          volume: 0.5,
          walls: true
        },
        sourceEffect: {
          audio: {
            file:'',
            randomFile: false,
            volume: 0.5
          },
          delay: 0,
          duration: 0,
          file: '',
          offset: {
            x: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: '',
              min: 0,
              max: 0,
              type: ''
            }
          },
          randomFile: false,
          repeat: 0,
          rotate: false,
          scale: 1.0,
          target: ''
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
          e: {max:0, min:0, type: ''},
          flag: true,
          hz: {dir:'', max:0, min:0},
          source:'',
          sToT: false,
          teleport: false,
          tiles: '',
          walls: '',
          v: {dir:'', max:0, min:0}
        },
        wall: {
          bottom:false,
          dir: 0,
          door: 0,
          doorSound: undefined,
          ds: 0,
          left: false,
          light: 1,
          offset: {
            x: {
              flip: false,
              min: 0,
              max: 0,
              type: ''
            },
            y: {
              flip: false,
              min: 0,
              max: 0,
              type: ''
            }
          },
          move: 1,
          random: false,
          right: false,
          sense: 1,
          sound: 1,
          tag: '',
          top: false,
          threshold: {
            attenuation: false,
            light: null,
            sight: null,
            sound: null
          }
        },
        macro: '',
        migration: {
          globalZone: 1
        }
      }
    }

  get effect(){
    return this.options.effect
  }

  get effectDeleteEffects(){
    return this.effect.flags?.[`${dangerZone.ID}`]?.deleteEffects ?? []
  }
  
  get effectDisableEffects(){
    return this.effect.flags?.[`${dangerZone.ID}`]?.disableEffects ?? []
  }

  get effectEnableEffects(){
    return this.effect.flags?.[`${dangerZone.ID}`]?.enableEffects ?? []
  }

  get effectToggleEffects(){
    return this.effect.flags?.[`${dangerZone.ID}`]?.toggleEffects ?? []
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
    return this.options.canvas ?? {}
  }

  get combat(){
    return this.options.combat ?? {}
  }

  get damage(){
    return this.options.flags.tokenResponse?.damage ? this.options.flags.tokenResponse.damage : {}
  }

  get foregroundEffect(){
    return this.options.foregroundEffect
  }

  get hasCombat(){
    return (this.combat.targets.add || this.combat.spawn || this.combat.source.add || this.combat.new || this.combat.initiative.type || this.combat.start ) ? true : false
  }

  get globalZone(){
    return this.options.globalZone
  }

  get hasGlobalZone(){
    return Object.keys(this.options.globalZone).length ? true : false
  }

  get hasRegion(){
    return this.options.region.active
  }

  get hasRegionTeleport(){
    return this.region.behavior?.teleport?.enable ? true : false
  }

  get hasTwinBoundary(){
    const mat = this.options.flags['monks-active-tiles']?.teleport
    return (this.hasRegionTeleport || (mat && mat.add && mat.twin)) ? true : false
  }

  get item(){
    return this.options.item
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

  get parts(){
    const flags = this.options.flags ? Object.entries(this.options.flags).filter(o => o[0]!=='tokenResponse') : []
    const tr = this.options.flags?.tokenResponse ? Object.entries(this.options.flags.tokenResponse) : []
    return Object.entries(this.options).filter(o => o[0]!=='flags').concat(flags).concat(tr)
  }

  get region(){
    return this.options.region ?? {}
  }

  get save(){
    return (this.options.flags.tokenResponse?.save && Object.keys(saveTypes()).length)  ? this.options.flags.tokenResponse.save : {}
  }

  get scene(){
    return this.options.scene
  }

  get sound(){
    return this.options.sound
  }

  get sourceEffect(){
    return this.options.sourceEffect
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

  get weather(){
    return this.options.flags.weather ? this.options.flags.weather : {}
  }

  get weatherIsFoundry(){
    if(!this.weather.type) return false
    return this.weather.type.includes('foundry.') ? true : false
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
      foundry.utils.mergeObject(type, obj, {insertKeys: false, enforceTypes: enforceTypes});
      if(obj.flags){foundry.utils.mergeObject(type.flags, obj.flags, {insertKeys: true})}
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

  static async copyDanger(id) {
    const danger = dangerZoneType.getDanger(id);
    const newId = foundry.utils.randomID(16);
    danger['id'] = newId;
    danger['name'] = danger['name'] + ' (copy)';
    await danger._update();
    dangerZone.log(false, 'Danger copied ', {danger: danger})
    return newId;
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
    if(added) await migrateDanger.migrate()
    return {"added": added, "skipped": alreadyExists, "error": inError}
  }
}
  