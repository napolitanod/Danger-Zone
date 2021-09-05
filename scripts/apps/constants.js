export const TOKENDISPOSITION = {
    "0": "DANGERZONE.token-disposition.neutral.label",
    "1": "DANGERZONE.token-disposition.friendly.label",
    "-1": "DANGERZONE.token-disposition.hostile.label"
}

export function actorOps(){
    return game.actors.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}