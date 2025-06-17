import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {MIGRATION_DANGER, MIGRATION_ZONE, WORLDZONE} from './constants.js';


 function stringToArray(string, {splitter = '|'} = {}){
    if (Array.isArray(string)) return string
    return string ? string.split(splitter).map(n => n.trim()).filter(n => n !== "") : []
  }

export class migrateDanger {
    
    constructor(){
        this._migrationLevel = dangerZone.MIGRATION.DANGER,
        this.dangers = dangerZoneType._allDangers; 
        this.update = false
    }

    static async migrate(){
        if(game.user.isActiveGM) {
            const migration = new migrateDanger()
            await migration.go()
        } 
    }
    
    async go(){
        if(!this.dangers) return
        await this._migrateData()
    }
    
    setMigration(danger, level){
        danger.migration = level
    }

    async _migrateData() {
        dangerZone.log(false, 'Migrating Danger Data... Start...', this)
        for(var key in this.dangers){
            let danger = this.dangers[key]
            if(this._migrationLevel <= danger.migration) continue;
            if(!this.update) ui.notifications?.info('Beginning migration of Danger Zone dangers data...')
            this.update = true
            this._migrationData_001(danger)
            this._migrationData_002(danger)
            dangerZone.log(false, `Migrating Danger Data... ${danger.name}...`, {newDanger: danger, key: key, danger: this.dangers[key], dangers: this})       
        }
        if(this.update){
            await dangerZoneType.setZoneTypes(this.dangers);
            ui.notifications?.info('Completed migration of Danger Zone dangers data...')
        }
        dangerZone.log(false, 'Migrating Danger Data... End...', this)
      }

      _migrationData_001(danger){
            //Global Zone Revision
            if (!danger.migration || danger.migration < MIGRATION_DANGER.WORLD) {
                if(danger.options.globalZone && Object.keys(danger.options.globalZone).length){
                    const update = {}, part = {}; 
                    Object.assign(update, WORLDZONE)
                    Object.assign(part,danger.options.globalZone)

                    Object.assign(update,{
                        enabled: part.enabled,
                        flavor: part.flavor
                    });

                    Object.assign(update.dimensions, {
                        bleed: part.options?.bleed ?? false,
                        bottom: part.options?.bottom ?? 0,
                        stretch: part.options?.stretch ?? '',
                        top: part.options?.top ?? 0
                    });

                    Object.assign(update.trigger, {
                        delay:  {
                            min: part.options?.delay?.min ?? 0,
                            max: part.options?.delay?.max ?? 0
                        }, 
                        loop: part.loop,
                        operation: part.operation
                    });

                    Object.assign(update.source, {
                        actors: stringToArray(part.source?.actor)
                    });

                    Object.assign(update.target, {
                        actors: stringToArray(part.actor),
                        all: part.options?.allInArea ?? false,
                        always: part.options?.runUntilTokenFound ?? false,
                        choose:{
                            enable: part.options?.placeTemplate ?? false,
                            prompt: !part.options?.noPrompt ?? true
                        },
                        dispositions: stringToArray(part.tokenDisposition)
                    });

                    danger.options.globalZone = foundry.utils.deepClone(update);
                }
                this.setMigration(danger, MIGRATION_DANGER.WORLD)
            }
      }

    _migrationData_002(danger){
        //Move parsed strings for arrays to arrays
        if ((!danger.migration || danger.migration < MIGRATION_DANGER.MULTI) ){
            const effect = danger.options.effect.flags?.[`${dangerZone.ID}`]
            const splitter = {splitter: '||'}
            if(effect && Object.keys(effect).length){
                effect.deleteEffects = stringToArray(effect.deleteEffects, splitter)
                effect.disableEffects = stringToArray(effect.disableEffects, splitter)
                effect.enableEffects = stringToArray(effect.enableEffects, splitter)
                effect.toggleEffects = stringToArray(effect.toggleEffects, splitter)
            }
            if(danger.options.item) danger.options.item.name =  stringToArray(danger.options.item.name, splitter)
            this.setMigration(danger, MIGRATION_DANGER.MULTI)
        }
    }
}


export class migrateScene {
    constructor (scene) {
        this.scene = scene,
        this._migrationLevel = dangerZone.MIGRATION.ZONE,
        this.flagMigration = scene ? scene.getFlag(dangerZone.ID, dangerZone.FLAGS.MIGRATION) ?? MIGRATION_ZONE.INITIAL : false,
        this.flagScene = scene ? scene.getFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE) : {},
        this._regionMigration = {
            data: [],
            regions: [],
            zones: []
        },
        this.update = false;
    }

    get _currentMigration(){
        return this.flagMigration
    }

    get hasFlags(){
        return (this.flagScene && Object.keys(this.flagScene).length) ? true : false
    }

    static async migrate(scene = false){
        if(game.user.isActiveGM){
            if(scene){
                const migrate = new migrateScene(scene)
                await migrate.go()
            } else {
                for (const s of game.scenes) {
                    const migrate = new migrateScene(s)
                    await migrate.go()
                }
            }
        }
    }

    async go(){
        if(!this.scene || !this.hasFlags) return
        this._migrateToScene()
        if(this._currentMigration >= this._migrationLevel) return await this.save()
        dangerZone.log(false, 'initiating Scene Zone Data Migration...', {sceneMigration: this, flags: this.flagScene})
        await this._migrateToRegion()
        await this._migrateData()
        await this.save()
        await this.scene.setFlag(dangerZone.ID, dangerZone.FLAGS.MIGRATION, this.flagMigration);
    }

    async save(){
        if(this.update) await this.scene.setFlag(dangerZone.ID, dangerZone.FLAGS.SCENEZONE, this.flagScene);
    }

    setMigration(level){
        this.flagMigration = level
    }
    
    async _migrateData() {
        if(this._currentMigration >= MIGRATION_ZONE.MULTI) return
        for(var key in this.flagScene){
            const flag = this.flagScene[key]
            if (!flag._migration?.data || flag._migration.data < 1){

                const zn = new zone(this.scene);

                Object.assign(zn,{
                    id: flag.id,
                    dangerId: flag.type,
                    enabled: flag.enabled,
                    extensions: flag.extensions,
                    flavor: flag.flavor,
                    scene: flag.scene,
                    title: flag.title
                });

                Object.assign(zn.dimensions, {
                    bleed: flag.options?.bleed ?? false,
                    stretch: flag.options?.stretch ?? ''
                });

                Object.assign(zn.trigger, {
                    combatantInZone: flag.options?.combatantInZone ?? false,
                    delay: {
                        min: flag.options?.delay?.min ?? 0,
                        max: flag.options?.delay?.max ?? 0
                    }, 
                    initiative: flag.initiative,
                    likelihood: flag.likelihood,
                    loop: flag.loop,
                    operation: flag.operation,
                    prompt: flag.options?.promptTrigger ?? false,
                    random: flag.random,
                    events: stringToArray(flag.trigger),
                    weight: flag.weight
                });

                Object.assign(zn.source, {
                    actors: stringToArray(flag.source?.actor),
                    tags: stringToArray(flag.source?.tag),
                    area: flag.source?.area ?? '',
                    limit: {
                        min: flag.source?.limit?.min ?? 0,
                        max: flag.source?.limit?.max ?? 0
                      },
                    target: flag.source?.target ?? '',
                    trigger: flag.source?.trigger ?? ''
                });

                Object.assign(zn.target, {
                    actors: stringToArray(flag.actor),
                    all: flag.options?.allInArea ?? false,
                    always: flag.options?.runUntilTokenFound ?? false,
                    choose:{
                        enable: flag.options?.placeTemplate ?? false,
                        prompt: !flag.options?.noPrompt ?? true
                    },
                    isCombatant: flag.options?.targetCombatant ?? false,
                    dispositions: stringToArray(flag.tokenDisposition),
                    exclusion: {
                        conditions: stringToArray(flag.tokenExCon)
                    }
                });

                this.flagScene[zn.id] = zn;
                this.update = true;

                dangerZone.log(false, 'Migrating Zone Data...', {flag: flag, zone: zn, flags: this.flagScene})
            }
        }
        this.setMigration(MIGRATION_ZONE.MULTI)
      }

      getZonesToMigrate(){
          for (var flag in this.flagScene) {
            const zone = this.flagScene[flag];
            if(zone.scene.regionId || !zone.scene.start) continue
            this._regionMigration.zones.push(new migrateSceneZone(zone));
          }
      }
    
      async _migrateToRegion(){
        if(this._currentMigration >= MIGRATION_ZONE.REGION) return
        this.getZonesToMigrate()
    
        if(this._regionMigration.zones.length) {
            ui.notifications?.info(`Danger Zone migration of scene ${this.scene.name} zone dimensions to regions started`)
    
            this._regionMigration.data = this._regionMigration.zones.filter(zn => !zn.hasFullSceneDimensions && !zn._migrateRegionMatch(this._regionMigration.data)).map(zn => zn._migrationData.regionData)
          
            if (this._regionMigration.data.length) this._regionMigration.regions = await this.scene.createEmbeddedDocuments("Region", this._regionMigration.data)
      
            dangerZone.log(false, 'Check migration to region', {zones: this._regionMigration.zones, scene: this.scene, regions: this._regionMigration.regions, regionsData: this._regionMigration.data})
            this._regionMigration.update = false
            for (const zn of this._regionMigration.zones) {
                this._regionMigration.update = await zn.convertToRegion(zn._migrateRegionMatch(this._regionMigration.regions)?.id)
            }
            if(this._regionMigration.update) {
                this.update = true;
                ui.notifications?.info(`Danger Zone migration of scene ${this.scene.name} zone dimensions to regions end`)
            }
        }
        this.setMigration(MIGRATION_ZONE.REGION)
      }
    
      _migrateToScene(){
        for (var flag in this.flagScene) {
            const zone = this.flagScene[flag];
            if(zone.scene.sceneId !== this.scene.id){
                zone.scene.sceneId = this.scene.id
                this.update = true
            }
          }
      }


}

export class migrateSceneZone {
    constructor (zoneData) {
        this.zoneData = zoneData
    }

    get end(){
        return this.sceneData.end
    }

    get hasFullSceneDimensions(){
        return (
            (!this.start && !this.regionId)
            || (
                this.start 
                && this.start.x === this.scene.dimensions.sceneX
                && this.start.y === this.scene.dimensions.sceneY
                && this.start.z === 0
                && this.end.x === this.scene.dimensions.sceneX + this.scene.dimensions.sceneWidth
                && this.end.y === this.scene.dimensions.sceneY + this.scene.dimensions.sceneHeight
                && this.end.z === 0
            )
         ) ? true : false
    }

    get regionId(){
        return this.sceneData.regionId
    }

    get sceneData(){
        return this.zoneData.scene
    }

    get scene(){
        return game.scenes.get(this.sceneData.sceneId);
    }

    get start(){
        return this.sceneData.start
    }

    get _migrationData(){
        return {
            regionData: {
                elevation: {bottom: this.start?.z, top: this.end?.z},
                name: `Danger Zone Region: ${this.zoneData.title}`,
                shapes: [{
                    type: 'rectangle',
                    height: this.end?.y - this.start?.y,
                    rotation: 0,
                    width: this.end?.x - this.start?.x,
                    x: this.start?.x,
                    y: this.start?.y
                }]
            }
        }
    }

    _migrateRegionMatch(regionArray){
        return regionArray.find(rg => 
            rg.elevation.bottom === this._migrationData.regionData.elevation.bottom
            && rg.elevation.top === this._migrationData.regionData.elevation.top
            && rg.shapes[0].x === this._migrationData.regionData.shapes[0].x
            && rg.shapes[0].y === this._migrationData.regionData.shapes[0].y
            && rg.shapes[0].height === this._migrationData.regionData.shapes[0].height
            && rg.shapes[0].width === this._migrationData.regionData.shapes[0].width
        )
    }

    async convertToRegion(regionId){
        if(!this.sceneData || !this.start) return

        if(regionId || this.hasFullSceneDimensions) {
            Object.assign(this.zoneData.scene, {
                start: null,
                end: null,
                regionId: regionId ?? ''
            });
            return true
        }
    }

}