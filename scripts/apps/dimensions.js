import {dangerZone} from '../danger-zone.js';
import {circleAreaGrid, getTagEntities, rayIntersectsGrid} from './helpers.js';
import { wallHeightOn } from '../index.js';

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
            y: 0,
            z: 0
        },
        this.start = {
            x: 0,
            y: 0,
            z: 0
        };
        this._init();
    }
  
    /**
     * refreshes class data with scene data
     */
     _init() {
        const dim = this.scene.dimensions;
        this.start.x = dim.sceneX,
        this.start.y = dim.sceneY,
        this.end.x = dim.sceneWidth + dim.sceneX,
        this.end.y = dim.sceneHeight + dim.sceneY;
    }

    get scene(){
        return game.scenes.get(this.sceneId);
    }

    get danger(){
        return this.zone.danger;
    }

    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    _subDimensions(w,h){
		const start = canvas.grid.getOffset(this.start);
		const end = canvas.grid.getOffset(this.end);
        return [w ? w : end.i-start.i, h ? h : end.j-this.start.j]
    }

    async boundary(){
        const ex = await this._excludedTagged();
        const un = await this.zone.sourceArea();
        return new boundary(this.start, this.end, {exclude: ex, limit: un})
    }

    async boundaryBleed(){
        const {w,h,d} = this.danger.dimensions.units; 
        const b = await this.boundary();
        const dim = b.dimensions;
        const topLeft = canvas.grid.getTopLeftPoint({j:dim.j -(Math.min(dim.j, (h-1))), i:dim.i - (Math.min(dim.i, (w-1)))});
        topLeft.z = dim.z - (d ? d-1 : 0);
        const p = new point(topLeft)
        return new boundary(p, b.B, {excludes: b.excludes, universe: b.universe})
    }

    async boundaryConstrained(){
        let {w,h,d} = this.danger.dimensions.units;
        [w, h] = this._subDimensions(w,h);
        const b = await this.boundary();
        const dim = b.dimensions;
        return boundary.locationToBoundary(b.A, {d: Math.abs(dim.d - (d ? d : dim.d ? dim.d : 0)), h: Math.abs(dim.h - (h-1)), w: Math.abs(dim.w - (w-1))}, {excludes: b.excludes, universe: b.universe})
    }

    async grids(){
        const b = await this.boundary();
        return b.grids()
    }

    async randomDangerBoundary() {
        let {w,h,d} = this.danger.dimensions.units;
        [w, h] = this._subDimensions(w,h);
        const b = this.zone.options.bleed ? await this.boundaryBleed() : await this.boundaryConstrained();
        const options = {range:{w: w, h: h, d: d}}
        this.zone.stretch(options);
        const grids = b.randomBoundary(options);
        dangerZone.log(false,'Random Area Variables ', {"zoneScene": this, boundary: b, dangerUnits: [w,h,d], zone: this.zone, options: options})
        return grids
    }

    static tokenMovement(token, update){
        const endXPixel = update.x ? update.x : token.x; 
		const endYPixel = update.y ? update.y : token.y;
		const start = canvas.grid.getOffset(token);
		const end= canvas.grid.getOffset({x:endXPixel, y:endYPixel});
		const endDepth = update.elevation ? update.elevation : token.elevation;
		return {
			startPos: {x: token.x, y: token.y, z: token.elevation},
			endPos: {x: endXPixel, y: endYPixel, z: endDepth},
			moveYGrids: Math.abs(start.j - end.j),
			moveXGrids: Math.abs(start.i - end.i),
			moveYPixels: Math.abs(token.y - endYPixel),
			moveXPixels: Math.abs(token.x - endXPixel),
			moveDepth: Math.abs(token.elevation - endDepth)
		}
    }

    static async addHighlightZone(zoneId, sceneId, nameModifier = '', dangerId = ''){
        const zn = dangerId ? dangerZone.getGlobalZone(dangerId, sceneId)?.scene : dangerZone.getZoneFromScene(zoneId, sceneId)?.scene;
        if(zn) await zn.addHighlightZone(nameModifier)
    }

    async addHighlightZone(nameModifier = ''){
        const boundary = await this.boundary()
        this.dangerId ? boundary.highlight(this.dangerId + nameModifier, 10737280) : boundary.highlight(this.zoneId + nameModifier, 16737280)
    }

    static destroyHighlightZone(zoneId, nameModifier = '', dangerId = ''){
        const name = 'dz-' + (dangerId ? dangerId : zoneId) + nameModifier;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }

    destroyHighlightZone(nameModifier = ''){
        const name = 'dz-'+ (this.dangerId ? this.dangerId : this.zoneId) + nameModifier;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }

    async _excludedTagged(){
        return getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene)
    }
}

export class boundary{
    constructor (a = {x:0, y:0, z:0}, b = {x:0, y:0, z:0}, options = {}) {
        this.A = {
            x: a.x ? Math.min(a.x, a.x ? b.x : b.x) : 0,
            y: a.y ? Math.min(a.y, a.y ? b.y : b.y) : 0,
            z: a.z ? Math.min(a.z, a.z ? b.z : b.z) : 0
        },
        this.B = {
            x: b.x ? Math.max(a.x ? a.x : b.x, b.x) : 0,
            y: b.y ? Math.max(a.y ? a.y : b.y, b.y) : 0,
            z: b.z ? Math.max(a.z ? a.z : b.z, b.z) : 0
        },
        this.offset = options.offset,
        this.excludes = options.excludes ? options.excludes : new Set(),
        this.universe = options.universe ? options.universe : (options.limit?.target ? new Set() : ''),
        this.gridIndex = new Set();
        if('bottom' in options){this.A.z = options.bottom}
        if('top' in options){this.B.z = options.top}
        if(!('retain' in options)) this._toTopLeft();
        if(options.exclude){this._exclude(options.exclude)}
        if(options.limit?.target){this._universe(options.limit)}
        this._setGridIndex();
    }

    get width(){
        return Math.abs(this.B.x - this.A.x)
    }

    get height(){
        return Math.abs(this.B.y - this.A.y)
    }

    get depth(){
        return Math.abs(this.B.z - this.A.z)
    }

    get bottom(){
        return this.A.z
    }

    get top(){
        return this.B.z
    }

    get center(){
        return {x: this.A.x + (this.width/2), y: this.A.y + (this.height/2)}
    }

    get dimensions(){
        const top = canvas.grid.getOffset(this.A);
        const left = canvas.grid.getOffset({x:this.A.x, y:this.B.y});
        const right = canvas.grid.getOffset({x:this.B.x, y:this.A.y});
        const bottom = canvas.grid.getOffset(this.B);
        const w = Math.max(right.j,bottom.j) - Math.min(top.j,left.j);
        const h = Math.max(left.i,bottom.i) - Math.min(top.i,right.i);
        const d = this.B.z - this.A.z;
        return {w: w, h: h, d:d, j:top.j, i:top.i, z:this.A.z}
    }

    _setGridIndex(){
        const grids = this.grids();
        for(const grid of grids){
            this.gridIndex.add(boundary.makeIndex(grid))
        }
    }

    _toTopLeft(){    
        const A = canvas.grid.getTopLeftPoint(this.A);
        const B = canvas.grid.getTopLeftPoint(this.B);
        this.A.x = A.x;
        this.A.y = A.y;
        this.B.x = B.x;
        this.B.y = B.y;
    }

    * grids(options={}){
        const dim = this.dimensions; 
        for(let m=0; (options.inclusive ? m<=dim.w : m<dim.w) || m===0; m++){
            for(let n=0; (options.inclusive ? n<=dim.h: n<dim.h) || n===0; n++){
                if((!this.universe || this.universe.has((dim.i+n) + '_' + (dim.j+m))) && !this.excludes.has((dim.i+n) + '_' + (dim.j+m))){yield {i:dim.i+n, j:dim.j+m, e:dim.z, shift: {w:n, h:m}}}
            }
        }
    } 

    * randomBoundary (options={}){
        const grids = this.grids(options);
        const all = []
        for(const grid of grids){
            all.push(grid)
        }
        const dim = this.dimensions;
        const w = options.range?.w ? options.range?.w : 1
        const h = options.range?.h ? options.range?.h : 1
        const d = options.range?.d ? options.range?.d : 0

        const ops = {excludes: this.excludes, universe: this.universe}
        if('bottom' in options){ops.bottom = options.bottom}
        if('top' in options){ops.top = options.top}

        if(all.length < 1 || dim.d < 0){
            if(dim.d<0 && game.user.isGM){
                ui.notifications?.error(game.i18n.localize("DANGERZONE.alerts.danger-depth-exceeds-zone"));
            }
            return dangerZone.log(false,'Invalid zone settings ', {boundary: this})
        }
        const zAdj = dim.d ? d ? d : dim.d-1 : 0 

        while(true){
            const test = all[Math.floor(Math.random() * all.length)]
            const topLeft = canvas.grid.getTopLeftPoint(test); 
            let bottomRight = point.shiftPoint(topLeft, {w:w, h:h});
            const e = test.e + Math.floor(Math.random() * dim.d);
            topLeft.z = e;
            bottomRight.z = e + zAdj;
            yield new boundary(topLeft, bottomRight, ops)
        }

    }

    static documentBoundary(documentName, document, options = {}){
        let dim;
        switch(documentName){
            case "Wall":
                dim=document.object.bounds;
                break
            case "AmbientLight":
                const dm = (document.object.radius*2)-1
                dim={x:document.object.bounds.x, y:document.object.bounds.y, width: dm, height: dm} 
                break
            case "Drawing":
                dim={x: document.x, y:document.y, width: document.shape.width, height: document.shape.height}
                break;
            case "Tile":
                dim={x: document.x, y:document.y, width: document.width - 1, height: document.height - 1}
                break;
            case "Token":
                const multiplier = game.settings.get(dangerZone.ID, 'token-depth-multiplier');
                const position = canvas.grid.getOffset(document);
                const topLeft = canvas.grid.getTopLeftPoint({j:position.j + document.height, i:position.i + document.width}); 
                const distance = document.parent?.dimensions?.distance ? document.parent?.dimensions?.distance : 1
                const Td = (wallHeightOn && document.getFlag('wall-height', 'tokenHeight')) ? document.getFlag('wall-height', 'tokenHeight') : (distance * Math.max(document.width, document.height) * multiplier);
                dim = {x:document.x, y:document.y, width: topLeft.x - document.x, height: topLeft.y - document.y, depth: Td,  bottom:document.elevation};
                break
            default: 
                dim=document
        }
        const b = new boundary({x:dim.x, y:dim.y, z:dim.bottom ? dim.bottom : 0}, {x: dim.x + dim.width, y: dim.y + dim.height, z: dim.depth ? dim.bottom + dim.depth : 0}, options)
        return b
    }
    
    _exclude(documents){
        this._indexDocuments(documents, this.excludes)
    }

    _indexDocuments(documents, indices){
        for(const document of documents){
            const documentName = document.documentName ? document.documentName : document.document.documentName;
            const b = boundary.documentBoundary(documentName, document);
            const dim=b.dimensions
            const inclusive = documentName === "Token" ? false : true
            const grids = b.grids({inclusive:inclusive})  
            switch(documentName){
                case "Wall":
                    for(const grid of grids){
                        if(indices.has(yPos + '_' + xPos)){continue}
                        if(rayIntersectsGrid(grid, document.object.toRay())){indices.add(boundary.makeIndex(grid))}
                    }
                    break
                case "AmbientLight":
                    for(const grid of grids){
                        if(indices.has(grid.i + '_' + grid.j)){continue}
                        if(circleAreaGrid(grid.shift.w,grid.shift.h,dim.w, dim.h)){indices.add(boundary.makeIndex(grid))}
                    }
                    break
                default: 
                    for(const grid of grids){
                        let index = boundary.makeIndex(grid);
                        if(indices.has(index)){continue}
                        indices.add(index)
                    }
            }
        }
        dangerZone.log(false, 'Tagged ', {tagged: documents, boundary: this});
    }

    _universe(limit){
        this._indexDocuments(limit.documents, this.universe)
        if(limit.target === 'I') return
        const newUniv = new Set() 
        this.universe.forEach((value) => {
            const[yPos, xPos] = value.split('_')
            const nghbrs = canvas.grid.getNeighbors(Number(yPos), Number(xPos))
            for(const pos of nghbrs){
                if(limit.target === 'A') {
                    if (!this.universe.has(pos[0] + '_' + pos[1])) newUniv.add(pos[0] + '_' + pos[1])
                } else {
                    newUniv.add(pos[0] + '_' + pos[1])
                }
            }
        })
        this.universe = newUniv
    }

    static locationToBoundary(coords, units, options={}){
        let position = point.shiftPoint(coords, units)
        dangerZone.log(false,'Location to boundary...', {point: coords, units: units, options: options});
        return new boundary(coords,{x:position.x, y:position.y, z:(coords.z + units.d)},options)
    }

    static offsetBoundary(bndry, globalOffset, offset, scene = canvas.scene){
        function flip(flip, flipLocation){
            if (typeof flip == "boolean") {
                return ((flip && flipLocation) ? -1 : 1)
            }
            return ((['N', 'L', 'B'].includes(flip) && flipLocation) ? -1 : 1 )
        }
        const obj = {A: {x: 0, y: 0, z: 0}, B: {x: 0, y: 0, z: 0}, options: {offset: {x: {flip: 0, amt: 0}, y: {flip: 0, amt: 0}}, retain: true}};
        obj.options.offset.x.flip = flip(offset.x.flip, globalOffset.x.flipLocation)
        obj.options.offset.y.flip = flip(offset.y.flip, globalOffset.y.flipLocation)
        obj.options.offset.x.amt = boundary.offsetAxis(offset.x, obj.options.offset.x.flip, scene, globalOffset.x.random)
        obj.options.offset.y.amt = boundary.offsetAxis(offset.y, obj.options.offset.y.flip, scene, globalOffset.y.random)
        Object.assign(obj.A, {x: bndry.A.x + obj.options.offset.x.amt, y:bndry.A.y + obj.options.offset.y.amt, z: bndry.A.z})
        Object.assign(obj.B, {x: bndry.B.x + obj.options.offset.x.amt, y:bndry.B.y + obj.options.offset.y.amt, z: bndry.B.z})
        return new boundary(obj.A, obj.B, obj.options)
    }

    static makeIndex(coords) {
        return coords.i + '_' + coords.j
    }

    static offsetAxis(offsetAxis, flip, scene, random){
        function randomRange(min, max, random){
            if(min === max) return min
            return (Math.floor(random * (max - min + 1)) + min)
        }
        switch(offsetAxis.type){
            case "pxl":
                return (randomRange(offsetAxis.min, offsetAxis.max, random) * flip)
            case "pct":
                return (Math.floor((randomRange(offsetAxis.min, offsetAxis.max, random)/100) * scene.dimensions.size) * flip)
            default:
                return 0
        }
    }

    tokensIn(tokens){
        let kept = [];
        for(let token of tokens){
            const b = boundary.documentBoundary('Token', token);
            if(this.intersectsBoundary(b)){
                kept.push(token)
            }
        }
        return kept
    } 

    intersectsBoundary(bound = boundary){
        if(!this.depth || ((this.bottom <= bound.top && this.top > bound.bottom))) {
            const grids = bound.grids()
            for(const grid of grids){
                if(this.gridIndex.has(boundary.makeIndex(grid))){return true}
            }
        }
        return false
    }

    highlight(name, color = 16737280){
        let hId = 'dz-' + name;
        canvas.interface.grid.addHighlightLayer(hId);
        const grids = this.grids();
        for(const grid of grids){ 
            let position = canvas.grid.getTopLeftPoint(grid); 
            canvas.interface.grid.highlightPosition(hId, {x: position.x, y: position.y, color:color});
        }
    }

    destroyHighlight(name){
        canvas.interface.grid.destroyHighlightLayer('dz-' + name)
    }
}

export class point{
    constructor({x=0, y=0, z=0}){
        this.x = x ? x : 0, 
        this.y = y ? y : 0,
        this.z = z ? z : 0;
        this._toTopLeft();
    }
    
    _toTopLeft(){    
        const position = canvas.grid.getTopLeftPoint({x:this.x, y:this.y});
        this.x = position.x;
        this.y = position.y;
    }

    static shiftPoint(reference = {}, shift = {}){
        let shifted = reference;
        for(let i=0;i<Math.abs(shift.w);i++){shifted = canvas.grid.getShiftedPoint(shifted, shift.w > 0 ? CONST.MOVEMENT_DIRECTIONS.RIGHT : CONST.MOVEMENT_DIRECTIONS.LEFT)}
        for(let i=0;i<Math.abs(shift.h);i++){shifted = canvas.grid.getShiftedPoint(shifted, shift.h > 0 ? CONST.MOVEMENT_DIRECTIONS.DOWN : CONST.MOVEMENT_DIRECTIONS.UP)}
        shifted.z = reference.z
        return shifted
    }
}