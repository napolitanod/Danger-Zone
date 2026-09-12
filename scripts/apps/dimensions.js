import {dangerZone} from '../danger-zone.js';
import {circleAreaGrid, rayIntersectsGrid, helper} from './helpers.js';

export class dangerZoneDimensions {
    /**
     * @param {string} zoneId - id of the parent zone
     * @param {string} sceneId - the id of the scene  
     * @param {string} regionId - the id of the region that defines the zone dimensions. Can be blank, which indicates full scene dimensions.
    */
    constructor (sceneId, zoneId, regionId = '') {
        this.zoneId = zoneId,
        this.sceneId = sceneId,
        this.regionId = regionId,
        this.levels = [];
    }

    /**returns the zone's pure boundary, without factoring in levels, region, exclusions, universe
     * 
     */
    get boundary(){
        let docType, document
        
        if(this.hasRegion) {
            docType = "Region";
            document = this.region;
        } else {
            docType = "Scene";
            document = this.scene
        }

        const el = {elevation: this.elevation}

        return boundary.documentBoundary(docType, document, el)
    }

    /**Returns the danger class for the zone
     * 
     */
    get danger(){
        return this.zone.danger;
    }

    get dangerRelativeDimensions(){
        return {
                w: this.danger.dimensions.units.w ?? this.boundary.dimensions.w, 
                h: this.danger.dimensions.units.h ?? this.boundary.dimensions.h, 
                d: this.danger.dimensions.units.d < 1 ? this.boundary.depth : this.danger.dimensions.units.d 
            }
    }

    /**
     * Create the zone elevation, also patching up infinities to allow for some boundary to the zone targeting
     */
    get elevation(){
        const e = this.hasRegion ? this.region.elevation : this.zone.dimensions
        const elevation = {
            top: helper.fallbackElevationTop(e.top),
            bottom: helper.fallbackElevationBottom(e.bottom)
        }
        return elevation
    }

    /**Returns the entities tagged on the scene with exclusions
     * 
     */
    get excludedTaggedEntities(){
        return helper.getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene)
    }

    /**
     * The presence of a danger id means that this dangerZoneDimensions class was created as part of a pseudo zone to facilitate global danger functionality
     * This is a temporary class and thus the id is also transient
     */
    get hasWorldZone(){
        return this.dangerId ? true : false
    }

    /**
     * A region is associated to this zone
     */
    get hasRegion(){
        return this.region?.id ? true : false
    }


    /**
     * returns the region document for the given region id
     */
    get region(){
        const region = this.regionId ? this.scene.getEmbeddedDocument("Region",this.regionId) : {}
        return region ?? {}
    }

    /**
     * returns the scene document for the given zone scene id
     */
    get scene(){
        return game.scenes.get(this.sceneId);
    }

    /**
     * Array of scene level ids
     */
    get regionLevels(){
        if(!this.hasRegion) return []
        return this.region.levels.size ? [...this.region.levels] : []
    }

    /**
     * Array of scene level documents
     */
    get sceneLevels(){
        return helper.filterLevels(this.scene, {output: 'documents'})
    }

    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    /**
     * Generates the boundary for this zone
     * @returns boundary class
     */
    get zoneBoundary(){
        //return the boundary for the zone, with settings for exclude, universe, and region
        return new boundary(this.boundary.A, this.boundary.B, this.boundary.elevation, this.zoneBoundaryOptions)
    }

    /**
     * returns an object typically submitted into the boundary constructor when pulling the actual zone boundary
     */
    get zoneBoundaryOptions(){
        return {
            exclude: this.excludedTaggedEntities,    //Generate the exclusion list of documents 
            levels: this.zoneLevels,    //include the zone levels   
            limit: this.zone.sourceArea,   //Generate a universe of documents for the boundary to use that consists of the zone's sources
            regionUuid: this.region.uuid  //include the region
        }
    }

    /**
     * Array of zone level ids
     * An empty array = all levels
     */
    get zoneLevels(){
        let levels
        if(this.hasRegion){
            levels = this.regionLevels
        } else if(this.levels.length) {
            //filter out level ids on zone that are no longer on the scene (were deleted)
            levels = helper.filterLevels(this.scene, {output: 'ids', filterIds: this.levels}) 
        } else {
            levels = []
        }
        return levels
    }

    /**
     * id of zone level visible to GM. 
     * Is blank if no zone level is visible to GM
     * Assumes that all danger zone processing is on the GM's instance
     */
    get zoneLevelGMVisible(){
        let visible

        //return array of level documents from scene that are considered zone levels
        const arr = helper.filterLevels(this.scene, {output: 'documents', filterIds:this.zoneLevels}) 

        //return the id for the level in view
        if(arr.length){
            visible = arr.find(lvl => lvl.isView)?.id
        }

        return visible
    }



    /** a boundary that includes grids outside of the defined boundary, 
     * allows enough room for the options range to select any grid in boundary, even the lowest row or column, which, if range dimensions exceed 1 grid, would overrun the boundary dimensions
     * @param {boundary} b // the boundary class for the zone
     * @param {object} options {range: {w: , h: , d:}}//object set by dimensions class dangerRelativeDimensions(). Sets the danger's dimensions
     * @returns 
     */
    boundaryBleed(b, options = {}){

        //means to adjust the area to account for situations where the zone's danger dimensions exceeds zone boundary
        //this adjustment is used to factor in the bleed
        const adjustedDim = {
            j: b.dimensions.j - (Math.min(b.dimensions.j, (this.danger.dimensions.units.w - 1))), 
            i: b.dimensions.i - (Math.min(b.dimensions.i, (this.danger.dimensions.units.h - 1)))
        }

        //ensure that the adjusted dimension point position is on the left corner of the top left grid spot
        const topLeft = canvas.grid.getTopLeftPoint(adjustedDim);

        //creates a new point, including the elevation that calculates a similar bleed
        const p = new point(topLeft, b.bottom - this.danger.dimensions.units.d )

        //create the new boundary with the bleed dimensions, setting inclusive to 
        b = new boundary(
                p.coords, 
                b.B, 
                {bottom: p.elevation, top: b.top}, 
                options
            )
        
        return b
    }



    /** a boundary that includes grids within the defined boundary or a reduced set, 
     * constraining the number of grids so that the options range to can select top left of any grid in boundary and not overrun the boundary
     * @param {boundary} b // the boundary class
     * @param {object} options {range: {w: , h: , d:}}//object set by dimensions class dangerRelativeDimensions(). Sets the danger's dimensions
     * @returns 
     */
    boundaryConstrained(b, options = {}){

        //this adjustment is used to factor constrain so any danger target will fit fully in zone
        const adjustedDim = {
            d: b.depth - options.range.d, 
            h: b.dimensions.h - (options.range.h - 1), 
            w: b.dimensions.w - (options.range.w - 1)
        }

        //generate the new boundary for the adjusted dimensions
        b = boundary.locationToBoundary(
            b.A, 
            b.elevation, 
            adjustedDim, 
            options
        )

        return b
    }



    /**Generates an iterator that can then be used to output a random boundary
     * 
     * @returns iterator *
     */
    getZoneTargetGridsIterator() {
        //start with zone boundary
        const b = this.zoneBoundary

        //the danger's width, height, and depth. Else the boundary for this dimension (typically 1,1,0)
        const options = {
            ...this.zoneBoundaryOptions,
            range: this.dangerRelativeDimensions,
            inclusive: false //set the inclusive key on the options to false
        }

        //if zone dimensions include stretch, adds to the options object either 'bottom' or 'top' value, based on stretch setting
        this.zone.stretch(options);

        //generate the boundary from the zone boundary, accounting for bleed
        this.zone.dimensions.bleed ? this.boundaryBleed(b, options) : this.boundaryConstrained(b, options);
        
        //generate the random boundary iterator
        const grids = b.boundaryRangeIterator();

        dangerZone.log(false,'Zone Danger Target Grid Iterator Created  ', {"zoneScene": this, boundary: b, grids: grids, zone: this.zone, options: options})

        return grids
    }

    static tokenMovement(token, update){
        const endPos = {
            coords: {
                x: update.x ? update.x : token.x,
                y: update.y ? update.y : token.y
            },
            elevation: update.elevation ? update.elevation : token.elevation 
        };
        const startPos = {
            coords: {
                x: token.x,
                y: token.y
            },
            elevation: token.elevation
        };
		const startGrid = canvas.grid.getOffset(token);
		const endGrid = canvas.grid.getOffset(endPos.coords);
		return {
            start:startPos,
            end: endPos,
            dimensions: {
                h:  Math.abs(startGrid.i - endGrid.i),
                w: Math.abs(startGrid.j - endGrid.j),
                d: Math.abs(startPos.elevation - endPos.elevation)
            },
			height: Math.abs(startPos.coords.y - endPos.coords.y ),
			width: Math.abs(startPos.coords.x - endPos.coords.x)
		}
    }

    /****Highlighting methods */
    static addHighlightZone(zoneId, sceneId, nameModifier = '', dangerId = ''){
        const zn = dangerId ? dangerZone.getGlobalZone(dangerId, sceneId)?.scene : dangerZone.getZoneFromScene(zoneId, sceneId)?.scene;
        if(zn) zn.addHighlightZone(nameModifier)
    }

    addHighlightZone(nameModifier = ''){
        const boundary = this.zoneBoundary
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
}


    /*
        options:{ 
            inclusive: bool //indicates whether the bottom and right edges are included in the boundary,
            retain: bool //prevents the boundary during initialization to locking the boundary points to the grid. Instead, point may be anywhere and not residing on a grid intersection
            universe: Set //
            bottom: Integer //override value for bottom getter, so that is output rather than the elevation bottom
            limit: object { //object for universe definition that is returned from the SourceArea() functionA
                target: string// the source.target (A: Adjacent, I: In, B: Both)
                documents: array //an array of documents that are used to build the universe for establishing boundary dimensions
                }   
            exclude: array //an array of documents that are used to exclude areas from the boundary
            levels: array// passed in for constructor. These are the leves that further define the boundary
        }
    */
export class boundary{
    constructor (a = {x:0, y:0}, b = {x:0, y:0}, elevation = {bottom: -Infinity, top: Infinity}, options = {}) {
        this.A = {
            x: a.x ? Math.min(a.x, a.x ? b.x : b.x) : 0,
            y: a.y ? Math.min(a.y, a.y ? b.y : b.y) : 0
        },
        this.B = {
            x: b.x ? Math.max(a.x ? a.x : b.x, b.x) : 0,
            y: b.y ? Math.max(a.y ? a.y : b.y, b.y) : 0
        },
        this.elevation = elevation,
        this.excludes = new Set(),
        this.gridsArray = [],
        this.gridIndex = new Set(),
        this.levels = options.levels ?? [],
        this.options = options,
        this.universe = options.universe ?? (options.limit?.target ? new Set() : '');
        this._init()
    }

    /****Initialization Activities */
    


    /**
     * Initializes additional index and positional data for boundary
     */
    _init(){
        //if not set to keep points where they are, locks the boundary points to the grid 
        if(!('retain' in this.options)) this._toTopLeft();

        //index the exclusion grids
        if(this.exclude) this._exclude();

        //index the universe grids
        if(this.limit.target) this._universe();

        //initialize the array of grid indices that make up the boundary, accounting for universe and exclusion
        this._setGridIndex();
    }
    



    /**Initialization: Exclusion Index
     * run through the documents in the exclude option and index them for future reference
     */
    _exclude(){
        this._indexDocuments(this.exclude, this.excludes)
    }




    /**Initialization: Universe Index
     * run through the documents in the limit option and index them for future reference
     */
    _universe(){
        //index the universe and load to the class
        this._indexDocuments(this.limit.documents, this.universe)

        //if target is I 'in' for inside the dimensions only, then return the universe as is
        if(this.limit.target === 'I') return

        //else iterate through the univers to find adjacent grids
        const newUniv = new Set() 
        this.universe.forEach((value) => {
            const[i, j] = value.split('_')
            const nghbrs = canvas.grid.getAdjacentOffsets({i:Number(i), j:Number(j)})
            for(const pos of nghbrs){
                let index = boundary.makeIndex(pos)

                //of target is A 'adjacent', add this
                if(this.limit.target === 'A') {
                    if (!this.universe.has(index)) newUniv.add(index)
                } 
                //If not adjacent, then it is both in and adjacent
                else {
                    newUniv.add(index)
                }
            }
        })

        //replace the universe with the new universe
        this.universe = newUniv
    }




    /**Initialization: Indexing function
     * intakes a list of documents to index and then insert into the indices class array
     * 
     * @param {array} documents //array of documents
     * @param {array} indices  //class array 
     */
    _indexDocuments(documents, indices){
        for(const document of documents){
            const documentName = document.documentName ?? document.document.documentName;
            const b = boundary.documentBoundary(documentName, document, {inclusive: (documentName === "Token" ? false : true)});
            const grids = b.grids()  
            for(const grid of grids){
                let index = boundary.makeIndex(grid);
                if(indices.has(index)) continue
                switch(documentName){
                    case "Wall":
                        if(!rayIntersectsGrid(grid, document.object.toRay())) continue
                        break
                    case "AmbientLight":
                        if(!circleAreaGrid(grid.shift.w, grid.shift.h, b.dimensions)) continue
                        break
                    default:
                }
                indices.add(index)
            }
        }
        dangerZone.log(false, 'Tagged ', {tagged: documents, boundary: this, indices: indices});
    }




    /**Initialization: adds the boundary grids to the grid index
     * creates a set of indexes for all of the boundary's grids
     * 
     */
    _setGridIndex(){
        const grids = this.grids();

        for(const grid of grids){
            this.gridIndex.add(boundary.makeIndex(grid))
        }
    }




    /**Initialization: lock into grid
     * Used to ensure that that boundary points are locked to the grid points (as opposed to mid-grid)
     */
    _toTopLeft(){    
        this.A = canvas.grid.getTopLeftPoint(this.A);
        this.B = canvas.grid.getTopLeftPoint(this.B);
    }



    /**Getters */
    
    get bottom(){
        return this.options.bottom ?? this.elevation.bottom
    }

    get bottomIsInfinite(){
        return this.bottom === -Infinity || this.bottom === null
    }
    
    get bottomToElevation(){
        return this.bottomIsInfinite ? 0 : this.bottom
    }

    get center(){
        return {x: this.A.x + (this.width/2), y: this.A.y + (this.height/2)}
    }

    get depth(){
        return this.depthIsInfinite ? null : Math.abs(this.top - this.bottom)
    }

    get depthIsInfinite(){
        return this.topIsInfinite || this.bottomIsInfinite
    }

    get dimensions(){
        const top = canvas.grid.getOffset(this.A);
        const left = canvas.grid.getOffset({x:this.A.x, y:this.B.y});
        const right = canvas.grid.getOffset({x:this.B.x, y:this.A.y});
        const bottom = canvas.grid.getOffset(this.B);
        const w = Math.max(right.j,bottom.j) - Math.min(top.j,left.j);
        const h = Math.max(bottom.i,left.i) - Math.min(top.i,right.i);

        return {w: w, h: h, j:top.j, i:top.i, top: top, left: left, right: right, bottom: bottom}
    }

    get elevationArray(){
        if (this.depthIsInfinite) return [0]
        const arr = []
        for (let i = 0; i < this.depth; i++) {
            arr.push(this.bottom + i);
        }
        return arr
    }

    get exclude(){
        return this.options.exclude
    }

    get height(){
        return Math.abs(this.B.y - this.A.y)
    }

    get inclusive(){
        return (this.options.inclusive || (!('inclusive' in this.options) && this.region?.id)) ? true : false
    }

    get limit(){
        return this.options.limit ?? {}
    }

    get location(){
        return {x:this.A.x, y:this.A.y, elevation: this.bottom}
    }

    get offset(){
        return this.options.offset
    }

    get range(){
        return this.options.range ?? {w: 1, h:1, d:0}
    }

    get region(){
        return this.regionUuid ? fromUuidSync(this.regionUuid) : {}
    }

    get regionUuid(){
        return this.options.regionUuid ?? ''
    }

    get top(){
        return this.options.top ?? this.elevation.top
    }

    get topIsInfinite(){
        return this.top === Infinity || this.top === null
    }
    
    get topToElevation(){
        return this.topIsInfinite ? 0 : this.top
    }

    get width(){
        return Math.abs(this.B.x - this.A.x)
    }

    _testGridToRegion(dim = {}){
        let inRegion = false, i = 0;
        let vertices = []//canvas.grid.getVertices(dim)
        if(this.range.h > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i + (this.range.h-1), j: dim.j})))//vertices = vertices.concat(canvas.grid.getVertices({i: dim.i + (this.range.h-1), j: dim.j}))
        if(this.range.w > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i, j: dim.j + (this.range.w - 1)})))//vertices = vertices.concat(canvas.grid.getVertices({i: dim.i, j: dim.j + (this.range.w - 1)}))
        if(this.range.h > 1 && this.range.w  > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i + (this.range.h-1), j: dim.j + (this.range.w - 1)}))) //vertices = vertices.concat(canvas.grid.getVertices({i: dim.i + (this.range.h-1), j: dim.j + (this.range.w - 1)}))
        vertices.push(canvas.grid.getCenterPoint(dim))
        //dangerZone.log(true, "Testing Grid to Region", {dimensions: this, region: this.region, coord: dim, vertices: vertices})
        do {
            const testPoint = vertices[i];
            for(const d of this.elevationArray){
                inRegion = this.region.testPoint({x: testPoint.x, y: testPoint.y, elevation: d})
                if(inRegion) break;
            }
            i++
        } while (!inRegion && i < vertices.length)
        return inRegion
    }

    /** the grids that make up the boundary, as an iterator
     * 
     */
    * grids(){
        const dim = this.dimensions; 

        const maxW = this.inclusive ? dim.w : dim.w - 1;
        const maxH = this.inclusive ? dim.h : dim.h - 1;

        for(let m=0; m <= maxW || m===0; m++){
            for(let n=0; n <= maxH; n++){

                let coord = {i: dim.i+n, j: dim.j+m}; 
                let coordIndex = boundary.makeIndex(coord);

                //skip if the index is in the excludes Set
                if(this.excludes.has(coordIndex)) continue;

                //skip if there is a universe and the universe does not include this index
                if((this.universe && !this.universe.has(coordIndex))) continue;

                //skip if boundary is a region and it fails the region test
                const inRegion = !this.region?.object || this._testGridToRegion(coord)
                if(!inRegion) continue;

                //output the grid
                yield {
                    i:coord.i, 
                    j:coord.j, 
                    e: this.bottom, 
                    index: coordIndex, 
                    shift: {w:n, h:m}
                }
            }
        }
    } 




    /** Returns an iterator of every grid point eligible for this boundary
     * 
     * @returns iterator of grid boundaries for any given range included in this boundary
     */
    * boundaryRangeIterator (){

        //cache the grid array
        if(!this.gridsArray.length) this.gridsArray = [...this.grids()];

        if(this.gridsArray.length === 0 || this.depth < 0){
            if(this.depth < 0 && game.user.isActiveGM){
                ui.notifications?.error(game.i18n.localize("DANGERZONE.alerts.danger-depth-exceeds-zone"));
            }
            return dangerZone.log(false,'Invalid zone settings ', {boundary: this})
        }

        const ops = {
                excludes: this.excludes,
                universe: this.universe,
                ...(this.options.inclusive !== undefined && {inclusive: this.options.inclusive}),
                ...(this.options.regionUuid && {regionUuid: this.options.regionUuid}),
                ...(this.options.bottom !== undefined && {bottom: this.options.bottom}),
                ...(this.options.top !== undefined && {top: this.options.top}),
                ...(this.options.range && {range: this.range})
            };

        const zAdj = this.depth ? (this.range.d ?? this.depth-1) : 0 

        //iterator function
        while(true){
            const test = helper.pickRandom(this.gridsArray)

            const topLeft = canvas.grid.getTopLeftPoint(test); 
            const bottomRight = point.shiftPoint(topLeft, this.range);

            const randomDepth = this.depthIsInfinite ? 0 : Math.floor((Math.random() * this.depth));
            const bottom = test.e + randomDepth;
            const top = this.topIsInfinite ? Infinity : bottom + zAdj;

            yield new boundary(topLeft, bottomRight, {bottom: bottom, top: top}, ops)
        }

    }




    /**Converts a foundry document into a Danger Zone boundary
     * 
     * @param {*} documentName 
     * @param {*} document 
     * @param {*} options  //options not used here are also passed through into the boundary method
     *  {
     *      elevation: {bottom: integar, top: integer}} //used to pass in bottom and top of zone for world zones,
     *  }
     * @returns 
     */
    static documentBoundary(documentName, document, options = {}){
        let dim;
        switch(documentName){
            case "Wall":
                const wallElevation = helper.sceneLevelsElevationBounds(document.parent, document.levels) 
                dim={
                    x: document.object.bounds.x, 
                    y:document.object.bounds.y, 
                    width: document.object.bounds.width, 
                    height: document.object.bounds.height, 
                    bottom: wallElevation.bottom, 
                    top: wallElevation.top
                }
                break
            case "AmbientLight":
                const radius = document.object.radius
                const dm = (radius * 2) - 1
                dim={
                    x:document.object.bounds.x, 
                    y:document.object.bounds.y, 
                    width: dm, 
                    height: dm, 
                    bottom: document.elevation - radius, 
                    top: document.elevation + radius
                } 
                break;
            case "Drawing":
                dim={
                    x: document.x, 
                    y:document.y, 
                    width: document.shape.width, 
                    height: document.shape.height, 
                    bottom: document.elevation, 
                    top: document.elevation
                }
                break;
            case "Region":
                dim={
                    x: document.object.bounds.x, 
                    y:document.object.bounds.y, 
                    width: document.object.bounds.width, 
                    height: document.object.bounds.height, 
                    bottom: document.elevation.bottom, 
                    top: document.elevation.top
                }
                break;
            case "Scene":
                const sceneElevation = helper.sceneLevelsElevationBounds(document, document.levels) 
                dim={
                    x: document.dimensions.sceneX, 
                    y:document.dimensions.sceneY, 
                    width: document.dimensions.sceneWidth, 
                    height: document.dimensions.sceneHeight, 
                    bottom: sceneElevation.bottom, 
                    top: sceneElevation.top
                }
                break;
            case "Tile":
                dim={
                    x: document.x, 
                    y:document.y, 
                    width: document.width - 1, 
                    height: document.height - 1, 
                    bottom: document.elevation, 
                    top: document.elevation
                }
                break;
            case "Token":
                const multiplier = game.settings.get(dangerZone.ID, 'token-depth-multiplier');
                const position = canvas.grid.getOffset(document);
                const topLeft = canvas.grid.getTopLeftPoint({j:position.j + document.width, i:position.i + document.height}); 
                const distance = document.parent?.dimensions?.distance ? document.parent?.dimensions?.distance : 1
                const Td = (distance * Math.max(document.width, document.height) * multiplier);
                dim = {
                    x:document.x, 
                    y:document.y, 
                    width: topLeft.x - document.x, 
                    height: topLeft.y - document.y, 
                    bottom:document.elevation, 
                    top: document.elevation + Td
                };
                break
            default: 
                dim=document
        }

        //generate the new bound
        const A = {x: dim.x, y: dim.y}
        const B = {x: A.x + dim.width, y: A.y + dim.height}
        const e = {bottom: options.elevation?.bottom ?? dim.bottom, top: options.elevation?.top ?? dim.top}
        const b = new boundary(A, B, e, options)

        //return the boundary
        return b
    }



    static locationToBoundary(coords, elevation, units, options={}){
        let position = point.shiftPoint(coords, units)
        dangerZone.log(false,'Location to boundary...', {point: coords, units: units, options: options});
        return new boundary(coords, position, {bottom: elevation.bottom, top: elevation.bottom + units.d}, options)
    }



    /**Makes an index out of given coordinates
     * 
     * @param {obj} coords //obj with {i,j} coordinates
     * @returns string //index of those coordinates understood by Danger Zone processing
     */
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

    static offsetBoundary(bndry, globalOffset, offset, scene = canvas.scene){
        function flip(flip, flipLocation){
            if (typeof flip == "boolean") {
                return ((flip && flipLocation) ? -1 : 1)
            }
            return ((['N', 'L', 'B'].includes(flip) && flipLocation) ? -1 : 1 )
        }
        const obj = {A: {x: 0, y: 0}, B: {x: 0, y: 0}, elevation: bndry.elevation,options: {offset: {x: {flip: 0, amt: 0}, y: {flip: 0, amt: 0}}, retain: true}};
        obj.options.offset.x.flip = flip(offset.x.flip, globalOffset.x.flipLocation)
        obj.options.offset.y.flip = flip(offset.y.flip, globalOffset.y.flipLocation)
        obj.options.offset.x.amt = boundary.offsetAxis(offset.x, obj.options.offset.x.flip, scene, globalOffset.x.random)
        obj.options.offset.y.amt = boundary.offsetAxis(offset.y, obj.options.offset.y.flip, scene, globalOffset.y.random)
        Object.assign(obj.A, {x: bndry.A.x + obj.options.offset.x.amt, y:bndry.A.y + obj.options.offset.y.amt})
        Object.assign(obj.B, {x: bndry.B.x + obj.options.offset.x.amt, y:bndry.B.y + obj.options.offset.y.amt})
        return new boundary(obj.A, obj.B, obj.elevation, obj.options)
    }

    /**Intakes an array of tokens and outputs an array consisting of those tokens that exist within the document bounds. 
     * Does not account for levels
     * 
     * @param {array} tokens //an array of token documents
     * @returns 
     */
    tokensIn(tokens){
        let kept = [];

        //iterate over tokens, keeping those that exist in the boundary
        for(let token of tokens){

            //generates a boundary for the token
            const b = boundary.documentBoundary('Token', token);

            //checks intersection of token boundary with this boundary, keeping token on intersect
            if(this.intersectsBoundary(b)) kept.push(token)
        }

        return kept
    } 

    intersectsBoundary(bound = boundary){
        if((this.bottomIsInfinite || this.bottom < bound.top) && (this.topIsInfinite || this.top >= bound.bottom)) {
            const grids = bound.grids()
            for(const grid of grids){
                if(this.gridIndex.has(grid.index)) return true
            }
        }
        return false
    }

    /**Highlights a grid highlight layer with the dimensions of this boundary
     * 
     * @param {*} name //highlight layer name to use for locating the highlight and turning it off
     * @param {*} color //the color to use for highlight
     */
    highlight(name, color = 16737280){

        //append to id for the highlight layer the danger zone prefix
        let hId = 'dz-' + name;

        //add the highlight level
        canvas.interface.grid.addHighlightLayer(hId);

        //for each grid of this boundary, add the highlight color
        const grids = this.grids();
        for(const grid of grids){ 
            let position = canvas.grid.getTopLeftPoint(grid);
            canvas.interface.grid.highlightPosition(hId, {x: position.x, y: position.y, color:color});
        }
    }

    //destroy a highlight layer previously created for displaying this boundary in highlight
    destroyHighlight(name){
        canvas.interface.grid.destroyHighlightLayer('dz-' + name)
    }
}

export class point{
    constructor(coords = {x: 0, y: 0}, elevation = null){
        this.coords = coords,
        this.elevation = elevation;
        this._toTopLeft();
    }
    
    _toTopLeft(){    
        this.coords = canvas.grid.getTopLeftPoint(this.coords);
    }

    static shiftPoint(reference = {}, shift = {}){
        for(let i=0;i<Math.abs(shift.w);i++){reference = canvas.grid.getShiftedPoint(reference, shift.w > 0 ? CONST.MOVEMENT_DIRECTIONS.RIGHT : CONST.MOVEMENT_DIRECTIONS.LEFT)}
        for(let i=0;i<Math.abs(shift.h);i++){reference = canvas.grid.getShiftedPoint(reference, shift.h > 0 ? CONST.MOVEMENT_DIRECTIONS.DOWN : CONST.MOVEMENT_DIRECTIONS.UP)}
        return reference
    }
}