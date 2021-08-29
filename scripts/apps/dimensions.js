//test scene update hook on close of config form
import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';

export class dangerZoneDimensions {

    /**
     * @param {string} zoneId - id of the parent zone
     * @param {string} sceneId - the id of the scene  
    */
    constructor (sceneId, zoneId) {
        this.zoneId = zoneId,
        this.sceneId = sceneId,
        this.end = {
            x: 0,
            y: 0
        },
        this.start = {
            x: 0,
            y: 0
        }
        ;
        this._init();
    }
  
    /**
     * refreshes class data with scene data
     */
     _init() {
        const scene = game.scenes.get(this.sceneId);
        const dim = scene.dimensions;

        this.start.x = dim.paddingX,
        this.start.y = dim.paddingY,
        this.end.x = dim.sceneWidth + dim.paddingX,
        this.end.y = dim.sceneHeight + dim.paddingY;
    }

  
   /**
    * generates a random target area based on zone size zone bleed, scene size and zone type size
    * @returns object with dimension coordinats indicating boundary of the area
    */
    async randomArea() {
        const zn = dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
        const znType = dangerZoneType.getDangerZoneType(zn.type).dimensions.units;
        const g = this.getUnitDimensions();
        if(zn.options.bleed){
            let gU = canvas.grid.grid.getGridPositionFromPixels(g.start[0], g.start[1]);
            let adjX = Math.min(gU[0], (znType.x-1));
            let adjY = Math.min(gU[1], (znType.y-1));
            g.w += adjX;
            g.h += + adjY;
            g.start[0] -= adjX;
            g.start[1] -= adjY;
        }
        let die = `1d` + (g.w * g.h);
        const randomRoll = new Roll(die);
        let rolledResult = await randomRoll.roll().result;
        let posY = g.start[1] + Math.floor((rolledResult-1)/g.w);
        let posX = g.start[0] + ((rolledResult - 1) % g.w);  
        let start = canvas.grid.grid.getPixelsFromGridPosition(posX, posY);
        let end = canvas.grid.grid.getPixelsFromGridPosition(posX+znType.x, posY+znType.y);
        
        dangerZone.log(false,'Random Area Variables ', {"zoneScene": this, randomArea: {units: g, start: start, end: end}, roll: rolledResult})
        return this._conformBoundary(start[0], start[1], end[0], end[1])
    }

    widthHeightCenterFromLocation(x,y,units){
        let bnd = this.locationToBoundary(x, y, units)
        const w = bnd.end.x - bnd.start.x;
        const h = bnd.end.y - bnd.start.y;
        const c = {x: x + (w/2), y: y + (h/2)}
        return {w: w, h: h, c: c}
    }

    locationToBoundary(x,y, units){
        let start = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let end = canvas.grid.grid.getPixelsFromGridPosition(start[0]+units.x, start[1]+units.y);
        return this._conformBoundary(x, y, end[0], end[1])
    }

    static conformBoundary(x1, y1, x2, y2){    
        const s = canvas.grid.getTopLeft(Math.min(x1, x2), Math.min(y1, y2));
        const e = canvas.grid.getTopLeft(Math.max(x1, x2), Math.max(y1, y2));
        return {
            start: {
                x: s[0], 
                y: s[1]
            }, 
            end: {
                x: e[0], 
                y: e[1]
            }
        }
    }

    _conformBoundary(x1, y1, x2, y2){
        return dangerZoneDimensions.conformBoundary(x1, y1, x2, y2);
    }

    _conformBoundaryToZone(boundary){
        let start = this._conformLocationToZone(boundary.start.x, boundary.start.y);
        let end = this._conformLocationToZone(boundary.end.x, boundary.end.y);
        dangerZone.log(false, 'Conform to zone', {boundary: boundary, conform: {start: start, end: end}});
        return {start: start.location, end: end.location}
    }

    static conformLocationToZone(x,y, zoneId, sceneId, conformOnly = false){
        let zn = dangerZone.getZoneFromScene(zoneId, sceneId);
        const g = zn.getUnitDimensions();
        return zn._conformLocationToZone(x,y,g, conformOnly)
    }

    _conformLocationToZone(x,y, conformOnly = false){
        let b = this.getUnitDimensions();
        return dangerZoneDimensions.conformCheck(x,y,b,conformOnly)
    }
 
    static conformLocationToBoundary(x,y, boundary, conformOnly = false){
        let b = dangerZoneDimensions.getUnitDimensions(boundary);
        return dangerZoneDimensions.conformCheck(x,y,b,conformOnly)
    }

    static conformCheck(x,y,b,conformOnly){
        let g = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let location={x:g[0], y:g[1]}; let conforms = true;
        if(g[0] >= b.start[0]){
            if (g[0] > (b.start[0] + b.w)) {
                if(conformOnly){return false}
                location.x=b.start[0] + b.w; conforms = false;
            } 
        } else {
            if(conformOnly){return false}
            location.x=b.start[0]; conforms = false;
        }

        if(g[1] >= b.start[1]){
            if (g[1] > (b.start[1] + b.h)) {
                if(conformOnly){return false}
                location.y=b.start[1] + b.h; conforms = false;
            } 
        } else {
            if(conformOnly){return false}
            location.y=b.start[1]; conforms = false;
        }
        return {location: location, conforms: conforms}
    }

    /**
     * Returns an array of tokens that have x and y coordinate that fit within the boundary provided.
     * @param {array} tokens - an array of tokens
     * @param {object} boundary - an object indicating the top left start point and bottom right end point in a boundy {start: {x: , y: }, end: {x: , y: }}
    */
    static tokensInBoundary(tokens, boundary){
        boundary = dangerZoneDimensions.conformBoundary(boundary.start.x, boundary.start.y, boundary.end.x, boundary.end.y);
        const g = dangerZoneDimensions.getUnitDimensions(boundary);
        let kept = [];
        for(let token of tokens){
            if(dangerZoneDimensions.conformLocationToBoundary(token.data.x, token.data.y, boundary, true))
                kept.push(token);
        }
        return kept
    }  

    tokensInZoneBoundary(tokens, boundary){
        boundary = this._conformBoundaryToZone(boundary);
        return dangerZoneDimensions.tokensInBoundary(tokens, boundary);
    }

    tokensInZone(tokens){
        if(!tokens){tokens = game.scenes.get(this.sceneId)}
        return dangerZoneDimensions.tokensInBoundary(tokens, {start: this.start, end: this.end});
    }

    static getUnitDimensions(boundary){
        let s = canvas.grid.grid.getGridPositionFromPixels(boundary.start.x, boundary.start.y);
        let se = canvas.grid.grid.getGridPositionFromPixels(boundary.start.x, boundary.end.y);
        let es = canvas.grid.grid.getGridPositionFromPixels(boundary.end.x, boundary.start.y);
        let w = se[0] - s[0];
        let h = es[1] - s[1];
        return {w: w, h: h, start: s}
    }

    getUnitDimensions(){
        return dangerZoneDimensions.getUnitDimensions({start: this.start, end: this.end});
    }

    static addHighlightZone(zoneId, sceneId, nameModifier = ''){
        let hId = 'dz-'+ zoneId + nameModifier;
        canvas.grid.addHighlightLayer(hId);
        const zn = dangerZone.getZoneFromScene(zoneId, sceneId).scene;
        const g = zn.getUnitDimensions();
        for(let j=0; j < g.h; j++){
            for(let i=0; i < g.w; i++){
                let pos = canvas.grid.grid.getPixelsFromGridPosition((g.start[0]+i), (g.start[1]+j));
                canvas.grid.highlightPosition(hId, {x: pos[0], y: pos[1], color:16737280});
            }
        }
    }

    static destroyHighlightZone(zoneId, nameModifier = ''){
        canvas.grid.destroyHighlightLayer('dz-'+zoneId + nameModifier)
    }
}