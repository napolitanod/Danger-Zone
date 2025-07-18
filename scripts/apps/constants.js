import { dangerZone } from '../danger-zone.js';
import {ZoneListForm} from './zone-list-form.js';

/**v13
 * Defines the metadata for danger parts, including data used when building forms
 */
export const DANGERZONEPARTS = new Map([
    ['ambientLight', {icon: 'fa-regular fa-lightbulb', templates: new Map([[1, 'light'], [2, 'offset'], [3, 'animation'], [4,'advanced']])}],
    ['audio', {icon: 'fa-solid fa-volume'}], 
    ['backgroundEffect', {icon:'fas fa-bomb', templates: new Map([[1, 'visual'], [2, 'audio'], [3,'offset']])}], 
    ['canvas', {icon:'fas fa-wind'}], 
    ['combat', {icon: 'fas fa-swords'}], 
    ['effect', {icon: 'fas fa-hand-sparkles'}],
    ['item', {icon: 'fas fa-suitcase'}], 
    ['foregroundEffect', {icon:'fas fa-bolt', templates: new Map([[1, 'visual'], [2, 'source'], [3,'offset']])}],
    ['globalZone', {icon:'fas fa-radiation', templates: new Map([[1, 'basics'], [2, 'boundary'], [3,'trigger'], [4,'source'], [5,'target'], [6,'clear']])}],
    ['lastingEffect', {icon:'fa-solid fa-cubes', templates: new Map([[1, 'tile'], [2,'overhead'], [3,'offset']])}], 
    ['mutate', {flag: true, icon: 'fas fa-pastafarianism'}],
    ['region', {icon:'fa-regular fa-game-board', templates: new Map([[1, 'settings'], [2, 'offset'], [3, 'behaviors']])}],
    ['rolltable', {icon: 'fas fa-th-list'}], 
    ['scene', {icon: 'fas fa-map', templates: new Map([[1, 'settings'], [2,'light']])}], 
    ['sound', {icon:'fa-solid fa-music', templates: new Map([[1, 'audio'], [2,'offset']])}],
    ['sourceEffect', {icon: 'fas fa-dragon', templates: new Map([[1, 'visual'], [2, 'audio'], [3,'offset']])}],
    ['tokenMove', {icon: 'fas fa-arrows-alt', templates: new Map([[1, 'movement'], [2, 'settings']])}],
    ['tokenEffect', {icon: 'fas fa-male'}],
    ['tokenResponse', {icon: 'fas fa-shield-alt', flag: true, templates: new Map([[1, 'save'], [2, 'damage']])}],
    ['tokenSays', {icon: 'fas fa-comment', flag: true, templates: new Map([[1, 'settings'], [2, 'chat'], [3,'audio']])}],
    ['wall', {icon: 'fa-solid fa-block-brick', templates: new Map([[1, 'wall'], [2, 'offset']])}],
    ['warpgate', {flag: true, icon: 'fas fa-circle-notch'}],
    ['weather', {flag: true, icon: 'fas fa-cloud-rain'}]
    ]);

/**v13
 * constant for data used to configure danger zone and forms
 */
export const DANGERZONECONFIG = {
    CLASSES: {
        DANGERPART: {
            _default: ''
        }
    },
    ID: {
        MODULE: 'danger-zone',
        FORM: {
            DANGER: 'danger-zone-type-form',
            DANGERPART: {_default: 'id'},
            DANGERS: 'danger-zone-types',
            ZONE: 'danger-zone',
            ZONECOPY: "danger-zone-zone-copy",
            ZONEEXECUTOR: "danger-zone-executor",
            ZONEEXTENSION: "danger-zone-extension",
            ZONELIST: "zone-list"
        }
    },
    ICON: {
        ADVANCED: 'fas fa-cogs',
        ANIMATION: 'fas fa-play',
        AUDIO: 'fa-solid fa-volume',
        BASICS: 'fas fa-radiation',
        BEHAVIORS: 'fa-solid fa-child-reaching',
        BOUNDARY: 'fas fa-ruler',
        CHAT: DANGERZONEPARTS.get('tokenSays').icon,
        CLEAR: 'fas fa-eraser',
        DAMAGE: 'fas fa-skull',
        LIGHT: DANGERZONEPARTS.get('ambientLight').icon,
        DANGERPART:{
            _default: ''
        },
        DANGER: "fas fa-radiation",
        MOVEMENT: DANGERZONEPARTS.get('tokenMove').icon,
        OFFSET: 'fa-solid fa-rotate',
        OVERHEAD: 'fa-solid fa-house',
        SAVE: 'fas fa-shield-alt',
        SOURCE: 'fas fa-dragon',
        TARGET: 'fas fa-bullseye',
        TILE: DANGERZONEPARTS.get('lastingEffect').icon,
        TRASH: 'fas fa-trash',
        TRIGGER: "fas fa-play",
        VISUAL: 'fa-solid fa-eye',
        SETTINGS: 'fa-solid fa-gear',
        WALL: DANGERZONEPARTS.get('wall').icon,
        ZONE: 'fas fa-radiation',
        ZONECOPY: 'fas fa-copy',
        ZONELIST: 'fas fa-radiation',
        ZONEEXECUTOR: 'fas fa-list-alt',
        ZONEEXTENSION: 'fas fa-link'
    },
    LABEL: {
        ADVANCED: 'DANGERZONE.advanced.label',
        ANIMATION: 'DANGERZONE.animation.label',
        BASICS: 'DANGERZONE.edit-form.basics.label',
        BEHAVIORS: 'DANGERZONE.behaviors.label',
        BOUNDARY: 'DANGERZONE.edit-form.boundary.label',
        AUDIO: 'DANGERZONE.audio.label',
        CHAT: 'DANGERZONE.chat.label',
        CLEAR: 'DANGERZONE.edit-form.clear.label',
        DAMAGE: 'DANGERZONE.damage.label',
        DANGERPART:{ _default: ''},
        DANGER: "DANGERZONE.zone-type-form.form-name",
        DELETE: 'DANGERZONE.delete',
        LIGHT: 'DANGERZONE.light.label',
        MOVEMENT: 'DANGERZONE.movement.label',
        OFFSET: 'DANGERZONE.offset.label',
        OVERHEAD: 'DANGERZONE.overhead.label',
        TARGET: 'DANGERZONE.edit-form.token-targeting.label',
        TILE: 'DANGERZONE.tile.label',
        TRIGGER: 'DANGERZONE.edit-form.trigger.label',
        SAVE: 'DANGERZONE.save.label',
        SETTINGS: 'DANGERZONE.settings.label',
        SOURCE: 'DANGERZONE.source.label',
        VISUAL: 'DANGERZONE.visual.label',
        WALL: 'DANGERZONE.wall.label',
        ZONE: "DANGERZONE.edit-form.name",
        ZONECOPY: "DANGERZONE.copy-zone.label",
        ZONEEXECUTOR: "DANGERZONE.executor-form.form-name",
        ZONEEXTENSION: "DANGERZONE.edit-form.extension.add",
        ZONELIST: "DANGERZONE.scene.header.name"
    },
    RANDOM: {
        audio : {
            CHECKED: {
                LABEL: "DANGERZONE.file.audio.playlist.label",
                PLACEHOLDER: ""
            },
            NOTCHECKED: {
                LABEL: "DANGERZONE.file.audio.label",
                PLACEHOLDER: "DANGERZONE.file.audio.placeholder"
            },
            LABEL: "DANGERZONE.file.audio.random.label",
            SELECTOR: `audio-file`
        },
        visual : {
            FILE: "DANGERZONE.file.visual.label",
            PLACEHOLDER: "DANGERZONE.file.visual.placeholder",
            LABEL: "DANGERZONE.file.visual.random.label"
        }
    },
    TAB: {
        ZONECONFIG: [{
                icon: "fas fa-radiation", 
                id: "basics", 
                label: 'DANGERZONE.edit-form.basics.label'
            },
            {
                icon: "fas fa-ruler", 
                id: "dimensions", 
                label: 'DANGERZONE.edit-form.boundary.label'
            },
            {
                icon: "fas fa-play", 
                id: "trigger", 
                label: 'DANGERZONE.edit-form.trigger.label'
            },
            {
                icon: "fas fa-dragon", 
                id: "source", 
                label: 'DANGERZONE.edit-form.source.label'
            },
            {
                icon: "fas fa-bullseye", 
                id: "target", 
                label: 'DANGERZONE.edit-form.token-targeting.label'
            },
            {
                icon: "fas fa-eraser", 
                id: "clear", 
                label: 'DANGERZONE.edit-form.clear.label'
            },
            {
                icon: "fas fa-link", 
                id: "extend", 
                label: 'DANGERZONE.edit-form.extend.label'
            }
        ],
        ZONEEXECUTOR: [{
                icon: "fas fa-radiation", 
                id: "trigger", 
                label: 'DANGERZONE.executor-form.tab.list.label'
            },
            {
                icon: "fas fa-list-alt", 
                id: "exploded", 
                label: 'DANGERZONE.executor-form.tab.exploded.label'
            }
        ]
    }, 
    TEMPLATE: {
        DANGERCONFIG: `modules/danger-zone/templates/danger-form.hbs`,
        DANGERSLIST: `modules/danger-zone/templates/dangers-list.hbs`,
        DANGERSLISTFOOTER: `modules/danger-zone/templates/dangers-list-footer.hbs`,
        DANGERSLISTHEADER: `modules/danger-zone/templates/dangers-list-header.hbs`,
        DANGERPART: {_default: 'modules/danger-zone/templates/dangers-list-footer.hbs'},
        FOOTER: `modules/danger-zone/templates/footer.hbs`,
        TABNAV: `modules/danger-zone/templates/tab-navigation.hbs`,
        ZONECONFIG: {
            BASICS: `modules/danger-zone/templates/zone-form-basics.hbs`,
            DIMENSIONS: `modules/danger-zone/templates/zone-form-dimensions.hbs`,
            TRIGGER: `modules/danger-zone/templates/zone-form-trigger.hbs`,
            SOURCE: `modules/danger-zone/templates/zone-form-source.hbs`,
            TARGET: `modules/danger-zone/templates/zone-form-target.hbs`,
            CLEAR: `modules/danger-zone/templates/zone-form-clear.hbs`,
            EXTEND: `modules/danger-zone/templates/zone-form-extend.hbs`,
        }, 
        ZONEEXTENSION: `modules/danger-zone/templates/zone-extension-form.hbs`,
        ZONEEXECUTOR: {
            TRIGGER: `modules/danger-zone/templates/zone-executor-form-trigger.hbs`,
            EXPLODED: `modules/danger-zone/templates/zone-executor-form-exploded.hbs`,
        },
        ZONECOPY: `modules/danger-zone/templates/zone-copy-form.hbs`,
        ZONELIST: `modules/danger-zone/templates/zone-list-form.hbs`
    }
}

/**v13
 * constant providiing data for use in danger part form options
 */
export const DANGERFORMOPTIONS = {
    AMBIENTLIGHT: {
        ANIMATION: animationTypes(),
        CLEAR: {
            'D': 'DANGERZONE.light.clear-types.delete',
            'O': 'DANGERZONE.light.clear-types.off'
        },
        COLORATION: foundry.canvas.rendering.shaders.AdaptiveLightingShader.SHADER_TECHNIQUES,
    },
    CANVAS:{
        TYPE: {
            "": "",
            "shake": "DANGERZONE.type-form.canvas.types.shake"
        }
    },
    COMBAT:{
        INITIATIVE: {
        '': "DANGERZONE.type-form.combat.initiative.type.options.none",
        "R": "DANGERZONE.type-form.combat.initiative.type.options.roll",
        "S": "DANGERZONE.type-form.combat.initiative.type.options.set"
        }
    },
    EFFECT: {
        TIMESUPMACROREPEAT: {
            "startEveryTurn": "DANGERZONE.times-up-macro.start",
            "endEveryTurn": "DANGERZONE.times-up-macro.end"
        }
    },
    ITEM: {
        TARGET: {
            "A": "DANGERZONE.item.target.add",
            "B": "DANGERZONE.item.target.add-unless",
            "D": "DANGERZONE.item.target.delete",
            "E": "DANGERZONE.item.target.delete-all",
            "U": "DANGERZONE.item.target.update"
        }
    },
    LASTINGEFFECT: {
        TILEOCCLUSIONMODES: {
            "NONE": "DANGERZONE.occlusionmodes.none",
            "FADE": "DANGERZONE.occlusionmodes.fade",
            "RADIAL": "DANGERZONE.occlusionmodes.radial",
            "VISION": "DANGERZONE.occlusionmodes.vision"
        }
    },
    MIRRORIMAGEOPTIONS: {
        "": "DANGERZONE.type-form.offset.flip.options.none.label",
        "L": "DANGERZONE.type-form.offset.flip.options.location.label",
        "A": "DANGERZONE.type-form.offset.flip.options.image-always.label",
        "S": "DANGERZONE.type-form.offset.flip.options.image-sometimes.label",
        "B": "DANGERZONE.type-form.offset.flip.options.both.label",
        "N": "DANGERZONE.type-form.offset.flip.options.any.label"
    },
    MIRRORROTATIONOPTIONS: {
        "": "DANGERZONE.type-form.offset.flip.options.none.label",
        "L": "DANGERZONE.type-form.offset.flip.options.location.label",
        "A": "DANGERZONE.type-form.offset.flip.options.rotation-always.label",
        "S": "DANGERZONE.type-form.offset.flip.options.rotation-sometimes.label",
        "B": "DANGERZONE.type-form.offset.flip.options.both.label",
        "N": "DANGERZONE.type-form.offset.flip.options.any.label"
    },
    OFFSETOPTIONS: {
        "": "DANGERZONE.type-form.offset.type.options.non.label",
        "pct": "DANGERZONE.type-form.offset.type.options.pct.label",
        "pxl": "DANGERZONE.type-form.offset.type.options.pxl.label"
    },
    REGION: {
        EVENTS: Object.keys(CONST.REGION_EVENTS).reduce((obj, key) => {
                let k = CONST.REGION_EVENTS[key];
                let v = `DANGERZONE.region.events.options.${k}`
                obj[k] = v === key ? key.titleCase().replace('_',' ').replace('_',' ') : v;
                return obj;
            }, {}),
        SHAPETYPE: {
            "ellipse": "DANGERZONE.type-form.region.type.options.ellipse",
            "rectangle": "DANGERZONE.type-form.region.type.options.rectangle"
        },
        VISIBILITY: {
            'LAYER': "DANGERZONE.type-form.region.visibility.options.layer",
            'GAMEMASTER': "DANGERZONE.type-form.region.visibility.options.gamemaster",
            'ALWAYS': "DANGERZONE.type-form.region.visibility.options.always"
        }
    },
    SCENE: {
        FOREGROUNDELEVATIONMOVEMENT: {
            "": "",
            "R": "DANGERZONE.type-form.scene.foreground.e.types.relative.label",
            "S": "DANGERZONE.type-form.scene.foreground.e.types.set.label"
        },
        GLOBALILLUMINATION: {
            "": "",
            "Y": "DANGERZONE.type-form.scene.globalLight.options.Y.label",
            "N": "DANGERZONE.type-form.scene.globalLight.options.N.label"
        }
    },
    SOURCEDANGERLOCATION: {
        "A": "DANGERZONE.source.danger.location.actor",
        "R": "DANGERZONE.source.danger.location.area",
        "B": "DANGERZONE.source.danger.location.both"
    },
    SOURCETREATMENT: {
        "": "DANGERZONE.source.treatment.none",
        "I": "DANGERZONE.source.treatment.ignore",
        "S": "DANGERZONE.source.treatment.also",
        "O": "DANGERZONE.source.treatment.only"
    },
    TOKENMOVE: {
        HORIZONTALMOVEMENT: {
            "": "",
            "D": "DANGERZONE.type-form.tokenMove.horizontal-directions.left.label",
            "U": "DANGERZONE.type-form.tokenMove.horizontal-directions.right.label",
            "R": "DANGERZONE.type-form.tokenMove.horizontal-directions.random.label"
        },
        VERTICALMOVEMENT: {
            "": "",
            "D": "DANGERZONE.type-form.tokenMove.vertical-directions.down.label",
            "U": "DANGERZONE.type-form.tokenMove.vertical-directions.up.label",
            "R": "DANGERZONE.type-form.tokenMove.vertical-directions.random.label"
        },
        ELEVATIONMOVEMENT: {
            "": "",
            "R": "DANGERZONE.type-form.tokenMove.elevation-types.relative.label",
            "S": "DANGERZONE.type-form.tokenMove.elevation-types.set.label"
        },
        WALLSBLOCK: {
            "" : "DANGERZONE.walls-block.none.label",
            "A" : "DANGERZONE.walls-block.all.label"
        },
        TILESBLOCK: {
            "" : "DANGERZONE.tiles-block.none.label",
            "A" : "DANGERZONE.tiles-block.all.label",
            "R" : "DANGERZONE.tiles-block.roof.label",
            "B" : "DANGERZONE.tiles-block.bottom.label",
            "T" : "DANGERZONE.tiles-block.top.label"
        }
    },
    TOKENRESPONSE: {
        DAMAGEONSAVE: {
            "N": "DANGERZONE.type-form.tokenResponse.damage.save.options.none",
            "H":"DANGERZONE.type-form.tokenResponse.damage.save.options.half",
            "F": "DANGERZONE.type-form.tokenResponse.damage.save.options.full"
        },
        DAMAGETYPE: {},
        SAVERESULT: {
            0: "DANGERZONE.type-form.tokenResponse.save.result.both",
            2: "DANGERZONE.type-form.tokenResponse.save.result.fail",
            1: "DANGERZONE.type-form.tokenResponse.save.result.success"
        },
        SAVETYPE: {}
    },
    TOKENSAYS: {
        TYPE: {
            "audio":  "DANGERZONE.type-form.tokenSays.rule-type-option.playlist",
            "rollTable":  "DANGERZONE.type-form.tokenSays.rule-type-option.roll-table"
        }
    },
    WALL: {
        DIRECTIONTYPES: Object.keys(CONST.WALL_DIRECTIONS).reduce((obj, key) => {
                let k = CONST.WALL_DIRECTIONS[key];
                obj[k] = key.titleCase();
                return obj;
            }, {}),
        DOORSOUNDS: CONFIG.Wall.doorSounds,
        DOORSTATES: {
            0: "DANGERZONE.doorStates.closed",
            1: "DANGERZONE.doorStates.open",
            2: "DANGERZONE.doorStates.locked"
        },
        DOORTYPES: Object.keys(CONST.WALL_DOOR_TYPES).reduce((obj, key) => {
                let k = CONST.WALL_DOOR_TYPES[key];
                obj[k] = key.titleCase();
                return obj;
            }, {}),
        MOVETYPES: {
            0: "DANGERZONE.restrictions.none",
            1: "DANGERZONE.restrictions.normal"
        },
        SENSETYPES: {
            0: "DANGERZONE.restrictions.none",
            2: "DANGERZONE.restrictions.limited",
            1: "DANGERZONE.restrictions.normal",
            3: "DANGERZONE.restrictions.proximity",
            4: "DANGERZONE.restrictions.distance",
        }
    },
    WEATHER: {
        TYPE: {}
    }
}

/**v13
 * constant providiing data for use in zone form options
 */
export const ZONEFORMOPTIONS = {
    REPLACE: {
        LIGHT: {
            "N": "DANGERZONE.light.replace-types.N.label", 
            "R": "DANGERZONE.light.replace-types.R.label",
            "T": "DANGERZONE.light.replace-types.T.label",
            "Z": "DANGERZONE.light.replace-types.Z.label",
            "A": "DANGERZONE.light.replace-types.A.label"
        },
        REGION: {
            "N": "DANGERZONE.region.replace-types.N.label", 
            "R": "DANGERZONE.region.replace-types.R.label",
            "T": "DANGERZONE.region.replace-types.T.label",
            "Z": "DANGERZONE.region.replace-types.Z.label",
            "A": "DANGERZONE.region.replace-types.A.label"
        },
        SOUND: {
            "N": "DANGERZONE.sound.replace-types.N.label", 
            "R": "DANGERZONE.sound.replace-types.R.label",
            "T": "DANGERZONE.sound.replace-types.T.label",
            "Z": "DANGERZONE.sound.replace-types.Z.label",
            "A": "DANGERZONE.sound.replace-types.A.label"
        },
        TILE: {
            "N": "DANGERZONE.replace-types.N.label", 
            "R": "DANGERZONE.replace-types.R.label",
            "T": "DANGERZONE.replace-types.T.label",
            "Z": "DANGERZONE.replace-types.Z.label",
            "A": "DANGERZONE.replace-types.A.label"
        }, 
        WALL: {
            "N": "DANGERZONE.wall.replace-types.N.label", 
            "R": "DANGERZONE.wall.replace-types.R.label",
            "T": "DANGERZONE.wall.replace-types.T.label",
            "Z": "DANGERZONE.wall.replace-types.Z.label",
            "A": "DANGERZONE.wall.replace-types.A.label"
        },
        WEATHER: {
            "N": "DANGERZONE.weather.replace-types.N.label", 
            "T": "DANGERZONE.weather.replace-types.T.label",
            "A": "DANGERZONE.weather.replace-types.A.label"
        }
    },
    SOURCEAREA: {
    "": "DANGERZONE.source.area.none",
    "A": "DANGERZONE.source.area.actor",
    "D": "DANGERZONE.source.area.danger.placeable",
    "T": "DANGERZONE.source.area.tag",
    "Z": "DANGERZONE.source.area.zone.placeable"
    },
    SOURCEAREAGLOBALZONE: {
        "": "DANGERZONE.source.area.none",
        "A": "DANGERZONE.source.area.actor",
        "D": "DANGERZONE.source.area.danger.placeable",
        "T": "DANGERZONE.source.area.tag"
    },
    SOURCEAREATARGET: {
        "": "DANGERZONE.source.target.none",
        "A": "DANGERZONE.source.target.adjacent",
        "I": "DANGERZONE.source.target.in",
        "B": "DANGERZONE.source.target.both"
    },
    SOURCETRIGGERS: {
        "": "DANGERZONE.edit-form.source.triggers.any",
        "C": "DANGERZONE.edit-form.source.triggers.scene",
        "S": "DANGERZONE.edit-form.source.triggers.source"
    },
    STRETCH: {
        "": "",
        "B": "DANGERZONE.stretch.bottom.label",
        "G": "DANGERZONE.stretch.ground.label",
        "S": "DANGERZONE.stretch.sky.label",
        "T": "DANGERZONE.stretch.top.label"
    },
    TOKENDISPOSITION: {
        "0": "DANGERZONE.token-disposition.neutral.label",
        "1": "DANGERZONE.token-disposition.friendly.label",
        "-1": "DANGERZONE.token-disposition.hostile.label"
    },
    TRIGGEROPERATION: {
        "Q": "DANGERZONE.trigger-operation.sequential",
        "G": "DANGERZONE.trigger-operation.staggered",
        "T": "DANGERZONE.trigger-operation.together"
    },
    ZONEEXTENSION:{
        INTERACTIONOPTIONS: {
            "T": "DANGERZONE.edit-form.extension.interaction.options.trigger",
            "A": "DANGERZONE.edit-form.extension.interaction.options.enable",
            "D": "DANGERZONE.edit-form.extension.interaction.options.disable",
            "G": "DANGERZONE.edit-form.extension.interaction.options.toggle",
            "R": "DANGERZONE.edit-form.extension.interaction.options.add-region",
            "P": "DANGERZONE.edit-form.extension.interaction.options.replace-region",
            "S": "DANGERZONE.edit-form.extension.interaction.options.swap-region"
        }, 
        SEQUENCEOPTIONS: {
            "1": "DANGERZONE.edit-form.extension.sequence.options.after",
            "-1": "DANGERZONE.edit-form.extension.sequence.options.before",
            "0": "DANGERZONE.edit-form.extension.sequence.options.same"
        }
    }
}

/** Foundry Configurations**/

/**v13 CONTROLTRIGGERS
 * holds objects that are then loaded to the scene controls
 */
export const CONTROLTRIGGERS = {
    visible: false,
    controls: {}
}

/**v13 
 * Perform initializations of constants that must occur immediately on module load
 */
function runOnInit(){

    DANGERZONEPARTS.forEach((part, k, m) => {
        part.templates?.forEach((tab, key, map) => {
            if(!DANGERZONECONFIG.TAB[tab]) DANGERZONECONFIG.TAB[tab] =  {icon: DANGERZONECONFIG.ICON[tab.toUpperCase()], id: tab, label: DANGERZONECONFIG.LABEL[tab.toUpperCase()]}
        })
    })

    DANGERZONEPARTS.forEach((part, key, map) => {
        DANGERZONECONFIG.ID.FORM.DANGERPART[key] = `danger-zone-danger-${key}`;
        DANGERZONECONFIG.ICON.DANGERPART[key] = part.icon;
        DANGERZONECONFIG.LABEL.DANGERPART[key] = `DANGERZONE.type-form.${key}.label`;
        if(part.templates) {
            DANGERZONECONFIG.TEMPLATE.DANGERPART[key] = {}
            part.templates.forEach((template, order, map) => {
                DANGERZONECONFIG.TEMPLATE.DANGERPART[key][template] = `modules/danger-zone/templates/danger-form-${key}-${template}.hbs`
            });
        } else {DANGERZONECONFIG.TEMPLATE.DANGERPART[key] = `modules/danger-zone/templates/danger-form-${key}.hbs`}
    });
}

runOnInit()

/**v13 setControlTriggers
 * loads the CONTROLTRIGGERS object. Intended to be called after Foundry initializes so that classes are available.
 */
export function runOnSetup(){
    CONTROLTRIGGERS['controls'] = {
        activeTool: 'executor',
        icon: "fas fa-radiation",
        name: dangerZone.ID,
        title: "Zones",
        visible: game.user.isActiveGM &&  canvas.scene?.id,
        tools: {
            executor: {
                active: dangerZone.executorForm.visible,
                icon: "fas fa-list-alt",
                name: "executor",
                title: "DANGERZONE.scene.executor.label",
                toggle: true,
                onChange: (event, toggle) => {
                    dangerZone.log(false, 'executor control launch', event, toggle)
                    if(toggle){
                        if(!canvas.scene.active) {
                            ui.notifications?.info(`Danger zones cannot be triggered on an inactive scene.`)
                            return
                        }
                        dangerZone.executorForm.renderOnScene(canvas.scene.id, '', true);
                    } 
                },
                visible: game.user.isActiveGM 
            },
            config: {
                button: true,
                icon: "fa-solid fa-gear",
                name: "config",
                title: "DANGERZONE.zones",
                onChange: (event, active) => {
                    if(active && dangerZone.executorForm.visible) new ZoneListForm('', canvas.scene?.id).render(true)
                },
                visible: game.user.isActiveGM
            },
            clear: {
                button: true,
                icon: "fas fa-trash",
                name: "clear",
                title: "DANGERZONE.controls.clear.label",
                onChange: (event, active) => {
                    if(active) dangerZone.handleClear(event)
                },
                visible: game.user.isActiveGM
            },
            tiles: {
                button: true,
                icon: "fa-solid fa-cubes", 
                name: 'tiles',
                title: "DANGERZONE.controls.clearEffectsTile.label",
                onChange: (event, active) => {
                    if(active) dangerZone.wipe('Tile', true)
                },
                visible: game.user.isActiveGM
            },
            lighting: {
                button: true,
                icon: "fa-regular fa-lightbulb", 
                name: 'lighting',
                title: "DANGERZONE.controls.clearAmbientLight.label",
                onChange: (event, active) => {
                    if(active) dangerZone.wipe('AmbientLight', true)
                },
                visible: game.user.isActiveGM
            },
            sounds: {
                button: true,
                icon: "fa-solid fa-music", 
                name: 'sounds',
                title: "DANGERZONE.controls.clearAmbientSound.label",
                onChange: (event, active) => {
                    if(active) dangerZone.wipe('AmbientSound', true)
                },
                visible: game.user.isActiveGM
            },
            regions: {
                button: true,
                icon: "fa-regular fa-game-board",
                name: 'regions',
                title: "DANGERZONE.controls.clearRegion.label",
                onChange: (event, active) => {
                    if(active) dangerZone.wipe('Region', true)
                },
                visible: game.user.isActiveGM
            },
            walls: {
                button: true,
                icon: "fa-solid fa-block-brick", 
                name: 'walls',
                title: "DANGERZONE.controls.clearWall.label",
                onChange: (event, active) => {
                    if(active) dangerZone.wipe('Wall', true)
                },
                visible: game.user.isActiveGM
            }
        }   
    }

    /**v13
     * load form constants for system and module based data
     */
    DANGERFORMOPTIONS.TOKENRESPONSE.DAMAGETYPE = damageTypes();
    DANGERFORMOPTIONS.TOKENRESPONSE.SAVETYPE = saveTypes()
    DANGERFORMOPTIONS.WEATHER.TYPE = weatherTypes()
    
    if(dangerZone.MODULES.taggerOn){
        ZONEFORMOPTIONS.SOURCEAREA["C"] = "DANGERZONE.source.area.danger.tile"; 
        ZONEFORMOPTIONS.SOURCEAREAGLOBALZONE["C"] = "DANGERZONE.source.area.danger.tile"; 
        ZONEFORMOPTIONS.SOURCEAREA["Y"] = "DANGERZONE.source.area.zone.tile";  
    }    
}

/************* Begin CONSTANT load functions */
/**v13
 * function used to populate DANGERFORMOPTIONS 
 * @returns obj
 */
function animationTypes() {
    const animationTypes = {"": "DANGERZONE.none"};
    for ( let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations) ) {
      animationTypes[k] = v.label;
    }
    return animationTypes;
}

/** v13
 * outputs a list of save types for use in dropdowns, based on the system
 * @returns save type options 
 */
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

/** v13
 * outputs a list of damage types for use in dropdowns, based on the system
 * @returns damage type options 
 */
function damageTypes() {
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

/** v13
 * outputs a list of weather types for use in dropdowns, based on the system
 * @returns weather type options 
 */
function weatherTypes() {
    const obj = {'':''}
    Object.assign(obj, Object.fromEntries(Object.entries(CONFIG.weatherEffects).filter(w => !w[1].id.includes('fxmaster')).map(k=> [`foundry.${k[0]}`,`${game.i18n.localize(k[1].label)} (Foundry)`])))
    if(dangerZone.MODULES.fxMasterOn) Object.assign(obj,Object.fromEntries(Object.entries(CONFIG.fxmaster.particleEffects).map(k=> [k[0],`${k[1].name.replace('ParticleEffect','')} (FXMaster)`])))
    return obj
}


/************* End CONSTANT load functions */


/************* Begin dropdown generator functions */


/**v13
 * outputs that can be used as a dropdown of actor options
 * @returns actor options
 */
export function actorOps(){
    return game.actors.reduce((obj, a) => {obj[a.id] = a.name; return obj;}, {})
}

/**v13
 * Outputs what can be used as a dropdown of macro options
 * @param {keyIsUuid} Boolean      //if the dropdown keys should be the macro Uuid or just the id 
 * @returns macro options 
 */
export function determineMacroList(keyIsUuid = false) {
  let list = {};
  for (let macro of game.macros.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
    list[keyIsUuid ? macro.uuid : macro.id] = macro.name;
  }
  return list;
}

/**v13
 * Outputs what can be used as a dropdown of compendium options
 * @param {string} fileType 
 * @returns compendium options for the given filetype
 */
export function getCompendiumOps(fileType){
    return game.packs.filter((x) => x.documentName == TOKENSAYSFILETYPEENTITYTYPE[fileType]).reduce((obj, p) => {obj['']=''; obj[p.collection] = p.title; return obj;}, {})
}

/**v13
 * outputs that can be used as a dropdown of region options for a given scene
 * @param {string}      id for scene
 * @returns region options
 */
export function regionOps(sceneId){
    return game.scenes.get(sceneId).regions.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

/**v13
 * outputs that can be used as a dropdown of scene options
 * @returns scene options
 */
export function sceneOps(){
    return game.scenes.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

/**
 * v13 
 * outputs parameters for a given fxMaster
 */
export function weatherParameters(type) {
    if(dangerZone.MODULES.fxMasterOn) return CONFIG.fxmaster.particleEffects[type]?.parameters
}

/************* End dropdown generator functions */

/**v13
 * Convesion object, with key representing the document name and the value the placeable name 
 */
export const PLACEABLESBYDOCUMENT =  {
    'Tile': 'tiles',
    'Wall': 'walls',
    'AmbientLight': 'lights',
    'AmbientSound': 'sounds',
    'Region': 'regions',
    'fxmaster-particle':'fxmaster-particle'
}

/**v13
 * states in order that zone trigger workflow moves through.
 */
export const WORKFLOWSTATES = {
    NONE: 0,
    INITIALIZE: 1,
    EXECUTE: 2,
    INFORM: 3,
    CANCEL: 98,
    COMPLETE: 99
}

/**v13
 * holds default settings for initializing the world zone data part
 */
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


export const FVTTMOVETYPES = {
    0: 0,
    1: 20
}

export const FVTTSENSETYPES = {
    0: 0,
    1: 20,
    2: 10,
    3: 30,
    4: 40
}

const TOKENSAYSFILETYPEENTITYTYPE = {
    rollTable: "RollTable",
    audio: "Playlist",
    item: "Item"
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
                fileTypes: ['audio'],
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
                fileTypes: ['image'],
                title: "Primary Effect", 
                icon: "fas fa-bolt", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'ambientLight': {
                title: "Ambient Light", 
                icon: "fa-regular fa-lightbulb", 
                document: "AmbientLight", 
                wipeable: true, 
                modules: [
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
                fileTypes: ['image'],
                title: "Lasting Effect", 
                icon: "fa-solid fa-cubes", 
                document: "Tile",  
                wipeable: true, 
                modules: [
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
                fileTypes: ['image', 'audio'],
                title: "Secondary Effect", 
                icon: "fas fa-bomb", 
                modules: [{active: dangerZone.MODULES.sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'region': {
                document: "Region", 
                title: "Region", 
                icon: "fa-regular fa-game-board",
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
                fileTypes: ['image', 'overlay'],
                title: "Scene", 
                icon: "fas fa-map", 
                document: 'scene',
                wipeable: false,
                modules:[],
                scope: "scene"
            },
            'sound': {
                fileTypes: ['audio'],
                title: "Sound", 
                icon: "fa-solid fa-music", 
                document: "AmbientSound", 
                modules:[],
                wipeable: true, 
                scope: "boundary"
            },
            'sourceEffect': {
                fileTypes: ['image', 'audio'],
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
                fileTypes: ['image'],
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
                icon: "fa-solid fa-block-brick", 
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