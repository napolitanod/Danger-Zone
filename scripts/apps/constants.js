import { dangerZone } from '../danger-zone.js';

export const WORKFLOWSTATES = {
    NONE: 0,
    INITIALIZE: 1,
    EXECUTE: 2,
    INFORM: 3,
    CANCEL: 98,
    COMPLETE: 99
}

export const PLACEABLESBYDOCUMENT =  {
    'Tile': 'tiles',
    'Wall': 'walls',
    'AmbientLight': 'lights',
    'AmbientSound': 'sounds',
    'Region': 'regions',
    'fxmaster-particle':'fxmaster-particle'
}

export const WORLDZONE = {
    dimensions: {
        bleed: false,
        bottom: 0,
        stretch: '',
        top: 0
    },
    source: {
        area: '',
        actors: [],
        dispositions: [],
        exclusion: {
          conditions: []
        },
        limit: {
          min: 0,
          max: 0
        },
        tags: [],
        target: ''
    },
    replace: {
        light: 'N',
        region: 'N',
        sound: 'N',
        tile: 'N',
        wall: 'N',
        weather: 'N'
    },
    target: {
        actors: [],
        all: false,
        always: false,
        choose:{
          enable: false,
          prompt: true
        },
        dispositions: [],
        exclusion: {
          conditions: []
        }
    },
    trigger: {
        delay: {min: 0, max: 0},
        likelihood: 100,
        loop: 1,
        operation: "Q"
    },
    flavor: "",
    enabled: true
  }

export const AMBIENTLIGHTCLEAROPS = {
    'D': 'DANGERZONE.light.clear-types.delete',
    'O': 'DANGERZONE.light.clear-types.off'
}

export const COMBATINITIATIVE = {
    '': "DANGERZONE.type-form.combat.initiative.type.options.none",
    "R": "DANGERZONE.type-form.combat.initiative.type.options.roll",
    "S": "DANGERZONE.type-form.combat.initiative.type.options.set"
}

export const SCENEFORMICONDISPLAYOPTIONS = {
    'B': 'DANGERZONE.setting.scene-header.display.iconLabel', 
    'I': 'DANGERZONE.setting.scene-header.display.iconOnly', 
    'N': 'DANGERZONE.setting.scene-header.display.none'
};

export const TRIGGERDISPLAYOPTIONS = {
    "S": "DANGERZONE.trigger-display-options.scene.label",
    "H":"DANGERZONE.trigger-display-options.hotbar.label"
}

export const TOKENDISPOSITION = {
    "0": "DANGERZONE.token-disposition.neutral.label",
    "1": "DANGERZONE.token-disposition.friendly.label",
    "-1": "DANGERZONE.token-disposition.hostile.label"
}

export const DANGERZONEREPLACE = {
    "N": "DANGERZONE.replace-types.N.label", 
    "R": "DANGERZONE.replace-types.R.label",
    "T": "DANGERZONE.replace-types.T.label",
    "Z": "DANGERZONE.replace-types.Z.label",
    "A": "DANGERZONE.replace-types.A.label"
}

export const DANGERZONELIGHTREPLACE = {
    "N": "DANGERZONE.light.replace-types.N.label", 
    "R": "DANGERZONE.light.replace-types.R.label",
    "T": "DANGERZONE.light.replace-types.T.label",
    "Z": "DANGERZONE.light.replace-types.Z.label",
    "A": "DANGERZONE.light.replace-types.A.label"
}

export const DANGERZONEREGIONREPLACE = {
    "N": "DANGERZONE.region.replace-types.N.label", 
    "R": "DANGERZONE.region.replace-types.R.label",
    "T": "DANGERZONE.region.replace-types.T.label",
    "Z": "DANGERZONE.region.replace-types.Z.label",
    "A": "DANGERZONE.region.replace-types.A.label"
}

export const DANGERZONESOUNDREPLACE = {
    "N": "DANGERZONE.sound.replace-types.N.label", 
    "R": "DANGERZONE.sound.replace-types.R.label",
    "T": "DANGERZONE.sound.replace-types.T.label",
    "Z": "DANGERZONE.sound.replace-types.Z.label",
    "A": "DANGERZONE.sound.replace-types.A.label"
}

export const DANGERZONEWALLREPLACE = {
    "N": "DANGERZONE.wall.replace-types.N.label", 
    "R": "DANGERZONE.wall.replace-types.R.label",
    "T": "DANGERZONE.wall.replace-types.T.label",
    "Z": "DANGERZONE.wall.replace-types.Z.label",
    "A": "DANGERZONE.wall.replace-types.A.label"
}

export const DANGERZONEWEATHERREPLACE = {
    "N": "DANGERZONE.weather.replace-types.N.label", 
    "T": "DANGERZONE.weather.replace-types.T.label",
    "A": "DANGERZONE.weather.replace-types.A.label"
}

export const EVENTS = {
    "api": {
        automated: false,
        chat: {
            event: false
        },
        combat: {
            event: false
        },
        label:  "DANGERZONE.events.api.label",
        movement: false,
        zone: false
    },
    "manual":  {
        automated: false,
        chat: {
            event: false
        },
        combat: {
            event: false
        },
        label: "DANGERZONE.events.manual.label",
        movement: false,
        zone: true
    },
    "aura": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: false
        },
        label: "DANGERZONE.events.aura.label",
        movement: true,
        zone: true
    }, 
    "move": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: false
        },
        label:  "DANGERZONE.events.move.label",
        movement: true,
        zone: true
    },
    "chat-rolltable": {
        automated: true,
        chat: {
            event: true,
            type: 'R'
        },
        combat: {
            event: false
        },
        label:  "DANGERZONE.events.chat-rolltable.label",
        movement: false,
        zone: true
    },
    "combat-start": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'start',
            period: 'combat'
        },
        label:  "DANGERZONE.events.combat-start.label",
        movement: false,
        zone: true
    }, 
    "combat-end": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'end',
            period: 'combat'
        },
        label: "DANGERZONE.events.combat-end.label",
        movement: false,
        zone: true
    },  
    "extension": {
        automated: false,
        chat: {
            event: false
        },
        combat: {
            event: false
        },
        label:  "DANGERZONE.events.extension.label",
        movement: false,
        zone: false
    },
    "initiative-start": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'start',
            period: 'initiative'
        },
        label:  "DANGERZONE.events.initiative-start.label",
        movement: false,
        zone: true
    },  
    "initiative-end": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'end',
            period: 'initiative'
        },
        label:  "DANGERZONE.events.initiative-end.label",
        movement: false,
        zone: true
    },  
    "round-start": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'start',
            period: 'round'
        },
        label:  "DANGERZONE.events.round-start.label",
        movement: false,
        zone: true
    }, 
    "round-end": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'end',
            period: 'round'
        },
        label:  "DANGERZONE.events.round-end.label",
        movement: false,
        zone: true
    }, 
    "turn-start": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'start',
            period: 'turn'
        },
        label:  "DANGERZONE.events.turn-start.label",
        movement: false,
        zone: true
    }, 
    "turn-end": {
        automated: true,
        chat: {
            event: false
        },
        combat: {
            event: true,
            threshold:'end',
            period: 'turn'
        },
        label:  "DANGERZONE.events.turn-end.label",
        movement: false,
        zone: true
    } 
};
export const AUTOMATED_EVENTS = Object.entries(EVENTS).filter(e => e[1].automated).map(([k,v]) => k);
export const EVENT_OPTIONS = Object.entries(EVENTS ).filter(e => e[1].zone).reduce((obj,[k,v]) => {obj[k] = v.label; return obj;}, {});
export const CHAT_EVENTS = Object.entries(EVENTS).filter(e => e[1].chat.event).map(([k,v]) => k);
export const COMBAT_EVENTS = Object.entries(EVENTS).filter(e => e[1].combat.event).map(([k,v]) => k);
export const COMBAT_PERIOD_INITIATIVE_EVENTS = Object.entries(EVENTS).filter(e => e[1].combat.period === 'initiative').map(([k,v]) => k);
export const COMBAT_THRESHOLD_END_EVENTS = Object.entries(EVENTS).filter(e => e[1].combat.threshold === 'end').map(([k,v]) => k);
export const COMBAT_PERIOD_COMBAT_EVENTS = Object.entries(EVENTS).filter(e => e[1].combat.period === 'combat').map(([k,v]) => k);
export const MANUAL_EVENTS = Object.entries(EVENTS).filter(e => !e[1].automated).map(([k,v]) => k);
export const MOVEMENT_EVENTS = Object.entries(EVENTS).filter(e => e[1].movement).map(([k,v]) => k);

export const DANGERZONETRIGGERSORT = {
    "manual":  8,
    "aura": 21,
    "move": 20,
    "chat-rolltable": 15,
    "combat-start":  7,
    "combat-end":  0,
    "initiative-start":  2,
    "initiative-end":  5,
    "round-start":  3,
    "round-end":  4,
    "turn-start":  1,
    "turn-end":  6
} 

export const MIGRATION_DANGER = {
    INITIAL: 0,
    WORLD: 1,
    MULTI: 2
}

export const MIGRATION_ZONE = {
    INITIAL: 0,
    REGION: 1,
    MULTI: 2
}

export const TRIGGEROPERATION = {
    "Q": "DANGERZONE.trigger-operation.sequential",
    "G": "DANGERZONE.trigger-operation.staggered",
    "T": "DANGERZONE.trigger-operation.together"
}

export const SOURCETREATMENT = {
    "": "DANGERZONE.source.treatment.none",
    "I": "DANGERZONE.source.treatment.ignore",
    "S": "DANGERZONE.source.treatment.also",
    "O": "DANGERZONE.source.treatment.only"
}

//a few options are added via the setModOptions function if tagger is on
export const SOURCEAREA = {
    "": "DANGERZONE.source.area.none",
    "A": "DANGERZONE.source.area.actor",
    "D": "DANGERZONE.source.area.danger.placeable",
    "T": "DANGERZONE.source.area.tag",
    "Z": "DANGERZONE.source.area.zone.placeable"
}

export const SOURCEAREAGLOBALZONE = {
    "": "DANGERZONE.source.area.none",
    "A": "DANGERZONE.source.area.actor",
    "D": "DANGERZONE.source.area.danger.placeable",
    "T": "DANGERZONE.source.area.tag"
}

export const SOURCEAREATARGET = {
    "": "DANGERZONE.source.target.none",
    "A": "DANGERZONE.source.target.adjacent",
    "I": "DANGERZONE.source.target.in",
    "B": "DANGERZONE.source.target.both"
}

export const SOURCEDANGERLOCATION = {
    "A": "DANGERZONE.source.danger.location.actor",
    "R": "DANGERZONE.source.danger.location.area",
    "B": "DANGERZONE.source.danger.location.both"
}

export const STRETCH = {
    "": "",
    "B": "DANGERZONE.stretch.bottom.label",
    "G": "DANGERZONE.stretch.ground.label",
    "S": "DANGERZONE.stretch.sky.label",
    "T": "DANGERZONE.stretch.top.label"
}

export const HORIZONTALMOVEMENT = {
    "": "",
    "D": "DANGERZONE.type-form.tokenMove.horizontal-directions.left.label",
    "U": "DANGERZONE.type-form.tokenMove.horizontal-directions.right.label",
    "R": "DANGERZONE.type-form.tokenMove.horizontal-directions.random.label"
}

export const VERTICALMOVEMENT = {
    "": "",
    "D": "DANGERZONE.type-form.tokenMove.vertical-directions.down.label",
    "U": "DANGERZONE.type-form.tokenMove.vertical-directions.up.label",
    "R": "DANGERZONE.type-form.tokenMove.vertical-directions.random.label"
}

export const ELEVATIONMOVEMENT = {
    "": "",
    "R": "DANGERZONE.type-form.tokenMove.elevation-types.relative.label",
    "S": "DANGERZONE.type-form.tokenMove.elevation-types.set.label"
}

export const SCENEFOREGROUNDELEVATIONMOVEMENT = {
    "": "",
    "R": "DANGERZONE.type-form.scene.foreground.e.types.relative.label",
    "S": "DANGERZONE.type-form.scene.foreground.e.types.set.label"
}

export const SCENEGLOBALILLUMINATION = {
    "": "",
    "Y": "DANGERZONE.type-form.scene.globalLight.options.Y.label",
    "N": "DANGERZONE.type-form.scene.globalLight.options.N.label"
}

export const CANVASTYPES = {
    "": "",
    "shake": "DANGERZONE.type-form.canvas.types.shake"
}

export const OFFSETOPTIONS = {
    "": "DANGERZONE.type-form.offset.type.options.non.label",
    "pct": "DANGERZONE.type-form.offset.type.options.pct.label",
    "pxl": "DANGERZONE.type-form.offset.type.options.pxl.label"
}

export const MIRRORIMAGEOPTIONS = {
    "": "DANGERZONE.type-form.offset.flip.options.none.label",
    "L": "DANGERZONE.type-form.offset.flip.options.location.label",
    "A": "DANGERZONE.type-form.offset.flip.options.image-always.label",
    "S": "DANGERZONE.type-form.offset.flip.options.image-sometimes.label",
    "B": "DANGERZONE.type-form.offset.flip.options.both.label",
    "N": "DANGERZONE.type-form.offset.flip.options.any.label"
}

export const MIRRORROTATIONOPTIONS = {
    "": "DANGERZONE.type-form.offset.flip.options.none.label",
    "L": "DANGERZONE.type-form.offset.flip.options.location.label",
    "A": "DANGERZONE.type-form.offset.flip.options.rotation-always.label",
    "S": "DANGERZONE.type-form.offset.flip.options.rotation-sometimes.label",
    "B": "DANGERZONE.type-form.offset.flip.options.both.label",
    "N": "DANGERZONE.type-form.offset.flip.options.any.label"
}

export const SOURCETRIGGERS = {
    "": "DANGERZONE.edit-form.source.triggers.any",
    "C": "DANGERZONE.edit-form.source.triggers.scene",
    "S": "DANGERZONE.edit-form.source.triggers.source"
}

export const TOKENSAYSTYPES = {
    "audio":  "DANGERZONE.type-form.tokenSays.rule-type-option.playlist",
    "rollTable":  "DANGERZONE.type-form.tokenSays.rule-type-option.roll-table"
}

export const DAMAGEONSAVE = {
    "N": "DANGERZONE.type-form.tokenResponse.damage.save.options.none",
    "H":"DANGERZONE.type-form.tokenResponse.damage.save.options.half",
    "F": "DANGERZONE.type-form.tokenResponse.damage.save.options.full"
}

export const SAVERESULT = {
    0: "DANGERZONE.type-form.tokenResponse.save.result.both",
    2: "DANGERZONE.type-form.tokenResponse.save.result.fail",
    1: "DANGERZONE.type-form.tokenResponse.save.result.success"
}

export const ITEMTARGET = {
    "A": "DANGERZONE.item.target.add",
    "B": "DANGERZONE.item.target.add-unless",
    "D": "DANGERZONE.item.target.delete",
    "E": "DANGERZONE.item.target.delete-all",
    "U": "DANGERZONE.item.target.update"
}

export const DOORSTATES = {
    0: "DANGERZONE.doorStates.closed",
    1: "DANGERZONE.doorStates.open",
    2: "DANGERZONE.doorStates.locked"
}

export const FVTTDOORSTATES = {
    0: 0,
    1: 1,
    2: 2
}

export function actorOps(){
    return game.actors.reduce((obj, a) => {obj[a.id] = a.name; return obj;}, {})
}

export function regionOps(sceneId){
    return game.scenes.get(sceneId).regions.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

export function sceneOps(){
    return game.scenes.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

export const MOVETYPES = {
    0: "DANGERZONE.restrictions.none",
    1: "DANGERZONE.restrictions.normal"
}

export const FVTTMOVETYPES = {
    0: 0,
    1: 20
}

export const REGIONSHAPETYPEOPTIONS = {
    "ellipse": "DANGERZONE.type-form.region.type.options.ellipse",
    "rectangle": "DANGERZONE.type-form.region.type.options.rectangle"
}

export const REGIONVISIBILITY = {
    'LAYER': "DANGERZONE.type-form.region.visibility.options.layer",
    'GAMEMASTER': "DANGERZONE.type-form.region.visibility.options.gamemaster",
    'ALWAYS': "DANGERZONE.type-form.region.visibility.options.always"
}

export const SENSETYPES = {
    0: "DANGERZONE.restrictions.none",
    2: "DANGERZONE.restrictions.limited",
    1: "DANGERZONE.restrictions.normal",
    3: "DANGERZONE.restrictions.proximity",
    4: "DANGERZONE.restrictions.distance",

}

export const FVTTSENSETYPES = {
    0: 0,
    1: 20,
    2: 10,
    3: 30,
    4: 40
}

export function dirTypes(){ 
    return Object.keys(CONST.WALL_DIRECTIONS).reduce((obj, key) => {
        let k = CONST.WALL_DIRECTIONS[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
}

export function doorTypes(){
    return Object.keys(CONST.WALL_DOOR_TYPES).reduce((obj, key) => {
        let k = CONST.WALL_DOOR_TYPES[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
}

export function animationTypes() {
    const animationTypes = {"": game.i18n.localize("DANGERZONE.none")};
    for ( let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations) ) {
      animationTypes[k] = v.label;
    }
    return animationTypes;
}

export function determineMacroList() {
  let list = {};
  for (let macro of game.macros.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
    list[macro.id] = macro.name;
  }
  return list;
}

export function determineMacroListUuid() {
    let list = {'': ''};
    for (let macro of game.macros.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
      list[macro.uuid] = macro.name;
    }
    return list;
  }

export function regionEvents(){
    return Object.keys(CONST.REGION_EVENTS).reduce((obj, key) => {
        let k = CONST.REGION_EVENTS[key];
        let v = game.i18n.localize(`DANGERZONE.region.events.options.${k}`)
        obj[k] = v === key ? key.titleCase().replace('_',' ').replace('_',' ') : v;
        return obj;
    }, {})
}


export function saveTypes() {
    switch(game.world.system){
        case "dnd5e":
            const saveEntries = {};
            for ( let [k, v] of Object.entries(game.dnd5e.config.abilities) ) {
                saveEntries[k] = v.label;
            }
            return saveEntries;
        default:
            return {}
    }
}

export function damageTypes() {
    switch(game.world.system){
        case "dnd5e":
            const damageEntries = {};
            for ( let [k, v] of Object.entries(Object.assign(game.dnd5e.config.damageTypes, game.dnd5e.config.healingTypes)) ) {
                damageEntries[k] = v.label;
            }
            return damageEntries
        default:
            return {}
    }
}

export const TILEOCCLUSIONMODES = {
    "NONE": "DANGERZONE.occlusionmodes.none",
    "FADE": "DANGERZONE.occlusionmodes.fade",
    "RADIAL": "DANGERZONE.occlusionmodes.radial",
    "VISION": "DANGERZONE.occlusionmodes.vision"
}

export const TIMESUPMACROREPEAT = {
    "startEveryTurn": "DANGERZONE.times-up-macro.start",
    "endEveryTurn": "DANGERZONE.times-up-macro.end"
}

export const WALLSBLOCK = {
    "" : "DANGERZONE.walls-block.none.label",
    "A" : "DANGERZONE.walls-block.all.label"
}

export const TILESBLOCK = {
    "" : "DANGERZONE.tiles-block.none.label",
    "A" : "DANGERZONE.tiles-block.all.label",
    "R" : "DANGERZONE.tiles-block.roof.label",
    "B" : "DANGERZONE.tiles-block.bottom.label",
    "T" : "DANGERZONE.tiles-block.top.label"
}

export function setModOptions(){
    if(dangerZone.MODULES.taggerOn){
        SOURCEAREA["C"] = "DANGERZONE.source.area.danger.tile"; 
        SOURCEAREAGLOBALZONE["C"] = "DANGERZONE.source.area.danger.tile"; 
        SOURCEAREA["Y"] = "DANGERZONE.source.area.zone.tile";  
    }     
}

const TOKENSAYSFILETYPEENTITYTYPE = {
    rollTable: "RollTable",
    audio: "Playlist",
    item: "Item"
  }

export function getCompendiumOps(fileType){
    return game.packs.filter((x) => x.documentName == TOKENSAYSFILETYPEENTITYTYPE[fileType]).reduce((obj, p) => {obj['']=''; obj[p.collection] = p.title; return obj;}, {})
}

export function weatherTypes() {
    const obj = {'':''}
    Object.assign(obj, Object.fromEntries(Object.entries(CONFIG.weatherEffects).filter(w => !w[1].id.includes('fxmaster')).map(k=> [`foundry.${k[0]}`,`${game.i18n.localize(k[1].label)} (Foundry)`])))
    if(dangerZone.MODULES.fxMasterOn) Object.assign(obj,Object.fromEntries(Object.entries(CONFIG.fxmaster.particleEffects).map(k=> [k[0],`${k[1].name.replace('ParticleEffect','')} (FXMaster)`])))
    return obj
}

export function weatherParameters(type) {
    if(dangerZone.MODULES.fxMasterOn) return CONFIG.fxmaster.particleEffects[type]?.parameters
}

export const ZONEEXTENSIONINTERACTIONOPTIONS = {
    "T": "DANGERZONE.edit-form.extension.interaction.options.trigger",
    "A": "DANGERZONE.edit-form.extension.interaction.options.enable",
    "D": "DANGERZONE.edit-form.extension.interaction.options.disable",
    "G": "DANGERZONE.edit-form.extension.interaction.options.toggle",
    "R": "DANGERZONE.edit-form.extension.interaction.options.add-region",
    "P": "DANGERZONE.edit-form.extension.interaction.options.replace-region",
    "S": "DANGERZONE.edit-form.extension.interaction.options.swap-region"
}

export const ZONEEXTENSIONSEQUENCEOPTIONS = {
    "1": "DANGERZONE.edit-form.extension.sequence.options.after",
    "-1": "DANGERZONE.edit-form.extension.sequence.options.before",
    "0": "DANGERZONE.edit-form.extension.sequence.options.same"
}

export const EXECUTABLEOPTIONS = {};

export function setExecutableOptions(){
    Object.assign(EXECUTABLEOPTIONS, {
            'effect': {
                title: "Active Effect", 
                icon: "fas fa-hand-sparkles",
                modules: [{active: dangerZone.MODULES.activeEffectOn, name: "game-system", dependent: true}],
                scope: "token"
            },
            'audio': {
                title: "Audio", 
                icon: "fas fa-music", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: false}],
                scope: "scene"
            },
            'combat': {
                title: "Combat", 
                icon: "fas fa-swords", 
                modules: [{active: dangerZone.MODULES.portalOn, name: "portal", dependent: false}],
                scope: "scene"
            },
            'foregroundEffect': {
                title: "Primary Effect", 
                icon: "fas fa-bolt", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'ambientLight': {
                title: "Ambient Light", 
                icon: "fas fa-lightbulb", 
                document: "AmbientLight", 
                wipeable: true, 
                modules: [
                    {active: dangerZone.MODULES.perfectVisionOn, name: "perfect-vision", dependent: false},
                    {active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'canvas': {
                title: "Canvas", 
                icon: "fas fa-wind", 
                modules: [
                    {active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}
                ],
                scope: "scene"
            },
            'damage': {
                title: "Damage", 
                icon: "fas fa-skull", 
                scope: "token"
            },
            'item': {
                title: "Item", 
                icon: "fas fa-suitcase", 
                modules: [{active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false},{active: dangerZone.MODULES.itemPileOn, name: "item-piles", dependent: false}],
                scope: "token"
            },
            'lastingEffect': {
                title: "Lasting Effect", 
                icon: "fas fa-cube", 
                document: "Tile",  
                wipeable: true, 
                modules: [
                    {active: dangerZone.MODULES.monksActiveTilesOn, name: "monks-active-tiles", dependent: false},
                    {active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'macro': {
                title: "Macro", 
                icon: "fas fa-file-code",
                scope: "scene"
            },
            'mutate': {
                title: "Mutate", 
                icon: "fas fa-pastafarianism", 
                modules:[
                    {active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false}
                ],
                scope: "token"
            },
            'backgroundEffect': {
                title: "Secondary Effect", 
                icon: "fas fa-bomb", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'region': {
                document: "Region", 
                title: "Region", 
                icon: "fa-solid fa-expand",
                scope: "boundary",
                wipeable: true
            },
            'rolltable':{
                title: 'Roll Table',
                icon: "fas fa-th-list",
                scope: "scene"
            },
            'save': {
                title: "Save", 
                icon: "fas fa-shield-alt",
                scope: "token"
            },
            'scene': {
                title: "Scene", 
                icon: "fas fa-map", 
                document: 'scene',
                wipeable: false,
                modules:[],
                scope: "scene"
            },
            'sound': {
                title: "Sound", 
                icon: "fas fa-volume-high", 
                document: "AmbientSound", 
                modules:[],
                wipeable: true, 
                scope: "boundary"
            },
            'sourceEffect': {
                title: "Source Effect", 
                icon: "fas fa-dragon", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'warpgate': {
                title: "Spawn", 
                icon: "fas fa-circle-notch", 
                modules:[
                    {active: dangerZone.MODULES.portalOn, name: "portal", dependent: true}, 
                    {active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'tokenMove': {
                title: "Token Move", 
                icon: "fas fa-arrows-alt",
                scope: "token"
            },
            'tokenEffect': {
                title: "Token Effect", 
                icon: "fas fa-male", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "token"
            },
            'tokenSays': {
                title: "Token Says", 
                icon: "fas fa-comment", 
                modules: [{active: dangerZone.MODULES.tokenSaysOn, name: "token-says", dependent: true}],
                scope: "token"
            },
            'wall': {
                title: "Wall", 
                icon: "fas fa-university", 
                document: "Wall",  
                wipeable: true,
                modules:[
                    {active: dangerZone.MODULES.wallHeightOn, name: "wall-height", dependent: false}, 
                    {active: dangerZone.MODULES.taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'weather': {
                title: "Weather", 
                icon: "fas fa-cloud-rain", 
                document: 'fxmaster-particle',
                wipeable: true,
                modules:[
                    {active: dangerZone.MODULES.fxMasterOn, name: "fxmaster", dependent: false}
                ],
                scope: "scene"
            },
            'flavor': {
                title: "Flavor", 
                icon:"fas fa-book",
                scope: "scene"
            } 
        });
  }

  export const WIPEABLES = {
        tiles: {
            name: 'tiles',
            setting: 'scene-control-button-display',
            id: 'danger-zone-tile-effects-clear',
            title: "DANGERZONE.controls.clearEffectsTile.label",
            wipeId: 'Tile' 
        },
        lighting: {
            name: 'lighting',
            setting: 'scene-control-light-button-display',
            id: 'danger-zone-lighting-effects-clear',
            title: "DANGERZONE.controls.clearAmbientLight.label",
            wipeId: 'AmbientLight' 
        },
        sounds: {
            name: 'sounds',
            setting: 'scene-control-sound-button-display',
            id: 'danger-zone-sounds-clear',
            title: "DANGERZONE.controls.clearAmbientSound.label",
            wipeId: 'AmbientSound' 
        },
        regions: {
            name: 'regions',
            setting: 'scene-control-region-button-display',
            id: 'danger-zone-regions-clear',
            title: "DANGERZONE.controls.clearRegion.label",
            wipeId: 'Region' 
        },
        walls: {
            name: 'walls',
            setting: 'scene-control-wall-button-display',
            id: 'danger-zone-wall-effects-clear',
            title: "DANGERZONE.controls.clearWall.label",
            wipeId: 'Wall' 
        }

  }