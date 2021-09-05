import {dangerZone } from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';
import {dangerZoneDimensions} from './dimensions.js';
import {tokenSaysOn, monksActiveTilesOn, warpgateOn, fluidCanvasOn, sequencerOn} from '../index.js';

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const WORKFLOWSTATES = {
    INIT: 0,
    AWAITLOCATION: 1,
    EXECUTELIKELIHOOD: 2,
    GETZONEDATA: 3,
    GETZONEELIGIBLETOKENS: 4,
    ESTABLISHTARGETBOUNDARY: 5,
    GETZONETARGETS: 6,
    GENERATEFLAVOR: 10,
    GENERATEFLUIDCANVAS: 15,
    GENERATEFOREGROUNDEFFECT: 20,
    GENERATEAUDIOEFFECT: 21,
    GENERATEBACKGROUNDEFFECT: 22,
    CLEARLASTINGEFFECTS: 30,
    GENERATELASTINGEFFECT: 31,
    GENERATEACTIVEEFFECT: 32,
    GENERATEMACRO: 33,
    TOKENSAYS: 50,
    WARPGATE: 51,
    AWAITPROMISES: 95,
    CANCEL: 98,
    COMPLETE: 99
}

export const DANGERZONEREPLACE = {
    "N": "DANGERZONE.replace-types.N.label", 
    "R": "DANGERZONE.replace-types.R.label",
    "T": "DANGERZONE.replace-types.T.label",
    "Z": "DANGERZONE.replace-types.Z.label",
    "A": "DANGERZONE.replace-types.A.label"
}

function getRandomFromArray(array){
    let i = (Math.random() * array.length) | 0
    return array.splice(i, 1)[0]
}

export class workflow {

    constructor(zone) {
        this.active = true,
        this.currentState = WORKFLOWSTATES.INIT,
        this.eligibleTargets = [],
        this.likelihoodResult = 100,
        this.promises = [],
        this.scene = game.scenes.get(zone.scene.sceneId),
        this.targetBoundary = {
            end: {
                x: 0,
                y: 0
            },
            start: {
                x: 0,
                y: 0
            }
        },
        this.targets = [];
        this.twinLocation = {},
        this.userSelectedLocation = {},
        this.zone = zone,
        this.zoneEligibleTokens = [], 
        this.zoneTokens = [], 
        this.zoneType = dangerZoneType.getDangerZoneType(zone.type)
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

    log(message, data){
        dangerZone.log(false,`${message}... `, {workflow: this, data:data});
    }

    async next(nextState){
        await this._next(nextState);
        if(WORKFLOWSTATES[nextState]>=98){return this}
    }

    async _next(state){
        this.currentState = state;
        switch(state) {
            case WORKFLOWSTATES.NONE:
                if (this.zone.options.placeTemplate) {
                    return this.next(WORKFLOWSTATES.AWAITLOCATION);
                } else {return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD)}

            case WORKFLOWSTATES.AWAITLOCATION:
                await this.promptSelectArea();
                break;

            case WORKFLOWSTATES.EXECUTELIKELIHOOD:
                await this.happens();
                this.log('Zone likelihood executed', {});
                if(this.active && this.zoneType) {
                    return this.next(WORKFLOWSTATES.GETZONEDATA)
                } else {
                    return this.next(WORKFLOWSTATES.CANCEL)
                }  
            
            case WORKFLOWSTATES.GETZONEDATA:
                this.getZoneData();
                this.log('Zone tokens got ', {});
                return this.next(WORKFLOWSTATES.GETZONEELIGIBLETOKENS)

            case WORKFLOWSTATES.GETZONEELIGIBLETOKENS:
                this.getZoneEligibleTokens();
                this.log('Zone eligible tokens got ', {});
                return this.next(WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY)

            case WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY:
                let boundaryData = await this.establishTargetBoundary();
                this.log('Zone target boundary and eligible targets established', boundaryData);
                return this.next(WORKFLOWSTATES.GETZONETARGETS)

            case WORKFLOWSTATES.GETZONETARGETS:
                await this.getZoneTargets();
                this.log('Zone targets got', {});
                return this.next(WORKFLOWSTATES.GENERATEFLAVOR)

            case WORKFLOWSTATES.GENERATEFLAVOR:
                this.flavor();
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
                await this.deleteLastingEffects();//hard stop here, pausing those operations that wait for lasting effect delay
                return this.next(WORKFLOWSTATES.GENERATELASTINGEFFECT)

            case WORKFLOWSTATES.GENERATELASTINGEFFECT:
                await this.lastingEffect();//hard stop here, pausing those operations that wait for lasting effect delay
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
                    this.log('Warpgate not active in this world', {warpgateOn: warpgateOn});
                }
                return this.next(WORKFLOWSTATES.AWAITPROMISES) 

            case WORKFLOWSTATES.CANCEL: 
                return this.log('Zone workflow cancelled', {});

            case WORKFLOWSTATES.AWAITPROMISES: 
                Promise.all(this.promises)
                    .then((results) => {
                        this.log('Zone workflow promises returned ', results)
                        return this.next(WORKFLOWSTATES.COMPLETE) 
                    })
                    .catch((e) => {
                        this.log('Zone workflow promise errors ', e);
                        return this.next(WORKFLOWSTATES.CANCEL) 
                    });

            case WORKFLOWSTATES.COMPLETE: 
                    return this.log('Zone workflow complete', {})
        }
    }

    /*prompts the user to select the zone location point (top left grid location) and captures the location*/
    async promptSelectArea() {
        //activate grid layer to allow for select
        let currentLayer = canvas.activeLayer;
        canvas.activateLayer('grid');

        dangerZoneDimensions.addHighlightZone(this.zone.id, this.scene.id, '_wf');

        //notify user that awaiting select
        let info = game.i18n.localize("DANGERZONE.alerts.select-target");
        ui.notifications?.info(info);

        //click once listener, initiates rest of workflow, else workflow ends
        canvas.app.stage.once('pointerdown', event => {
            this.userSelectedLocation = event.data.getLocalPosition(canvas.app.stage);

            dangerZoneDimensions.destroyHighlightZone(this.zone.id, '_wf');
            //return to previous active layer
            currentLayer.activate();

            this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD);
        });
        return
    }
 
    /*Checks random d100 result against the zone's likelihood and outputs a true or false for whether likelihood is met*/
    async happens() {
        if(this.zone.likelihood < 100){
            const maybe = new Roll(`1d100`);
            this.likelihoodResult = await maybe.roll().result;
            if (this.likelihoodResult > this.zone.likelihood){this.active = false}
        }
    }

    getZoneData(){
        return this.zoneTokens = this.zone.zoneTokens();
    }

    getZoneEligibleTokens(){
        return this.zoneEligibleTokens = this.zone.zoneEligibleTokens(this.zoneTokens);
    }

    async establishTargetBoundary() {
        if(Object.keys(this.userSelectedLocation).length){
            return this.getChosenLocationBoundary();
        }
        return await this.getRandomLocationBoundary()
    }

    getChosenLocationBoundary(){
        let boundary = this.zone.scene.locationToBoundary(this.userSelectedLocation.x, this.userSelectedLocation.y, this.zoneType.dimensions.units);
        mergeObject(this.targetBoundary, boundary, {insertKeys: false, enforceTypes: true});
        this.eligibleTargets = this.zone.scene.tokensInBoundaryInZone(this.zoneEligibleTokens, this.targetBoundary);
        return boundary
    }

    async getRandomLocationBoundary() {
        let max = 1, i=0, testBoundary = [];
        if(this.zone.options.runUntilTokenFound && this.zoneEligibleTokens.length){
            max = 10000;
        }
        do {
            i++;
            testBoundary = await this.zone.scene.randomArea();
            if(!testBoundary){return this.next(WORKFLOWSTATES.CANCEL)}
            this.eligibleTargets = this.zone.scene.tokensInBoundaryInZone(this.zoneEligibleTokens, testBoundary);
        }
        while(this.eligibleTargets.length === 0 && i < max);
        mergeObject(this.targetBoundary, testBoundary, {insertKeys: false, enforceTypes: true});
        return {attempts: i, max: max}
    }

    getZoneTargets(){
        if(this.eligibleTargets.length > 1 && !this.zone.options.allInArea){
           return this.targets = getRandomFromArray(this.eligibleTargets)
        }
        return this.targets = this.eligibleTargets
    }

    async deleteLastingEffects() {
        let tileIds;
        switch (this.zone.replace) {
            case 'Z':
                tileIds=canvas.background.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                tileIds=canvas.background.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                tileIds=canvas.background.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                tileIds=canvas.background.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear lasting effects', {});
        }
        await wait(this.zoneTypeOptions.lastingEffect.delay);
		await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
        return this.log('Lasting effects cleared', {tiles: tileIds})
    }

    async createEffectTile(twinTile) {
        const effect = this.zoneTypeOptions.lastingEffect;
        const tiles = [];

        let boundary; 
        if(twinTile){
            boundary = this.twinLocation
        } else {
            boundary = this.targetBoundary
        }

        let whc = this.zone.scene.widthHeightCenterFromLocation(boundary.start.x, boundary.start.y, this.zoneType.dimensions.units)
        

        let newTile = {
            flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}},
            hidden: false,
            img: effect.file,
            locked: false,
            height: whc.h * effect.scale,
            overhead: false,
            rotation: 0,
            scale: effect.scale,
            width: whc.w * effect.scale,
            video: {autoplay: true, loop: effect.loop, volume: 0},
            x: boundary.start.x - ((effect.scale - 1) *  (whc.w/2)),
            y: boundary.start.y - ((effect.scale - 1) *  (whc.h/2)),
            z: 100
        };

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
                        this.twinLocation = await this.zone.scene.randomArea();
                    };

                    let boundaryTwin; 
                    if(twinTile){
                        boundaryTwin = this.targetBoundary;
                    } else {
                        boundaryTwin = this.twinLocation
                    }

                    let whcTwin = this.zone.scene.widthHeightCenterFromLocation(boundaryTwin.start.x, boundaryTwin.start.y, this.zoneType.dimensions.units)
                    newTile.flags['monks-active-tiles'].actions.push(
                        {
                            "action": "teleport",
                            "data": {
                                "animatepan": flag.teleport.animatepan,
                                "avoidtokens": flag.teleport.avoidtokens,
                                "deletesource": flag.teleport.deletesource,
                                "location": whcTwin.c
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
        let location; 
        if(twin){
            location = this.twinLocation.start
        }else{
            location =this.targetBoundary.start
        }
        const whc = this.zone.scene.widthHeightCenterFromLocation(location.x, location.y, this.zoneType.dimensions.units)
        //const rotation = Math.floor(Math.random() * 90) - 45;
        if(this.zoneTypeOptions.foregroundEffect?.file) {
            let s = new Sequence()
                if(this.zoneTypeOptions.foregroundEffect.delay){
                   s = s.wait(this.zoneTypeOptions.foregroundEffect.delay)
                }
                
                s = s.effect()
                    .file(this.zoneTypeOptions.foregroundEffect.file)
                    .atLocation(whc.c)
                    .scale(this.zoneTypeOptions.foregroundEffect.scale)
                    .randomizeMirrorX()

                    if(this.zoneTypeOptions.foregroundEffect.duration){
                        s = s.duration(this.zoneTypeOptions.foregroundEffect.duration)
                    }

                    if(this.zoneTypeOptions.foregroundEffect.repeat){
                        s = s.repeats(this.zoneTypeOptions.foregroundEffect.repeat)
                    }

                s.play()

            return this.log('Zone foreground effect generated', {});
        } 
        return this.log('Zone foreground effect skipped', {});
    }

    async backgroundEffect(twin = false){
        let location; 
        if(twin){
            location = this.twinLocation.start
        }else{
            location =this.targetBoundary.start
        }
        const whc = this.zone.scene.widthHeightCenterFromLocation(location.x, location.y, this.zoneType.dimensions.units)
        
        if(this.zoneTypeOptions.backgroundEffect?.file) {
            let s = new Sequence()
                if(this.zoneTypeOptions.backgroundEffect.delay){
                    s = s.wait(this.zoneTypeOptions.backgroundEffect.delay)
                }
                
                s = s.effect()
                    .file(this.zoneTypeOptions.backgroundEffect.file)
                    .atLocation(whc.c)
                    .scale(this.zoneTypeOptions.backgroundEffect.scale)
                    .belowTokens()
                    .randomRotation()
                    
                    if(this.zoneTypeOptions.backgroundEffect.duration){
                        s = s.duration(this.zoneTypeOptions.backgroundEffect.duration)
                    }

                    if(this.zoneTypeOptions.backgroundEffect.repeat){
                        s = s.repeats(this.zoneTypeOptions.backgroundEffect.repeat)
                    }

                s.play()
            return this.log('Zone background effect generated', {});
        } 
        return this.log('Zone background effect skipped', {});
    }

    async lastingEffect(){
        if(this.zoneTypeOptions.lastingEffect?.file) {//the delay is handled during the clear operation
            let tile = await this.createEffectTile();
            return this.log('Zone lasting effect generated', {tile: tile});
        } 
        return this.log('Zone lasting effect skipped', {});
    }

    async audioEffect() {
        if(this.zoneTypeOptions.audio?.file) {
            const audio = this.zoneTypeOptions.audio;
            await wait(audio.delay);
            const sound = await AudioHelper.play({src: audio.file, volume: audio.volume, loop: false, autoplay: true}, true);
            this.log('Zone audio effect generated', {sound: sound});
            return {audio: sound}
        }
        this.log('Zone audio effect skipped', {});
        return {audio: false}
    }

    async activeEffect() {
        if(Object.keys(this.zoneTypeOptions.effect).length && this.targets.length) {
            for (let i = 0; i < this.targets.length; i++) { 
                await this.targets[i].actor.createEmbeddedDocuments("ActiveEffect", [this.zoneTypeOptions.effect]);
            }
            this.log('Zone active effect generated', {});
            return {activeEffect: this.zoneTypeOptions.effect}
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

    /*Module Integrations*/
    async fluidCanvas(){
        const flag = this.flags?.fluidCanvas;
        if(flag?.type){
            await wait(flag.delay);
            const users = game.users.map(u => u.id);
            switch (flag.type){
                case 'black':
                   await FluidCanvas.black(users);
                   await wait(flag.duration);
                   await FluidCanvas.black(users);
                   break;
                case 'blur':
                    await FluidCanvas.blur(users, flag.intensity);
                    await wait(flag.duration);
                    await FluidCanvas.blur(users);
                    break;
                case 'drug':
                    await FluidCanvas.drugged(users, 1, flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'earthquake':
                    await FluidCanvas.earthquake(flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'heartbeat':
                    await FluidCanvas.heartBeat(flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'negative':
                    await FluidCanvas.negative(users);
                    await wait(flag.duration);
                    await FluidCanvas.negative(users);
                    break;
                case 'sepia':
                    await FluidCanvas.sepia(users);
                    await wait(flag.duration);
                    await FluidCanvas.sepia(users);
                    break;
                case 'spin':
                    await FluidCanvas.spin(flag.intensity, flag.duration, flag.iteration);
                    break;
            }
        }
    }

    async tokenSays() {
        const flag = this.flags?.tokenSays;
        if(this.targets.length && flag?.fileType && (flag?.fileName || flag?.fileType)) {
            const options = {
                type: flag.fileType,
                source: flag.fileName,
                compendium: flag.compendiumName,
                quote: flag.fileTitle
            }
            let actor = '';
            for (let i = 0; i < this.targets.length; i++) { 
                let token = this.targets[i].id;
                await tokenSays.saysDirect(token, actor, this.scene.id, options);
            }
            this.log('Token Says generated', {options: options});
            return {'token-says': options}
        }
        this.log('Token Says skipped', {});
        return {'token-says': false}
    }

    async spawnWarpgate() {
        const flag = this.flags?.warpgate;
        if(flag?.actor){        
            const whc = this.zone.scene.widthHeightCenterFromLocation(this.targetBoundary.start.x, this.targetBoundary.start.y, this.zoneType.dimensions.units)
                   
            let options = {}, callbacks = {}, updates = {}, actor = '';
            if(flag.duplicates > 1){options= {"duplicates": flag.duplicates}}
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
                await warpgate.spawnAt(whc.c, token, updates, callbacks, options);
            }
            this.log('Warpgate spawned! ', {"actor": actor, "warpgate-data": flag});
            return {warpgate: {"actor": actor, "data": flag}}
        }
        this.log('Warpgate skipped ', {})
        return {warpgate: false}
    }
}


