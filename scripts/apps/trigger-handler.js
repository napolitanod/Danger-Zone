import {dangerZone} from '../danger-zone.js';
import {workflow} from './workflow.js';

export const DANGERZONETRIGGERS = {
    "manual":  "DANGERZONE.trigger-types.manual.label",
    "combat-start":  "DANGERZONE.trigger-types.combat-start.label",
    "combat-end":  "DANGERZONE.trigger-types.combat-end.label",
    "round-start":  "DANGERZONE.trigger-types.round-start.label",
    "round-end":  "DANGERZONE.trigger-types.round-end.label",
    "turn-start":  "DANGERZONE.trigger-types.turn-start.label",
    "turn-end":  "DANGERZONE.trigger-types.turn-end.label"
} 

export class triggerManager {

    constructor(sceneId, data, sceneZones, hook) {
        this.combatTriggers = [],
        this.combatStart = false,
        this.data = data,
        this.hook = (hook === undefined) ? '' : hook,
        this.randomZones = [],
        this.roundStart = false, 
        this.sceneZones = (sceneZones === undefined) ? null : sceneZones,
        this.turnChange = false,
        this.sceneId = sceneId,
        this.zones = []
    }

    log(message, data){
        dangerZone.log(false,`${message}... `, {triggerManager: this, data:data});
    }

    async next(){
        if(game.user.isGM && canvas.scene.id !== this.sceneId){ 
            ui.notifications?.warning(game.i18n.localize("DANGERZONE.alerts.no-trigger-if-not-on-combat-scene"));
            return
        }
        if (this.zones.length){
            return await this._next(this.zones.pop());
        } else {
            this.log(`Trigger manager finished...`, {});
            return
        }
    }

    async _next(zone){
        const flow = new workflow(zone);
        await flow.next();
        this.next();
    }

    async trigger() {
        const data = $(this.data.currentTarget).data("data-id"); 
        
        if(data.zone ==='random') {
            this.zones.push(await dangerZone.getRandomZoneFromScene(data.scene, 'manual'))
            if(!this.zones.length) {
                this.log(`Random trigger zone not found...`, {eventData: data});
                return
            } else {
                this.log(`Random trigger zone found...`, {eventData: data});
            }
        } else {
            this.zones.push(dangerZone.getZoneFromScene(data.zone, data.scene))
        } 
        
        if(this.zones[0].trigger === 'manual'){
            await this.next();
        } else {
            await this.zones[0].toggleZoneActive();
        }
    
        return this
    }

    async combatTrigger(){
        this.setCombatFlags();
        for (const [id, zn] of this.sceneZones) { 
            if(this.combatTriggers.indexOf(zn.trigger) !== -1){
                this.stageCombatZones(zn);
            }
        }
        await this.reconcileRandomZones();
        this.zones.sort((a, b) => { return a.trigger < b.trigger ? -1 : (a.trigger > b.trigger ? 1 : 0)});
        this.next();
    }

    setCombatFlags(){
        if(this.hook==='updateCombat' && this.data.current.round > this.data.previous.round){
            this.roundStart = true;
            this.addCombatTrigger('round-start');
            if(this.data.current.round > 1){this.addCombatTrigger('round-end')}
        }
        if(this.roundStart && this.data.previous.round===0){
            this.combatStart = true;
            this.addCombatTrigger('combat-start');
        }
        if(this.hook==='updateCombat' && this.data.current.turn > this.data.previous.turn || this.roundStart){
            this.turnChange = true;
            this.addCombatTrigger('turn-start');
            if(!this.combatStart){this.addCombatTrigger('turn-end')}
        }
        if(this.hook==='deleteCombat'){
            this.addCombatTrigger('combat-end')
        }
    }

    addCombatTrigger(trigger){
        this.combatTriggers.push(trigger);
    }
    
    stageCombatZones(zone) {
        if(!zone.random){
            this.zones.push(zone)
        } else {
            this.randomZones.push(zone)
        }
    }

    async reconcileRandomZones() {
        if(this.randomZones.length) {
            for (let i = 0; i < this.combatTriggers.length; i++){
                let zone = await dangerZone.getRandomZoneFromScene(this.sceneId, this.combatTriggers[i])
                if(zone){this.zones.push(zone)}
            }
        } 
    }

    static async manualTrigger(event) {
        let sceneId = $(event.currentTarget).data("data-id").scene; 
        const tm = new triggerManager(sceneId, event);
        return await tm.trigger();
    }

    static async findCombatTriggers(combat, hook){
        if(game.user.isGM && combat.scene) {
            const sceneZones = dangerZone.getCombatZonesFromScene(combat.scene.id);
            if(sceneZones.size){
                const scene = game.scenes.get(combat.scene.id);
                if(!scene?.data?.gridType){return dangerZone.log(false,'No Combat Triggers When Gridless ', {combat, hook})}

                const tm = new triggerManager(combat.scene.id, combat, sceneZones, hook);
                await tm.combatTrigger();
                tm.log(`Initiating combat trigger handler...`, {combat, hook});
            } 
            return
        }
    }
}




