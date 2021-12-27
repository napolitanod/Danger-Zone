import {dangerZone } from '../danger-zone.js';
import {dangerZoneDimensions, point, locationToBoundary, documentBoundary, getTagEntities, furthestShiftPosition} from './dimensions.js';
import {tokenSaysOn, monksActiveTilesOn, warpgateOn, fluidCanvasOn, sequencerOn, betterRoofsOn, levelsOn, taggerOn, wallHeightOn, midiQolOn} from '../index.js';
import {saveTypes, damageTypes, FVTTMOVETYPES, FVTTSENSETYPES} from './constants.js';
import {stringToObj} from './helpers.js';

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const WORKFLOWSTATES = {
    INIT: 0,
    AWAITLOCATION: 1,
    EXECUTELIKELIHOOD: 2,
    GETZONEDATA: 3,
    GETZONEELIGIBLETOKENS: 4,
    ESTABLISHTARGETBOUNDARY: 5,
    HIGHLIGHTTARGETBOUNDARY: 6,
    GETZONETARGETS: 7,
    GENERATEFLAVOR: 8,
    MAKESAVES: 9,
    GENERATEFLUIDCANVAS: 15,
    GENERATEFOREGROUNDEFFECT: 20,
    GENERATEAUDIOEFFECT: 21,
    GENERATEBACKGROUNDEFFECT: 22,
    CLEARLASTINGEFFECTS: 30,
    GENERATELASTINGEFFECT: 31,
    CLEARWALLS: 33,
    GENERATETOKENEFFECT: 34,
    GENERATETOKENMOVE: 35,
    DAMAGETOKEN: 40,
    GENERATEWALLS: 54,
    CLEARLIGHT: 55,
    GENERATELIGHT: 56,
    GENERATEACTIVEEFFECT: 68,
    GENERATEMACRO: 70,
    TOKENSAYS: 80,
    WARPGATE: 81,
    MUTATE: 82,
    AWAITPROMISES: 95,
    CANCEL: 98,
    COMPLETE: 99
}

export class workflow {

    constructor(zone, trigger, options = {}) {
        this.active = true,
        this.currentState = WORKFLOWSTATES.INIT,
        this.eligibleTargets = [],
        this.id = foundry.utils.randomID(16),
        this.likelihoodResult = 100,
        this.previouslyExecuted = options.previouslyExecuted ? options.previouslyExecuted : false,
        this.promises = [],
        this.saveFailed = [],
        this.saveSucceeded = [],
        this.scene = game.scenes.get(zone.scene.sceneId),
        this.targetBoundary,
        this.targets = [];
        this.tokenMovement = [],
        this.trigger = trigger,
        this.twinLocation = {},
        this.userSelectedLocation = options.location ? options.location : {},
        this.userSelectedTargets = options.targets ? options.targets : [],
        this.zone = zone,
        this.zoneBoundary,
        this.zoneEligibleTokens = [], 
        this.zoneTokens = [], 
        this.zoneType = zone.danger
    };

    get flags() {
        return this.zoneType.options.flags
    };

    get zoneTypeOptions() {
        return this.zoneType.options
    };

    get sceneTokens() {
        return this.scene.tokens
    };

    get selectedPoint() {
        return new point(this.userSelectedLocation)
    }

    log(message, data){
        dangerZone.log(false,`${message} ${this.zone.title}... `, {workflow: this, data:data});
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
                if (!this.zoneType){
                    this.log('Zone type does not exist', {});
                    return this.next(WORKFLOWSTATES.CANCEL)
                }
                if (this.zone.options.placeTemplate) {
                    return this.next(WORKFLOWSTATES.AWAITLOCATION);
                } else {return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD)}

            case WORKFLOWSTATES.AWAITLOCATION:
                this.log('Prompt location', {});
                await this.promptSelectZArea();
                if(!('x' in this.userSelectedLocation ) || !('y' in this.userSelectedLocation) || !('z' in this.userSelectedLocation)){
                    ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.user-selection-exited"));
                    return this.next(WORKFLOWSTATES.CANCEL)
                }
                return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD);

            case WORKFLOWSTATES.EXECUTELIKELIHOOD:
                await this.happens();
                this.log('Zone likelihood executed', {});
                if(this.active && this.zoneType) {
                    return this.next(WORKFLOWSTATES.GETZONEDATA)
                } else {
                    this.gmChatDetails();
                    return this.next(WORKFLOWSTATES.CANCEL)
                }  
            
            case WORKFLOWSTATES.GETZONEDATA:
                await this.getZoneData();
                this.log('Zone tokens got ', {});
                return this.next(WORKFLOWSTATES.GETZONEELIGIBLETOKENS)

            case WORKFLOWSTATES.GETZONEELIGIBLETOKENS:
                this.getZoneEligibleTokens()
                this.log('Zone eligible tokens got ', {});
                return this.next(WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY)

            case WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY:
                await this.establishTargetBoundary();
                this.log('Zone target boundary and eligible targets established', {});
                return this.next(WORKFLOWSTATES.HIGHLIGHTTARGETBOUNDARY)

            case WORKFLOWSTATES.HIGHLIGHTTARGETBOUNDARY:
               // this.promises.push(this.highlightTargetBoundary())
                this.highlightTargetBoundary()
                return this.next(WORKFLOWSTATES.GETZONETARGETS)

            case WORKFLOWSTATES.GETZONETARGETS:
                await this.getZoneTargets();
                this.log('Zone targets got', {});
                this.gmChatDetails();
                return this.next(WORKFLOWSTATES.GENERATEFLAVOR)

                
            case WORKFLOWSTATES.GENERATEFLAVOR:
                if(!this.previouslyExecuted){this.flavor();}
                return this.next(WORKFLOWSTATES.MAKESAVES)

            case WORKFLOWSTATES.MAKESAVES:
                if(Object.keys(saveTypes()).length){
                    await this.makeTokenSaves();
                }
                return this.next(WORKFLOWSTATES.GENERATEFLUIDCANVAS)

            case WORKFLOWSTATES.GENERATEFLUIDCANVAS:
                if(fluidCanvasOn){
                    this.promises.push(this.fluidCanvas());
                } else {
                    this.log('Fluid Canvas not active in this world', {fluidCanvasOn: fluidCanvasOn});
                }
                return this.next(WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT:
                if(sequencerOn){
                    this.promises.push(this.foregroundEffect());
                } else {
                    this.log('Fore/Background effects skipped - Sequencer not active in this world', {sequencerOn: sequencerOn});
                }
                return this.next(WORKFLOWSTATES.GENERATEAUDIOEFFECT)

            case WORKFLOWSTATES.GENERATEAUDIOEFFECT:
                this.promises.push(this.audioEffect());
                return this.next(WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT:
                if(sequencerOn){
                    this.promises.push(this.backgroundEffect());
                }
                return this.next(WORKFLOWSTATES.CLEARLASTINGEFFECTS)

            case WORKFLOWSTATES.CLEARLASTINGEFFECTS:
                if(!this.previouslyExecuted){await this.deleteLastingEffects();}//hard stop here, pausing those operations that wait for lasting effect delay
                return this.next(WORKFLOWSTATES.GENERATELASTINGEFFECT)

            case WORKFLOWSTATES.GENERATELASTINGEFFECT:
                await this.lastingEffect();//hard stop here, pausing those operations that wait for lasting effect delay
                return this.next(WORKFLOWSTATES.CLEARWALLS)

            case WORKFLOWSTATES.CLEARWALLS:
                if(!this.previouslyExecuted){await this.deleteWalls();}//hard stop here
                return this.next(WORKFLOWSTATES.GENERATETOKENEFFECT)

            case WORKFLOWSTATES.GENERATETOKENEFFECT:
                this.promises.push(this.tokenEffect());
                return this.next(WORKFLOWSTATES.GENERATETOKENMOVE) 

            case WORKFLOWSTATES.GENERATETOKENMOVE:
                this.promises.push(this.tokenMove());
                return this.next(WORKFLOWSTATES.DAMAGETOKEN)

            case WORKFLOWSTATES.DAMAGETOKEN:
                if(midiQolOn){
                    this.promises.push(this.damageTokens());
                }
                return this.next(WORKFLOWSTATES.GENERATEWALLS)
                
            case WORKFLOWSTATES.GENERATEWALLS:
                this.promises.push(this.createWalls());
                return this.next(WORKFLOWSTATES.CLEARLIGHT) 

            case WORKFLOWSTATES.CLEARLIGHT:
                if(!this.previouslyExecuted){await this.deleteLight();}//hard stop here
                return this.next(WORKFLOWSTATES.GENERATELIGHT)

            case WORKFLOWSTATES.GENERATELIGHT:
                this.promises.push(this.createLight());
                return this.next(WORKFLOWSTATES.GENERATEACTIVEEFFECT) 
                 
            case WORKFLOWSTATES.GENERATEACTIVEEFFECT:
                this.promises.push(this.activeEffect());
                return this.next(WORKFLOWSTATES.GENERATEMACRO)  

            case WORKFLOWSTATES.GENERATEMACRO:
                this.promises.push(this.macro());
                return this.next(WORKFLOWSTATES.TOKENSAYS) 

            case WORKFLOWSTATES.TOKENSAYS:
                if(tokenSaysOn){
                    this.promises.push(this.tokenSays());
                } else {
                    this.log('TokenSays not active in this world', {tokenSaysOn: tokenSaysOn});
                }
                return this.next(WORKFLOWSTATES.WARPGATE) 

            case WORKFLOWSTATES.WARPGATE:
                if(warpgateOn){
                    this.promises.push(this.spawnWarpgate())
                } else {
                    this.log('Spawn Skipped: Warpgate not active in this world', {warpgateOn: warpgateOn});
                }
                return this.next(WORKFLOWSTATES.MUTATE) 

            case WORKFLOWSTATES.MUTATE:
                if(warpgateOn){
                    this.promises.push(this.mutate())
                } else {
                    this.log('Mutate skipped: Warpgate not active in this world', {warpgateOn: warpgateOn});
                }
                return this.next(WORKFLOWSTATES.AWAITPROMISES) 

            case WORKFLOWSTATES.CANCEL: 
                this.active = false
                this.log('Zone workflow cancelled', {});
                return this

            case WORKFLOWSTATES.AWAITPROMISES: 
                return await Promise.all(this.promises)
                    .then((results) => {
                        this.log('Zone workflow promises returned ', results)
                        return this.next(WORKFLOWSTATES.COMPLETE) 
                    })
                    .catch((e) => {
                        this.log('Zone workflow promise errors ', e);
                        return this.next(WORKFLOWSTATES.CANCEL) 
                    });

            case WORKFLOWSTATES.COMPLETE: 
                this.active = false
                this.previouslyExecuted = true;
                return this.log('Zone workflow complete', {})
        }
    }
    
    /*prompts the user to select the zone location point (top left grid location) and captures the location*/
    async promptSelectZArea() {
        if(this.zone.options.noPrompt) {
            this.userSelectedLocation.z = 0;
            return await this.promptSelectXYArea();
        }  
        return new Promise((resolve, reject) => {
            new Dialog({
                title: game.i18n.localize("DANGERZONE.alerts.input-z"),
                content: `<p>${game.i18n.localize("DANGERZONE.alerts.enter-z")}</p><center><input type="number" id="zInput" min="0" steps="1" value="0"></center><br>`,
                buttons: {
                    submit: {
                        label: game.i18n.localize("DANGERZONE.yes"),
                        icon: '<i class="fas fa-check"></i>',
                        callback: async (html) => {
                            this.userSelectedLocation.z = parseInt(html.find("#zInput")[0].value);
                            await this.promptSelectXYArea();
                            resolve(true)
                            }
                        },
                    cancel:  {
                        label: game.i18n.localize("DANGERZONE.cancel"),
                        icon: '<i class="fas fa-times"></i>',
                        callback: () => {
                            resolve(null)
                            }
                        }
                    },
                default: 'submit'
                }, {width: 75}).render(true);
        });
    }

    async promptSelectXYArea(){
        let currentLayer = canvas.activeLayer;
        canvas.activateLayer('grid');
        
        dangerZoneDimensions.destroyHighlightZone(this.zone.id, '', this.zone.scene.dangerId);
        await dangerZoneDimensions.addHighlightZone(this.zone.id, this.scene.id, '_wf', this.zone.scene.dangerId);

        return new Promise((resolve, reject)=>{
            ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-target"));
            canvas.app.stage.once('pointerdown', event => {
                let selected = event.data.getLocalPosition(canvas.app.stage);
                resolve(selected);
            })
        }).then((selected)=> {
                this.userSelectedLocation.x = selected.x;
                this.userSelectedLocation.y = selected.y;
                dangerZoneDimensions.destroyHighlightZone(this.zone.id, '_wf', this.zone.scene.dangerId);    
                currentLayer.activate();
        });  
    }
 
    /*Checks random d100 result against the zone's likelihood and outputs a true or false for whether likelihood is met*/
    async happens() {
        if(this.zone.likelihood < 100){
            const maybe = await new Roll(`1d100`).roll();
            this.likelihoodResult = maybe.result;
            if (this.likelihoodResult > this.zone.likelihood){this.active = false}
        }
    }

    async getZoneData(){
        this.zoneBoundary = await this.zone.scene.boundary();
        return this.zoneTokens = this.zoneBoundary.tokensIn(this.sceneTokens);
    }

    getZoneEligibleTokens(){
        return this.zoneEligibleTokens = this.zone.zoneEligibleTokens(this.zoneTokens);
    }

    async establishTargetBoundary() {
        if(Object.keys(this.userSelectedLocation).length){
            return this.getChosenLocationBoundary();
        }
        await this.getRandomLocationBoundary()
    }

    async highlightTargetBoundary(){
        if(this.targetBoundary && game.user.isGM && game.settings.get(dangerZone.ID, 'display-danger-boundary')){
            this.targetBoundary.highlight(this.id, 16711719)
            await wait(5000)
            this.targetBoundary.destroyHighlight(this.id);
        }
    }

    getChosenLocationBoundary(){
        const options = {excludes: this.zoneBoundary.excludes}
        this.zone.stretch(options);
        this.targetBoundary = locationToBoundary(this.selectedPoint, this.zoneType.dimensions.units, options);
        this.eligibleTargets = this.targetBoundary.tokensIn(this.zoneEligibleTokens);
    }

    async getRandomLocationBoundary() {
        let max = 1, i=0;
        const testBoundary = await this.zone.scene.randomDangerBoundary();
        const targetPool = this.userSelectedTargets.length ? this.userSelectedTargets : this.zoneEligibleTokens;
        this.log('Test Boundary Got...', {'testBoundary': testBoundary});
        if((this.userSelectedTargets.length || this.zone.options.runUntilTokenFound) && targetPool.length){
            max = 10000;
        }
        do {
            i++;
            const b = testBoundary.next()
            if(!b || b.done){return this.next(WORKFLOWSTATES.CANCEL)}
            this.targetBoundary = b.value;
            this.eligibleTargets = this.targetBoundary.tokensIn(targetPool);
        }
        while(this.eligibleTargets.length === 0 && i < max);
        return {attempts: i, max: max}
    }

    getZoneTargets(){
        if(!this.zone.options.allInArea){
            if(this.userSelectedTargets.length){
                return this.targets = this.userSelectedTargets
            }
            if(this.eligibleTargets.length > 1){
                return this.targets.push(this.eligibleTargets[Math.floor(Math.random() * this.eligibleTargets.length)])
            }
        }
        return this.targets = this.eligibleTargets
    }

    async makeTokenSaves(){
        const save = this.zoneTypeOptions.flags.tokenResponse?.save
        if(save && save.enable){
            const tg = this.zone.sourceTreatment(save.source, this.targets);
            if(tg.length){
                for(let token of tg){ 
                    if(token.actor){  
                        let res = await token.actor.rollAbilitySave(save.type); 
                        if(!res || res.total < save.diff) {this.saveFailed.push(token)} else {this.saveSucceeded.push(token)}
                    } 
                }
                return this.log('Zone token saves generated', {});
            }
        }
        return this.log('Zone token save skipped', {});
    }

    async gmChatDetails() {
        if(game.user.isGM && game.settings.get(dangerZone.ID, 'chat-details-to-gm')) {   
            let content = "Danger: " + this.zoneType.name + " w" + this.zoneType.dimensions.units.w + " h" + this.zoneType.dimensions.units.h  + " d" + this.zoneType.dimensions.units.d +
                "<br>Zone: bleed " + this.zone.options.bleed + ", hit all " + this.zone.options.allInArea + ", always hits " + this.zone.options.runUntilTokenFound + ", likelihood " + this.zone.likelihood +
                "<br>Likelihood result: " + this.likelihoodResult;
            if(this.targetBoundary?.A){
                content += "<br>Eligible zone tokens: " + this.zoneEligibleTokens.map(t => t.data.name) +
                "<br>Target boundary start: x" + this.targetBoundary.A.x + " y" + this.targetBoundary.A.y + " z" + this.targetBoundary.A.z +
                "<br>Target boundary end: x" + this.targetBoundary.B.x + " y" + this.targetBoundary.B.y + " z" + this.targetBoundary.B.z +
                "<br>Eligible targets: " + this.eligibleTargets.map(t => t.data.name) +
                "<br>Hit targets: " + this.targets.map(t => t.data.name)
            } 
            ChatMessage.create({
                content: content,
                whisper: [game.user.id]
            },{chatBubble : false})
        }
    }

    async deleteLastingEffects() {
        let tileIds=[];
        switch (this.zone.replace) {
            case 'Z':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear lasting effects', {});
        }
        if(tileIds.length){
            await wait(this.zoneTypeOptions.lastingEffect.delay);
            await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
        }
        return this.log('Lasting effects cleared', {tiles: tileIds})
    }

    async createEffectTile(twinTile) {
        const effect = this.zoneType.lastingEffect;
        const tiles = [];
        const boundary = twinTile ? this.twinLocation : this.targetBoundary
        const file = await this.zoneType.lastingEffectFile();
        let newTile = {
            alpha: effect.alpha,
            flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}},
            hidden: effect.hidden,
            img: effect.file,
            locked: false,
            height: boundary.height * effect.scale,
            occlusion: {
                alpha: effect.occlusion.alpha,
                mode: CONST.TILE_OCCLUSION_MODES[effect.occlusion.mode]
            },
            overhead: (levelsOn && boundary.bottom > 0) ? true : effect.overhead,
            rotation: 0,
            scale: effect.scale,
            width: boundary.width * effect.scale,
            video: {autoplay: true, loop: effect.loop, volume: 0},
            x: boundary.A.x - ((effect.scale - 1) *  (boundary.width/2)),
            y: boundary.A.y - ((effect.scale - 1) *  (boundary.height/2)),
            z: effect.z
        };

        if(betterRoofsOn && boundary.bottom){
            newTile.flags['betterroofs'] = {
                brMode: 3
            }
        }

        if(levelsOn && boundary.bottom){
            newTile.flags['levels'] = {
                "rangeTop": boundary.top,
                "rangeBottom": boundary.bottom,
                "showIfAbove": false,
                "showAboveRange": null,
                "isBasement": false,
                "noFogHide": false
            }
        }

        if(taggerOn && this.zoneTypeOptions.lastingEffect.tag){
            newTile.flags['tagger'] = {
                "tags": [this.zoneTypeOptions.lastingEffect.tag]
            }
        }

        if(monksActiveTilesOn){
            const flag = this.flags?.["monks-active-tiles"];
            if(flag?.macro?.macroid || flag?.teleport) {
                newTile.flags["monks-active-tiles"] = {
                    "actions": [],
                    "active": true,
                    "restriction": "all",
                    "controlled": "all",
                    "trigger": "enter",
                    "pertoken": false,
                    "chance": 100
                };

                //macro
                if(flag.macro?.macroid){
                    newTile.flags['monks-active-tiles'].actions.push(
                        {
                            "delay": flag.macro.delay,
                            "action": "runmacro",
                            "data": {
                                "macroid": flag.macro.macroid,
                                "args": flag.macro.args
                            },
                            "id": foundry.utils.randomID(16)
                        }
                    )
                };

                //teleport
                if(flag.teleport?.add){
                    if(isObjectEmpty(this.twinLocation)){
                        const rBoundary = await this.zone.scene.randomDangerBoundary();
                        this.twinLocation = rBoundary.next().value
                    };
                    const boundaryTwin = twinTile ? this.targetBoundary : this.twinLocation;
                    
                    newTile.flags['monks-active-tiles'].actions.push(
                        {
                            "action": "teleport",
                            "data": {
                                "animatepan": flag.teleport.animatepan,
                                "avoidtokens": flag.teleport.avoidtokens,
                                "deletesource": flag.teleport.deletesource,
                                "location": boundaryTwin.center
                            },
                            "id": foundry.utils.randomID(16)
                        }
                    )
                    
                    if(flag.teleport.twin && !twinTile && sequencerOn){
                        this.promises.push(this.foregroundEffect(true));
                        this.promises.push(this.backgroundEffect(true));
                        return await this.createEffectTile(newTile);
                    } 
                }
            }
        }

        tiles.push(newTile);
        if(twinTile){tiles.push(twinTile)}

        return await this.scene.createEmbeddedDocuments("Tile", tiles);
    }

    flavor() {
        if(this.zone.flavor) {   
            ChatMessage.create({
                content : this.zone.flavor
            },{chatBubble : false})
            return this.log('Zone flavor generated', {});
        }
        return this.log('Zone flavor skipped', {});
    }

    async foregroundEffect(twin = false){
        const fe = this.zoneTypeOptions.foregroundEffect;
        if(fe?.file) {
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.fe);
            if(!sv || (sv > 1 ? this.saveFailed.length : this.saveSucceeded.length)){
                const boundary = twin ? this.twinLocation : this.targetBoundary;
                let s = new Sequence()
                if(fe.delay){s = s.wait(fe.delay)}
                if(fe.source?.enabled && (fe.source?.name || this.zone.sources.length)){
                    let tagged;
                    if(fe.source?.name){
                        tagged = await getTagEntities(fe.source.name, this.scene);
                    } else{tagged = this.zone.sources}

                    if(tagged && tagged.length){
                        for(let i=0; i<tagged.length; i++){
                            const document = tagged[i]
                            const documentName = document.documentName ? document.documentName : document.document.documentName;
                            const source = documentBoundary(documentName, document, {retain:true});
                            if(source.A.x === boundary.A.x && source.A.y === boundary.A.y && source.B.x === boundary.B.x && source.B.y === boundary.B.y){continue}
                            s = fe.source.swap ? await this._foregroundSequence(source, s, boundary) : await this._foregroundSequence(boundary, s, source);
                        }
                    } else {
                        return this.log('Zone foreground effect skipped - no source', {});
                    }
                } else {
                    s = await this._foregroundSequence(boundary, s);
                }
                s.play()
                return this.log('Zone foreground effect generated', {});
            }
        } 
        return this.log('Zone foreground effect skipped', {});
    }

    async _foregroundSequence(boundary, s, source = {}){
        const fe = this.zoneType.foregroundEffect;
        const file = await this.zoneType.foregroundEffectFile();
        s = s.effect()
            .file(file)
            .zIndex(boundary.top)
            if(source.center){
                s = s.atLocation(source.center)
                    .reachTowards(boundary.center)
                    .gridSize(fe.scale * 200)
                    .startPoint(fe.scale * 200)
                    .endPoint(fe.scale * 200)
                    if(fe.duration){
                        s = s.waitUntilFinished(fe.duration)
                    }
            } else {
                s = s.atLocation(boundary.center)
                .scale(fe.scale)
                .randomizeMirrorX()
                if(fe.duration && fe.duration>0){
                    s = s.duration(fe.duration)
                }
            }
            if(fe.repeat){
                s = s.repeats(fe.repeat)
            }
        return s
    }

    async backgroundEffect(twin = false){ 
        const be = this.zoneType.backgroundEffect;
        if(be && be.file) {
            const file = await this.zoneType.backgroundEffectFile();
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.be);
            if(!sv || (sv > 1 ? this.saveFailed.length : this.saveSucceeded.length)){
                const boundary = twin ? this.twinLocation : this.targetBoundary;      
                let s = new Sequence()
                    if(be.delay){
                        s = s.wait(be.delay)
                    }
                    s = s.effect()
                        .file(file)
                        .atLocation(boundary.center)
                        .scale(be.scale)
                        .zIndex(boundary.bottom)
                        if(be.rotate){
                            s = s.randomRotation()
                        }
                        if(be.duration){
                            s = s.duration(be.duration)
                        }
                        if(be.repeat){
                            s = s.repeats(be.repeat)
                        }
                    s.play()
                return this.log('Zone background effect generated', {});
            }
        } 
        return this.log('Zone background effect skipped', {});
    }

    async lastingEffect(){
        if(this.zoneTypeOptions.lastingEffect?.file) {//the delay is handled during the clear operation
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.le);
            if(!sv || (sv > 1 ? this.saveFailed.length : this.saveSucceeded.length)){
                let tile = await this.createEffectTile();
                return this.log('Zone lasting effect generated', {tile: tile});
            }
        } 
        return this.log('Zone lasting effect skipped', {});
    }

    async audioEffect() {
        if(this.zoneTypeOptions.audio?.file) {
            const audio = this.zoneTypeOptions.audio;
            await wait(audio.delay);
            const sound = await AudioHelper.play({src: audio.file, volume: audio.volume, loop: false, autoplay: true}, true);
            if(audio.duration){
                sound.schedule(() => sound.fade(0), audio.duration);//set a duration based on system preferences.
                sound.schedule(() => sound.stop(), (audio.duration+1)); //stop once fade completes (1000 milliseconds default)
            }
            this.log('Zone audio effect generated', {sound: sound});
            return {audio: sound}
        }
        this.log('Zone audio effect skipped', {});
        return {audio: false}
    }

    async tokenEffect(){
        const te = this.zoneType.tokenEffect;
        if(te && te.file) {
            const file = await this.zoneType.tokenEffectFile();
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.te);
            let tg = sv ? (sv > 1 ? this.saveFailed : this.saveSucceeded) : this.targets;
            tg = this.zone.sourceTreatment(te.source, tg);
            for (let i = 0; i < tg.length; i++) { 
                let s = new Sequence()
                if(te.delay){
                   s = s.wait(te.delay)
                }
                s = s.effect()
                    .file(file)
                    .attachTo(tg[i])
                    .scale(te.scale)
                if(te.below){
                    s.belowTokens()
                }
                if(te.duration){
                   s = s.duration(te.duration)
                    .fadeOut(500)
                } else {
                    s=s.persist()
                }
                s.play()
            }
            return this.log('Zone token effect generated', {});
        } 
        return this.log('Zone token effect skipped', {});
    }

    async damageTokens(){
        const damage = this.zoneTypeOptions.flags.tokenResponse?.damage
        if(damage && damage.enable && damage.amount){
            if(damage.delay){await wait(damage.delay)}
            const targets = this.zone.sourceTreatment(damage.source, this.targets);
            if(damage.amount.indexOf('@')===-1 && damage.flavor.indexOf('@elevation')===-1 && damage.flavor.indexOf('@moved')===-1){
                const damageRoll = await new Roll(damage.amount).roll();
                if(!this.zoneTypeOptions.flags.tokenResponse.save?.enable || damage.save==='F'){
                    await this._determineDamage(false, damageRoll, damage.type, targets, damage.flavor)
                } 
                else { 
                    if(this.saveFailed.length){await this._determineDamage(false, damageRoll, damage.type, this.saveFailed, damage.flavor)}
                    if(damage.save === 'H' && this.saveSucceeded.length){await this._determineDamage(true, damageRoll, damage.type, this.saveSucceeded, damage.flavor)}
                }
            } else {
                for(let i = 0; i < targets.length; i++){
                    const tg = targets[i];
                    if(damage.save ==='N' && this.saveSucceeded.find(t => t.id === tg.id)){continue;}
                    const isHalf = (damage.save === 'H' && this.saveSucceeded.find(t => t.id === tg.id)) ? true : false;
                    const mvMods = this.tokenMovement.find(t => t.tokenId === tg.id);
                    const e = mvMods?.e ? mvMods.e : 0; const mv = Math.max((mvMods?.v ? mvMods.v : 0), (mvMods?.v ? mvMods.v : 0));
                    let dice = damage.amount.replace(/@elevation/i,e).replace(/@moved/i,mv);
                    const damageRoll = await new Roll(dice).roll();     
                    let flavor = damage.flavor.replace(/@elevation/i,e).replace(/@moved/i,mv);
                    await this._determineDamage(isHalf, damageRoll, damage.type, [tg], flavor)
                }
            }
            return this.log('Zone token damage applied', {});
        }
        return this.log('Zone token damage skipped', {});
    }

    async _determineDamage(isHalf, damageRoll, type, tokens, flavorAdd){
        let roll; const types = damageTypes();
        let flavor = `<label>${isHalf ? 'Half ': ''}${types[type]} damage on ${damageRoll?.formula} roll result of ${damageRoll.result}.</label><br>${flavorAdd.replace(/@alias/i, tokens.map(t => t.name).join(', '))}`;
        if(isHalf){
            let hf = Math.floor(damageRoll.total/2);
            roll = await new Roll(`${hf}`).roll();
        } else {roll = damageRoll}
        await this._damageApply(tokens, roll, type, flavor)
    }

    async _damageApply(tokens, damage, type, flavor){
        if(!damage?.total || !tokens.length) {return}
        this.log('Zone token Midi Damage Workflow started', {tokens: tokens, damage: damage, type: type, flavor: flavor});
        await new MidiQOL.DamageOnlyWorkflow(null, null, damage.total, type, tokens, damage, {flavor: flavor}) 
    }

    async activeEffect() {
        const eff = this.zoneTypeOptions.effect;
        if(Object.keys(eff).length) {
            let flgs = eff.flags?.['danger-zone'];
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.ae);
            let tg = sv ? (sv > 1 ? this.saveFailed : this.saveSucceeded) : this.targets;
            tg = this.zone.sourceTreatment(flgs?.source, tg);
            if(flgs?.delay){await wait(flgs.delay)}
            for (let i = 0; i < tg.length; i++) { 
                if(flgs?.limit && tg[i].actor && tg[i].actor.effects.find(e => e.data.flags['danger-zone']?.origin === this.zoneType.id)){
                    continue;
                }
                await tg[i].actor.createEmbeddedDocuments("ActiveEffect", [eff]);
            }
            this.log('Zone active effect generated', {});
            return {activeEffect: eff}
        }
        this.log('Zone active effect skipped', {});
        return {activeEffect: false}
    }

    async macro() {
        if(this.zoneTypeOptions.macro) {
            const macro = await game.macros.get(this.zoneTypeOptions.macro);
            if(macro){
                await macro.execute(this);
                this.log('Zone macro generated', {macro: macro});
            } else {
                this.log('Zone macro not Found', {});
            }
            return {macro: macro}
        }
        this.log('Zone macro skipped', {});
        return {macro: false}
    }

    async deleteWalls() {
        let ids;
        switch (this.zone.wallReplace) {
            case 'Z':
                ids=this.scene.walls.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                ids=this.scene.walls.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                ids=this.scene.walls.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                ids=this.scene.walls.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear walls', {});
        }
		await canvas.scene.deleteEmbeddedDocuments("Wall", ids);
        return this.log('Walls cleared', {walls: ids})
    }

    async createWalls() {
        if(this.zoneTypeOptions.wall?.top || this.zoneTypeOptions.wall?.right || this.zoneTypeOptions.wall?.bottom || this.zoneTypeOptions.wall?.left) {
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.wall);
            if(!sv || (sv > 1 ? this.saveFailed.length : this.saveSucceeded.length)){
                const walls = [];
                if(this.zoneTypeOptions.wall?.top && (!this.zoneTypeOptions.wall.random || Math.random() < 0.5)){walls.push(this._wallData(this.targetBoundary.A, {x: this.targetBoundary.B.x, y: this.targetBoundary.A.y}))}
                if(this.zoneTypeOptions.wall?.right && (!this.zoneTypeOptions.wall.random || Math.random() < 0.5)){walls.push(this._wallData({x: this.targetBoundary.B.x, y: this.targetBoundary.A.y}, this.targetBoundary.B))}
                if(this.zoneTypeOptions.wall?.bottom && (!this.zoneTypeOptions.wall.random || Math.random() < 0.5)){walls.push(this._wallData(this.targetBoundary.B, {x: this.targetBoundary.A.x, y: this.targetBoundary.B.y}))}
                if(this.zoneTypeOptions.wall?.left && (!this.zoneTypeOptions.wall.random || Math.random() < 0.5)){walls.push(this._wallData({x: this.targetBoundary.A.x, y: this.targetBoundary.B.y}, this.targetBoundary.A))}
                if(walls.length){await this.scene.createEmbeddedDocuments("Wall",walls)}
                return this.log('Zone walls generated', {wall: walls});
            }
        }
        return this.log('Zone walls not generated', {});
    }

    _wallData(start, end){
        const obj = {
            c:[start.x, start.y, end.x, end.y],
            dir: this.zoneTypeOptions.wall.dir,
            door: this.zoneTypeOptions.wall.door,
            ds: 0,
            light: FVTTSENSETYPES[this.zoneTypeOptions.wall.light],
            move: FVTTMOVETYPES[this.zoneTypeOptions.wall.move],
            sense: FVTTSENSETYPES[this.zoneTypeOptions.wall.sense],
            sound: FVTTSENSETYPES[this.zoneTypeOptions.wall.sound],
            flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}}
        }

        if(wallHeightOn && (this.targetBoundary.bottom || this.targetBoundary.top)){
            obj.flags['wallHeight'] = {
                "wallHeightTop": this.targetBoundary.top-1,
                "wallHeightBottom": this.targetBoundary.bottom
            }
        }

        if(taggerOn && this.zoneTypeOptions.wall.tag){
            obj.flags['tagger'] = {
                "tags": [this.zoneTypeOptions.wall.tag]
            }
        }
        
        return obj;
    }

    async deleteLight() {
        let lightIds;
        switch (this.zone.lightReplace) {
            case 'Z':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear ambient lighting', {});
        }
		await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightIds);
        return this.log('Ambient light cleared', {lights: lightIds})
    }

    async createLight() {
        if(this.zoneTypeOptions.ambientLight?.dim || this.zoneTypeOptions.ambientLight?.bright) {
            let c = this.targetBoundary.center

            const light = {
                config: {
                    alpha: Math.pow(this.zoneTypeOptions.ambientLight.tintAlpha, 2).toNearest(0.01),
                    angle: this.zoneTypeOptions.ambientLight.angle,
                    animation: {
                        reverse: false,
                        speed: this.zoneTypeOptions.ambientLight.lightAnimation.speed,
                        intensity: this.zoneTypeOptions.ambientLight.lightAnimation.intensity,
                        type: this.zoneTypeOptions.ambientLight.lightAnimation.type
                    },
                    bright: this.zoneTypeOptions.ambientLight.bright,
                    color: this.zoneTypeOptions.ambientLight.tintColor,
                    coloration: 1,
                    contrast: 0,
                    darkness: {min:0, max:1},
                    dim: this.zoneTypeOptions.ambientLight.dim,
                    gradual: true,
                    luminosity: 0.5,
                    saturation: 0,
                    shadows: 0
                },               
                hidden: false,
                rotation: this.zoneTypeOptions.ambientLight.rotation,
                vision: false,
                walls: true,
                x: c.x,
                y: c.y,
                flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}}
            }

            if(levelsOn && (this.targetBoundary.bottom || this.targetBoundary.top)){
                light.flags['levels'] = {
                    "rangeTop": this.targetBoundary.top,
                    "rangeBottom": this.targetBoundary.bottom
                }
            }
            if(taggerOn && this.zoneTypeOptions.ambientLight.tag){
                light.flags['tagger'] = {
                    "tags": [this.zoneTypeOptions.ambientLight.tag]
                }
            }
            await this.scene.createEmbeddedDocuments("AmbientLight",[light]);
            return this.log('Zone ambient light generated', {light: light});
        }
        return this.log('Zone ambient light not generated', {});
    }

    /*Module Integrations*/
    async fluidCanvas(){
        const flag = this.flags?.fluidCanvas;
        if(flag?.type){
            if(flag.delay){await wait(flag.delay)}
            const users = game.users.map(u => u.id);
            switch (flag.type){
                case 'black':
                   await KFC.executeAsGM("black",users);
                   await wait(flag.duration);
                   await KFC.executeAsGM("black",users);
                   break;
                case 'blur':
                    await KFC.executeAsGM("blur",users, flag.intensity);
                    await wait(flag.duration);
                    await KFC.executeAsGM("blur",users);
                    break;
                case 'drug':
                    await KFC.executeAsGM("drug",users, flag.intensity, flag.duration, flag.iteration);
                    await wait(flag.duration);
                    await KFC.executeAsGM("drug",users);
                    break;
                case 'earthquake':
                    await KFC.executeForEveryone("earthquake", flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'heartbeat':
                    await KFC.executeForEveryone("heartbeat", flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'negative':
                    await KFC.executeAsGM("negative",(users));
                    await wait(flag.duration);
                    await KFC.executeAsGM("negative",(users));
                    break;
                case 'sepia':
                    await KFC.executeAsGM("sepia",(users));
                    await wait(flag.duration);
                    await KFC.executeAsGM("sepia",(users));
                    break;
                case 'spin':
                    await KFC.executeForEveryone("spin",flag.intensity, flag.duration, flag.iteration);
                    break;
            }
        }
    }

    async tokenMove() {
        const move = this.zoneTypeOptions.tokenMove;
        if(move && ((this.targets.length && (move.v?.dir || move.hz?.dir || move.e?.type)) || (move.sToT && this.zone.sources.length))) {
            if(move.delay > 0){
                await wait(move.delay);
            }

            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.tm);
            let tg = sv ? (sv > 1 ? this.saveFailed : this.saveSucceeded) : this.targets;
            tg = this.zone.sourceTreatment(move.source, tg);
            if(move.sToT){tg = this.zone.sourceAdd(tg)}

            const updates = [];
            for (let i = 0; i < tg.length; i++) { 
                let token = this.scene.tokens.get(tg[i].id);
                if(!token){continue;}
                let amtV = 0, amtH = 0, amtE =0, e, x, y;
                if(move.sToT && this.zone.isSource(token)){
                    let srcCnt = this.targetBoundary.center;
                    let tBnd = documentBoundary("Token", token);
                    x = srcCnt.x - (tBnd.center.x - tBnd.A.x), y = srcCnt.y - (tBnd.center.y - tBnd.A.y);
                    e = this.targetBoundary.bottom;
                } else if (move.v?.dir || move.hz?.dir || move.e?.type) {
                    if(move.v?.dir){
                        let adjV = 1;
                        if(move.v.dir === "U" || (move.v.dir === "R" && Math.round(Math.random()))){adjV=-1}
                        amtV = ((move.v.min + Math.floor(Math.random() * (move.v.max - move.v.min + 1))) * adjV)
                    }
                    if(move.hz?.dir){
                        let adjH = 1;
                        if(move.hz.dir === "L" || (move.hz.dir === "R" && Math.round(Math.random()))) {adjH=-1}
                        amtH = ((move.hz.min + Math.floor(Math.random() * (move.hz.max - move.hz.min + 1))) * adjH)
                    }
                    if(move.e?.type){
                        amtE = (move.e.min + Math.floor(Math.random() * (move.e.max - move.e.min + 1)))
                    }
                    [x, y] = move.walls ? furthestShiftPosition(token, [amtH, amtV]) : canvas.grid.grid.shiftPosition(token.data.x, token.data.y, amtH, amtV)
                    e = move.e.type === 'S' ? amtE : token.data.elevation + amtE;
                    this.tokenMovement.push({tokenId: token.id, hz: Math.abs(amtH), v: Math.abs(amtV), e: Math.abs(e - token.data.elevation)})
                }
                updates.push({"_id": token.id,"x": x,"y": y, "elevation": e});
            }
            const opts = move.flag ? {dangerZoneMove: true} : {};
            await this.scene.updateEmbeddedDocuments("Token",updates, opts);
            return this.log('Token Move generated', {options: updates});
        }
        return this.log('Token Move skipped', {});
    }

    async tokenSays() {
        const flag = this.flags?.tokenSays;
        if(flag){
            if(flag.fileType && (flag.fileName || flag.fileType)) {
                if(flag.delay > 0){
                    await wait(flag.delay);
                }
                const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.ts);
                let tg = sv ? (sv > 1 ? this.saveFailed : this.saveSucceeded) : this.targets;
                tg = this.zone.sourceTreatment(flag.source, tg);
                const options = {
                    likelihood: flag.likelihood ? flag.likelihood : 100,
                    type: flag.fileType,
                    source: flag.fileName,
                    compendium: flag.compendiumName,
                    quote: flag.fileTitle
                }
                let actor = '';
                for (let i = 0; i < tg.length; i++) { 
                    let token = tg[i].id;
                    await tokenSays.saysDirect(token, actor, this.scene.id, options);
                }
                this.log('Token Says generated', {options: options});
                return {'token-says': options}
            }
        }
        this.log('Token Says skipped', {});
        return {'token-says': false}
    }

    async spawnWarpgate() {
        const flag = this.flags?.warpgate;
        if(flag?.actor){                           
            let options = {}, callbacks = {}, updates = {token: {elevation: this.targetBoundary.bottom}}, actor = '';
            if(flag.duplicates > 1){options= {"duplicates": flag.duplicates}}
            if(flag.tag){updates.token['flags'] = {"tagger":{"tags": [flag.tag]}}}
            if(flag.isRolltable){
                let table = game.tables.getName(flag.actor);
                if(!table){return dangerZone.log(false,'Warpgate Rolltable Not Found ', {"warpgate-data": flag})}
                let rolledResult = await table.roll(); 
                actor = rolledResult.results[0].data.text;
            } else {actor = flag.actor}
            const token = await game.actors.getName(actor).getTokenData();
        
            if(!token){return this.log('Warpgate Token is Blank ', {"warpgate-data": flag})}
            else {
                if(flag.delay > 0){
                    await warpgate.wait(flag.delay);
                }
                await warpgate.spawnAt(this.targetBoundary.center, token, updates, callbacks, options);
            }
            this.log('Warpgate spawned! ', {"actor": actor, "warpgate-data": flag});
            return {warpgate: {"actor": actor, "data": flag}}
        }
        this.log('Warpgate skipped ', {})
        return {warpgate: false}
    }

    async mutate() {
        const mutate = this.flags?.mutate;
        if(mutate?.token || mutate?.actor || mutate?.embedded){                           
            const updates = {}, options = {};
            if (mutate.token) updates['token']  = stringToObj(mutate.token);
            if (mutate.actor) updates['actor'] =  stringToObj(mutate.actor)
            if (mutate.embedded) updates['embedded'] = stringToObj(mutate.embedded)
            if(mutate.permanent) options['permanent'] = mutate.permanent;
            if(mutate.tag){updates.token['flags'] = {"tagger":{"tags": [mutate.tag]}}}
            if(mutate.delay) await warpgate.wait(mutate.delay);
            const sv = parseInt(this.zoneTypeOptions.flags.tokenResponse?.save?.mt);
            let tg = sv ? (sv > 1 ? this.saveFailed : this.saveSucceeded) : this.targets;
            tg = this.zone.sourceTreatment(mutate.source, tg);
            for (const token of tg) { 
                await warpgate.mutate(token, updates, {}, options);
            }
            return this.log('Mutation Peformed! ', {"targets": tg, "mutation-data": mutate});
        }
        return this.log('Mutation skipped ', {})
    }
}


