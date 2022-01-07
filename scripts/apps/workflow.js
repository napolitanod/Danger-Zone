import {dangerZone, zone} from '../danger-zone.js';
import {dangerZoneDimensions, point, locationToBoundary, documentBoundary, getTagEntities, furthestShiftPosition} from './dimensions.js';
import {tokenSaysOn, monksActiveTilesOn, warpgateOn, fluidCanvasOn, sequencerOn, betterRoofsOn, levelsOn, taggerOn, wallHeightOn, midiQolOn} from '../index.js';
import {saveTypes, damageTypes, FVTTMOVETYPES, FVTTSENSETYPES, WORKFLOWSTATES} from './constants.js';
import {getFilesFromPattern, stringToObj} from './helpers.js';

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

class plan {
    constructor(executor){
        this.ongoing,
        this.executor = executor,
        this.manifest = new Map;
        this._initialize()
    }

    get initializePlan(){
        return [
            () => this.executor.load(),
            () => this.executor.ready()
        ]
    }

    _initialize(){
        this.manifest.set("load", );
        this.ongoing = this.manifest.entries();
    }
}

export class workflow {

    constructor(zone, trigger, options = {}) {
        this.active = true,
        this.currentState = WORKFLOWSTATES.INIT,
        this.id = foundry.utils.randomID(16),
        this.report = 'Workflow is processing...',
        this.trigger = trigger,
        this.executor = new executor(zone, options);
        this.plan = new plan(this.executor)
    };

    get previouslyExecuted(){
        return this.executor.previouslyExecuted
    }

    get title(){
        return this.executor.data.zone.title
    }

    log(message, data){
        dangerZone.log(false,`${message} ${this.title}... `, {workflow: this, data:data});
    }

    async next(nextState){
        if(!this.active){return this}
        await this._next(nextState);
        if(!this.active){return this}
    }

    async _next(state){
        this.currentState = state;
        switch(state) {
            case WORKFLOWSTATES.NONE:
                let [k,v] = this.plan.ongoing.next().value
                for(const f of v){
                    if(this.executor.state) {await f()} else {this.next(WORKFLOWSTATES.CANCEL)}
                }
                return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD)

            case WORKFLOWSTATES.EXECUTELIKELIHOOD:
                this.active = await this.executor.check();
                this.log('Zone likelihood determined',  this.executor.data);
                if(!this.active) return this.next(WORKFLOWSTATES.INFORM)
                return this.next(WORKFLOWSTATES.SETZONEDATA)
            
            case WORKFLOWSTATES.SETZONEDATA:
                this.active = await this.executor.setZoneData()
                this.log('Zone data set', this.executor.data);
                return this.next(WORKFLOWSTATES.INFORM)

            case WORKFLOWSTATES.INFORM:
                await this.executor.inform()
                this.log('Information generated', {});
                if(!this.active) return this.next(WORKFLOWSTATES.CANCEL)
                return this.next(WORKFLOWSTATES.CLEAR)

            case WORKFLOWSTATES.CLEAR:
                await this.executor.wipe();
                this.log('Documents wiped', {});
                return this.next(WORKFLOWSTATES.GENERATEFLAVOR)

            case WORKFLOWSTATES.GENERATEFLAVOR:
                if(!this.previouslyExecuted) this.executor.flavor();
                this.log('Flavor step complete', {});
                return this.next(WORKFLOWSTATES.MAKESAVES)

            case WORKFLOWSTATES.MAKESAVES:
                await this.executor.save();
                this.log('Saves step complete', this.executor._save);
                return this.next(WORKFLOWSTATES.GENERATEFLUIDCANVAS)

            case WORKFLOWSTATES.GENERATEFLUIDCANVAS:
                await this.executor.canvas()
                this.log('Canvas initiated', this.executor._canvas)
                return this.next(WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT:
                await this.executor.primaryEffect()
                this.log('Primary effect initiated', this.executor._primaryEffect)
                return this.next(WORKFLOWSTATES.GENERATEAUDIOEFFECT)

            case WORKFLOWSTATES.GENERATEAUDIOEFFECT:
                await this.executor.audio();
                this.log('Audio initiated', this.executor._audio);
                return this.next(WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT:
                await this.executor.secondaryEffect()
                this.log('Secondary effect initiated', this.executor._secondaryEffect)
                return this.next(WORKFLOWSTATES.GENERATELASTINGEFFECT)

            case WORKFLOWSTATES.GENERATELASTINGEFFECT:
                await this.executor.lastingEffect()
                this.log('Lasting effect initiated', this.executor._lastingEffect)
                return this.next(WORKFLOWSTATES.GENERATETOKENEFFECT)

            case WORKFLOWSTATES.GENERATETOKENEFFECT:
                await this.executor.tokenEffect()
                this.log('Token effect initiated', this.executor._tokenEffect)
                return this.next(WORKFLOWSTATES.GENERATETOKENMOVE) 

            case WORKFLOWSTATES.GENERATETOKENMOVE:
                await this.executor.tokenMove()
                this.log('Token move initiated', this.executor._tokenMove)
                return this.next(WORKFLOWSTATES.DAMAGETOKEN)

            case WORKFLOWSTATES.DAMAGETOKEN:
                await this.executor.damageToken()
                this.log('Damage token initiated', this.executor._damageToken)
                return this.next(WORKFLOWSTATES.GENERATEWALLS)
                
            case WORKFLOWSTATES.GENERATEWALLS:
                await this.executor.wall()
                this.log('Wall initiated', this.executor._wall)
                return this.next(WORKFLOWSTATES.GENERATELIGHT) 

            case WORKFLOWSTATES.GENERATELIGHT:
                await this.executor.ambientLight()
                this.log('Ambient light initiated', this.executor._ambientLight)
                return this.next(WORKFLOWSTATES.GENERATEACTIVEEFFECT) 
                 
            case WORKFLOWSTATES.GENERATEACTIVEEFFECT:
                await this.executor.activeEffect()
                this.log('Active effect initiated', this.executor._activeEffect)
                return this.next(WORKFLOWSTATES.GENERATEMACRO)  

            case WORKFLOWSTATES.GENERATEMACRO:
                await this.executor.macro(this)
                this.log('Macro initiated', this.executor._macro)
                return this.next(WORKFLOWSTATES.TOKENSAYS) 

            case WORKFLOWSTATES.TOKENSAYS:
                await this.executor.tokenSays()
                this.log('Token Says initiated', this.executor._tokenSays)
                return this.next(WORKFLOWSTATES.SPAWN) 

            case WORKFLOWSTATES.SPAWN:
                await this.executor.spawn()
                this.log('Spawn initiated', this.executor._spawn)
                return this.next(WORKFLOWSTATES.MUTATE) 

            case WORKFLOWSTATES.MUTATE:
                await this.executor.mutate()
                this.log('Mutate initiated', this.executor._mutate)
                return this.next(WORKFLOWSTATES.AWAITPROMISES) 

            case WORKFLOWSTATES.AWAITPROMISES: 
                const executeResult = await this.executor.done();
                this.report = executeResult.results;
                if(executeResult.success){
                    this.log('Zone executed successfully ', this.report)
                    return this.next(WORKFLOWSTATES.COMPLETE) 
                } else {
                    this.log('Zone executed with errors ', this.report);
                    return this.next(WORKFLOWSTATES.CANCEL) 
                }

            case WORKFLOWSTATES.CANCEL: 
                this.active = false
                this.log('Zone workflow cancelled', {});
                return this

            case WORKFLOWSTATES.COMPLETE: 
                this.active = false;
                return this.log('Zone workflow complete', {})
        }
    }
}

class executorData {
    constructor(zone, options){
        this.id = foundry.utils.randomID(16),
        this.boundary = options.boundary ? options.boundary : {},
        this.eligibleTargets = [],
        this.likelihoodResult = 100,
        this.location = options.location ? new point(options.location) : {},
        this.save = {failed: [], succeeded: []},
        this._sources = options.sources ? options.sources : [],
        this.targets = options.targets ? options.targets : [],
        this.tokenMovement = [],
        this.twinBoundary = {},
        this.valid = true,
        this.zone = zone,
        this.zoneBoundary,
        this.zoneEligibleTokens = [],
        this.zoneTokens = []
    }

    get danger(){
        return this.zone.danger
    }

    get dualBoundaries(){
        return Object.keys(this.twinBoundary).length ? [this.boundary, this.twinBoundary] : [this.boundary]
    }

    get flag(){
        return {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}}
    }

    get hasFails(){
        return this.save.failed.length ? true : false
    }

    get happens(){
        return this.likelihoodResult <= this.zone.likelihood
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

    get hasSuccesses(){
        return this.save.succeeded.length ? true : false
    }

    get hasTargets(){
        return this.targets.length ? true : false
    }

    get scene() {
       return game.scenes.get(this.zone.scene.sceneId)
    }

    get sceneTokens() {
        return this.scene.tokens
    };

    get sources() {
        return this._sources.length ? this._sources : this.zone.sources 
    }

    get targetBoundary(){
        return this.boundary
    }

    about() {
        if(game.user.isGM && game.settings.get(dangerZone.ID, 'chat-details-to-gm')) {   
            let content =
                `Danger: ${this.danger.name} 
                <br>Dimensions: w${this.danger.dimensions.units.w} h${this.danger.dimensions.units.h} d${this.danger.dimensions.units.d}
                <br>Zone: bleed ${this.zone.options.bleed}, hit all ${this.zone.options.allInArea}, always hits ${this.zone.options.runUntilTokenFound}
                <br>Zone Likelihood: ${this.zone.likelihood}
                <br>Likelihood result: ${this.likelihoodResult}`;
            if(this.hasBoundary){
                content += `
                    <br>Target boundary start: x${this.boundary.A.x} y${this.boundary.A.y} z${this.boundary.A.z}
                    <br>Target boundary end: x${this.boundary.B.x} y${this.boundary.B.y} z${this.boundary.B.z}
                    <br>Eligible zone tokens: ${this.zoneEligibleTokens.map(t => t.data.name)}
                    <br>Eligible targets: ${this.eligibleTargets.map(t => t.data.name)}
                    <br>Hit targets: ${this.targets.map(t => t.data.name)}`
            } 
            ChatMessage.create({
                content: content,
                whisper: [game.user.id]
            },{chatBubble : false})
        }
    }

    async checkLikelihood() {
        if(this.zone.likelihood < 100){
            const maybe = await new Roll(`1d100`).roll();
            this.likelihoodResult = maybe.result;
        }
        return this.happens
    }

    async highlightBoundary(){
        if(this.hasBoundary && game.user.isGM && game.settings.get(dangerZone.ID, 'display-danger-boundary')){
            this.boundary.highlight(this.id, 16711719)
            await wait(5000)
            this.boundary.destroyHighlight(this.id);
        }
    }

    informLikelihood(){
        console.log(`Zone likelihood of ${this.zone.likelihood} was ${this.happens ? '' : 'not '} met with a roll of ${this.likelihoodResult}`)
    }

    async randomBoundary() {
        let max = 1, i=0;
        const test = await this.zone.scene.randomDangerBoundary();
        const targetPool = this.targets.length ? this.targets : this.zoneEligibleTokens;
        if((this.targets.length || this.zone.options.runUntilTokenFound) && targetPool.length) max = 10000;
        do {
            i++;
            const b = test.next()
            if(!b || b.done) return
            this.boundary = b.value;
            this.eligibleTargets = this.boundary.tokensIn(targetPool);
        } while(!this.eligibleTargets.length && i < max);
    }

    async set(){
        this.zoneBoundary = await this.zone.scene.boundary();
        this.zoneTokens = this.zoneBoundary.tokensIn(this.sceneTokens);
        this.zoneEligibleTokens = this.zone.zoneEligibleTokens(this.zoneTokens);
        await this.setBoundary()
        this.setTargets()
        if(this.danger.hasTwinBoundary) await this.setTwinBoundary()
        if(!this.hasBoundary) this.valid = false
    }
    
    async setBoundary() {
        if(this.hasBoundary) return this._setBoundary();
        if(this.hasLocation) return this._setLocationBoundary();
        if(this.zone.options.placeTemplate) {
            this.location = await this.zone.promptTemplate();
            if(!this.hasLocation) {
                return ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.user-selection-exited"));
            }
            return this._setLocationBoundary()
        }
        await this.randomBoundary()
    }
    
    setTargets(){
        if (this.hasTargets) return
        if(!this.zone.options.allInArea){
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

    _setBoundary(){
        this.eligibleTargets = this.boundary.tokensIn(this.zoneEligibleTokens);
    }

    _setLocationBoundary(){
        const options = {excludes: this.zoneBoundary.excludes}
        this.zone.stretch(options);
        this.boundary = locationToBoundary(this.location, this.danger.dimensions.units, options);
        this._setBoundary();
    }
}

class executor {
    constructor(zone, options = {}) {
        this.data = new executorData(zone, options),
        this.parts = [],
        this.previouslyExecuted = options.previouslyExecuted ? options.previouslyExecuted : false,
        this.promises = {
            load: [],
            execute: []
        },
        this.state = 1,
        this._initialize();
    }

    _initialize(){
        this._activeEffect = new activeEffect(this.danger.effect, this.data, {title: "Active Effect"}),
        this._ambientLight = new ambientLight(this.danger.ambientLight, this.data, {title: "Ambient Light", wipeable: true, modules: [{active: levelsOn, name: "levels", dependent: false}, {active: taggerOn, name: "tagger", dependent: false}]})
        this._audio = new audio(this.danger.audio, this.data, {title: "Audio", modules: [{active: sequencerOn, name: "sequencer", dependent: false}]}),
        this._canvas = new fluidCanvas(this.danger.canvas, this.data, {title: "Canvas", modules: [{active: fluidCanvasOn, name: "kandashis-fluid-canvas", dependent: true}]}),
        this._damageToken = new damageToken(this.danger.damage, this.data, {title: "Damage", modules: [{active: midiQolOn, name: "midi-qol", dependent: true}]}), 
        this._lastingEffect = new lastingEffect(this.danger.lastingEffect, this.data, {title: "Lasting Effect", wipeable: true, modules: [{active: monksActiveTilesOn, name: "monks-active-tiles", dependent: false},{active: taggerOn, name: "tagger", dependent: false},{active: levelsOn, name: "levels", dependent: false},{active: betterRoofsOn, name: "better-roofs", dependent: false}]}),
        this._macro = new macro(this.danger.macro, this.data, {title: "Macro"}),
        this._mutate = new mutate(this.danger.mutate, this.data, {title: "Mutate", modules:[{active: warpgateOn, name: "warpgate", dependent: true}, {active: taggerOn, name: "tagger", dependent: false}]}),
        this._primaryEffect = new primaryEffect(this.danger.foregroundEffect, this.data, {title: "Primary Effect", modules: [{active: sequencerOn, name: "sequencer", dependent: true}]}),
        this._secondaryEffect = new secondaryEffect(this.danger.backgroundEffect, this.data, {title: "Secondary Effect", modules: [{active: sequencerOn, name: "sequencer", dependent: true}]}),
        this._save = new save(this.danger.save, this.data, {title: "Save"}),
        this._spawn = new spawn(this.danger.warpgate, this.data, {title: "Spawn", modules:[{active: warpgateOn, name: "warpgate", dependent: true}, {active: taggerOn, name: "tagger", dependent: false}]}),
        this._tokenMove = new tokenMove(this.danger.tokenMove, this.data, {title: "Token Move"}),
        this._tokenEffect = new tokenEffect(this.danger.tokenEffect, this.data, {title: "Token Effect", modules: [{active: sequencerOn, name: "sequencer", dependent: true}]}),
        this._tokenSays = new tokenSays(this.danger.tokenSays, this.data, {title: "Token Says", modules: [{active: tokenSaysOn, name: "token-says", dependent: true}]}),
        this._wall = new wall(this.danger.wall, this.data, {title: "Wall", wipeable: true, modules:[{active: wallHeightOn, name: "wall-height", dependent: false}, {active: taggerOn, name: "tagger", dependent: false}]})
        this.parts = [this._activeEffect,this._ambientLight,this._audio,this._canvas,this._damageToken,this._lastingEffect,this._macro,this._mutate,this._primaryEffect,this._secondaryEffect,this._save,this._spawn,this._tokenMove,this._tokenEffect,this._tokenSays,this._wall]
    }

    get danger(){
        return this.zone.danger
    }

    get _flavor(){
        return this.data.zone.flavor
    }

    get executables(){
        return this.parts.filter(e => e.has)
    }

    get wipeables(){
        return this.executables.filter(e => e.wipeable)
    }

    get zone(){
        return this.data.zone
    }

    async activeEffect(){
        this.promises.execute.push(this._activeEffect.go())
    }

    async ambientLight(){
        this.promises.execute.push(this._ambientLight.go())
    }

    async audio() {
        this.promises.execute.push(this._audio.go())
    }

    async canvas(){
        this.promises.execute.push(this._canvas.go());
    }

    async check(){
        let cont = false
        if(!this.data.danger) return cont
        cont = await this.data.checkLikelihood()
        if(!cont) this.data.informLikelihood()
        return cont
    }

    async damageToken(){
        this.promises.execute.push(this._damageToken.go());
    }

    async done(){
        const result = await Promise.all(this.promises.execute).then((results) => {return {success:true, results: results}}).catch((e) => {return {success:false, results: e}});
        this.previouslyExecuted = true;
        return result
    }

    flavor() {
        if(this._flavor) ChatMessage.create({content : this._flavor})
    }

    async lastingEffect(){
        this.promises.execute.push(this._lastingEffect.go())
    }

    async load(){
        if(!sequencerOn || this.previouslyExecuted) return true
        const promises = [this._audio.file, this._lastingEffect.file, this._primaryEffect.file, this._secondaryEffect.file, this._tokenEffect.file];
        const files = await Promise.all(promises).then((results) => {return results.filter(r => r)}).catch((e) => {return console.log('Danger Zone file caching failed.')});
        this.promises.load.push(Sequencer.Preloader.preloadForClients(files))
    }

    async macro(args){
        this.promises.execute.push(this._macro.go(args))
    }

    async mutate(){
        this.promises.execute.push(this._mutate.go())
    }

    async primaryEffect(){
        this.promises.execute.push(this._primaryEffect.go())
    }

    async ready(){
        this.state = await Promise.all(this.promises.load).then(() => {return 1}).catch((e) => {return 0});
    }

    async save(){
        const result = this._save.go();
        this.promises.execute.push(result)
        await result
    }

    async secondaryEffect(){
        this.promises.execute.push(this._secondaryEffect.go())
    }

    async spawn(){
        this.promises.execute.push(this._spawn.go())
    }

    async tokenEffect(){
        this.promises.execute.push(this._tokenEffect.go())
    }

    async tokenMove(){
        this.promises.execute.push(this._tokenMove.go())
    }

    async tokenSays(){
        this.promises.execute.push(this._tokenSays.go())
    }

    async wall(){
        this.promises.execute.push(this._wall.go())
    }

    async wipe(){
        if(!this.previouslyExecuted){
            for(const wipeable of this.wipeables){
                await wipeable.wipe();
            }
        }
    }
 
    async inform(){
        await this.data.highlightBoundary()
        this.data.about();
    }
    
    async setZoneData(){
        await this.data.set()
        return this.data.valid
    }
}

class executable {
    constructor(part = {}, data = executorData, options = {} ){
        this.data = data,
        this._executed = false,
        this._modules = options.modules ? options.modules : [],
        this._dangerName = options.title ? options.title : '',
        this._part = part,
        this.wipeable = options.wipeable ? true : false
    }

    get delay(){
        return this._part.delay ? this._part.delay : 0
    }

    get has(){
        return (!Object.keys(this._part).length || this._modules.find(m => m.dependent === true && m.active === false)) ? false : true 
    }

    get hasTargets(){
        return this.targets.length ? true : false
    }

    get report(){
        return {"danger": this._dangerName, "executed": this._executed, "modules": this._modules}
    }

    get scale(){
        return this._part.scale ? this._part.scale : 1
    }

    get source(){
        return this._part.source ? this._part.source : ''
    }
    
    get save(){
        return 0
    }

    get tag(){
        return this._part.tag ? this._part.tag : ''
    }

    get taggerTag(){
        return {"tags": [this.tag]}
    }
    
    get targets(){
        return zone.sourceTreatment(this.source, (this.save ? (this.save > 1 ? this.data.save.failed : this.data.save.succeeded) : this.data.targets), this.data.sources);
    }

    async go(){
        if(this.has) {
            await this._wait();
            await this.play(); 
        }
        return this.report
    }

    async play(){  
        this.setExecuted()
    }

    setExecuted(){
        this._executed = true
    }

    async _wait() {
        await delay(this.delay);
    }

    async wipe(document){
        this.data.zone.wipe(document)
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
        return (this._file && sequencerOn) ? Sequencer.Preloader.preloadForClients(this._file) : true
    }

    async play(){
        if(!this._file) await this.file;
        this.setExecuted()
    }

    async _setFile(){
        if(!this.filePath || !this.randomFile) return this._file = this.filePath;
        const files = await getFilesFromPattern(this.filePath);
        this._file = files[Math.floor(Math.random() * files.length)]
        return this._file
      }
}

class activeEffect extends executable {

    get delay(){
        return this.flag.delay ? this.flag.delay : 0
    }

    get effect(){
        return this._part
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

    get source(){
        return this.flag.source ? this.flag.source : ''
    }
    
    get save(){
        return this.data.danger.save.ae ? parseInt(this.data.danger.save.ae) : 0
    }

    async play(){  
        await super.play()                  
        for (const token of this.targets) {
            if(this.limit && token.actor && token.actor.effects.find(e => e.data.flags[dangerZone.ID]?.origin === this.data.danger.id)){
                continue;
            }
            await token.actor.createEmbeddedDocuments("ActiveEffect", [this.effect]);
        }
    }
}

class ambientLight extends executable{

    get angle(){
        return this._part.angle
    }

    get bright(){
        return this._part.bright
    }

    get dim(){
        return this._part.dim
    }

    get lightAnimation(){
        return this._part.lightAnimation
    }

    get rotation(){
        return this._part.rotation
    }

    get tag(){
        return this._part.tag
    }

    get tintAlpha(){
        return this._part.tintAlpha
    }

    get tintColor(){
        return this._part.tintColor
    }

    get has(){
        return (super.has && (this.dim || this.bright)) ? true : false
    }  

    get _light() {
        const light = {
            config: {
                alpha: Math.pow(this.tintAlpha, 2).toNearest(0.01),
                angle: this.angle,
                animation: {
                    reverse: false,
                    speed: this.lightAnimation.speed,
                    intensity: this.lightAnimation.intensity,
                    type: this.lightAnimation.type
                },
                bright: this.bright,
                color: this.tintColor,
                coloration: 1,
                contrast: 0,
                darkness: {min:0, max:1},
                dim: this.dim,
                gradual: true,
                luminosity: 0.5,
                saturation: 0,
                shadows: 0
            },               
            hidden: false,
            rotation: this.rotation,
            vision: false,
            walls: true,
            x: this.data.boundary.center.x,
            y: this.data.boundary.center.y,
            flags: this.data.flag
        }
        if(levelsOn && (this.data.boundary.bottom || this.data.boundary.top)) light.flags['levels'] = {"rangeTop": this.data.boundary.top,"rangeBottom": this.data.boundary.bottom}
        if(taggerOn && this.tag) light.flags['tagger'] = this.taggerTag
        return light
    }
    
    async play(){
        await super.play()
        await this.data.scene.createEmbeddedDocuments("AmbientLight",[this._light]);
    }
    
    async wipe(){
       await super.wipe('AmbientLight')
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
        this.sound = await AudioHelper.play({src: this.file, volume: this.volume, loop: false, autoplay: true}, true)
        this._schedule();
    }

    _schedule(){
        if(this.duration){
            this.sound.schedule(() => this.sound.fade(0), this.duration);
            this.sound.schedule(() => this.sound.stop(), this.duration+1); 
        }
    }

    stop(){
       this.sound.stop();
    }
}

class damageToken extends executable{
    
    get amount(){
        return this._part.amount
    } 
    
    get enable(){
        return this._part.enable
    } 

    get flavor(){
        return this._part.flavor
    } 

    get has(){
        return (super.has && this.enable && this.amount) ? true : false
    }

    get isBulk(){
        return (this.amount.indexOf('@')===-1 || this.flavor.indexOf('@elevation')===-1 || this.flavor.indexOf('@moved')===-1) ? false : true
    }
    
    get _save(){
        return this._part.save
    } 
    
    get save(){
        return !this.data.danger.save.enable ? "F" : this._save
    }
    
    get targets(){
        return zone.sourceTreatment(this.source, this.data.targets, this.data.sources);
    }
    
    get type(){
        return this._part.type
    } 

    async play(){    
        await super.play()
        this.isBulk ? await this._bulkWorkflow() : await this._individualWorkflow()
    }

    async _bulkWorkflow(){
        const damageRoll = await new Roll(this.amount).roll()
        if(this.save==='F'){
            await this._calculateDamage(false, damageRoll, this.targets, this.flavor)
        } 
        else { 
            if(this.data.save.failed.length) await this._calculateDamage(false, damageRoll,  this.data.save.failed, this.flavor)
            if(this.save === 'H' && this.data.hasSaves) await this._calculateDamage(true, damageRoll, this.data.save.succeeded, this.flavor)
        }
    }

    async _individualWorkflow(){
        for (const token of this.targets){
            if(this.save ==='N' && this.data.save.succeeded.find(t => t.id === token.id)) continue;
            const half = (this.save === 'H' && this.data.save.succeeded.find(t => t.id === token.id)) ? true : false;
            const mvMods = this.data.tokenMovement.find(t => t.tokenId === token.id);
            const e = mvMods?.e ? mvMods.e : 0; const mv = Math.max((mvMods?.hz ? mvMods.hz : 0), (mvMods?.v ? mvMods.v : 0));
            let dice = this.amount.replace(/@elevation/i,e).replace(/@moved/i,mv);
            const damageRoll = await new Roll(dice).roll();     
            let flavor = this.flavor.replace(/@elevation/i,e).replace(/@moved/i,mv);
            await this._calculateDamage(half, damageRoll, [token], flavor)
        }
    }

    async _calculateDamage(half, damageRoll, tokens, flavorAdd){
        let roll; const types = damageTypes();
        let flavor = `<label>${damageRoll.result} ${types[this.type]} on a ${damageRoll?.formula} roll${half ? ' (halved due to save)': ''}.</label><br>${flavorAdd.replace(/@alias/i, tokens.map(t => t.name).join(', '))}`;
        if(half){
            let hf = Math.floor(damageRoll.total/2);
            roll = await new Roll(`${hf}`).roll();
        } else {roll = damageRoll}
        await this._applyDamage(tokens, roll, flavor)
    }

    async _applyDamage(tokens, damage, flavor){
        if(!damage?.total || !tokens.length) return
        await new MidiQOL.DamageOnlyWorkflow(null, null, damage.total, this.type, tokens, damage, {flavor: flavor}) 
    }
}

class fluidCanvas extends executable{
    
    get duration(){
        return this._part.duration ? this._part.duration : 500
    }

    get has(){
        return (super.has && this.type) ? true : false
    }

    get intensity(){
        return this._part.intensity ? this._part.intensity : 1
    }

    get iteration(){
        return this._part.iteration ? this._part.iteration : 3
    }
    
    get type(){
        return this._part.type
    }

    get isToggle(){
        return ['black', 'blur', 'drug', 'fade','negative','sepia'].includes(this.type)
    }

    get users(){
        return game.users.map(u => u.id)
    }

    async off(){ 
        if(this.isToggle) await KFC.executeAsGM(this.type, this.users);
    }

    async play(){
        await super.play()
        switch(this.type){
            case 'blur':
                await KFC.executeAsGM(this.type, this.users, this.intensity);
                break;
            case 'drug':
                await KFC.executeAsGM(this.type, this.users, this.intensity, this.duration, this.iteration);
                break;
            case 'black':
            case 'negative':
            case 'sepia':
                await KFC.executeAsGM(this.type, this.users);
                break;
            case 'fade':
                await KFC.executeAsGM(this.type);
                break;
            case 'spin':
            case 'earthquake':
            case 'heartbeat':
                await KFC.executeForEveryone(this.type, this.intensity, this.duration, this.iteration);
                break;
        }
        await this._for();
        await this.off();
    }

    async _for(){
        if(this.isToggle) await delay(this.duration);
    }
}

class lastingEffect extends executableWithFile{

    get activeTiles(){
        return this.flags["monks-active-tiles"] ? this.flags["monks-active-tiles"] : {}
    }

    get alpha(){
        return this._part.alpha
    }

    get flags(){
        return this._part.flags ? this._part.flags : {}
    }

    get hasActiveTiles(){
        return (this.activeTiles.macro?.macroid || this.activeTiles.teleport?.add) ? true : false
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

    get overhead(){
        return this._part.overhead
    }

    get save(){
        return this.data.danger.save.le ? parseInt(this.data.danger.save.le) : super.save
    }

    get z(){
        return this._part.z
    }

    build(){
        const tiles = [];
        for(let i = 0; i < this.data.dualBoundaries.length; i++){
            tiles.push(this._tile(this.data.dualBoundaries[i], i))
        }
        return tiles
    }

    async play(){
        await super.play()
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const tiles = this.build();
            await this.data.scene.createEmbeddedDocuments("Tile", tiles);
        }
    }
    _pairedBoundary(index){
        if(index % 2 && this.data.dualBoundaries.length >= index) return this.data.dualBoundaries[index-1]
        if(this.data.dualBoundaries.length >= index+1) return this.data.dualBoundaries[index+1]
        return this.data.dualBoundaries[index]
    }

    _tile(boundary, index = 0){
        const tile = {
            alpha: this.alpha,
            flags: this.data.flag,
            hidden: this.hidden,
            img: this._file,
            locked: false,
            height: boundary.height * this.scale,
            occlusion: {
                alpha: this.occlusion.alpha,
                mode: CONST.TILE_OCCLUSION_MODES[this.occlusion.mode]
            },
            overhead: (levelsOn && boundary.bottom > 0) ? true : this.overhead,
            rotation: 0,
            scale: this.scale,
            width: boundary.width * this.scale,
            video: {autoplay: true, loop: this.loop, volume: 0},
            x: boundary.A.x - ((this.scale - 1) *  (boundary.width/2)),
            y: boundary.A.y - ((this.scale - 1) *  (boundary.height/2)),
            z: this.z
        };
        if(betterRoofsOn && boundary.bottom) tile.flags['betterroofs'] = {brMode: 3}
        if(levelsOn && boundary.bottom){
            tile.flags['levels'] = {
                "rangeTop": boundary.top,
                "rangeBottom": boundary.bottom,
                "showIfAbove": false,
                "showAboveRange": null,
                "isBasement": false,
                "noFogHide": false
            }
        }
        if(taggerOn && this.tag) tile.flags['tagger'] = this.taggerTag
        if(monksActiveTilesOn && this.hasActiveTiles){
            tile.flags["monks-active-tiles"] = {
                "actions": [],
                "active": true,
                "restriction": "all",
                "controlled": "all",
                "trigger": "enter",
                "pertoken": false,
                "chance": 100
            };
            //macro
            if(this.activeTiles.macro?.macroid){
                tile.flags['monks-active-tiles'].actions.push(
                    {
                        "delay": this.activeTiles.macro.delay,
                        "action": "runmacro",
                        "data": {
                            "macroid": this.activeTiles.macro.macroid,
                            "args": this.activeTiles.macro.args
                        },
                        "id": foundry.utils.randomID(16)
                    }
                )
            };
            if(this.activeTiles.teleport?.add){                
                tile.flags['monks-active-tiles'].actions.push(
                    {
                        "action": "teleport",
                        "data": {
                            "animatepan": this.activeTiles.teleport.animatepan,
                            "avoidtokens": this.activeTiles.teleport.avoidtokens,
                            "deletesource": this.activeTiles.teleport.deletesource,
                            "location": this._pairedBoundary(index).center
                        },
                        "id": foundry.utils.randomID(16)
                    }
                ) 
            }
        }
        return tile
    } 

    async wipe(){
       await super.wipe('Tile')
    }
}

class macro extends executable{

    get _macro(){
        return this._part
    }
    
    get has(){
        return this._macro ? true : false
    }

    get macro(){
        return this._marco ? game.macros.get(this._macro) : false
    }

    async play(){
        if(!this.macro) return
        await super.play()
        await macro.execute(this.data);
    }
}

class mutate extends executable {

    get actor(){
        return this._part.actor ? stringToObj(this._part.actor) : {}
    }

    get embedded(){
        return this._part.embedded ? stringToObj(this._part.embedded) : {}
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
    
    get token(){
        const token = this._part.token ? stringToObj(this._part.token) : {}
        if(this.tag) token['flags'] = {"tagger":this.taggerTag}
        return token
    }

    get updates(){
        return {
            actor: this.actor,
            embedded: this.embedded,
            token: this.token
        }
    }

    async play(){    
        await super.play()            
        for (const token of this.targets) { 
            await warpgate.mutate(token, this.updates, {}, this.options);
        }
    }
}

class primaryEffect extends executableWithFile {
        
    get repeat(){
        return this._part.repeat
    }

    get duration(){
        return this._part.duration
    }

    get hasSources(){
        return (this.source.enabled && (this.source.name || this.data.hasSources))
    }

    get save(){
        return this.data.danger.save.fe ? parseInt(this.data.danger.save.fe) : super.save
    }

    async play(){
        await super.play()
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const result = await this._build();
            if(result.play) result.sequence.play();
        }
    }
    
    async _build(){
        let s = new Sequence(), play = true;
        for (const boundary of this.data.dualBoundaries){
            if(this.hasSources){
                const tagged = this.source.name ? await getTagEntities(this.source.name, this.data.scene) : this.data.sources
                if(tagged.length){
                    for(const document of tagged){
                        const documentName = document.documentName ? document.documentName : document.document.documentName;
                        const source = documentBoundary(documentName, document, {retain:true});
                        if(source.A.x === boundary.A.x && source.A.y === boundary.A.y && source.B.x === boundary.B.x && source.B.y === boundary.B.y){continue}
                        s = this.source.swap ? await this._sequence(source, s, boundary) : await this._sequence(boundary, s, source);
                    }
                } else {
                    play = false
                }
            } else {
                s = this._sequence(boundary, s);
            }
        }
        return {sequence: s, play: play}
    }

    _sequence(boundary, s, source = {}){
        s = s.effect()
            .file(this._file)
            .zIndex(boundary.top)
            if(source.center){
                s = s.atLocation(source.center)
                    .reachTowards(boundary.center)
                    .gridSize(this.scale * 200)
                    .startPoint(this.scale * 200)
                    .endPoint(this.scale * 200);
                    if(this.duration) s = s.waitUntilFinished(this.duration)
            } else {
                s = s.atLocation(boundary.center)
                    .scale(this.scale)
                    .randomizeMirrorX();
                    if(this.duration) s = s.duration(this.duration)
            }
            if(this.repeat) s = s.repeats(this.repeat)
        return s
    }
}

class save extends executable{

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

    get type(){
        return this._part.type
    }

    get succeeded(){
        return this.data.save.succeeded
    }

    _initialize(){
        this.data["save"] = {failed: [], succeeded: []}
    }

    async play(){
        await super.play()
        this._initialize()
        for(const token of this.targets){ 
            if(token.actor){  
                const result = await token.actor.rollAbilitySave(this.type); 
                (!result || result.total < this.diff) ? this.data.save.failed.push(token) : this.data.save.succeeded.push(token)
            } 
        }
    }
}

class secondaryEffect extends executableWithFile {

    get duration(){
        return this._part.duration
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

    async play(){
        await super.play()
        if(!this.save || (this.save > 1 ? this.data.hasFails : this.data.hasSuccesses)){
            const result = await this._build();
            result.play()
        }
    }

    async _build(){
        let s = new Sequence();
        for (const boundary of this.data.dualBoundaries){
            s = this._sequence(boundary, s);
        }
        return s
    }

    _sequence(boundary, s){
        s = s.effect()
            .file(this._file)
            .zIndex(boundary.bottom)
            .atLocation(boundary.center)
            .scale(this.scale);
            if(this.duration) s = s.duration(this.duration)
            if(this.repeat) s = s.repeats(this.repeat)
            if(this.rotate) s = s.randomRotation()
        return s
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
        return this.duplicates ? {"duplicates": this.duplicates} : {}
    }

    get updates(){
        const updates = {token: {elevation: this.data.boundary.bottom}}
        if(this.tag) updates.token['flags'] = {"tagger":this.taggerTag}
        return updates
    }

    async play(){
        await super.play()
        const token = await this.token();
        if(token) await warpgate.spawnAt(this.data.boundary.center, token, this.updates, {}, this.options);
    }

    async token(){
        if(!this.hasActor) await this._setActor();
        const token = this.hasActor ? await game.actors.getName(this.actor).getTokenData() : ''
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
        return this._part.duration
    }   

    get save(){
        return this.data.danger.save.te ? parseInt(this.data.danger.save.te) : super.save
    }
    

    async play(){
        await super.play()
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

    get movesTargets(){
        return (this.v?.dir || this.hz?.dir || this.e?.type) ? true : false
    }

    get save(){
        return this.data.danger.save.tm ? parseInt(this.data.danger.save.tm) : super.save
    }
    
    get targets(){
        let targets = super.targets
        if(this.sToT) targets = tg.concat(this.data.sources.filter(s => targets.find(t => t.id !== s.id))) 
        return targets
    }

    async play() {
        if(this.movesTargets || (this.sToT && this.data.hasSources)){
            for (const token of this.targets) { 
                let amtV = this._v(), amtH = this._hz(), amtE = this._e(), e, x, y;
                if(this.sToT && this.data.sources.find(s => s.id === token.id)){
                    let location = this.data.boundary.center;
                    let tokenBoundary = documentBoundary("Token", token);
                    x = location.x - (tokenBoundary.center.x - tokenBoundary.A.x), y = location.y - (tokenBoundary.center.y - tokenBoundary.A.y);
                    e = this.targetBoundary.bottom;
                } else if (this.movesTargets) {
                    [x, y] = this.walls ? furthestShiftPosition(token, [amtH, amtV]) : canvas.grid.grid.shiftPosition(token.data.x, token.data.y, amtH, amtV)
                    e = this.e.type === 'S' ? amtE : token.data.elevation + amtE;
                    this.data.tokenMovement.push({tokenId: token.id, hz: Math.abs(amtH), v: Math.abs(amtV), e: Math.abs(e - token.data.elevation)})
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
        const adjH = (this.hz.dir === "L" || (this.hz.dir === "R" && Math.round(Math.random()))) ? -1 : 1
        return ((this.hz.min + Math.floor(Math.random() * (this.hz.max - this.hz.min + 1))) * adjH)
    }

    _v(){
        if(!this.v?.dir) return 0
        const adjV = (this.v.dir === "U" || (this.v.dir === "R" && Math.round(Math.random()))) ? -1 : 1
        return ((this.v.min + Math.floor(Math.random() * (this.v.max - this.v.min + 1))) * adjV)
    }

    async _update(){
        const opts = this.flag ? {dangerZoneMove: true} : {};
        await this.data.scene.updateEmbeddedDocuments("Token", this.updates, opts);
    }
}

class tokenSays extends executable {   

    get compendiumName(){
        return this._part.compendiumName
    }
    
    get fileName(){
        return this._part.fileName
    }
    
    get fileTitle(){
        return this._part.fileTitle
    }
    
    get fileType(){
        return this._part.fileType
    }
    
    get likelihood(){
        return this._part.likelihood ? this._part.likelihood : 100
    }

    get has(){
        return (super.has && this.fileType && (this.fileName || this.fileTitle)) ? true : false
    }

    get options(){
        return {
            likelihood: this.likelihood,
            type: this.fileType,
            source: this.fileName,
            compendium: this.compendiumName,
            quote: this.fileTitle
        }
    }

    get save(){
        return this.data.danger.save.ts ? parseInt(this.data.danger.save.ts) : super.save
    }

    async play() {
        await super.play()
        for (const token of this.targets) { 
            await game.modules.get("token-says").api.saysDirect(token.id, '', this.data.scene.id, this.options);
        }
    }
}

class wall extends executable {

    get bottom(){
        return this._part.bottom
    }

    get dir(){
        return this._part.dir
    }

    get door(){
        return this._part.door
    }

    get has(){
        return (super.has && (this.top || this.right || this.bottom || this.left)) ? true : false
    }

    get left(){
        return this._part.left
    }

    get light(){
        return this._part.light
    }

    get move(){
        return this._part.move
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
        return this._part.sense
    }

    get sound(){
        return this._part.sound
    }

    get top(){
        return this._part.top
    }

    get _build(){
        const walls = [];
        if(this.top && this.randomize()) walls.push(this._wall(this.data.boundary.A, {x: this.data.boundary.B.x, y: this.data.boundary.A.y}))
        if(this.right && this.randomize()) walls.push(this._wall({x: this.data.boundary.B.x, y: this.data.boundary.A.y}, this.data.boundary.B))
        if(this.bottom && this.randomize()) walls.push(this._wall(this.data.boundary.B, {x: this.data.boundary.A.x, y: this.data.boundary.B.y}))
        if(this.left && this.randomize()) walls.push(this._wall({x: this.data.boundary.A.x, y: this.data.boundary.B.y}, this.data.boundary.A))
        return walls
    }

    async play(){
        await super.play()
        const walls = this._build;
        if(walls.length) await this.data.scene.createEmbeddedDocuments("Wall",walls)
    }

    randomize(){
        return (!this.random || Math.random() < 0.5)
    }

    _wall(start, end){
        const wall = {
            c:[start.x, start.y, end.x, end.y],
            dir: this.dir,
            door: this.door,
            ds: 0,
            light: FVTTSENSETYPES[this.light],
            move: FVTTMOVETYPES[this.move],
            sense: FVTTSENSETYPES[this.sense],
            sound: FVTTSENSETYPES[this.sound],
            flags: this.data.flag
        }
        if(wallHeightOn && (this.data.boundary.bottom || this.data.boundary.top)) wall.flags['wallHeight'] = {"wallHeightTop": this.data.boundary.top-1, "wallHeightBottom": this.data.boundary.bottom}
        if(taggerOn && this.tag) wall.flags['tagger'] = this.taggerTag
        return wall;
    }  

    async wipe(){
        await super.wipe('Wall')
    }
}

async function delay(delay){
    if(delay) await wait(delay)
}
