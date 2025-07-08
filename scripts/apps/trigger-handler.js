import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions, boundary} from './dimensions.js'
import {workflow} from './workflow.js';
import {COMBAT_EVENTS, DANGERZONETRIGGERSORT, COMBAT_PERIOD_COMBAT_EVENTS, COMBAT_THRESHOLD_END_EVENTS, COMBAT_PERIOD_INITIATIVE_EVENTS} from './constants.js';


/**
 * 
 * 
 * data {
 *   force: forces the zone to trigger even when zone does not have the event. Used primarily for executor trigger of any zone manually
 * }
 */
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

    _loadTokens(ids, options = {}){
        const arr = []; let startingArr = ids;
        if(['aura'].includes(options.event) && options.type === 'target' && options.zone) {
            startingArr = options.zone.zoneEligibleTokens(ids);
        }
        for(const token of startingArr){
            let t = this.scene.tokens.get(token._id ? token._id : token.id);
            if(t) arr.push(t)
        }
        return arr
    }

    _options(zone, event){
        const options = {}
        if(!['move'].includes(event)){
            if(this.data?.options?.location && Object.keys(this.data.options.location).length && !['aura'].includes(event)) options['location'] = this.data.options.location
            if(this.data?.options?.boundary && Object.keys(this.data.options.boundary).length) options['boundary'] = new boundary(this.data.options.boundary.A, this.data.options.boundary.B)
            if(this.data?.options?.targets && this.data.options.targets.length) options.targets = this._loadTokens(this.data.options.targets, {zone: zone, event: event, type: 'target'})
            if(this.data?.options?.sources && this.data.options.sources.length) options.sources = this._loadTokens(this.data.options.sources, {zone: zone, event: event, type: 'source'})
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

    static async apiDirectTrigger(zn, sceneId, options = {}){
        const event = 'api'
        const tm = new triggerManager(sceneId, {zone: 'direct', scene: sceneId, options: options});
        tm.zones.push(zn, event);
        (zn.enabled || !options.activeOnly) ? await tm.next() : console.log('API trigger bypassed scene disabled ', {zone: zn, trigger: tm, options: options});
        return tm
    }

    static async findChatEvents(chatMessage, hook, options) {
        let rollResult, table, results;
	    const sceneId = chatMessage.speaker?.scene ?? canvas.scene.id
        const sceneZones = dangerZone.getRolltableZonesFromScene(sceneId)
        if(!sceneZones.length) return
        if(hook === "createChatMessage"){
            rollResult = chatMessage.rolls[0].result
            if(!rollResult) return
            table = game.tables.get(options.rollTableId)
            if(!table) return
            results = table.getResultsForRoll(rollResult).map(r => r.text) 
        } else {
            table = options.table
            results = chatMessage.results
        }
        if(!results) return
        
        const eligibleZones = sceneZones.filter(s => s.trigger.chat.phrases.find(r => results.includes(r)))
        dangerZone.log(false, 'Searching for Rolltable Result Trigger', {chatMessage: chatMessage, sceneZones: sceneZones, eligibleZones: eligibleZones, rollResult: rollResult, table: table, tableResults: results})
        if(eligibleZones.length){
            const tm = new triggerManager(sceneId, chatMessage, eligibleZones, hook);
            await tm.chatTrigger();
        }
    }

    async chatTrigger(){
        for(const zn of this.sceneZones) { 
            for(const event of zn.chatEvents) this.#stageZone(zn, event);
        }
        await this.#reconcileRandomZones();
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.event] < DANGERZONETRIGGERSORT[b.event] ? -1 : (DANGERZONETRIGGERSORT[a.event] > DANGERZONETRIGGERSORT[b.event] ? 1 : 0)});
        this.next();
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
                        if(!(await zn.sourceTrigger([this.combatant.token]))){
                            this._cancelZone(zn, `Failed ${event} source trigger check on combatant ${this.combatant.name}`)
                            continue
                        }
                    }
                    else if(event == 'turn-end'){
                        if(!(await zn.sourceTrigger([this.previousCombatant.token]))){
                            this._cancelZone(zn, `Failed ${event} source trigger check on previous combatant ${this.previousCombatant.name}`)
                            continue
                        }
                    } 
                    else {
                        if(!(await zn.sourceTrigger(this.combatants.map(c => c.token)))){
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
                    this.#stageZone(zn, event);
                } else {
                    this._cancelZone(zn, `Failed ${event} was not a combat event that occurred.`)
                }
            }
        }
        await this.#reconcileRandomZones();
        this.zones.sort((a, b) => {let _a = (COMBAT_PERIOD_INITIATIVE_EVENTS.includes(a.event) ? a.zone.trigger.initiative : 0), _b = (COMBAT_PERIOD_INITIATIVE_EVENTS.includes(b.event) ? b.zone.trigger.initiative : 0); return _a < _b ? -1 : _a > _b ? 1 : 0});
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.event] < DANGERZONETRIGGERSORT[b.event] ? -1 : (DANGERZONETRIGGERSORT[a.event] > DANGERZONETRIGGERSORT[b.event] ? 1 : 0)});
        this.next();
    }

    static async findcombatEvents(combat, hook, options){
        const sceneId = combat.scene?.id ?? canvas.scene.id
        if(game.user.isActiveGM && sceneId && (combat.started || hook === 'combatStart')) {
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

    static async zoneMovement(token, update, movementPromise){
        const sceneId = token.parent.id;
        const scene = game.scenes.get(sceneId);
        if(!scene?.grid?.type){return dangerZone.log(false,'No Movement Triggers When Gridless ', {token: token, update:update})}
        triggerManager.findMovementEvents(token, update, {end: false, sceneId: sceneId})
        triggerManager.findMovementEvents(token, update, {movementPromise: movementPromise, end: true, sceneId: sceneId})
    }

    static async findMovementEvents(token, update, options){
        const sceneZones = options.end ? dangerZone.getMovementCompleteZonesFromScene(options.sceneId) : dangerZone.getMovementNotCompleteZonesFromScene(options.sceneId);
        if(!sceneZones.length) return

        const zones = []
        const move = dangerZoneDimensions.tokenMovement(token, update);
        if(options.end) await CanvasAnimation.getAnimation(options.movementPromise)?.promise

        for (const zn of sceneZones) {
            if(!(await zn.sourceTrigger([token]))){
                continue;
            }
            const zoneBoundary = await zn.scene.getZoneBoundary();

            const zoneTokens = zoneBoundary.tokensIn([token]);

            if('x' in update) token.x = update.x
            if('y' in update) token.y = update.y
            if('elevation' in update) token.elevation = update.elevation
            if(zoneTokens.length){
                zones.push(zn)
            }
        }

        const data = {provokingMove: move, update: update, options: {targets: [token], location: options.end ? move.end : move.start}}

        if(zones.length){
            const tm = new triggerManager(options.sceneId, data, zones, "updateToken");
            tm.log(`Initiating ${options.end ? 'movement end' : 'movement start'} trigger handler...`, {token: token, data:data, move: move});
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

    async movementTrigger(){
        for(const zn of this.sceneZones) { 
            for(const event of zn.movementEvents){
                if(event === 'aura') {
                    let targets = zn.zoneEligibleTokens(this.data?.options?.targets)
                    if(!targets.length){
                        this.log(`Aura trigger bypassed, moving token cannot be targeted..`, {trigger: this, event: event, zone: zn, targets: this.data?.options?.targets});
                        continue //only trigger aura if the moving token can be targted
                    }
                }
                this.#stageZone(zn, event);
            }
        }
        await this.#reconcileRandomZones();
        this.zones.sort((a, b) => { return DANGERZONETRIGGERSORT[a.event] < DANGERZONETRIGGERSORT[b.event] ? -1 : (DANGERZONETRIGGERSORT[a.event] > DANGERZONETRIGGERSORT[b.event] ? 1 : 0)});
        this.next();
    }

    async next(){
        if(canvas.scene.id !== this.sceneId){ 
           if(game.user.isActiveGM) ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.no-trigger-if-not-on-combat-scene"));
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
    
    /************ PRIVATE METHODS *****************/

    /**V13
     * method called by manual trigger. Runs through determining the random trigger to generate or the provided on
     * @returns trigger manager
     */
    async #manualTrigger() {
        if(this.data.zone ==='random') {
            await this.#stageRandomManualZone()
        } else {
            const zn = this.data.dangerId ? dangerZone.getGlobalZone(this.data.dangerId, this.data.scene) : dangerZone.getZoneFromScene(this.data.zone, this.data.scene)
            if(zn) this.zones.push({zone: zn, event: (zn.hasManualEvent || this.data.force) ? 'manual' : ''})
        } 
        
        if(!this.zones.length) return

        if(this.zones[0].event === 'manual' || this.data.force){
            await this.next();
        } else {
            await this.zones[0].zone.toggleZoneActive();
        }
    
        return this
    }

    /**V13
     * from the array of events that have randomized zones, selects a zone at random that is eligible for each given event and adds as a zone to trigger
     */
    async #reconcileRandomZones() {
        if(this.randomZones.length) {
            for (let event of this.randomEvents){
                const zone = await dangerZone.getRandomZoneFromScene(this.sceneId, event, this.randomZones.filter(z => z.event === event).map(z => z.zone))
                if(zone){
                    this.zones.push({zone: zone, event: event})
                    this.log(`Random trigger zone not found...`, {eventData: this.data, event: event})
                } else{
                    this.log(`Random trigger zone found...`, {eventData: this.data, event: event});
                }
            }
        } 
    }

    /**v13
     * During manual trigger of a random event, selects 1 zone and sends it to be staged for random handling
     */
    async #stageRandomManualZone(){
        const zn = await dangerZone.getRandomZoneFromScene(this.sceneId, 'manual')
        this.#stageZone(zn, 'manual')
        await this.#reconcileRandomZones()
    }
    
    /**v13
     * For random zones, adds the event to the random event array for use in random triggering
     * @param {string} event      the trigger event 
     * @param {integer} initiative      initiative setting on zone
     */
    #stageRandomZoneEvent(event, initiative){
        const e = COMBAT_PERIOD_INITIATIVE_EVENTS.includes(event) ? event + '-' + initiative.toString() : event
        this.randomEvents.add(e)
    }

    /**v13
     * Adds the zone to the appropriate array - whether for random handling or queued for trigger
     * For random zones, calls the method to stage the event also
     * @param {zone} zone      the zone class
     * @param {string} event     the trigger event 
     */
    #stageZone(zone, event) {
        if(!zone.trigger.random){
            this.zones.push({zone: zone, event: event})
        } else {
            this.randomZones.push({zone: zone, event: event})
            this.#stageRandomZoneEvent(event, zone.trigger.initiative ?? 0)
        }
    }

    /************ METHODS *****************/
    /**v13
     * method called by a manual trigger (for example, using the executor)
     * @param {object} data 
     * @returns trigger manager
    */
    static async manualTrigger(data) {
        let sceneId = data.scene; 
        const tm = new triggerManager(sceneId, data);
        return await tm.#manualTrigger();
    }


}


