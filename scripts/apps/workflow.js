import {dangerZone, zone} from '../danger-zone.js';
import {point, boundary} from './dimensions.js';
import {EVENTS, EXECUTABLEOPTIONS, FVTTMOVETYPES, FVTTSENSETYPES, WORKFLOWSTATES} from './constants.js';
import {furthestShiftPosition, getActorOwner, getFilesFromPattern, getTagEntities, limitArray, shuffleArray, stringToObj, wait, maybe, joinWithAnd} from './helpers.js';

async function delay(delay){
    if(delay) await wait(delay)
}

function biRandom() {
    return Math.random() < 0.5 ? true : false
}

export class workflow {

    constructor(zone, trigger, event, options = {}) {
        this.active = true,
        this.executor = new executor(zone, options, this);
        this._options = options,
        this._id = foundry.utils.randomID(16),
        this._state = WORKFLOWSTATES.NONE,
        this.event = event,
        this.trigger = trigger
    };

    get danger(){
        return this.executor.data.danger
    }

    get plan(){
        return this.executor.plan
    }

    get previouslyExecuted(){
        return this.executor.previouslyExecuted
    }

    get title(){
        return this.zone.title
    }

    get zone(){
        return this.executor.data.zone
    }

    log(message, data){
        dangerZone.log(false,`${message} ${this.title}... `, {workflow: this, data:data});
    } 

    static async go(zone, trigger, event, options){
        const length = zone.trigger.loop ?? 1
        let delay = 0;
        for(let i=0; i < length; i++){
            options['previouslyExecuted'] = i ? true : false
            if(zone.trigger.delay.min > 0 || zone.trigger.delay.max > 0) {
                if(zone.trigger.operation === 'T'){
                    if(!i) delay = zone.delay()
                } else {
                    delay = zone.delay()
                }
            }
            if(options.extensionDelay) delay = delay + options.extensionDelay;
            options['delay'] = delay;
            const flow = new workflow(zone, trigger, event, options);
            flow.log(`Workflow ${zone.title} loop ${i+1} of ${length}...`, {zone: zone, event: event, trigger: trigger, options: options});
            zone.trigger.operation === 'Q' ? await flow.next() : flow.next()
        }
    }

    async next(nextState = WORKFLOWSTATES.INITIALIZE){
        if(!this.active){return this}
        this._state = nextState
        await this._next();
        if(!this.active){return this}
    }

    async _next(){
        switch(this._state) {
            case WORKFLOWSTATES.INITIALIZE:
                return this.next(WORKFLOWSTATES.EXECUTE)

            case WORKFLOWSTATES.EXECUTE:
                await this.executor.play()
                switch(this.executor.state){
                    case 0: 
                        return this.next(WORKFLOWSTATES.CANCEL)
                    case 1: 
                        return this.next(WORKFLOWSTATES.COMPLETE)
                    case 2: 
                        return this.next(WORKFLOWSTATES.INFORM)
                }

            case WORKFLOWSTATES.INFORM: 
                await this.executor.inform();
                return this.next(WORKFLOWSTATES.COMPLETE)

            case WORKFLOWSTATES.CANCEL: 
                this.active = false
                this.log('Zone workflow cancelled', {});
                return this

            case WORKFLOWSTATES.COMPLETE: 
                this.executor.done();
                this.active = false;
                return this.log('Zone workflow complete', {})
        }
    }
}

class plan {
    constructor(executor){
        this.current = {},
        this.elapsedTime = 0,
        this.executor = executor,
        this.manifest = new Map,
        this.ongoing,
        this.running = [],
        this.valid = true;
        this._initialize()
    }

    get title(){
        return this.executor.data.zone.title
    }

    _build(){
        const groups = [...new Set(this.executor.executables.map(e => e.delay))].sort((a, b) => {return a < b ? -1 : (a > b ? 1 : 0)}); 
        if(!groups.length) return
        this.setElapsedTime(groups[0]);
        for(const group of groups){
            this.manifest.set(`Dangers group ${group} delay`,[()=> {return this._newStep(group)}]);
            this.manifest.set(`Dangers group ${group}`,this.executor.executables.filter(e => e.delay === group).map(e => ()=> {return e.go()}));
        }
        if(this.elapsedTime > 0) this.setElapsedTime(0);
    }

    _clearRun(){
        this.running = []
    }

    async done(){
        const run = await Promise.all(this.running).then((r) => {return {success: true, result: r}}).catch((e) => {return {success: false, result: e}})
        run.success ? this.runReport(run.result) : this.errorReport(run.result)
        this._clearRun()
        return run.success
    }

    errorReport(report){
        console.log(`Danger Zone ${this.title} plan step execution failed ${report?.danger}...`, report)
    }

    _initialize(){
        this.manifest.set("load", [() => {return this.executor.load()}]);
        this.manifest.set("ready", [() => {return this.executor.ready()}]);
        this.manifest.set("check", [() => {return this.executor.check()}]);
        this.manifest.set("data", [() => {return this.executor.setZoneData()}]);
        this.manifest.set("inform", [() => {return this.executor.inform()}]);
        if(!this.executor.data.clearBypass) this.manifest.set("wipe", [() => {return this.executor.wipe()}]);
        this.manifest.set("extension_pre", [()=> {return this.executor.extensionPre()}])
        this.manifest.set("delay", [()=> {return this.executor.delay()}])
        this.manifest.set("extension_same", [()=> {return this.executor.extensionConcurrent()}])
        this._build();
        this.manifest.set("extension_post", [()=> {return this.executor.extensionPost()}])
        this.ongoing = this.manifest.entries();
    }

    log(message, data){
        dangerZone.log(false,`${this.title} ${message}... `, data);
    }

    async _newStep(time){
        const del = time-this.elapsedTime;
        await delay(time-this.elapsedTime);
        this.setElapsedTime(time)
        return {"danger": `Delay ${del} millisecond`, "data": this}
    }

    reset(){
        this.current = {},
        this.elapsedTime = 0,
        this.manifest = new Map,
        this.ongoing,
        this.running = [],
        this.valid = true;
        this._initialize()
    }

    async runPlan(){
        this.current = this.ongoing.next();
        while (this.valid && !this.current.done) {
            const [k,v] = this.current.value
            for(const f of v){
                if(this.executor.state===1) {this.runStep(f())} else {break;}
            }
            this.valid = await this.done()
            this.current = this.ongoing.next();
        }
        return this.valid
    }

    runReport(run){
        for (const report of run){
            if(report) this.log(`plan step executed ${report?.danger}`, report?.data)
        }
    }

    runStep(f){
        this.running.push(f)
    }

    setElapsedTime(time){
        this.elapsedTime = time
    }
}

class executorData {
    constructor(zone, options, parent){
        this.id = foundry.utils.randomID(16),
        this.boundary = options.boundary ?? {},
        this.clearBypass = options.clearBypass ?? false,
        this._delay = options.delay,
        this.eligibleTargets = [],
        this.likelihoodResult = 100,
        this.location = options.location ? (new point(options.location.coords ?? {x: options.location.x, y: options.location.y}, options.location.elevation ?? options.location.z)) : {},
        this.offset = {
            x:{
                random: Math.random(),
                flipLocation: biRandom()
            },
            y:{
                random: Math.random(),
                flipLocation: biRandom()
            }
        },
        this._options = options,
        this.parent = parent,
        this.previouslyExecuted = options.previouslyExecuted ?? false,
        this.regionData = {
            shapes: []
        },
        this.save = {failed: options.save?.failed ?? [], succeeded: options.save?.succeeded ?? []},
        this._sources = options.sources ?? [],
        this.sources = [],
        this._sourceAreas = options.sourceAreas ?? [],
        this.sourceAreas = [],
        this.sourcesBlended = [],
        this.sourceLimit = zone.generateSourceCount(),
        this.spawn = {
            mutate: false,
            tokens: []
        },
        this.targets = options.targets ?? [],
        this.tokenMovement = [],
        this.twinBoundary = {},
        this.valid = true,
        this.zone = zone,
        this.zoneBoundary,
        this.zoneEligibleTokens = [],
        this.zoneTokens = [];
    }

    get danger(){
        return this.zone.danger
    }

    get dualBoundaries(){
        return Object.keys(this.twinBoundary).length ? [this.boundary, this.twinBoundary] : [this.boundary]
    }

    get eligibleSources(){
        return this.zone.sources.filter(s => !this.sources.find(s.id))
    }

    get event(){
        return this.parent?.parent?.event ?? 'manual'
    }

    get flag(){
        return {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.event, type: this.zone.dangerId}}}
    }

    get hasFails(){
        return this.save.failed.length ? true : false
    }

    get hasDualBoundaries(){
        return (!this.dualBoundaries.length || this.dualBoundaries.length % 2) ? false : true 
    }

    get hasBoundary(){
        return (Object.keys(this.boundary).length) ? true : false
    }

    get hasLocation(){
        return (Object.keys(this.location).length) ? true : false
    }

    get hasSources(){
        return this.sources.length ? true : false
    }

    get hasSourceAreas(){
        return this.sourceAreas?.length ? true : false
    }

    get hasSuccesses(){
        return this.save.succeeded.length ? true : false
    }

    get hasTargets(){
        return this.targets.length ? true : false
    }

    get twinDanger(){
        return (this.zone.danger.hasTwinBoundary) ? true : false
    }

    get likelihoodMet(){
        return this.likelihoodResult <= this.zone.trigger.likelihood
    }

    get saveFailed(){
        return this.save.failed
    }

    get saveSucceeded(){
        return this.save.succeeded
    }

    get scene() {
       return game.scenes.get(this.zone.scene.sceneId)
    }

    get sceneBoundary(){
        return {
            x: {min: this.scene.dimensions.sceneX, max: this.scene.dimensions.sceneX + this.scene.dimensions.sceneWidth - this.scene.dimensions.size},
            y: {min: this.scene.dimensions.sceneY, max: this.scene.dimensions.sceneY + this.scene.dimensions.sceneHeight - this.scene.dimensions.size }
        }
    }

    get sceneTokens() {
        return this.scene.tokens
    }

    get range(){
        return this.scene.dimensions.distance * Math.max(this.danger.dimensions.units.w, this.danger.dimensions.units.h)
    }

    get targetBoundary(){
        return this.boundary
    }

    about() {
        if(game.user.isActiveGM && game.settings.get(dangerZone.ID, 'chat-details-to-gm')) {   
            let content =
                `<div class="danger-zone-chat-message-title"><i class="fas fa-radiation"></i> Danger Zone Workflow Details</div><div class="danger-zone-chat-message-body">
                <div><label class="danger-zone-label">Danger:</label><span> ${this.danger.name}</span></div>
                <div><label class="danger-zone-label">Dimensions:</label><span> w${this.danger.dimensions.units.w}  h${this.danger.dimensions.units.h}  d${this.danger.dimensions.units.d}${this.zone.dimensions.bleed ? ' (bleed)' : ''}</span></div>
                <div><label class="danger-zone-label">Eligible zone tokens:</label><span> ${this.zoneEligibleTokens.map(t => t.name)}</span></div>
                <div><label class="danger-zone-label">Trigger:</label><span> ${game.i18n.localize(EVENTS[this.event].label)}</span></div>
                <div><label class="danger-zone-label">Likelihood:</label><span> ${this.zone.trigger.likelihood}</span> <label class="danger-zone-label">Likelihood result:</label><span> ${this.likelihoodResult}</span></div>
                <div><label class="danger-zone-label">Targeting:</label><span> ${this.zone.target.always ? 'Must target a location with a token' : 'Can target any location in zone'}. ${this.zone.target.all ? 'Hits all eligible tokens' : 'Hits one eligible token'} at location.</span></div>
                `;
            if(this.hasBoundary){
                content += `
                <div><label class="danger-zone-label">Target location start:</label><span> x${this.boundary.A.x}  y${this.boundary.A.y}  e${this.boundary.bottomIsInfinite ? '-&infin;' : this.boundary.bottom}</span></div>
                <div><label class="danger-zone-label">Target location end:</label><span> x${this.boundary.B.x}  y${this.boundary.B.y}  e${this.boundary.topIsInfinite ? '&infin;' : this.boundary.top}</span></div>
                <div><label class="danger-zone-label">Eligible targets:</label><span> ${this.eligibleTargets.map(t => t.name)}</span></div>
                <div><label class="danger-zone-label">Hit targets:</label><span> ${this.targets.map(t => t.name)}</span></div></div>`
            } 
            ChatMessage.create({
                content: content,
                whisper: [game.user.id]
            },{chatBubble : false})
        }
    }

    async checkLikelihood() {
        if(this.zone.trigger.likelihood < 100){
            const roll = await maybe();
            this.likelihoodResult = roll.result;
        }
        return this.likelihoodMet
    }

    async fillSources(){
        await this._setSources(true);
    }

    async fillSourceAreas(){
        await this.setSourceAreas(true)
        this.setBlendedSources(true) 
    }

    async highlightBoundary(override = false){
        if(this.hasBoundary && game.user.isActiveGM && (override || game.settings.get(dangerZone.ID, 'display-danger-boundary'))){
            this.boundary.highlight(this.id, 16711719)
            await wait(1000)
            this.boundary.destroyHighlight(this.id);
        }
    }

    informLikelihood(){
        console.log(`Zone likelihood of ${this.zone.trigger.likelihood} was${this.likelihoodMet ? '' : ' not'} met with a roll of ${this.likelihoodResult}`)
    }

    async promptBoundary(){ 
        this.location = await this.zone.promptTemplate();
        if(!this.hasLocation) {
            return ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.user-selection-exited"));
        }
        return this._setLocationBoundary()
    }

    async randomBoundary() {
        let max = 1, i=0;
        const test = await this.zone.scene.randomDangerBoundary();
        const targetPool = this.targets.length ? this.targets : this.zoneEligibleTokens;
        if((this.targets.length || this.zone.target.always) && targetPool.length) max = 10000;
        do {
            i++;
            const b = test.next()
            if(!b || b.done) return
            this.boundary = b.value;
            this.eligibleTargets = this.boundary.tokensIn(targetPool);
        } while(!this.eligibleTargets.length && i < max);
        (test.done && !this.hasDualBoundaries) ? this.twinBoundary = this.boundary : this.twinBoundary = test.next().value
    }

    async set(asRun = true){
        await this._setSources();
        await this.setZone();
        await this.setBoundary(asRun)
        this.setTargets()
        if(this.danger.hasTwinBoundary) await this.setTwinBoundary()
        if(!this.hasBoundary) this.valid = false
    }
    
    async setBoundary(asRun = false) {
        if(this.hasBoundary) return this._setBoundary();
        if(this.hasLocation) return this._setLocationBoundary();
        if(asRun && this.zone.target.choose.enable) {
            await this.promptBoundary();
            return
        }
        await this.randomBoundary()
    }

    async _setSources(fill = false){
        this.setTokenSources(fill);
        await this.setSourceAreas(fill);
        this.setBlendedSources(fill);
    }

    setBlendedSources(fill = false){
        const all = this.sourceAreas.concat(this.sources.filter(s => !this.sourceAreas.find(a => a.id === s.id)))
        if (this.sourceLimit === -1 || all.length <= this.sourceLimit) {this.sourcesBlended = all} 
        else if(!fill){this.sourcesBlended = limitArray(shuffleArray(all),this.sourceLimit)} 
        else {
            const fillCount = this.sourceLimit - all.length;
            if(fillCount) this.sourcesBlended = this.sourcesBlended.concat(limitArray(shuffleArray(all),fillCount))
        }
    }

    setTokenSources(fill = false){
        if(this._sources.length) {this.sources = this._sources}
        else if (this.sourceLimit === -1 || this.zone.sources.length <= this.sourceLimit) {this.sources = this.zone.sources}
        else if(!fill){this.sources = limitArray(shuffleArray(this.zone.sources),this.sourceLimit)} 
        else {
            const fillCount = this.sourceLimit - this.zone.sources.length;
            if(fillCount) this.sources = this.sources.concat(limitArray(shuffleArray(this.eligibleSources),fillCount))
        }
    }

    async setSourceAreas(fill = false){
        if(this._sourceAreas.length){this.sourceAreas = this._sourceAreas}
        else {
            let area;
            if(this.zone.source.area === 'A') {area = this.sources}
            else {
                const ar = await this.zone.sourceArea();
                area = ar.documents;
            } 
            if (this.sourceLimit === -1) {this.sourceAreas = area}
            else if(!fill){this.sourceAreas = limitArray(shuffleArray(area),this.sourceLimit)} 
            else {
                const fillCount = this.sourceLimit - this.sourceAreas.length;
                if(fillCount) this.sourceAreas = this.sourceAreas.concat(limitArray(shuffleArray(area.filter(s => !this.sourcesAreas.find(s.id))),fillCount))
            }
        }
        if(!this.sourceAreas) this.sourceAreas = []
    }
    
    setTargets(){
        if (this.hasTargets) return this.eligibleTargets.filter(e => this.targets.find(t => e.id === t.id))
        if(!this.zone.target.all){
            if(this.eligibleTargets.length > 1){
                return this.targets.push(this.eligibleTargets[Math.floor(Math.random() * this.eligibleTargets.length)])
            }
        }
        return this.targets = this.eligibleTargets
    }

    async setTwinBoundary(){
        const itr = await this.zone.scene.randomDangerBoundary();
        this.twinBoundary = itr.next().value
    }

    async setZone(){
        this.zoneBoundary = await this.zone.scene.getZoneBoundary();
        this.zoneTokens = this.zoneBoundary.tokensIn(this.sceneTokens);
        this.zoneEligibleTokens = this.zone.zoneEligibleTokens(this.zoneTokens);
    }

    _setBoundary(){
        this.eligibleTargets = this.boundary.tokensIn(this.zoneEligibleTokens);
    }

    _setLocationBoundary(){
        const options = {excludes: this.zoneBoundary.excludes, universe: this.zoneBoundary.universe}
        this.zone.stretch(options);
        this.boundary = boundary.locationToBoundary(this.location.coords, {bottom: this.location.elevation, top: this.location.elevation}, this.danger.dimensions.units, options);
        this._setBoundary();
    }

    insertSaveFailed(failed){
        this.save.failed = failed?.length ? this.save.failed.concat(failed.filter(t => !this.save.failed.find(tg => tg.id === t.id))) : [];
    }

    insertSaveSucceeded(success){
        this.save.succeeded = success?.length ? this.save.succeeded.concat(success.filter(t => !this.save.succeeded.find(tg => tg.id === t.id))) : [];
    }

    insertSources(sources){
        this._sources = sources?.length ? this.sources.concat(sources.filter(t => !this.sources.find(tg => tg.id === t.id))) : [];
    }

    insertTargets(targets){
        this.targets = targets?.length ? this.targets.concat(targets.filter(t => !this.targets.find(tg => tg.id === t.id))) : [];
    }

    updateBoundary(boundary){
        this.boundary = boundary ?? {}
    }

    updateLocation(location){
        this.location = location ? new point({x: location?.x ?? 0, y: location?.y ?? 0}, location?.elevation) : {}
    }

    updateSaveFailed(saves){
        this.save.failed = saves?.length ? saves : [] 
    }

    updateSaveSucceeded(saves){
        this.save.succeeded = saves?.length ? saves : [] 
    }

    updateSources(sources){
        this._sources = sources?.length ? sources : []
    }

    updateTargets(targets){
        this.targets = targets?.length ? targets : [];
    }
}

export class executor {
    constructor(zone, options = {}, parent = {}) {
        this.data = new executorData(zone, options, this),
        this.executable = {},
        this.parts = [],
        this.promises = {load: []},
        this.state = 1,
        this.parent = parent;

        this._initialize();

        this.plan = new plan(this);
    }

    _initialize(){
        for(let [name,part] of this.data.danger.parts){
            let be;
            switch(name){
                case 'effect': 
                    be = new activeEffect(part, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'audio': 
                    be = new audio(part, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'combat': 
                    be = new combat(part, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'foregroundEffect': 
                    be = new primaryEffect(this.danger.foregroundEffect, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'ambientLight': 
                    be = new ambientLight(this.danger.ambientLight, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'canvas': 
                    be = new Canvas(this.danger.canvas, this.data, name, EXECUTABLEOPTIONS[name]);
                    break;
                case 'damage': 
                    be = new damageToken(this.danger.damage, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'lastingEffect': 
                    be = new lastingEffect(this.danger.lastingEffect, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'macro': 
                    be = new macro(this.danger.macro, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'mutate': 
                    be = new mutate(this.danger.mutate, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'backgroundEffect': 
                    be = new secondaryEffect(this.danger.backgroundEffect, this.data, name, EXECUTABLEOPTIONS[name]);
                    break;
                case 'item': 
                    be = new item(this.danger.item, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'region': 
                    be = new region(this.danger.region, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'rolltable': 
                    be = new rolltable(this.danger.rolltable, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'save': 
                    be = new save(this.danger.save, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'sourceEffect': 
                    be = new sourceEffect(this.danger.sourceEffect, this.data, name, EXECUTABLEOPTIONS[name]);
                    break;
                case 'scene': 
                    be = new scene(this.danger.scene, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'sound': 
                    be = new sound(this.danger.sound, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'warpgate': 
                    be = new spawn(this.danger.warpgate, this.data, name, EXECUTABLEOPTIONS[name]);
                    break;
                case 'tokenMove': 
                    be = new tokenMove(this.danger.tokenMove, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'tokenEffect': 
                    be = new tokenEffect(this.danger.tokenEffect, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'tokenSays': 
                    be = new tokenSays(this.danger.tokenSays, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break;
                case 'wall': 
                    be = new wall(this.danger.wall, this.data, name, EXECUTABLEOPTIONS[name]); 
                    break; 
                case 'weather': 
                    be = new weather(this.danger.weather, this.data, name, EXECUTABLEOPTIONS[name]);
                    break;
            }
            if(be) this.reconcile(name, be);
        }
        this.reconcile('flavor', new flavor(this.zone.flavor, this.data, 'flavor', EXECUTABLEOPTIONS['flavor'])); 
    }

    get boundary(){
        return this.data.hasBoundary ? this.data.boundary : ''
    }

    get danger(){
        return this.zone.danger
    }

    get eligibleTargets(){
        return this.data.eligibleTargets
    }

    get executables(){
        return this.parts.filter(e => e.has)
    }

    get hasSave(){
        return this.executable.save ? true : false
    }

    get hasSourcing(){
        return (this.zone.hasSourceTokenDefined || this.executables.find(e => e.hasSourcing)) ? true : false
    }

    get hasSourceToTarget(){
        return false
    }

    get hasTargeting(){
        return (this.hasSave || this.executables.find(e => e.hasTargeting)) ? true : false
    }

    get previouslyExecuted(){
        return this.data.previouslyExecuted
    }

    get saveFailed(){
        return this.data.saveFailed
    }

    get saveSucceeded(){
        return this.data.saveSucceeded
    }

    get sourceAreas(){
        return this.data.sourceAreas
    }

    get sources(){
        return this.data.sources
    }

    get targets(){
        return this.data.targets
    }

    get wipeables(){
        return this.executables.filter(e => e.wipeable)
    }

    get zone(){
        return this.data.zone
    }

    get zoneEligibleTokens(){
        return this.data.zoneEligibleTokens
    }

    async check(){
        if(!this.data.danger) return this.state = 0
        const cont = await this.data.checkLikelihood()
        if(!cont) {
            this.data.informLikelihood();
            this.state = 2;
        }
        return this.report('Check');
    }

    async delay(){
        if(this.data._delay) await wait(this.data._delay)
    }

    async done(){
        this.data.previouslyExecuted = true;
    }

    async extensionPre(){
        await this.extensionSequence('-1')
        return this.report('Pre Extensions')
    }

    async extensionConcurrent(){
        this.extensionSequence('0')
        return this.report('Concurrent Extensions')
    }

    async extensionPost(){
        await this.extensionSequence('1')
        return this.report('Post Extensions')
    }

    async extensionSequence(stage){
        if(!this.zone.extensions) return
        const ar = this.zone.extensions.filter(e => e.sequence === stage);
        const promises = [];
        for(let ex of ar){
            if(ex.once && this.previouslyExecuted) {
                dangerZone.log(false,'Extension triggers only once, bypassing on triggering zone loops', {extension: ex})
                continue;
            }
            const znlist = dangerZone.getExtendedZones(this.data.scene.id);
            const zn = znlist.find(z => z.id === ex.zoneId);
            if(!zn){
                dangerZone.log(false,'Extension does not return a valid zone on the executor scene', {extension: ex, zones: znlist})
                continue;
            }
            if(ex.once && this.previouslyExecuted) {
                dangerZone.log(false,'Extension triggers only once, bypassing on triggering zone loops', {extension: ex})
                continue;
            }
            if(['S', 'R', 'P'].includes(ex.interaction)){//identify those zones that are on scene (and not global or dangers)
                const sceneZoneIds = dangerZone.getAllZonesFromScene(this.data.scene.id, {enabled: false, typeRequired: true}).map(m => m.id)
                if(!sceneZoneIds.includes(zn.id) || (ex.interaction === 'S' && !sceneZoneIds.includes(this.zone.id))){
                    console.log(`Zone extension uses a global zone or a zone that is not part of this scene.`)
                    continue;
                }
            }
            if(ex.likelihood < 100){
                const maybe = await maybe();
                if(ex.likelihood > maybe.result) {
                    console.log(`Zone extension likelihood of ${ex.likelihood} was not met with a roll of ${maybe.result}`)
                    continue;
                }
            }
            let sourceRegionId = this.zone.scene.regionId, targetRegionId = zn.scene.regionId;            
            switch(ex.interaction){
                case 'A':
                    if(!zn.enabled) promises.push(zn.toggleZoneActive())
                    break;
                case 'D':
                    if(zn.enabled) promises.push(zn.toggleZoneActive())
                    break;    
                case 'G':
                    promises.push(zn.toggleZoneActive())
                    break;  
                case 'P':
                    promises.push(zn.updateRegion(sourceRegionId))
                    break; 
                case 'R':
                    if(this.data.regionData.shapes.length) promises.push(zn.addShapesToRegion(this.data.regionData.shapes))
                    break; 
                case 'S':
                    promises.push(zn.updateRegion(sourceRegionId))
                    promises.push(this.zone.updateRegion(targetRegionId))
                    break; 
                case 'T':
                    promises.push(this.extensionTrigger(ex, zn))
                    break;
            }             
        }
        await Promise.all(promises);
    }

    async extensionTrigger(extension, zn){
        const ops = {};
        if(extension.boundary) ops.boundary = this.data.boundary;
        if(extension.target) ops.targets = this.data.targets;
        if(extension.save) ops.save = this.data.save;
        if(extension.source) ops.sources = this.data.sources;
        if(extension.clear) ops.clearBypass = true;
        if(extension.delay?.min || extension.delay?.max) ops.extensionDelay = zone.delay(extension.delay)
        await workflow.go(zn, 'zone', 'extension', ops)
    }
 
    async inform(){
        this.data.highlightBoundary()
        this.data.about();
        return this.report('Inform');
    }

    async load(){
        if(!dangerZone.MODULES.sequencerOn || this.previouslyExecuted) return true
        const promises = this.parts.filter(p => p._file).map(p => p.file).concat(this.parts.filter(p => p._fileB).map(p => p.fileB).concat(this.parts.filter(p => p._fileF).map(p => p.fileF)));
        const files = await Promise.all(promises).then((results) => {return results.filter(r => r)}).catch((e) => {return console.log('Danger Zone file caching failed.')});
        if(files.length) this.promises.load.push(Sequencer.Preloader.preloadForClients(files))
        return this.report('Load')
    }

    newPlan(){
        this.plan.reset()
    }

    async play(){
        await this.plan.runPlan()
    }

    async ready(){
        this.state = await Promise.all(this.promises.load).then(() => {return 1}).catch((e) => {return 0});
        return this.report('Ready')
    }

    reconcile(name, part){
        if(part.has){
            this.parts.push(part);
            this.executable[name] = part;
        }
    }

    report(title){
        return {"danger": title, "data": this}
    }

    async reset(){
        this.data = new executorData(this.data.zone, {}),
        await this.set()
    }

    clearBoundary(options={}){
        if(options.clearTargets) this.clearTargets();
        if(options.clearLocation) this.clearLocation()
        this.data.updateBoundary()
    }

    clearLocation(){
        this.data.updateLocation();
    }

    clearSaveFailed(){
        this.data.updateSaveFailed()
    }

    clearSaveSucceeded(){
        this.data.updateSaveSucceeded()
    }

    clearSources(){
        this.data.updateSources()
    }

    clearTargets(){
        this.data.updateTargets()
    }

    async highlightBoundary(override = false){
        await this.data.highlightBoundary(override)
    }

    insertSaveFailed(fails){
        this.data.insertSaveFailed(fails)
    }

    insertSaveSucceeded(saves){
        this.data.insertSaveSucceeded(saves)
    }

    insertSources(sources){
        this.data.insertSources(sources)
    }

    insertTargets(targets){
        this.data.insertTargets(targets)
    }

    async promptBoundary(options={}){
        this.clearBoundary(options);
        await this.data.promptBoundary()
        if(options.highlight) this.highlightBoundary(true)
    }

    async randomBoundary(options = {}){
        await this.setBoundary(options)
    }

    randomTarget(){
        this.clearTargets()
        this.setTargets()
    }

    async setBoundary(options = {}){
        this.clearBoundary(options);
        await this.data.setBoundary()
        if(options.highlight) this.highlightBoundary(true)
    }

    setTargets(){
        this.data.setTargets()
    }

    async updateBoundary(boundary, options={}){
        this.data.updateBoundary(boundary)
        await this.setBoundary(options)
    }

    async updateLocation(location, options={}){
        this.data.updateLocation(location);
        await this.setBoundary(options);
    }

    updateSaveFailed(saves){
        this.data.updateSaveFailed(saves)
    }

    updateSaveSucceeded(saves){
        this.data.updateSaveSucceeded(saves)
    }

    updateSources(sources){
        this.data.updateSources(sources)
    }

    updateTargets(targets){
        this.data.updateTargets(targets)
    }
    
    async setZone(){
       await this.data.setZone()
    }
    
    async setZoneData(asRun = true){
        await this.data.set(asRun)
        return this.report('Data');
    }

    async set(asRun = true){     
        await this.load();
        await this.ready();
        await this.setZoneData(asRun);
    }

    async wipe(){
        if(!this.previouslyExecuted){
            for(const wipeable of this.wipeables){
                await wipeable.wipe();
            }
            return this.report('Wiped')
        }
        return this.report('Wipe Skipped')
    }
}

class executable {
    constructor(part = {}, data = executorData, id, options = {}, flags = {}){
        this.boundary = {},
        this._cancel = false,
        this.data = data,
        this._document = options.document,
        this._executed = false,
        this._modules = options.modules ? options.modules : [],
        this.icon = options.icon ? options.icon : 'fas fa-hryvnia',
        this._id = id,
        this.likelihoodResult = 100,
        this.name = options.title ? options.title : '',
        this._flags = flags,
        this._part = part,
        this.scope = options.scope,
        this.twinBoundary = {},
        this.wipeable = options.wipeable ? true : false
    }

    get delay(){
        return this._part.delay ? this._part.delay : 0
    }

    get dualBoundaries(){
        return Object.keys(this.twinBoundary).length ? [this.boundary, this.twinBoundary] : [this.boundary]
    }

    get has(){
        return (!Object.keys(this._part).length || this._modules.find(m => m.dependent === true && m.active === false)) ? false : true 
    }

    get hasBoundaryScope(){
        return this.scope === 'boundary' ? true : false
    }

    get hasSceneScope(){
        return this.scope === 'scene' ? true : false
    }

    get hasSourcing(){
        return this.source ? true : false
    }

    get hasTargeting(){
        return this.hasTokenScope
    }

    get hasTokenScope(){
        return this.scope === 'token' ? true : false
    }

    get hasTargets(){
        return this.targets.length ? true : false
    }

    get offset(){
        return this._part.offset
    }

    get likelihood(){
        return this._part.likelihood ? this._part.likelihood : 100
    }

    get likelihoodMet(){
        return this.likelihoodResult <= this.likelihood
    }

    get report(){
        return {"danger": this.name, "data": this, "executed": this._executed, "modules": this._modules}
    }

    get requiresSaveFail(){
        return this.save === 2 ? true : false
    }

    get requiresSaveSuccess(){
        return this.save === 1 ? true : false
    }

    get scale(){
        return this._part.scale ? this._part.scale : 1
    }

    get source(){
        return this._part.source ? this._part.source : ''
    }

    get sourcesSelected(){
        switch(this._part.target){
            case 'A':
                return this.data.sources;
            case 'R':
                return this.data.sourceAreas;
            default:
                return this.data.sourcesBlended
        }
    }
    
    get save(){
        return 0
    }

    get stoppable(){
        return this.stop ? true : false
    }

    get tag(){
        return this._part.tag ? this._part.tag : ''
    }

    get taggerTag(){
        return {"tags": [this.tag]}
    }
    
    get targets(){
        return this.zone.sourceTreatment(this.source, (this.save ? (this.save > 1 ? this.data.save.failed : this.data.save.succeeded) : this.data.targets), this.data.sources);
    }  

    get zone(){
        return this.data.zone
    }

    _setBoundary(){
        if(!this.offset){
            this.boundary = this.data.boundary;
            this.twinBoundary = this.data.twinBoundary
        } else {
            this.boundary = boundary.offsetBoundary(this.data.boundary, this.data.offset, this.offset, this.data.scene)
            if(this.data.danger.hasTwinBoundary) this.twinBoundary = boundary.offsetBoundary(this.data.twinBoundary, this.data.offset, this.offset, this.data.scene)
        }
       
    }

    async check(){
        await this.checkLikelihood()
        if(!this.likelihoodMet) this.informLikelihood();
    }
    
    async checkLikelihood() {
        if(this.likelihood < 100){
            const roll = await maybe();
            this.likelihoodResult = roll.result;
        }
    }

    flipContent(axis){
        if (typeof this.offset[axis].flip == "boolean") {
            return false
        }
        return ((this.offset[axis].flip === 'A' || (this.offset[axis].flip === 'N' && biRandom()) || (['B','S'].includes(this.offset[axis].flip) && this.data.offset[axis].flipLocation)) ? true : false)
    }

    informLikelihood(){
        console.log(`${this.name} likelihood of ${this.likelihood} was${this.likelihoodMet ? '' : ' not'} met with a roll of ${this.likelihoodResult}`)
    }

    async go(){
        await this.check()
        if(this.has && this.likelihoodMet) await this.play(); 
        return this.report
    }

    async play(){  
        this.setExecuted()
        if (this.hasBoundaryScope && !this.data.hasBoundary) {this._cancel = true} else {this._setBoundary()}
    }

    randomize(){
        return (!this.random || Math.random() < 0.5)
    }

    setExecuted(){
        this._executed = true
    }

    async wipe(){
        this.zone.wipe(this._document)
    }

    async wipeType(){
        this.zone.wipe(this._document, 'T')
    }
}

class executableWithFile extends executable{
    constructor(...args){
        super(...args),
        this._file
    }

    get filePath(){
        return this._part.file ? this._part.file : ''
    } 

    get has(){
        return (super.has && this.filePath) ? true : false
    }

    get randomFile(){
        return this._part.randomFile ? true : false
    }

    get file(){
        if(!this._file) return this._setFile();
        return this._file
    }

    async load() {
        this._file = await this.file;
        return (this._file && dangerZone.MODULES.sequencerOn) ? Sequencer.Preloader.preloadForClients(this._file) : true
    }

    async play(){
        if(!this._file) await this.file;
        await super.play()
    }

    async _setFile(){
        if(!this.filePath || !this.randomFile) return this._file = this.filePath;
        const files = await getFilesFromPattern(this.filePath);
        this._file = files[Math.floor(Math.random() * files.length)]
        return this._file
      }
}

class activeEffect extends executable {
    constructor(...args){
        super(...args),
        this._adds = [],
        this._deletes = [],
        this._updates = []
    }

    get delay(){
        return this.flag.delay ? this.flag.delay : 0
    }

    get delete(){
        return this.data.danger.effectDeleteEffects
    }

    get disable(){
        return this.data.danger.effectDisableEffects.filter(e => !this.enable.includes(e))
    }

    get enable(){
        return this.data.danger.effectEnableEffects
    }

    get toggle(){
        return this.data.danger.effectToggleEffects.filter(e => !this.enable.includes(e)).filter(e => !this.disable.includes(e))
    }

    get effect(){
        const obj = this._part
        if(obj.hasOwnProperty('label')) {
            obj.name = obj.label;
            delete obj.label;
          }
        return obj
    }

    get flag(){
        return this.hasFlag ? this.effect.flags[dangerZone.ID] : {}
    }

    get hasFlag(){
        return this.effect.flags?.[dangerZone.ID] ? true : false
    }

    get limit(){
        return this.flag.limit ? this.flag.limit : false
    }
    
    get save(){
        return this.data.danger.save.ae ? parseInt(this.data.danger.save.ae) : 0
    }

    _data(token, array, type){
        if(!token.actor) return []
        const effects = token.actor.effects.filter(e => array.includes(e.name))
        switch(type){  
            case 0: 
                return effects.map(e => e._id) 
            case 1:
                return effects.map(e => ({_id: e._id, disabled: false})) 
            case 2:
                return effects.map(e => ({_id: e._id, disabled: true})) 
            case 3:
                return effects.map(e => ({_id: e._id, disabled: e.disabled ? false : true})) 
        }
    }

    async _addEffects(token){
        if(this.limit && token.actor.effects.find(e => e.flags[dangerZone.ID]?.origin === this.data.danger.id)){
            return;
        }
        const add = await token.actor.createEmbeddedDocuments("ActiveEffect", [this.effect]);
        this._adds.push({token: token, data: add}) 
    }


    async _deleteEffects(token){
        const data = this._data(token, this.delete, 0)
        if(data.length) await token.actor.deleteEmbeddedDocuments("ActiveEffect", data);
        this._deletes.push({token: token, data: data})  
    }

    async _updateEffects(token){
        let data = [];
        data = data.concat(this._data(token, this.enable, 1))
        data = data.concat(this._data(token, this.disable, 2))
        data = data.concat(this._data(token, this.toggle, 3))
        if(data.length) await token.actor.updateEmbeddedDocuments("ActiveEffect", data);
        this._updates.push({token: token, data: data})  
    }

    async play(){  
        await super.play() 
        if(this._cancel) return                 
        for (const token of this.targets) {
            if(!token.actor) continue
            await this._updateEffects(token)
            await this._deleteEffects(token)     
            await this._addEffects(token)                
        }
    }
}

class ambientLight extends executable{
    constructor(...args){
        super(...args),
        this.lights = []
    }

    get angle(){
        return this._part.angle
    }

    get attenuation(){
        return this._part.attenuation
    }

    get bright(){
        return this._part.bright
    }

    get coloration(){
        return this._part.coloration
    }

    get contrast(){
        return this._part.contrast
    }

    get darkness(){
        return this._part.darkness
    }

    get dim(){
        return this._part.dim
    }

    get flag(){
        const flg = foundry.utils.mergeObject({}, this.data.flag)
        return flg
    }

    get lightAnimation(){
        return this._part.lightAnimation
    }

    get luminosity(){
        return this._part.luminosity
    }

    get negative(){
        return (this.luminosity < 0 || this._part.negative ? true : false)
    }

    get rotation(){
        return this._part.rotation
    }

    get saturation(){
        return this._part.saturation
    }

    get shadows(){
        return this._part.shadows
    }

    get tag(){
        return this._part.tag
    }

    get tintAlpha(){
        return  this._part.tintAlpha//Math.pow(this._part.tintAlpha, 2).toNearest(0.01)
    }

    get tintColor(){
        return this._part.tintColor
    }

    get walls(){
        return this._part.walls ? true : false
    }

    get has(){
        return (super.has && (this.dim || this.bright)) ? true : false
    }  

    get _light() {
        const light = {
            config: {
                alpha: this.tintAlpha,
                angle: this.angle,
                animation: {
                    reverse: this.lightAnimation.reverse,
                    speed: this.lightAnimation.speed,
                    intensity: this.lightAnimation.intensity,
                    type: this.lightAnimation.type
                },
                attenuation: this.attenuation ? this.attenuation : (this._part.gradual ? 0.5 : 0.0),
                bright: this.bright,
                color: this.tintColor,
                coloration: this.coloration,
                contrast: this.contrast,
                darkness: this.darkness,
                dim: this.dim,
                luminosity: this.luminosity,
                negative: this.negative,
                priority: 0,
                saturation: this.saturation,
                shadows: this.shadows
            },   
            elevation: this.boundary.bottomToElevation,            
            hidden: false,
            rotation: this._flipRotation(),
            vision: false,
            walls: true,
            x: this.boundary.center.x,
            y: this.boundary.center.y,
            walls: this.walls,
            flags: this.flag
        }
        if(dangerZone.MODULES.taggerOn && this.tag) light.flags['tagger'] = this.taggerTag
        return light
    }
    
    async play(){
        await super.play()
        if(this._cancel) return
        this.lights = await this.data.scene.createEmbeddedDocuments("AmbientLight",[this._light]);
        if(this._part.clear.type) this._postEvent() 
        if(this._part.clear.type !== 'D') await this.data.fillSourceAreas()
    }

    _flipRotation(){
        const xFlip = this.flipContent('x');
        const yFlip = this.flipContent('y');
        let flipAmt = 0
        if(xFlip){
            if(yFlip) {flipAmt = this.offset.x.adj + this.offset.y.adj} else {flipAmt = this.offset.x.adj}
        } else if(yFlip) {flipAmt = this.offset.y.adj}
        let ang = this.rotation + flipAmt;
        if(ang < 0){ang = 360 + ang} 
        else if (ang >= 360) {ang = 360 - ang}
        return ang
    }

    async _postEvent(){
        if(this._part.clear.delay) await wait(this._part.clear.delay);
        switch(this._part.clear.type){
            case 'O':
                const updates = this.lights.filter(l => this.data.scene.lights.find(lt => lt.id === l.id)).map((data) => ({
                    _id: data.id,
                    hidden: true,
                  }));
                this.data.scene.updateEmbeddedDocuments("AmbientLight", updates);
                break;
            case 'D':
                await this.data.scene.deleteEmbeddedDocuments("AmbientLight",this.lights.filter(l => this.data.scene.lights.find(lt => lt.id === l.id)).map(l => l.id))
                break;
        }
        
    }
}   

class audio extends executableWithFile {
    constructor(...args){
        super(...args);
        this.sound 
    }

    get duration(){
        return this._part.duration
    } 

    get volume(){
        return this._part.volume ? this._part.volume : 0.5
    } 

    async play() {
        await super.play()
        if(this._cancel) return
        this.sound = await foundry.audio.AudioHelper.play({src: this.file, volume: this.volume, loop: false, autoplay: true}, true)
        this._schedule();
    }

    async _schedule(){
        if(this.duration){
            await wait(this.duration)
            await this.stop();            
        }
    }

    async stop(){
        if(this.sound?.id){
            game.socket.emit('module.danger-zone', {stop: this.sound.id})
            dangerZone.log(false, 'Stopping sound...', this.sound)
            await this.sound.fade(0, {duration: 250})
            this.sound.stop();
            dangerZone.log(false, 'Stopped sound...', this.sound)
        }  
    }

    async _setFile(){
        if(!this.filePath || !this.randomFile) return this._file = this.filePath;
        const playlist = game.playlists.getName(this.filePath);
        if(!playlist) {
            this._file = ''
        } else {
            const index = Math.floor(Math.random() * playlist.sounds.size)
            let i = 0; 
            for (let key of playlist.sounds) {
                if (i++ == index) {this._file = key?.path; break;}  
            }
        }
        return this._file
    }
}

class combat extends executable {
    constructor(...args){
        super(...args);
        this._combat,
        this.initiativeTargets = []
    }

    get addSource(){
        return this._part.source.add
    }

    get addTargets(){
        return this._part.targets.add
    }
    
    get combat(){
        return this._combat ?? game.combats.find(c => c.scene?.id === this.data.sceneId && c.active) ?? game.combats.find(c => c.isActive)
    }

    get has(){
        return (super.has && this.data.danger.hasCombat) ? true : false
    }

    get initiative(){
        return this._part.initiative.type
    }

    get initiativePlayer(){
        return this._part.initiative.player ?? false
    }

    get initiativeValue(){
        return this._part.initiative.value ?? 0
    }

    get newCombat(){
        return this._part.new ?? false
    }

    get spawn(){
        return this._part.spawn 
    }
    
    get start(){
        return this._part.start 
    }

    _checkActiveCombat(){
        if(!this.newCombat && !this.combat) {
            ui.notifications?.error(game.i18n.localize("DANGERZONE.alerts.no-active-combat"))
            this._cancel = true
        }
    }
    
    async play(){    
        await super.play()
        this._checkActiveCombat()
        if(this._cancel) return
        if(this.newCombat) await this._newCombat()
        this._setTargets()
        if(this.initiativeTargets.length) await this._addToCombat()
        if(this.initiative === 'R') {await this._rollInitiative()} else if(this.initiative ==='S'){await this._setInitiative()}
        if(this.start & !this.combat.started) await this.combat.startCombat()
    }

    async _addToCombat(){
        for(const token of this.initiativeTargets){if(!this._tokenCombatant(token)) await token.toggleCombatant(this.combat)}
    }

    async _newCombat(){
        this._combat = await Combat.create({scene: this.data.sceneId})
        await this._combat.activate()
    }

    _tokenCombatant(token){
        return this.combat.combatants.find(c => c.token.id === token.id) 
    }

    _setTargets(){
        if(this.addTargets) this.initiativeTargets = this.targets
        if(this.addSource && this.data.hasSources) this.initiativeTargets = this.initiativeTargets.concat(this.data.sources.filter(s => !this.initiativeTargets.find(t => t.id === s.id)))
        if(dangerZone.MODULES.portalOn && this.spawn){
            for(const token of this.data.spawn.tokens){
                if(!this.initiativeTargets.find(t => t.id === token.id)) this.initiativeTargets.push(this.data.sceneTokens.get(token.id))
            }
        }
    }

    async _rollInitiative(){
        const rollIds = []
        for(const token of this.initiativeTargets){
            if(!this.initiativePlayer && getActorOwner(token)) continue
            const combatantId = this._tokenCombatant(token)?.id
            if(combatantId) rollIds.push(combatantId) 
        }
        if (rollIds.length) await this.combat.rollInitiative(rollIds, {updateTurn: false})
    }
    
    async _setInitiative(){
        for(const token of this.initiativeTargets){
            if(!this.initiativePlayer && getActorOwner(token)) continue
            if(this._tokenCombatant(token)?.id) await this.combat.setInitiative(this._tokenCombatant(token).id, this.initiativeValue)
        }
    }

}

class damageToken extends executable{
    constructor(...args){
        super(...args),
        this._apply = game.settings.get('danger-zone', 'apply-damage') ?? false,
        this._chatMessageResults = '',
        this._gmChatMessageResults = '',
        this._gmDamageCount = 0,
        this._damageResults = []
    }

    get damages(){
        const arr = [];
        if(this.primaryDamage.amount && this.primaryDamage.type) arr.push(this.primaryDamage)
        if(this.secondaryDamage.amount && this.secondaryDamage.type) arr.push(this.secondaryDamage)
        return arr
    }
    
    get damageRoll(){
        return CONFIG.Dice.DamageRoll
    }

    get enable(){
        return this._part.enable
    } 

    get flavor(){
        return this._part.flavor ? this._part.flavor.replace(/@alias/i,this.targetNames) : ''
    } 

    get flavorIsIndividual(){
        return (this.flavor.indexOf('@elevation')!==-1 || this.flavor.indexOf('@moved')!==-1) ? true : false
    }

    get has(){
        return (super.has && this.enable && this._part.amount) ? true : false
    }

    get hasSaves(){
        return (this.data.danger.save.enable && this.damages.find(d => ['N', 'H'].includes(d.save))) ? true : false
    }

    get isBulk(){
        return (this.primaryDamage.amount.indexOf('@')!==-1 || this.secondaryDamage.amount.indexOf('@')!==-1 || this.flavor.indexOf('@elevation')!==-1 || this.flavor.indexOf('@moved')!==-1) ? false : true
    }

    get primaryDamage(){
        return {
            amount: this._part.amount ?? '',
            save: this._part.save ?? '',
            type: this._part.type ?? '',
        }
    }

    get requiresSaveFail(){
        return (this.primaryDamage.save === "N" || this.secondaryDamage.save ==='N') ? false : true
    }

    get requiresSaveSuccess(){
        return (this.primaryDamage.save === "H" || this.secondaryDamage.save ==='H') ? true : false
    }

    get secondaryDamage(){
        return {
            amount: this._part.secondary?.amount ?? '',
            save: this._part.secondary?.save ?? '',
            type: this._part.secondary?.type ?? ''
        }
    } 
    
    get targets(){
        return this.data.zone.sourceTreatment(this.source, this.data.targets, this.data.sources);
    }

    get targetNames(){
        return joinWithAnd(this.targets.map(t => t.name))
    }
    
    get type(){
        return this._part.type
    } 

    async play(){    
        await super.play()
        if(this._cancel) return
        this.isBulk ? await this._bulkWorkflow() : await this._individualWorkflow()
        if(this._damageResults.length) this._messageDamage()
    }

    async _applyDamage(options){
        if(!options.targets.length) return
        
        const damages = dnd5e.dice.aggregateDamageRolls(options.damageRolls, {respectProperties: true}).map(roll => ({
            value: roll.total,
            type: roll.options.type
        }));

        const message = await ChatMessage.create(
            {flavor: options.flavor, type: CONST.CHAT_MESSAGE_STYLES.OOC, rolls: options.damageRolls, emote:false, flags: {
                dnd5e: { targets: options.targets.map(target => ({
                    name: target.name,
                    img: target.texture.src,
                    uuid: target.actor.uuid,
                    ac: target.actor.system.attributes.ac.value
             }))
            }
            }
        })

        for(const token of options.targets){
            if(this._apply) await token.actor.applyDamage(damages, {multiplier: 1, invertHealing: true, ignore: false}); 
            this._damageResults.push({token: token, flavor: options.flavor, name: token.name, damages: damages} )    
        }
    }

    async _bulkWorkflow(){
        let success = [], remainder = [];
        if(this.data.hasSuccesses && this.hasSaves){
            success = this.data.save.succeeded
            remainder = this.data.save.failed
        } else {
            remainder = this.targets
        }

        const damageRolls = [], successDamageRolls = []
        for (const damage of this.damages){
            if(remainder.length){
                const damageRoll = await new this.damageRoll(damage.amount, {}, {type: damage.type}).evaluate();     
                damageRolls.push(damageRoll)
            }
            if(success.length){
                const successDamageRoll =  damage.save ==='N' ? await new this.damageRoll('0', {}, {type: damage.type}).evaluate() : await new this.damageRoll(`floor((${damage.amount})/2)`, {}, {type: damage.type}).evaluate();     
                successDamageRolls.push(successDamageRoll)
            }
        }

        if(remainder.length) await this._applyDamage({targets:remainder, damageRolls: damageRolls, flavor: this.flavor})
        if(success.length) await this._applyDamage({targets:success, damageRolls: successDamageRolls, flavor: this.flavor})
    }

    async _individualWorkflow(){
        for (const token of this.targets){
            const damageRolls = []
            //handle movement and elevation paramters
            const mvMods = this.data.tokenMovement.find(t => t.tokenId === token.id);
            const e = mvMods?.e ? mvMods.e : 0; const mv = Math.max((mvMods?.hz ? mvMods.hz : 0), (mvMods?.v ? mvMods.v : 0));
            
            for (const damage of this.damages){
                if(this.hasSaves && damage.save ==='N' && this.data.save.succeeded.find(t => t.id === token.id)) {
                    damageRolls.push(await new this.damageRoll('0', {}, {type: damage.type}).evaluate())
                    continue;
                }
               
                let dice = damage.amount.replace(/@elevation/i,e).replace(/@moved/i,mv);

                //apply half damage
                if(this.hasSaves && damage.save === 'H' && this.data.save.succeeded.find(t => t.id === token.id)) dice = `floor((${dice})/2)`
                const damageRoll = await new this.damageRoll(dice, {}, {type: damage.type}).evaluate();     
                damageRolls.push(damageRoll)
            }
            await this._applyDamage({targets:[token], damageRolls: damageRolls, flavor: this.flavor.replace(/@elevation/i,e).replace(/@moved/i,mv)})
        }
    }

    async _messageDamage(){
        for(const damage of this._damageResults){
            let text = '', 
                hasSecondary = damage.damages.length > 1 ? true : false, 
                primary= damage.damages[0], 
                secondary = damage.damages[1], 
                primSaveMessage = '',
                secSaveMessage = '';
            const flavor = (this.flavorIsIndividual && damage.flavor) ? damage.flavor + '. ' : ''

            if(this.hasSaves){
                primSaveMessage += this._saveResult(this.primaryDamage, damage)
                secSaveMessage += this._saveResult(this.secondaryDamage, damage)
            }

            text += `<div>${flavor}${damage.name} damaged for `

            if(hasSecondary){
                text += `<span class="danger-zone-label">${primary.value}</span> ${primary.type}${primSaveMessage} and <span class="danger-zone-label">${secondary.value}</span> ${secondary.type}${secSaveMessage}`
            } else {
                text += `<span class="danger-zone-label">${primary.value}</span> ${primary.type}${primSaveMessage}`
            }
            text += `.<br><hr></div>`
            if(getActorOwner(damage.token)) {
                this._chatMessageResults += text
            } else {
                this._gmDamageCount = ++this._gmDamageCount
                this._gmChatMessageResults += text
            } 
        }

        if(this._chatMessageResults || this._gmDamageCount){
        ChatMessage.create({
            content: `<div class="danger-zone-chat-message-title">${(this.flavorIsIndividual || !this.flavor) ?  'Damage Results' : this.flavor}</div><div class="danger-zone-chat-message-body">${this._chatMessageResults}` + (this._gmDamageCount ? `<div>GM applied damage to ${this._gmDamageCount} other tokens.</div>` : '') + '</div>'
            })
        }
        if(this._gmChatMessageResults){
            ChatMessage.create({
                content: `<div class="danger-zone-chat-message-title"><i class="fas fa-radiation"></i> GM Applied Damage</div><div class="danger-zone-chat-message-body">${this._gmChatMessageResults}</div>`,
                whisper: ChatMessage.getWhisperRecipients("GM") 
            })
        }
    }

    _saveResult(damageData, damageResults){
        if(this.data.save.succeeded.find(t => t.id === damageResults.token.id)){
            switch(damageData.save){
                case 'F': 
                    return ' (full damage on save)'
                case 'H': 
                    return ' (half damage on save)'
                default:
                    return ' (no damage on save)' 
            }
        } else {
            return ' (failed save)'
        }
    }
}

class flavor extends executable{

    get delay(){
        return -1
    }

    get flavor(){
        return this._part
    }
    
    get has(){
        return (this.flavor && !this.data.previouslyExecuted) ? true : false
    }

    async play(){
        await super.play()
        if(this._cancel) return
        ChatMessage.create({content : `<div class="danger-zone-chat-message-body-black">${this.flavor}</div>`})
    }

}

class Canvas extends executable{
    
    get duration(){
        return !this._part.effect.duration ? 1 : this._part.effect.duration
    }

    get has(){
        return (super.has && (this.type || this.pan.active)) ? true : false
    }

    get intensity(){
        return !this._part.effect.intensity ? 1 : this._part.effect.intensity
    }

    get iteration(){
        return !this._part.effect.iteration ? 1 : this._part.effect.iteration 
    }

    get pan(){
        return this._part.pan ?? {}
    }
    
    get type(){
        return this._part.effect.type
    }

    async play(){
        await super.play()
        if(this._cancel) return
        if(dangerZone.MODULES.sequencerOn && (this.type === 'shake' || this.pan.active)){
            let s = new Sequence().canvasPan()
            if(this.pan.active){
                s = s.atLocation(this.boundary.center)
                    if(this.pan.speed) s = s.speed(this.pan.speed) 
                    if(this.pan.scale) s = s.scale(this.pan.scale)
                    if(this.pan.lock) s = s.lockView(this.pan.lock) 
            }
            if(this.type ==='shake')
                s = s.shake({
                            duration: this.duration,
                            strength: this.intensity,
                            frequency: this.iteration
                        })
            return s.play()
        }
    }
}

class item extends executable {
    constructor(...args){
        super(...args);
        this.items = [],
        this.compendium
    }

    get action(){
        return this._part.action ? this._part.action : ''
    }

    get compendiumName(){
        return this._part.compendiumName ? this._part.compendiumName : ''
    }

    get has(){
        return (!this.itemNames.length || !super.has) ? false : true 
    }

    get hasUpdates(){
        return this._part.updates ? true : false
    }

    get pile(){
        return this._part.pile ? true : false
    } 

    get itemNames(){
        return this._part.name
    }

    get source(){
        return this._part.source
    } 

    get save(){
        return this.data.danger.save.it ? parseInt(this.data.danger.save.it) : super.save
    }

    async getCompendium(){
        this.compendium = await game.packs.find(p=>p.collection === this.compendiumName)?.getDocuments();
        if(!this.compendium) dangerZone.log(false, 'Compendium Not Found ', this)
    }

    getItems(){
        for(const item of this.itemNames){
            let found;
            if(this.compendium) found = this.compendium.find(i => i.name === item)
            if(!found) found = game.items.getName(item)
            found ? this.items.push(found) : console.log(`Item ${item} not found ${this.compendium ? 'in provided compendium.' : 'in world.'}`) 
        }
    }

    async play(){    
        await super.play()  
        if(this._cancel) return
        if(!['D','E'].includes(this.action)){
            if(this.compendiumName) await this.getCompendium() 
            this.getItems()
            if(!this.items.length) return 
        }
        if(this.pile && dangerZone.MODULES.itemPileOn) {
            const pilePos = canvas.grid.getTopLeftPoint({x:this.boundary.center.x, y:this.boundary.center.y})
            await ItemPiles.API.createItemPile({position: {x: pilePos.x, y: pilePos.y}, sceneId: this.data.scene.id, items: this.items, pileActorName: false})
            return
        }
        for (const token of this.targets) { 
            if(!token.actor) continue
            let crtdItms = []
            if(this.action === 'A'){
                crtdItms = await token.actor.createEmbeddedDocuments('Item', this.items)
                if(this.hasUpdates) await this.updateTokenItem(token, crtdItms)
            } else if(this.action === 'B'){
                const notOn = this.items.filter(t => !token.actor.items.find(i=> i.name === t.name))
                if(!notOn.length) return
                crtdItms = await token.actor.createEmbeddedDocuments('Item', notOn)
                if(this.hasUpdates) await this.updateTokenItem(token, crtdItms)
            } else if(this.action === 'D' || this.action === 'E'){
                let del = []
                if(this.action === 'E') {
                    del = token.actor.items.filter(i => this.itemNames.includes(i.name))
                 } else{
                    for(const item of this.itemNames){
                        let j = token.actor.items.find(i => i.name === item)
                        if(j) del.push(j)
                    }
                 }
                if(del.length) await token.actor.deleteEmbeddedDocuments('Item', del.map(i => i.id))
            } else {
                const itms = token.actor.items.filter(i => this.itemNames.includes(i.name))
                if(itms.length) await this.updateTokenItem(token, itms)
            }
        }
    }
    
    updates(item){
        const updates = this._part.updates ? stringToObj(this._part.updates, {document:item}) : {}
        const update = updates[item.name]
        if(update && this.tag) update['flags'] = {"tagger": this.taggerTag}
        return update
    }

    async updateTokenItem(token, arr){
        const toUpdate = arr.map(i => ({_id: i.id, ...this.updates(i)})).filter(i => Object.keys(i).length > 1)
        await token.actor.updateEmbeddedDocuments('Item', toUpdate);
    }
}

class lastingEffect extends executableWithFile{
    constructor(...args){
        super(...args);
        this._tiles = []
    }

    get alpha(){
        return this._part.alpha
    }

    get flags(){
        return this._flags ? this._flags : {}
    }

    get hidden(){
        return this._part.hidden
    }

    get loop(){
        return this._part.loop
    }

    get occlusion(){
        return this._part.occlusion
    }

    get restrictions(){
        return {
            light: this._part.roof ? this._part.roof : this._part.restrictions.light,
            weather: this._part.roof ? this._part.roof : this._part.restrictions.weather
        }
    }

    get save(){
        return this.data.danger.save.le ? parseInt(this.data.danger.save.le) : super.save
    }

    get z(){
        return this._part.z
    }

    build(){
        this._tiles.push(this._tile())
    }

    async play(){
        await super.play()
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            this.build();
            await this.data.scene.createEmbeddedDocuments("Tile", this._tiles);
        }
        await this.data.fillSourceAreas()
    }

    _tile(){
        const tile = {
            alpha: this.alpha,
            elevation: this.boundary.bottomToElevation, 
            flags: this.data.flag,
            hidden: this.hidden,
            locked: false,
            height: this.boundary.height,
            occlusion: {
                alpha: this.occlusion.alpha,
                mode: CONST.TILE_OCCLUSION_MODES[this.occlusion.mode] 
            },
            restrictions: this.restrictions,
            sort: this.z,
            texture: {
                rotation: 0,
                src: this._file,
                scaleX: this.flipContent('x') ? this.scale * -1 : this.scale,
                scaleY: this.flipContent('y') ? this.scale * -1 : this.scale
            },
            width: this.boundary.width,
            video: {autoplay: true, loop: this.loop, volume: 0},
            x: this.boundary.A.x,
            y: this.boundary.A.y
        };
        if(dangerZone.MODULES.taggerOn && this.tag) tile.flags['tagger'] = this.taggerTag
        
        return tile
    } 
}

class macro extends executable{

    get macroId(){
        return this._part
    }
    
    get has(){
        return this.macroId ? true : false
    }

    get macro(){
        return this.macroId ? game.macros.get(this.macroId) : false
    }

    async play(){
        await super.play()
        if(this._cancel) return
        await this.macro.execute(this.data);
    }
}

class mutate extends executable {

    constructor(...args){
        super(...args),
        this._tokenUpdates = [],
        this._actorUpdates = []
    }

    get embedded(){
        return this.hasEmbedded ? stringToObj(this._part.embedded) : {}
    }

    get hasActor(){
        return this._part.actor ? true : false
    }

    //get hasEmbedded(){
    //    return this._part.embedded ? true : false
    //}

    get hasToken(){
        return this._part.token ? true : false
    }

    get options(){
        return this.permanent ? {permanent: this.permanent} : {}
    }
    
    get permanent(){
        return this._part.permanent
    } 

    get save(){
        return this.data.danger.save.mt ? parseInt(this.data.danger.save.mt) : super.save
    }

    get targets(){
        return this.data.spawn.mutate ? this.data.sceneTokens.filter(t => this.data.spawn.tokens.find(s => s.id === t.id)) : super.targets
    }

    actor(token){
        const actor = stringToObj(this._part.actor, {document: token.actor})
        actor['_id'] = token.actorId
        this._actorUpdates.push(actor)
        return actor
    }

    token(token){
        const tok = stringToObj(this._part.token, {document: token})
        if(this.tag) tok['flags'] = {"tagger":this.taggerTag}
        tok['_id'] = token.id
        this._tokenUpdates.push(tok)
    }

    async updates(token){
        const obj = token.toJSON()
        if(this.hasToken) this.token(token)
        if(this.hasActor && token.actor) {
            const actorUpdate = this.actor(token)
            await token.updateEmbeddedDocuments("Actor", [actorUpdate])
        }
        //if(this.hasEmbedded) Object.assign(obj.delta, {delta: this.embedded}) //removed for v12 with loss of Warpgate
        return obj
    }

    async play(){    
        await super.play()  
        if(!this.permanent) this._cancel = true
        if(this._cancel) return          
        for (const token of this.targets) { 
            if(!token.actorLink) await this.updates(token);
        }
        await this.data.scene.updateEmbeddedDocuments("Token", this._tokenUpdates)
        await this.data.fillSources()
    }
}

class primaryEffect extends executableWithFile {
       
    _partSources = []

    get hasSourcing(){
        return this.source.enabled ? true : false
    }

    get repeat(){
        return this._part.repeat
    }

    get duration(){
        return this._part.duration
    }

    get hasSources(){
        return (this.source.enabled && (this.source.name || this.sourcesSelected.length))
    }
    
    get hasSourceToTarget(){
        return this.source.enabled
    }

    get hasTargeting(){
        return (super.hasTargeting || this.hasSourceToTarget) ? true : false
    }

    get save(){
        return this.data.danger.save.fe ? parseInt(this.data.danger.save.fe) : super.save
    }

    async play(){
        await super.play()
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const result = await this._build();
            if(result.play) result.sequence.play();
        }
    }
    
    async _build(){
        let s = new Sequence(), play = true;
        const boundaries = this.data.twinDanger ? this.data.dualBoundaries : [this.boundary]
        for (const bound of boundaries){
            if(this.hasSources || this.hasSourcing){
                if(this.source.name) {
                    const taggerEntities = await getTagEntities(this.source.name, this.data.scene)
                    this._partSources = limitArray(shuffleArray(taggerEntities),this.data.sourceLimit)
                 } else {
                    this._partSources = this.sourcesSelected
                 } 
                if(this._partSources.length){
                    for(const document of this._partSources){
                        const documentName = document.documentName ? document.documentName : document.document.documentName;
                        const source = boundary.documentBoundary(documentName, document, {retain:true});
                        if(source.A.x === bound.A.x && source.A.y === bound.A.y && source.B.x === bound.B.x && source.B.y === bound.B.y){continue}
                        s = this.source.swap ? await this._sequence(source, s, bound) : await this._sequence(bound, s, source);
                    }
                } else {
                    play = false
                }
            } else {
                s = this._sequence(bound, s);
            }
        }
        return {sequence: s, play: play}
    }

    _sequence(boundary, s, source = {}){
        s = s.effect()
            .file(this._file)
            .zIndex(boundary.topToElevation)
            .mirrorX(this.flipContent('x'))
            .mirrorY(this.flipContent('y'))
            if(source.center){
                s = s.atLocation(source.center)
                    .stretchTo(boundary.center)
                    .template({gridSize: this.scale * 200, startPoint: this.scale * 200, endPoint: this.scale * 200});
                    if(this.duration) s = s.waitUntilFinished(this.duration)
            } else {
                s = s.atLocation(boundary.center)
                    .scale(this.scale)
                    if(this.duration) s = s.duration(this.duration)
            }
            if(this.repeat) s = s.repeats(this.repeat)
        return s
    }
}

class region extends executable{
    constructor(...args){
        super(...args);
        this._boundaries = [],
        this._data = [],
        this._regions = []
    }

    get color(){
        return this._part.color ?? ''
    }

    get flags(){
        return this._flags ?? {}
    }

    get has(){
        return (super.has && this.data.danger.hasRegion) ? true : false
    }

    get hole(){
        return this._part.hole ?? false
    }

    get macro(){
        return this._part.behavior.macro?.uuid ? this._part.behavior.macro : false
    }

    get pause(){
        return this._part.behavior.pause?.enable ? this._part.behavior.pause : false
    }

    get regionName(){
        return this._part.name.length ? this._part.name  : this.data.danger.name
    }

    get scale(){
        return this._part.scale ?? 1
    }

    get script(){
        return this._part.behavior.script?.source ? this._part.behavior.script : false
    }

    get suppressWeather(){
        return this._part.behavior.suppressWeather?.enable ? this._part.behavior.suppressWeather : false
    }

    get teleport(){
        return this._part.behavior.teleport.enable ? this._part.behavior.teleport : false
    }

    get type(){
        return this._part.type ?? 'rectangle'
    }

    get visibility(){
        return CONST.REGION_VISIBILITY[this._part.visibility] ?? 0
    }

    async _addBehaviors(){
        for(let i = 0; i < this._regions.length; i++){
            let data = this._buildBehaviors(this._regions[i])
            if (data.length) await this._regions[i].createEmbeddedDocuments("RegionBehavior", data)
        }
    }

    build(){
        this._boundaries = this.data.twinDanger ? this.dualBoundaries : [this.boundary]
        for(let i = 0; i < this._boundaries.length; i++){
            this._data.push(this._region(this._boundaries[i], i))
        }
    }

    _buildBehaviors(region){
        const behaviors = []
        const isTwin = region.flags?.[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.istwin
        if(this.teleport && (!isTwin || this.teleport.twin)) behaviors.push(this._buildTeleport(region))
        if(isTwin) return behaviors
        if(this.macro) behaviors.push(this._buildMacro())
        if(this.pause) behaviors.push(this._buildPauseGame())
        if(this.script) behaviors.push(this._buildScript())
        if(this.suppressWeather) behaviors.push(this._buildSuppressWeather())
        return behaviors
    }

    _buildMacro(){
        return {
            disabled: false,
            flags: this.data.flag,
            name: `${this.regionName} Macro`,
            system: {
                events: this.macro.events,
                everyone: this.macro.everyone,
                uuid: this.macro.uuid
            },
            type: "executeMacro"
        } 
    }
    
    _buildPauseGame(){
        return {
            disabled: false,
            flags: this.data.flag,
            name: `${this.regionName} Pause Game`,
            system: {
                once: this.pause.once
            },
            type: "pauseGame"
        } 
    }

    _buildScript(){
        return {
            disabled: false,
            flags: this.data.flag,
            name: `${this.regionName} Script`,
            system: {
                events: this.script.events,
                source: this.script.source
            },
            type: "executeScript"
        } 
    }

    _buildShape(boundary){
        return Object.assign( {
            type: this.type,
            hole: this.hole,
            rotation: 0,
            x: boundary.A.x,
            y: boundary.A.y
        }, this.type ==='rectangle' ? 
            {x: boundary.A.x, y: boundary.A.y, width: boundary.width, height: boundary.height} : 
            {x: boundary.center.x, y: boundary.center.y, radiusX: boundary.width/2, radiusY: boundary.height/2})
    }

    _buildSuppressWeather(){
        return {
            disabled: false,
            flags: this.data.flag,
            name: `${this.regionName} Suppress Weather`,
            type: "suppressWeather"
        } 
    }

    _buildTeleport(region){
        return {
            disabled: false,
            flags: this.data.flag,
            name: this.teleport.name ?? `${this.regionName} Teleport`,
            system: {
                choice: this.teleport.choice,
                destination: this._regions.find(r => r.id !== region.id)?.uuid
            },
            type: "teleportToken"
        } 
    }

    async play(){
        await super.play()
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            this.build();
            this._regions = await this.data.scene.createEmbeddedDocuments("Region", this._data);
            await this._addBehaviors()
        }
        await this.data.fillSourceAreas()
    }

    _pairedBoundary(index){
        if(!this.data.hasDualBoundaries) return this.boundary
        if(index % 2 && this.dualBoundaries.length >= index) return this.dualBoundaries[index-1]
        if(this.dualBoundaries.length >= index+1) return this.dualBoundaries[index+1]
        return this.dualBoundaries[index]
    }

    _region(boundary, index){
        let shape = this._buildShape(boundary);
        const rg = {
            color: this.color,
            elevation: {bottom: boundary.bottom, top: boundary.top}, 
            flags: this.data.flag,
            name: this.regionName,
            shapes: [shape],
            visibility: this.visibility
        };
        if(dangerZone.MODULES.taggerOn && this.tag) rg.flags['tagger'] = this.taggerTag
        if(index) {
            rg.flags[dangerZone.ID][dangerZone.FLAGS.SCENETILE].istwin = true
        } else {
            this.data.regionData.shapes.push(shape)
        }
        return rg
    } 
}

class rolltable extends executable {

    constructor(...args){
        super(...args);
        this._message,
        this._pack = undefined,
        this._rolledResult = undefined,
        this._table = undefined
        ;
    }

    get options(){
        return {
            rollMode: this.whisper ? 'gmroll' : 'publicroll' 
        }
    }

    get has(){
        return (super.has && this.rolltable) ? true : false
    }

    get rolltable(){
        return this._part.name
    }

    get whisper(){
        return this._part.whisper
    }

    async play(){
        await super.play()
        if(this._cancel) return
        await this.build()
        await this.rollMessage()
    }

    async build(){
        this._table = game.tables.getName(this.rolltable)
        if(!this._table) dangerZone.log(false, 'No Rolltable Found ', {rollTable: this})
    }

    async rollMessage(){
        if(this._table) {
            if(!this._table.replacement && !this._table.results?.find(r => !r.drawn)) return console.log(`Rollable table ${this.rolltable} has all results drawn.`)
            this._rolledResult = await this._table.draw(this.options)
            this._message = this._rolledResult?.results[0]?.description
            Hooks.call("updateRollTable", this._rolledResult)
        }
    }
}

class save extends executable{
    constructor(...args){
        super(...args),
        this._chatMessageResults = '',
        this._gmChatMessageResults = '',
        this._gmRollCount = 0,
        this._saving = [],
        this._saveResults = [],
        this._playerPrompted = []
    }

    get delay(){
        return -1
    }

    get diff(){
        return this._part.diff
    }

    get enable(){
        return this._part.enable
    }

    get failed(){
        return this.data.save.failed
    }

    get has(){
        return (super.has && this.enable) ? true : false
    }
    get timeAlloted(){
        return game.settings.get('danger-zone', 'saving-throw-delay') * 1000
    }

    get type(){
        return this._part.type
    }

    get succeeded(){
        return this.data.save.succeeded
    }

    async _applySave(){
        let gmSaveCount = 0
        for(const token of this.targets){ 
            if(token.actor) this._saving.push(this._rollAbilitySave(token))  
        } 
        if(this._playerPrompted.length){
            ChatMessage.create({
                content: `<div class="danger-zone-chat-message-title"><i class="fas fa-radiation"></i> Danger Zone Saving Throw Prompted</div><div class="danger-zone-chat-message-body">${joinWithAnd(this._playerPrompted)} ${this._playerPrompted.length > 1 ? 'have' : 'has'} been prompted to make a DC${this.diff} ${game.dnd5e.config.abilities[this.type]} saving throw.</div><div class="danger-zone-chat-message-footer">They have ${this.timeAlloted} seconds to respond.</div>`,
                whisper: ChatMessage.getWhisperRecipients("GM") 
            })
        }
        this._saveResults = await Promise.all(this._saving).then((r) => {return {success: true, result: r}}).catch((e) => {return {success: false, result: e}})
    }

    _initialize(){
        this.data["save"] = {failed: [], succeeded: []}
    }

    async _messageSave(){
        if(this._chatMessageResults || this._gmRollCount){
        ChatMessage.create({
            content: `<div class="danger-zone-chat-message-title">Saving Throw Results</div><div class="danger-zone-chat-message-body">${this._chatMessageResults}` + (this._gmRollCount ? `<div>The GM rolled ${this._gmRollCount} saving throws.</div>` : '') + '</div>'
            })
        }
        if(this._gmChatMessageResults){
            ChatMessage.create({
                content: `<div class="danger-zone-chat-message-title"><i class="fas fa-radiation"></i> GM Rolled Saving Throws</div><div class="danger-zone-chat-message-body">${this._gmChatMessageResults}</div>`,
                whisper: ChatMessage.getWhisperRecipients("GM") 
            })
        }
    }

    async play(){
        await super.play()
        if(this._cancel) return
        this._initialize()
        await this._applySave()
        this._messageSave()
    }

    async _rollAbilitySave(token){
        let result, roll;
        const owner = getActorOwner(token), fastforward = game.settings.get(dangerZone.ID, 'saving-throw-fast-forward');
        if (!fastforward && dangerZone.MODULES.socketLibOn && owner) {
            const time = this.timeAlloted
            if(time){ 
                this._playerPrompted.push(`${token.name} (${owner.name})`)
                const query = dangerZone.dangerZoneSocket.executeAsUser("requestSavingThrow", owner.id, token.uuid, this.type, time)
                const race = wait(time)
                await Promise.race([query, race]).then((value) => {result = value})
            }
        }
        if(!result) {
            roll = await token.actor.rollSavingThrow({ability: this.type}, {chatMessage: false, configure: !fastforward})  
            dangerZone.log(false, 'Saving throw rolls', roll)
            result = roll?.[0]
        }
        const saved = (!result || result.total < this.diff) ? false : true
        !saved ? this.data.save.failed.push(token) : this.data.save.succeeded.push(token)
        const text = `<div>${token.name} <span class="danger-zone-label">${saved ? 'succeeds' : 'fails'}</span> with a ${result.total}.</div>`
        if(owner) {
            this._chatMessageResults += text}
        else {
            this._gmRollCount = ++this._gmRollCount
            this._gmChatMessageResults += text
        } 
        return result
    }
}

class scene extends executable{
    constructor(...args){
        super(...args),
        this._fileB,
        this._fileF,
        this.update = {},
        this.renderUpdate = {}
    }

    get active(){
        return this._part.active
    }

    get darkness(){
        return this._part.darkness.enable ? this._part.darkness.value : -1
    }

    get delay(){
        return this._part.delay ? this._part.delay - 0.5 : -0.5
    }

    get e(){
        return this._part.foreground.e ? this._part.foreground.e : {type: '', min: 0, max: 0}
    }

    get filePathB(){
        return this._part.background.file ? this._part.background.file : ''
    } 

    get filePathF(){
        return this._part.foreground.file ? this._part.foreground.file : ''
    } 

    get fileB(){
        return this._fileB ? this._fileB : this._setFileB()  
    }

    get fileF(){
        return this._fileF ? this._fileF : this._setFileF() 
    }

    get globalLight(){
        return this._part.globalLight ? this._part.globalLight : ''
    }

    get randomFileB(){
        return this._part.background.randomFile ? true : false
    }

    get randomFileF(){
        return this._part.foreground.randomFile ? true : false
    }
  
    get has(){
        return (super.has && (this.active || this.weather)) ? true : false
    }

    get hasNonRenderInvokingChange(){
        return Object.keys(this.update).length ? true : false
    } 

    get hasRenderInvokingChange(){
        return Object.keys(this.renderUpdate).length ? true : false
    } 

    get weather(){
        return (this.data.danger.weatherIsFoundry && !this.data.danger.weather.duration) ? this.data.danger.weather.type.replace('foundry.', '') : ''
    }

    get updateOps(){
        const ops = {};
        if (this.darkness !== -1) ops.animateDarkness = this._part.darkness.animate
        return ops
    }

    get z(){
        return this._part.z
    }

    _build() {
        if(this.active){
            if(this.darkness !== - 1) this.update.darkness = this.darkness;
            if(this.globalLight) this.update.globalLight = this.globalLight === 'Y' ? true : false;
            if(this.e.type) this.update.foregroundElevation = this.e.type === 'S' ? this._e() : this.data.scene.foregroundElevation + this._e();
            if(this._fileB && this.data.scene.background.src !== this._fileB) this.renderUpdate['background'] = {src: this._fileB}
            if(this._fileF && this.data.scene.foreground !== this._fileF) this.renderUpdate.foreground = this._fileF
        }
        if(this.weather) this.renderUpdate.weather = this.weather
    }

    _e(){
        const value = this.e.max === this.e.min ? this.e.min : (this.e.min + Math.floor(Math.random() * (this.e.max - this.e.min + 1))) 
        return value >= 1 ? value : null
    }

    async load() {
        this._fileB = await this.fileB;
        this._fileF = await this.fileF;
        let ret = true
        if(dangerZone.MODULES.sequencerOn){
            if(this._fileB){
                if(this._fileF){
                    ret = Sequencer.Preloader.preloadForClients([this._fileB, this._fileF])
                } else  {ret = Sequencer.Preloader.preloadForClients(this._fileB)}
            } else if(this._fileF) {ret = Sequencer.Preloader.preloadForClients(this._fileF)}
        }
        return ret
    }

    async play(){
        if(this.data.previouslyExecuted) {
            this._cancel = true;
        } else if(this.active) {
            if(!this._fileB) await this.fileB;
            if(!this._fileF) await this.fileF;
        }
        await super.play()
        if(this._cancel) return
        this._build()
        if(this.hasRenderInvokingChange) await this._updateWithRender() 
        if(this.hasNonRenderInvokingChange) await this._update();
    }

    async _updateWithRender(){
        let hookId;
      
        const render = new Promise(resolve => {
          hookId = Hooks.once("renderApplication", rendered => {
            resolve(rendered);
          });
        });

        await this.data.scene.update(this.renderUpdate);

        // Timeout after 5 seconds
        const timeout = new Promise(resolve => window.setTimeout(() => {
          Hooks.off("renderApplication", hookId);
          resolve();
        }, 3000));

        await Promise.race([render, timeout]);
    }

    async _setFileB(){
        if(!this.filePathB || !this.randomFileB) return this._fileB = this.filePathB;
        const files = await getFilesFromPattern(this.filePathB);
        this._fileB = files[Math.floor(Math.random() * files.length)]
        return this._fileB
      }

    async _setFileF(){
        if(!this.filePathF || !this.randomFileF) return this._fileF = this.filePathF;
        const files = await getFilesFromPattern(this.filePathF);
        this._fileF = files[Math.floor(Math.random() * files.length)]
        return this._fileF
    }

    async _update(){
        await this.data.scene.update(this.update, this.updateOps);
    }

}

class secondaryEffect extends executableWithFile {
    constructor(...args){
        super(...args);
        this._fileB 
    }

    get audio(){
        return this._part.audio ? this._part.audio : {}
    }
    
    get below(){
        return this._part.below 
    }

    get duration(){
        return this._part.duration
    }

    get fileB(){
        return this._fileB ? this._fileB : this._setFileB()  
    }

    get randomFileB(){
        return this.audio.randomFile ? true : false
    }

    get repeat(){
        return this._part.repeat
    }

    get rotate(){
        return this._part.rotate
    }

    get save(){
        return this.data.danger.save.be ? parseInt(this.data.danger.save.be) : super.save
    }

    async load() {
        this._file = await this.file;
        this._fileB = await this.fileB;
        let ret = true
        if(dangerZone.MODULES.sequencerOn){
            if(this._fileB){
                if(this._file){
                    ret = Sequencer.Preloader.preloadForClients([this._fileB, this._file])
                } else  {ret = Sequencer.Preloader.preloadForClients(this._fileB)}
            } else if(this._file) {ret = Sequencer.Preloader.preloadForClients(this._file)}
        }
        return ret
    }

    async play(){
        if(!this._fileB) await this.fileB;
        await super.play()
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const result = await this._build();
            result.play()
        }
    }

    async _build(){
        let s = new Sequence();
        const boundaries = this.data.twinDanger ? this.data.dualBoundaries : [this.boundary]
        for (const boundary of boundaries){
            s = this._sequence(boundary, s);
        }
        return s
    }

    _sequence(boundary, s){
        s = s.effect()
            .file(this._file)
            .zIndex(boundary.bottomToElevation)
            .atLocation(boundary.center)
            .mirrorX(this.flipContent('x'))
            .mirrorY(this.flipContent('y'))
            .scale(this.scale);
            if(this.duration) s = s.duration(this.duration)
            if(this.repeat) s = s.repeats(this.repeat)
            if(this.rotate) s = s.randomRotation()
            if(this.below) s = s.belowTokens()
        if(this._fileB){
            s = s.sound()
            .file(this._fileB)
            .volume(this.audio.volume)
        }
        return s
    }

    async _setFileB(){
        if(!this.audio.file || !this.audio.randomFile) return this._fileB = this.audio.file;
        this.playlist = game.playlists.getName(this.audio.file);
        if(!this.playlist) {
            this._fileB = ''
        } else {
            const index = Math.floor(Math.random() * this.playlist.sounds.size)
            let i = 0; 
            for (let key of this.playlist.sounds) {
                if (i++ == index) {this._fileB = key?.path; break;}  
            }
        }
        return this._fileB
    }
} 

class sound extends executableWithFile {
    constructor(...args){
        super(...args);
        this.sounds = []
    }

    get easing(){
        return this._part.easing
    } 

    get _sound() {
        const sound = {
            elevation: this.boundary.bottomToElevation,  
            easing: this.easing,
            flags: this.data.flag,
            path: this._file,
            radius: this.radius,
            volume: this.volume, 
            walls: this.walls, 
            x: this.boundary.center.x,
            y: this.boundary.center.y
        }
        return sound
    }

    get radius(){
        return this._part.radius
    } 

    get walls(){
        return this._part.walls
    } 

    get volume(){
        return this._part.volume ? this._part.volume : 0.5
    } 

    async play() {
        await super.play()
        if(this._cancel) return
        this.sounds = await this.data.scene.createEmbeddedDocuments("AmbientSound",[this._sound]);
    }

    async _setFile(){
        if(!this.filePath || !this.randomFile) return this._file = this.filePath;
        const playlist = game.playlists.getName(this.filePath);
        if(!playlist) {
            this._file = ''
        } else {
            const index = Math.floor(Math.random() * playlist.sounds.size)
            let i = 0; 
            for (let key of playlist.sounds) {
                if (i++ == index) {this._file = key?.path; break;}  
            }
        }
        return this._file
    }
}

class sourceEffect extends executableWithFile {
    constructor(...args){
        super(...args);
        this._fileB 
    }

    get audio(){
        return this._part.audio ? this._part.audio : {}
    }

    get duration(){
        return this._part.duration
    }

    get fileB(){
        return this._fileB ? this._fileB : this._setFileB()  
    }

    get hasSourceTargets(){
        return this.sourcesSelected.length ? true : false
    }

    get randomFileB(){
        return this.audio.randomFile ? true : false
    }

    get repeat(){
        return this._part.repeat
    }

    get rotate(){
        return this._part.rotate
    }

    get save(){
        return this.data.danger.save.se ? parseInt(this.data.danger.save.se) : super.save
    }

    async load() {
        this._file = await this.file;
        this._fileB = await this.fileB;
        let ret = true
        if(dangerZone.MODULES.sequencerOn){
            if(this._fileB){
                if(this._file){
                    ret = Sequencer.Preloader.preloadForClients([this._fileB, this._file])
                } else  {ret = Sequencer.Preloader.preloadForClients(this._fileB)}
            } else if(this._file) {ret = Sequencer.Preloader.preloadForClients(this._file)}
        }
        return ret
    }

    async play(){
        if(!this._file) await this.file;
        if(!this._fileB) await this.fileB;
        this.setExecuted()
        if (!this.hasSourceTargets) this._cancel = true
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const result = await this._build();
            result.play()
        }
    }

    async _build(){
        let s = new Sequence();
        for (const source of this.sourcesSelected){
            const documentName = source.documentName ? source.documentName : source.document.documentName;
            const docBound = boundary.documentBoundary(documentName, source)
            const bound = !this.offset ? docBound : boundary.offsetBoundary(docBound, this.data.offset, this.offset, this.data.scene)
            s = this._sequence(bound, s);
        }
        return s
    }

    _sequence(boundary, s){
        s = s.effect()
            .file(this._file)
            .zIndex(boundary.bottomToElevation)
            .atLocation(boundary.center)
            .mirrorX(this.flipContent('x'))
            .mirrorY(this.flipContent('y'))
            .scale(this.scale);
            if(this.duration) s = s.duration(this.duration)
            if(this.repeat) s = s.repeats(this.repeat)
            if(this.rotate) s = s.randomRotation()
        if(this._fileB){
            s = s.sound()
            .file(this._fileB)
            .volume(this.audio.volume)
        }
        return s
    }

    async _setFileB(){
        if(!this.audio.file || !this.audio.randomFile) return this._fileB = this.audio.file;
        this.playlist = game.playlists.getName(this.audio.file);
        if(!this.playlist) {
            this._fileB = ''
        } else {
            const index = Math.floor(Math.random() * this.playlist.sounds.size)
            let i = 0; 
            for (let key of this.playlist.sounds) {
                if (i++ == index) {this._fileB = key?.path; break;}  
            }
        }
        return this._fileB
    }
} 

class spawn extends executable {
    constructor(...args){
        super(...args);
        this.actor = ''
    }

    get _actor(){
        return this._part.actor
    }

    get color(){
        return this._part.color
    }

    get duplicates(){
        return this._part.duplicates
    }

    get has(){
        return (super.has && this._actor) ? true : false
    }

    get hasActor(){
        return this.actor ? true : false
    }

    get isRolltable(){
        return this._part.isRolltable
    }

    get options(){
        return this.duplicates ? {"count": this.duplicates} : {"count": 1}
    }

    get location(){
        return {x:this.boundary.center.x, y:this.boundary.center.y, elevation: this.boundary.bottomToElevation}
    }

    get range(){
        return this._part.range ? this._part.range : this.data.range
    }

    get spawnDelay(){
        return this._part.spawnDelay 
    }

    get texture(){
        return game.actors.getName(this.actor)?.thumbnail
    }

    get updates(){
        const updates = {token: {}}
        if(this.tag) updates.token['flags'] = {"tagger":this.taggerTag}
        return updates
    }

    async _build(){
        const obj = Object.assign(this.options, {updateData: this.updates});
        this.data.spawn.portal = await new Portal()
        //if(this.color) this.data.spawn.portal = this.data.spawn.portal.color(this.color)
        //if(this.spawnDelay) this.data.spawn.portal = this.data.spawn.portal.delay(this.spawnDelay)
        //if(this.texture) this.data.spawn.portal = this.data.spawn.portal.texture(this.texture)
        this.data.spawn.portal = this.data.spawn.portal.addCreature(this.actor, obj).origin(this.location).setLocation(this.location)//.range(this.range)
    }

    async _spawn(){
        this.data.spawn.tokens = await this.data.spawn.portal.spawn();
        await this.data.fillSources()
        if(this._part.mutate) this.data.spawn.mutate = true;
    }

    async play(){
        await super.play()
        if(this._cancel) return
        const token = await this.token();
        if(token) {
            await this._build()
            this._spawn()
        }
    }

    async token(){
        if(!this.hasActor) await this._setActor();
        const token = this.hasActor ? await game.actors.getName(this.actor).getTokenDocument() : ''
        return token
    }
    
    async _rollTable(){
        const table = game.tables.getName(this._actor);
        if(!table) return
        const rolledResult = await table.roll(); 
        this.actor = rolledResult.results[0].data.text;
    }

    async _setActor(){
        this.isRolltable ? await this._rollTable() : this.actor = this._actor
    }
}

class  tokenEffect extends executableWithFile {

    get below(){
        return this._part.below
    }   

    get duration(){
        return this._part.duration ?? 0
    }   

    get save(){
        return this.data.danger.save.te ? parseInt(this.data.danger.save.te) : super.save
    }
    
    async play(){
        await super.play()
        if(this._cancel) return
        const result = await this._build();
        result.play()
    }

    async _build(){
        let s = new Sequence();
        for(const target of this.targets) {
            s = this._sequence(target, s);
        }
        return s
    }

    _sequence(target, s){
        s = s.effect()
            .file(this._file)
            .attachTo(target)
            .scale(this.scale);
            if(this.duration) {
                s = s.duration(this.duration)   
                    .fadeOut(500)
            } else {
                s=s.persist()
            }
            if(this.below) s = s.belowTokens()
        return s
    }
}

class tokenMove extends executable {
    constructor(...args){
        super(...args);
        this.updates = []
    }

    get e(){
        return this._part.e
    }

    get flag(){
        return this._part.flag
    }

    get hz(){
        return this._part.hz
    }

    get sToT(){
        return this._part.sToT
    }

    get tiles(){
        return this._part.tiles
    }

    get walls(){
        return this._part.walls
    }

    get v(){
        return this._part.v
    }

    get has(){
        return (super.has && (this.movesTargets || this.sToT)) ? true : false
    }

    get hasSourceToTarget(){
        return this.sToT
    }

    get movesTargets(){
        return (this.v?.dir || this.hz?.dir || this.e?.type) ? true : false
    }

    get save(){
        return this.data.danger.save.tm ? parseInt(this.data.danger.save.tm) : super.save
    }
    
    get targets(){
        let targets = super.targets
        if(this.sToT) targets = targets.concat(this.data.sources.filter(s => targets.find(t => t.id !== s.id))) 
        return targets
    }

    get teleport(){
        return this._part.teleport
    }

    async play() {
        await super.play()
        if(this._cancel) return
        if(this.movesTargets || (this.sToT && this.data.hasSources)){
            for (const token of this.targets) { 
                let h = this._v(), w = this._hz(), amtE = this._e(), e, x, y;
                if(this.sToT && this.data.sources.find(s => s.id === token.id)){
                    let location = this.boundary.center;
                    let tokenBoundary = boundary.documentBoundary("Token", token);
                    x = location.x - (tokenBoundary.center.x - tokenBoundary.A.x), y = location.y - (tokenBoundary.center.y - tokenBoundary.A.y);
                    e = this.boundary.bottomToElevation;
                } else if (this.movesTargets) {
                    const shift = this.walls ? furthestShiftPosition(token, [w, h]) : point.shiftPoint(token, {w: w, h: h})
                    x = shift.x; y = shift.y;
                    e = this.e.type === 'S' ? amtE : token.elevation + amtE;
                    this.data.tokenMovement.push({tokenId: token.id, hz: Math.abs(w), v: Math.abs(h), e: Math.abs(e - token.elevation)})
                }
                if(x < this.data.sceneBoundary.x.min) {
                    x = this.data.sceneBoundary.x.min
                } else if (x > this.data.sceneBoundary.x.max) {
                    x = this.data.sceneBoundary.x.max
                }
                if(y < this.data.sceneBoundary.y.min) {
                    y = this.data.sceneBoundary.y.min
                } else if (y > this.data.sceneBoundary.y.max) {
                    y = this.data.sceneBoundary.y.max
                }
                this.updates.push({"_id": token.id,"x": x,"y": y, "elevation": e});
            }
            await this._update()
        }
    }

    _e(){
        return this.e?.type ? (this.e.min + Math.floor(Math.random() * (this.e.max - this.e.min + 1))) : 0
    }
    
    _hz(){
        if(!this.hz?.dir) return 0
        const adjH = (this.hz.dir === "D" || (this.hz.dir === "R" && Math.round(Math.random()))) ? -1 : 1
        return ((this.hz.min + Math.floor(Math.random() * (this.hz.max - this.hz.min + 1))) * adjH)
    }

    _v(){
        if(!this.v?.dir) return 0
        const adjV = (this.v.dir === "U" || (this.v.dir === "R" && Math.round(Math.random()))) ? -1 : 1
        return ((this.v.min + Math.floor(Math.random() * (this.v.max - this.v.min + 1))) * adjV)
    }

    async _update(){
        const opts = this.flag ? {dangerZoneMove: true} : {};
        if(this.teleport){
            opts.teleport = true;
            opts.forced = true;
        }
        await this.data.scene.updateEmbeddedDocuments("Token", this.updates, opts);
    }
}

class tokenSays extends executable {  

    get audio(){
        return {
            source: !this.isChat ? this._part.fileName : this._part.paired?.fileName,
            compendium: !this.isChat ? this._part.compendiumName : this._part.paired?.compendiumName,
            quote: !this.isChat ? this._part.fileTitle : this._part.paired?.fileTitle
         }
    }

    get chat(){
        return {
            source: this.isChat ? this._part.fileName : this._part.paired?.fileName,
            compendium: this.isChat ? this._part.compendiumName : this._part.paired?.compendiumName,
            quote: this.isChat ? this._part.fileTitle : this._part.paired?.fileTitle
         }
    }

    get fileType(){
        return this._part.fileType
    }
    
    get has(){
        return (super.has && this.fileType && (this.chat.quote || this.chat.source || this.audio.quote || this.audio.source )) ? true : false
    }

    get isChat(){
        return this.fileType === 'rollTable' ? true : false
    }

    get options(){
        return {
            audio: this.audio,
            chat: this.chat,
            suppress: {
                bubble: this.suppressChatbubble,
                message: this.suppressChatMessage,
                quotes: this.suppressQuotes
            },
            volume: this.volume
        }
    }

    get save(){
        return this.data.danger.save.ts ? parseInt(this.data.danger.save.ts) : super.save
    }

    get suppressChatbubble(){
        return this._part.suppressChatbubble ? true : false
    } 

    get suppressChatMessage(){
        return this._part.suppressChatMessage ? true : false
    } 

    get suppressQuotes(){
        return this._part.suppressQuotes ? true : false
    } 

    get volume(){
        return this._part.volume ? this._part.volume : 0.50
    }

    async play() {
        await super.play()
        if(this._cancel) return
        for (const token of this.targets) { 
            await game.modules.get("token-says").api.saysDirect(token.id, '', this.data.scene.id, this.options);
        }
    }
}

class wall extends executable {

    constructor(...args){
        super(...args);
        this._data = []
    }

    get bottom(){
        return this._part.bottom
    }

    get dir(){
        return this._part.dir
    }

    get door(){
        return this._part.door
    }

    get doorSound(){
        return this._part.doorSound
    }

    get ds(){
        return this._part.ds ?? 0
    }

    get has(){
        return (super.has && (this.top || this.right || this.bottom || this.left)) ? true : false
    }

    get left(){
        return this._part.left
    }

    get light(){
        return FVTTSENSETYPES[this._part.light]
    }

    get move(){
        return FVTTMOVETYPES[this._part.move]
    }

    get random(){
        return this._part.random
    }

    get right(){
        return this._part.right
    }

    get save(){
        return this.data.danger.save.wall ? parseInt(this.data.danger.save.wall) : super.save
    }

    get sense(){
        return FVTTSENSETYPES[this._part.sense]
    }

    get sound(){
        return FVTTSENSETYPES[this._part.sound]
    }

    get threshold(){
        return this._part.threshold ?? {}
    }

    get top(){
        return this._part.top
    }

    _build(){
        if(this.top && this.randomize()) this._data.push(this._wall(this.boundary.A, {x: this.boundary.B.x, y: this.boundary.A.y}))
        if(this.right && this.randomize()) this._data.push(this._wall({x: this.boundary.B.x, y: this.boundary.A.y}, this.boundary.B))
        if(this.bottom && this.randomize()) this._data.push(this._wall(this.boundary.B, {x: this.boundary.A.x, y: this.boundary.B.y}))
        if(this.left && this.randomize()) this._data.push(this._wall({x: this.boundary.A.x, y: this.boundary.B.y}, this.boundary.A))
    }

    _wall(start, end){
        const wall = {
            c:[start.x, start.y, end.x, end.y],
            dir: this.dir,
            door: this.door,
            doorSound: this.doorSound,
            ds: this.ds,
            move: this.move,
            sight: this.sense,
            sound: this.sound,
            light: this.light,
            threshold: this.threshold,
            flags: this.data.flag
        }
        if(dangerZone.MODULES.wallHeightOn && this.boundary.depthIsInfinite) wall.flags['wall-height'] = {"top": this.boundary.top, "bottom": this.boundary.bottom}
        if(dangerZone.MODULES.taggerOn && this.tag) wall.flags['tagger'] = this.taggerTag
        return wall;
    }  

    async play(){
        await super.play()
        if(this._cancel) return
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            this._build();
            if(this._data.length) await this.data.scene.createEmbeddedDocuments("Wall",this._data)
        }
        await this.data.fillSourceAreas()
    }
}

class weather extends executable{
    
    get duration(){
        return this._part.duration
    }

    get has(){
        return (super.has && this.type && !this.data.previouslyExecuted) ? true : false
    }

    get animations(){
        return this._part.animations ? [this._part.animations] : []
    }

    get density(){
        return this._part.density 
    }

    get direction(){
        return this._part.direction 
    }

    get flagName(){
        return this.duration ? this.data.id : this.data.zone.dangerId
    }

    get fxEffect(){
        const currentEffects = this.data.scene.getFlag('fxmaster', "effects") ?? {}
        return currentEffects[this.flagName]
    }

    get isFoundryType(){
        return this._part.type.includes('foundry.') ? true : false
    }

    get lifetime(){
        return this._part.lifetime 
    }

    get _options(){
        const obj = {};
        if(this.animations.length) obj['animations'] = this.animations;
        if(this.density !== undefined) obj['density'] = this.density;
        if(this.direction !== undefined) obj['direction'] = this.direction;
        if(this.lifetime !== undefined) obj['lifetime'] = this.lifetime;
        if(this.scale !== undefined) obj['scale'] = this.scale;
        if(this.speed !== undefined) obj['speed'] = this.speed;
        if(this.tint !== undefined) obj['tint'] = this.tint;
        return obj
    }

    get scale(){
        return this._part.scale 
    }

    get speed(){
        return this._part.speed 
    }

    get tint(){
        return this._part.tint 
    }
    
    get type(){
        return this._part.type.replace('foundry.','')
    }

    async off(){ 
        if(this.duration) {
            if(this.isFoundryType){       
                game.socket.emit('module.danger-zone', {weather: {stop: true}})
                game.canvas.weather.clearEffects()
            }
            else if(dangerZone.MODULES.fxMasterOn) {
                if(this.fxEffect) {
                    Hooks.call("fxmaster.switchParticleEffect", {
                        name: this.flagName,
                        type: this.type
                    });
                }
            }
        }
    }

    async play(){
        await super.play()
        if(this._cancel) return
        if(this.isFoundryType && this.duration) {
            game.canvas.weather.initializeEffects(CONFIG.weatherEffects[this.type])
            game.socket.emit('module.danger-zone', {weather: {sceneId: this.data.scene.id, play: this.type}})
        } else if(dangerZone.MODULES.fxMasterOn) {
            if(!this.fxEffect)  {
                    Hooks.call("fxmaster.switchParticleEffect", {
                    name: this.flagName,
                    type: this.type,
                    options: this._options
                });
            }
        }
        this._for();
    }

    async _for(){
        if(this.duration) await delay(this.duration);
        await this.off();
    }
}
