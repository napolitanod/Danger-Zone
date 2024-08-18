import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions, boundary} from './dimensions.js'
import {workflow} from './workflow.js';
import {COMBAT_EVENTS, DANGERZONETRIGGERSORT, COMBAT_PERIOD_COMBAT_EVENTS, COMBAT_THRESHOLD_END_EVENTS, COMBAT_PERIOD_INITIATIVE_EVENTS} from './constants.js';

export class triggerManager {

    constructor(sceneId, data, sceneZones, hook, options = {}) {
        this._cancels = [],
        this.combatEvents = [],
        this.combatStart = false,
        this.data = data,
        this.hook = (hook === undefined) ? '' : hook,
        this.randomEvents = new Set(),
        this.randomZones = [],
        this.roundStart = false, 
        this.sceneZones = (sceneZones === undefined) ? null : sceneZones,
        this.turnChange = false,
        this.sceneId = sceneId,
        this.options = options,
        this.zones = []
    }

    get combatant(){
        return this.hasCombatant ? this.data?.combatant : {}
    }

    get combatants(){
        return this.data.combatants ?? new Set()
    }

    get hasCombatant(){
        return this.data?.combatant ? true : false
    }

    get previousCombatant(){
        return this.data?.previous?.combatantId ? this.combatants.get(this.data.previous.combatantId) : {}
    }

    get currentInitiative(){
        return this.combatant.initiative ? Math.floor(this.combatant.initiative) :  (this.combatStart ? Math.max(...this.combatants.map(t => t.initiative)) : undefined)
    }

    get isInitiativeEvent(){
        return this.combatEvents.find(e => COMBAT_PERIOD_INITIATIVE_EVENTS.includes(e)) ? true : false
    }

    get previousInitiative(){
        return this.previousCombatant.initiative ? Math.floor(this.previousCombatant.initiative) : (this.combatStart ? 99999 : undefined)
    }

    get scene(){
        return game.scenes.get(this.sceneId);
    }

    _cancelZone(zn, message){
        this._cancels.push({zone: zn, reason: message})
    }

    _loadTokens(ids){
        const arr = [];
        for(const token of ids){
            const t = this.scene.tokens.get(token._id ? token._id : token.id);
            if(t) arr.push(t)
        }
        return arr
    }

    _options(zone, event){
        const options = {}
        if(event!== 'move'){
            if(this.data?.options?.location && Object.keys(this.data.options.location).length && event !== 'aura') options['location'] = this.data.options.location
            if(this.data?.options?.boundary && Object.keys(this.data.options.boundary).length) options['boundary'] = new boundary(this.data.options.boundary.A, this.data.options.boundary.B)
            if(this.data?.options?.targets && this.data.options.targets.length) options.targets = this._loadTokens(this.data.options.targets)
            if(this.data?.options?.sources && this.data.options.sources.length) options.sources = this._loadTokens(this.data.options.sources)
            if(zone.target.isCombatant && COMBAT_EVENTS.includes(event)){
                const tokens = this.getTriggerCombatant(event);
                if(tokens.length && !options.location && !options.boundary) options['location'] = {coords: {x: tokens[0].x, y: tokens[0].y}, elevation: tokens[0].elevation}
                if(tokens.length && !options.targets) options.targets = tokens;
            } 
        }
        return options;
    }

    addCombatTrigger(trigger){
        this.combatEvents.push(trigger);
    }

    addZoneEvent(event, initiative){
        const e = COMBAT_PERIOD_INITIATIVE_EVENTS.includes(event) ? event + '-' + initiative.toString() : event
        this.randomEvents.add(e)
    }

    static async apiDirectTrigger(zn, sceneId, options = {}){
        const event = 'api'
        const tm = new triggerManager(sceneId, {zone: 'direct', scene: sceneId, options: options});
        tm.zones.push(zn, event);
        (zn.enabled || !options.activeOnly) ? await tm.next() : console.log('API trigger bypassed scene disabled ', {zone: zn, trigger: tm, options: options});
        return tm
    }

    async combatTrigger(){
        this.setCombatFlags();
        for (const zn of this.sceneZones) { 
            for(const event of zn.combatEvents){
                if(this.combatEvents.includes(event)){  
                    if(zn.trigger.combatantInZone){
                        if(this.combatants.size){
                            const inZoneTokens = this.getTriggerCombatant(event)
                            if(!await zn.tokensInZone(inZoneTokens)) {
                                this._cancelZone(zn, `Failed ${event} combatant in zone check on combatant ${inZoneTokens.map(t => t.name).join()}`)
                                continue
                            }
                        } else {
                            this._cancelZone(zn, `Failed ${event} no combatant.`)
                        }
                    }  
                    if(event === 'turn-start'){
                        if(!(await zn.sourceTrigger([this.combatant.actorId]))){
                            this._cancelZone(zn, `Failed ${event} source trigger check on combatant ${this.combatant.name}`)
                            continue
                        }
                    }
                    else if(event == 'turn-end'){
                        if(!(await zn.sourceTrigger([this.previousCombatant.actorId]))){
                            this._cancelZone(zn, `Failed ${event} source trigger check on previous combatant ${this.previousCombatant.name}`)
                            continue
                        }
                    } 
                    else {
                        if(!(await zn.sourceTrigger(this.combatants.map(c => c.actorId)))){
                            this._cancelZone(zn, `Failed ${event} source trigger check on combatants ${this.combatants.map(c => c.name)}`)
                            continue
                        }
                    }
                    if(COMBAT_PERIOD_INITIATIVE_EVENTS.includes(event)){
                        let escape = true
                        const zi = zn.trigger.initiative ?? 0
                        if(
                            event === 'initiative-start'  && 
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
                            event === 'initiative-end' &&
                                (
                                        (zi <= this.previousInitiative && zi > this.currentInitiative)
                                    ||
                                        (zi > this.currentInitiative && this.roundStart)
                                    ||
                                        (zi <= this.previousInitiative && this.roundStart && !this.combatStart)
                                )
                            ){escape = false
                        }
                        if(escape){
                            this._cancelZone(zn, `Failed ${event} check.`)
                            continue
                        }
                    }
                    this.stageZones(zn, event);
                } else {
                    this._cancelZone(zn, `Failed ${event} was not a combat event that occurred.`)
                }
            }
        }
        await this.reconcileRandomZones();
        this.zones.sort((a, b) => {let _a = (COMBAT_PERIOD_INITIATIVE_EVENTS.includes(a.event) ? a.zone.trigger.initiative : 0), _b = (COMBAT_PERIOD_INITIATIVE_EVENTS.includes(b.event) ? b.zone.trigger.initiative : 0); return _a < _b ? -1 : _a > _b ? 1 : 0});
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.event] < DANGERZONETRIGGERSORT[b.event] ? -1 : (DANGERZONETRIGGERSORT[a.event] > DANGERZONETRIGGERSORT[b.event] ? 1 : 0)});
        this.next();
    }

    static async findcombatEvents(combat, hook, options){
        const sceneId = combat.scene?.id ?? canvas.scene.id
        if(game.user.isGM && sceneId && (combat.started || hook === 'combatStart')) {
            const sceneZones = dangerZone.getCombatZonesFromScene(sceneId);
            if(sceneZones.length){
                const scene = game.scenes.get(sceneId);
                if(!scene?.grid?.type){return dangerZone.log(false,'No Combat Triggers When Gridless ', {combat, hook, options})}

                const tm = new triggerManager(sceneId, combat, sceneZones, hook, options);
                tm.log(`Initiating combat trigger handler...`, {combat, hook, options});
                await tm.combatTrigger();
            } 
            return
        }
    }

    static async findMovementEvents(token, update){
        const sceneId = token.parent.id;
        const scene = game.scenes.get(sceneId);
        if(!scene?.grid?.type){return dangerZone.log(false,'No Movement Triggers When Gridless ', {token: token, update:update})}

        const sceneZones = dangerZone.getMovementZonesFromScene(sceneId);
        const zones = []
        const move = dangerZoneDimensions.tokenMovement(token, update);

        for (const zn of sceneZones) {
            if(!(await zn.sourceTrigger([token?.actor?.id]))){
                continue;
            }
            const zoneBoundary = await zn.scene.getZoneBoundary();
            //account for the token being in start position - update to end position
            if('x' in update) token.x = update.x
            if('y' in update) token.y= update.y
            if('elevation' in update) token.elevation = update.elevation

            const zoneTokens = zoneBoundary.tokensIn([token]);
            if(zoneTokens.length){
                zones.push(zn)
            }
        }

        if(zones.length){
            const tm = new triggerManager(sceneId, {provokingMove: move, update: update, options: {targets: [token], location:move.end}}, zones, "updateToken");
            tm.log(`Initiating move trigger handler...`, {token: token, update:update, move: move});
            await tm.movementTrigger()
        }
    }

    getTriggerCombatant(event){
        if(COMBAT_PERIOD_COMBAT_EVENTS.includes(event)) return this.combatants.map(t => t.token)
        if(COMBAT_THRESHOLD_END_EVENTS.includes(event)) return [this.previousCombatant.token]
        return [this.combatant.token]
    }

    log(message, data){
        dangerZone.log(false,`${message}... `, {triggerManager: this, data:data});
    }

    static async manualTrigger(event) {
        let sceneId = $(event.currentTarget).data("data-id").scene; 
        const tm = new triggerManager(sceneId, event);
        return await tm.trigger();
    }

    async movementTrigger(){
        for(let i = 0; i < this.sceneZones.length; i++) { 
            this.stageZones(this.sceneZones[i]);
        }
        await this.reconcileRandomZones();
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.event] < DANGERZONETRIGGERSORT[b.event] ? -1 : (DANGERZONETRIGGERSORT[a.event] > DANGERZONETRIGGERSORT[b.event] ? 1 : 0)});
        this.next();
    }

    async next(){
        if(canvas.scene.id !== this.sceneId){ 
           if(game.user.isGM) ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.no-trigger-if-not-on-combat-scene"));
           return
        }
        for(const zn of this.zones){
            const proceed = await zn.zone.triggerCheck()
            if(proceed){
                const options = this._options(zn.zone, zn.event)
                await workflow.go(zn.zone, this, zn.event, options) 
            }
        }  
        this.log(`Trigger manager finished...`, this._cancels);
    }

    async reconcileRandomZones() {
        if(this.randomZones.length) {
            for (let event of this.randomEvents){
                const zone = await dangerZone.getRandomZoneFromScene(this.sceneId, event, this.randomZones.filter(z => z.event === event).map(z => z.zone))
                if(zone){this.zones.push({zone: zone, event: event})}
            }
        } 
    }

    setCombatFlags(){
        if(this.hook==='combatStart'){
            this.combatStart = true;
            this.addCombatTrigger('combat-start');
        }
        if((this.hook==='updateCombat' && !this.data.current?.turn) || this.combatStart){
            this.roundStart = true;
            this.addCombatTrigger('round-start');
            if(this.data.current.round > 1){this.addCombatTrigger('round-end')}
        }
        if(this.hook==='updateCombat' && this.options.direction === 1 || this.roundStart){
            this.turnChange = true;
            this.addCombatTrigger('turn-start');
            if(!this.combatStart){this.addCombatTrigger('turn-end')}
        }
        if(this.hook==='deleteCombat'){
            this.addCombatTrigger('combat-end')
        }
        if(this.turnChange){
            if(this.currentInitiative && this.previousInitiative  || this.combatStart || this.roundStart){
                this.addCombatTrigger('initiative-start')
                this.addCombatTrigger('initiative-end')
            }
        }
    }
    
    stageZones(zone, event) {
        if(!zone.trigger.random){
            this.zones.push({zone: zone, event: event})
        } else {
            this.randomZones.push({zone: zone, event: event})
            this.addZoneEvent(event, zone.trigger.initiative ?? 0)
        }
    }

    async trigger() {
        const data = $(this.data.currentTarget).data("data-id"); 
        
        if(data.zone ==='random') {
            const zn = await dangerZone.getRandomZoneFromScene(data.scene, 'manual')
            this.zones.push({zone: zn, event: 'manual'})
            if(!this.zones.length) {
                this.log(`Random trigger zone not found...`, {eventData: data});
                return
            } else {
                this.log(`Random trigger zone found...`, {eventData: data});
            }
        } else {
            const zn = data.dangerId ? dangerZone.getGlobalZone(data.dangerId, data.scene) : dangerZone.getZoneFromScene(data.zone, data.scene)
            this.zones.push({zone: zn, event: zn.hasManualEvent ? 'manual' : ''})
        } 
        
        if(this.zones[0].event === 'manual'){
            await this.next();
        } else {
            await this.zones[0].zone.toggleZoneActive();
        }
    
        return this
    }

}


