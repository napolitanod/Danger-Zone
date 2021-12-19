import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions} from './dimensions.js'
import {workflow} from './workflow.js';
import {DANGERZONETRIGGERSORT} from './constants.js';

export class triggerManager {

    constructor(sceneId, data, sceneZones, hook) {
        this.combatTriggers = [],
        this.combatStart = false,
        this.data = data,
        this.hook = (hook === undefined) ? '' : hook,
        this.priorTrigger,
        this.randomTriggers = new Set(),
        this.randomZones = [],
        this.roundStart = false, 
        this.sceneZones = (sceneZones === undefined) ? null : sceneZones,
        this.turnChange = false,
        this.sceneId = sceneId,
        this.zones = []
    }

    get combatant(){
        return this.data?.combatant ? this.data.combatant : undefined
    }

    get previousCombatant(){
        return this.data?.previous?.combatantId ? this.data.combatants.get(this.data.previous.combatantId) : undefined
    }

    get currentInitiative(){
        return this.combatant?.data?.initiative ? Math.floor(this.combatant.data.initiative) : undefined
    }

    get previousInitiative(){
        return this.previousCombatant?.data?.initiative ? Math.floor(this.previousCombatant.data.initiative) : undefined
    }

    get scene(){
        return game.scenes.get(this.sceneId);
    }

    get singleCombatant(){
        return this.combatant.id === this.previousCombatant.id
    }

    log(message, data){
        dangerZone.log(false,`${message}... `, {triggerManager: this, data:data});
    }

    async next(){
        if(canvas.scene.id !== this.sceneId){ 
           if(game.user.isGM){
                ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.no-trigger-if-not-on-combat-scene"));
                return
           }
        }
        if (this.zones.length){
            const zn = this.zones.pop();
            const length = zn.loop ? zn.loop : 1
            for(let i=0; i<length; i++){
                const finalLoop = (i === length-1) ? true : false
                const previouslyExecuted = (i ? this.priorTrigger?.previouslyExecuted : false);
                this.log(`Trigger manager ${zn.title} loop ${i+1} of ${length}...`, {});
                await this._next(zn, finalLoop, previouslyExecuted);
            }
            
        } else {
            this.log(`Trigger manager finished...`, {});
            return
        }
    }

    async _next(zone, finalLoop = true, previousExec = false){
        const options = {previouslyExecuted: previousExec}
        if(zone.trigger !== 'move'){
            if(this.data?.options?.location && zone.trigger !== 'aura'){options['location'] = this.data.options.location}
            if(this.data?.options?.targets){options['targets'] = this.data.options.targets}
        }

        const flow = new workflow(zone, this, options);
        this.priorTrigger = await flow.next(); 
        if(finalLoop){await this.next()}
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

    async movementTrigger(){
        for(let i = 0; i < this.sceneZones.length; i++) { 
            this.stageZones(this.sceneZones[i]);
        }
        await this.reconcileRandomZones();
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.trigger] < DANGERZONETRIGGERSORT[b.trigger] ? -1 : (DANGERZONETRIGGERSORT[a.trigger] > DANGERZONETRIGGERSORT[b.trigger] ? 1 : 0)});
        this.next();
    }

    async combatTrigger(){
        this.setCombatFlags();
        for (const [id, zn] of this.sceneZones) { 
            if(this.combatTriggers.indexOf(zn.trigger) !== -1){    
                if(zn.trigger==='turn-start'){
                    if(!zn.sourceTrigger([this.combatant.data.actorId])){continue}
                }
                else if(zn.trigger==='turn-end'){
                    if(!zn.sourceTrigger([this.previousCombatant.data.actorId])){continue}
                } 
                else {
                    if(!zn.sourceTrigger(this.data.combatants.map(c => c.data.actorId))){continue}
                }
                if(zn.trigger==='initiative-start' || zn.trigger==='initiative-end' ){
                    let escape = true
                    const zi = zn.initiative ? zn.initiative : 0
                    if(
                        zn.trigger==='initiative-start' && 
                            (
                                    (zi < this.previousInitiative && zi >= this.currentInitiative)
                                ||
                                    (zi >= this.currentInitiative && this.roundStart)
                                ||
                                    (zi < this.previousInitiative && this.roundStart && !this.combatStart)
                            )
                        ){escape = false
                    }
                    else if(
                        zn.trigger==='initiative-end' &&
                            (
                                    (zi <= this.previousInitiative && zi > this.currentInitiative)
                                ||
                                    (zi > this.currentInitiative && this.roundStart)
                                ||
                                    (zi <= this.previousInitiative && this.roundStart && !this.combatStart)
                            )
                        ){escape = false
                    }
                    if(escape){continue}
                }
                this.stageZones(zn);
            }
        }
        await this.reconcileRandomZones();
        this.zones.sort((a, b) => { return a.initiative < b.initiative ? -1 : (a.initiative > b.initiative ? 1 : 0)});
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.trigger] < DANGERZONETRIGGERSORT[b.trigger] ? -1 : (DANGERZONETRIGGERSORT[a.trigger] > DANGERZONETRIGGERSORT[b.trigger] ? 1 : 0)});
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
        if(this.turnChange){
            if(this.currentInitiative && this.previousInitiative){
                this.addCombatTrigger('initiative-start')
                this.addCombatTrigger('initiative-end')
            }
        }
    }

    addCombatTrigger(trigger){
        this.combatTriggers.push(trigger);
    }

    addZoneTrigger(trigger, initiative){
        const trig = (trigger === 'initiative-start' || trigger === 'initiative-end') ? trigger + '-' + initiative.toString() : trigger
        this.randomTriggers.add(trig)
    }
    
    stageZones(zone) {
        if(!zone.random){
            this.zones.push(zone)
        } else {
            this.randomZones.push(zone)
            this.addZoneTrigger(zone.trigger, zone.initiative ? zone.initiative : 0)
        }
    }

    async reconcileRandomZones() {
        if(this.randomZones.length) {
            for (let trig of this.randomTriggers){
                const zone = await dangerZone.getRandomZoneFromScene(this.sceneId, trig, this.randomZones)
                if(zone){this.zones.push(zone)}
            }
        } 
    }

    static async manualTrigger(event) {
        let sceneId = $(event.currentTarget).data("data-id").scene; 
        const tm = new triggerManager(sceneId, event);
        return await tm.trigger();
    }

    static async apiDirectTrigger(zn, sceneId, options = {}){
        if(options === true || options === false){
            options = {activeOnly: options}
        }
        const tm = new triggerManager(sceneId, {zone: 'direct', scene: sceneId, options: options});
        tm.zones.push(zn);
        if(zn.enabled || !options.activeOnly){
            dangerZone.log(false,'API trigger ready ', {zone: zn, trigger: tm, options: options});
            return await tm.next();
        }
        dangerZone.log(false,'API trigger bypassed scene disabled ', {zone: zn, trigger: tm, options: options});
        return tm
    }

    static async findCombatTriggers(combat, hook){
        if(game.user.isGM && combat.scene && combat.started && !(combat.current.round === 1 && combat.current.turn === 0 && combat.combatants.find(c => c.initiative === null))) {
            const sceneZones = dangerZone.getCombatZonesFromScene(combat.scene.id);
            if(sceneZones.size){
                const scene = game.scenes.get(combat.scene.id);
                if(!scene?.data?.gridType){return dangerZone.log(false,'No Combat Triggers When Gridless ', {combat, hook})}

                const tm = new triggerManager(combat.scene.id, combat, sceneZones, hook);
                tm.log(`Initiating combat trigger handler...`, {combat, hook});
                await tm.combatTrigger();
            } 
            return
        }
    }

    static async findMovementTriggers(token, update){
        const sceneId = token.parent.id;
        const scene = game.scenes.get(sceneId);
        if(!scene?.data?.gridType){return dangerZone.log(false,'No Movement Triggers When Gridless ', {token: token, update:update})}

        const sceneZones = dangerZone.getMovementZonesFromScene(sceneId);
        const zones = []
        const move = dangerZoneDimensions.tokenMovement(token, update);

        for (let [k,zn] of sceneZones) {
            if(!zn.sourceTrigger([token?.actor?.id])){
                continue;
            }
            const zoneBoundary = await zn.scene.boundary();
            const zoneTokens = zoneBoundary.tokensIn([token]);
            if(zoneTokens.length){
                zones.push(zn)
            }
        }

        if(zones.length){
            const tm = new triggerManager(sceneId, {provokingMove: move, update: update, options: {targets: [token], location:move.endPos}}, zones, "updateToken");
            tm.log(`Initiating move trigger handler...`, {token: token, update:update, move: move});
            await tm.movementTrigger()
        }
    }
}




