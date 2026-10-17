import {dangerZone} from '../danger-zone.js';
import {helper} from './helpers.js';

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

    /**Returns the danger class for the zone
     * 
     */
    get danger(){
        return this.zone.danger;
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


    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    /**
     * Generates the boundary for this zone
     * @returns boundary class
     */
    get zoneBoundary(){
        const region = this.hasRegion ? this.region : helper.documentToRegion(this.scene, this.scene)
        const options = this.zoneBoundaryOptions
        options.region = region
        
        //return the boundary for the zone, with settings for exclude, universe, and region
        dangerZone.log(false, 'Creating zone boundary on zone dimensions', {zone: this, region: region, options: options})

        return new boundary(this.elevation, this.scene, options) 
    }

    /**
     * returns an object typically submitted into the boundary constructor when pulling the actual zone boundary
     */
    get zoneBoundaryOptions(){
        return {
            elevation: this.elevation,
            exclude: helper.getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene),    //Generate the exclusion list of documents 
            levels: this.zoneLevels,    //include the zone levels   
            universe: this.zone.sourceArea,   //Generate a universe of documents for the boundary to use that consists of the zone's sources
            regionUuid: this.region.uuid,  //include the region
            stretch: this.zone.dimensions.stretch
        }
    }

    /**
     * Array of zone level ids
     * An empty array = all levels
     */
    get zoneLevels(){
        let levels
        if(this.hasRegion){
            levels = this.region.levels.size ? [...this.region.levels] : []
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


    /****Highlighting methods */

    /**Add a highlight for a zone on the given scene
     * 
     * @param {zone} zone 
     * @param {string} sceneId id of a scene
     * @param {object} options {danger: string id of danger, level: string id of level to use for highlighting, id: string that is used to build the name of the highlight layer}
     */
    static addHighlightZone(zone, sceneId, options = {}){
        const zn = zone.scene ?? (options.danger ? dangerZone.getGlobalZone(options.danger, sceneId)?.scene : dangerZone.getZoneFromScene(zone, sceneId)?.scene)
        if(zn) zn.addHighlightZone(options)
    }


    /**Add a highlight for a zone's level
     * 
     * @param {object} options {level: string id of level to use for highlighting, id: string that is used to build the name of the highlight layer}
     */
    addHighlightZone(options = {}){

        const name = options.id ?? ''
        const level = options.level ?? helper.getDefaultLevel(this.scene.sceneId)

        let namePrefix, color;

        if (this.dangerId) {
            namePrefix = this.dangerId
            color = 10737280
        } else {
            namePrefix = this.zoneId
            color = 16737280
        }

        this.zoneBoundary.highlight({level: level, id: namePrefix + name, color: color})
    }


    /**Deletes a highlight layer for the given zone. 
     * 
     * @param {string} zoneId 
     * @param {string} id name of the highlight layer
     * @param {string} dangerId 
     */
    static destroyHighlightZone(zoneId, id = '', dangerId = ''){
        const name = 'dz-' + (dangerId ? dangerId : zoneId) + id;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }



    /**Deletes a highlight layer for this zone
     * 
     * @param {string} id name of the highlight layer
     */
    destroyHighlightZone(id = ''){
        const name = 'dz-'+ (this.dangerId ? this.dangerId : this.zoneId) + id;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }
}


    /*
        options:{
            name: string //name of region. Default is Boundary Region
            topInclusive: //indicates if the top of the elevation provide is inclusive in the boundary

            bottom: Integer //override value for bottom
            top: Integer //override value for top
            universe: object { //object for universe definition that is returned from the SourceArea() functionA
                target: string// the source.target (A: Adjacent, I: In, B: Both)
                documents: array //an array of documents that are used to build the universe for establishing boundary dimensions
                }   
            exclude: array //an array of documents that are used to exclude areas from the boundary
            levels: array// passed in for constructor. These are the leves that further define the boundary
            stretch: the stretch type

            regionUuid: a Uuid to select back a region that is permanent
            region: the region. used when region is temporary
        }
    */
export class boundary{
    constructor ( elevation = {bottom: -Infinity, top: Infinity}, scene, options = {}) {
        this.#options = options;
        this.#scene = scene;
        this.#elevation = elevation;

        this._init()
    }


    /**Elevation as passed in to the constructor
     * @type object {bottom, top}
     */
    #elevation

    /**shapes that make up the excludes (holes) by level
     * @type Map()
     */
    #excludes 

    /**Regions that make up the boundary by level
     * @type Map()
     */
    #levelsRegions = new Map()

    /**Options passed into the construcoor
     * @type object
     */
    #options

    #region 

    /**Object data used to construct regions when building out the boundary levels regions
     * @type object
     */
    #regionData = {}

    /**Scene the boundary exists on
     * @type scene
     */
    #scene
    
    /**The type of boundary, which is determined by the data used to create it
     * //'dimension', 'region', 'universe'
     * @type string
     */
    #type 

    /**Shapes that make up the universe by level
     * @type Map()
     */
    #universe



    /** GETTERS */
    //this initial coordinate passed in for top left

    get bottom(){
        return this.elevation.bottom
    }

    get bottomIsInfinite(){
        return helper.isInfinite(this.bottom)
    }
    
    get bottomToElevation(){
        return this.bottomIsInfinite ? 0 : this.bottom
    }

    get bounds(){
        return this.region.bounds
    }

    get center(){
        return this.bounds.center
    }

    get depth(){
        return this.depthIsInfinite ? null : Math.abs(this.top - this.bottom)
    }

    get depthIsInfinite(){
        return this.topIsInfinite || this.bottomIsInfinite
    }

    get elevation(){
        return this.region.elevation
    }

    get excludes(){
        return this.#excludes
    }

    get hasExclusions(){
        return this.excludes?.size ? true : false
    }

    get hasRegion(){
        return (this.options.regionUuid || this.options.region) ? true : false
    }

    get hasUniverse(){
        return this.options.universe?.target ? true : false
    }

    get height(){
        return this.bounds.height 
    }

    get levelIds(){
        return this.levels.length ? this.levels : helper.filterLevels(this.scene, {output: 'ids'})
    }
    
    get levels(){
        return [...this.region.levels]
    }

    /**
     * Names of the levels associated with this danger's targeting
     */
    get levelsNames(){
        return helper.getLevelsNames(this.scene, this.levels)
    }

    get levelsRegions(){
        return this.#levelsRegions
    }

    get location(){
        return {x:this.bounds.x, y:this.bounds.y, elevation: this.bottom}
    }

    get options(){
        return this.#options
    }

    get regionData(){
        return this.#regionData
    }

    get region(){
        return this.#region
    }

    get scene(){
        return this.#scene
    }

    get stretch(){
        return this.options.stretch
    }

    get top(){
        return this.elevation.top
    }

    get topIsInfinite(){
        return helper.isInfinite(this.top)
    }
    
    get topToElevation(){
        return this.topIsInfinite ? 0 : this.top
    }

    get type(){
        return this.#type
    }

    get universe(){
        return this.#universe
    }

    get width(){
        return this.bounds.width
    }

    /**  PRIVATE METHODS */
    /**
     * Initializes additional index and positional data for boundary
     */
    _init(){
        //set the type of boundary
        this._setType()

        //set the data object used for generating boundary regions
        this.#setRegionData()
        
        this.#setBoundaryRegion()

        //index the exclusion grids
        this.#setExcludes();

        //index the universe grids
        this.#setUniverse();

        //set the region
        this.#setLevelsRegions();
    }



    /**Delete on the levelsRegions map the level id 
     * 
     * @param {string} level  level id 
     */
    #deleteLevelRegion(level){
        this.#levelsRegions.delete(level)
    }



    /**
     * Intakes a set of documents and outputs an array of documents that are within this boundary's levels
     * @param {set} documents //set of documents
     * @param {array} levels //array of level ids to filter down to
     * @returns 
     */
    #filterDocumentsByBoundaryLevel(documents, levels = []){
        //all leves are included
        if(!this.levels.length) return documents

        //if levels are passed in, use those, making sure they exist in this boundary
        const filterLevels = levels.length ? levels.filter(l => this.levelIds.includes(l)) : this.levelIds

        //boundary specifies levels
        return documents.filter(doc => filterLevels.some(id => doc.locatedInLevel(id)));
    }



    /**
     * creates a Map of all of the level ids on this boundary. 
     * The ids will each be associated to a region document once set
     */
    #initializeExcludes(){
        this.#excludes = new Map(this.levelIds.map(id => [id, []]));
    }


    /**
     * Set the boundary region - used for calculating overall size. Possibly deprecated in future
     */
    #setBoundaryRegion(){
        this.#region = RegionDocument.implementation.fromSource(this.regionData, {parent: this.scene})
    }


    /**
     * run through the documents in the exclude option and create shapes that will then be part of creating this boundary's region
     * @returns 
     */
    #setExcludes(){
        if(!this.options.exclude?.length) return 

        //initialize excludes
        this.#initializeExcludes();

        //reduce the passed in exclusion documents to only those that are applicable (those locate on a level in the boundary)
        const documents = this.#filterDocumentsByBoundaryLevel(this.options.exclude)

        //generate the shapes for all of the documents as holes
        //the insert them into the level applicable for that shape
        for(const document of documents){  
            const {shapes, levels} = helper.documentToRegion(document, null, {hole: true, asObject: true})
            if(shapes.length) {
                for(const [id, array] of this.excludes){
                    if(!levels.length || levels.includes(id)) array.push(...shapes)
                } 
            }
        }
    }




    /**Set on the levelsRegions map the region associated to the level id as key
     * 
     * @param {string} level  level id 
     * @param {document} region region document 
     */
    #setLevelRegion(level, region){
        this.#levelsRegions.set(level, region)
    }


    /**Iterate through each level of this boundary and
     * set a region, assigning it to that level
     * Region includes consideration towards exclusion and universe
     */
    #setLevelsRegions(){
        for(const level of this.levelIds){
            //get the generic options
            let source = foundry.utils.deepClone(this.regionData)

            //check for universe. 
            if(this.hasUniverse){
                //if universe exists, get the shapes for this level
                const universeShapes = this.universe.get(level)

                //if there are no universe shapes for this level, delete the level from the map and continue
                if(!universeShapes.length) {
                    this.#deleteLevelRegion(level)
                    continue
                }

                //else replace the source shapes with the universe shapes
                source.shapes = universeShapes
            }

            //add the exclusions
            if(this.hasExclusions){
                const exclusions = this.excludes.get(level)
                if(exclusions?.length) source.shapes = source.shapes.concat(exclusions)
            }
            
            //create the region
            const region = RegionDocument.implementation.fromSource(source, {parent: this.scene})

            this.#setLevelRegion(level, region)
        } 
    }

    #setRegionData(){
        let regionData

        //for boundaries created from a region, set the region data for this boundary from that region
        if(this.type === 'region') {
            const region = this.options.region ?? fromUuidSync(this.options.regionUuid)
            regionData = region ? region.toObject() : {}
        } 
        //else set out the universe stub, which will be further populated by shapes during the set Universe step
        else {
            const {bottom, top} = this.#elevation;

            regionData = {
                elevation: {
                    bottom,
                    top,
                    topInclusive: false
                },
                levels:[],
                name: "Universe Boundary"
            }
        }

        //insert options
        const opts = this.options;

        if(opts.name) regionData.name = opts.name;
        if(opts.bottom) regionData.elevation.bottom = opts.bottom;
        if(opts.top) regionData.elevation.top = opts.top;
        if(opts.topInclusive) regionData.elevation.topInclusive = opts.topInclusive;
        if(opts.levels) regionData.levels = opts.levels;

        this._setRegionData(regionData)
    }



    /**Generate the universe as an array of shapes associated to each level the document exists in
     * Include handling for source area settings (adjance, in, in and adjacent)
     */
    #setUniverse(){
        if(this.hasUniverse){

            this.#universe = new Map(this.levelIds.map(id => [id, []]))

            //reduce the passed in universe documents to only those that are applicable (those locate on a level in the boundary)
            const documents = this.#filterDocumentsByBoundaryLevel(this.options.universe.documents)

            
            //generate the shapes for all of the documents as holes
            //the insert them into the level applicable for that shape
                //I = keep as is, A = adjacent, then another is for ajacent or in
            for(const document of documents){  
                const {shapes, levels} = helper.documentToRegion(document, null, {asObject: true})
                if(shapes.length) {
                    for(const [id, array] of this.#universe){
                        if(!levels.length || levels.includes(id)) array.push(...shapes)
                    } 
                }
            }
        }
    }
    


    /**Perform the stretch on the top and bottom elevation if passed in as an option
     * 
     * @param {object} elevation //top and bottom
    */
    #stretch(elevation = {}){
        switch(this.stretch){
            case "B":
                elevation.bottom = this.scene.elevation.bottom
                break;
            case "G":
                elevation.bottom = 0
                break;
            case "S":
                elevation.top = Infinity
                break;
            case "T":
                elevation.top = this.scene.elevation.top
                break;
            }
    }


    /**
     * Exposed private method for setting region data
     * @param {object} data 
     */
    _setRegionData(data = {}){
        Object.assign(this.#regionData, data)
    }


    /**Set a type identifier
     *  @param {string} type 
     */
    _setType(intype = ''){
        let type

        if(intype){
            type = intype
        }
        else if(this.hasRegion){
            type = 'region'
        } else {
            type = 'universe'
        }

        this.#type = type
    }


    /**  METHODS */


    /**destroy a highlight layer previously created for displaying this boundary in highlight
     * 
     * @param {string} name the name of the highlight layer
     */
    destroyHighlight(name){
        canvas.interface.grid.destroyHighlightLayer('dz-' + name)
    }
    


    /**return a boundary region that includes the shape
     * 
     * @param {PIXI} shape a PIXI shape
     * @param {object} elevation bottom and top of token
     * @param {array} levels array of level ids
     * @param {object} options stretch
     * @returns boolean false or object {region id, region} 
     */
    findRegionContainingShape(shape, elevation, levels = [], {stretch}){

        //must be shape and must have regions on the boundary
        if(!shape | !this.levelsRegions?.size) return false
        
        //convert shape to polygon
        const poly = shape.toPolygon()
 
        //test the region polygon tree for including shape. Return region key and region if so
        for(const [key, value] of this.levelsRegions) {
            if(levels.length){
                if(!levels.includes(key)) return false
            }

            const regionElevation = foundry.utils.deepClone(value.elevation)
            if(stretch){
                this.#stretch(regionElevation)
            }

            if(elevation) {
                const inEl = boundary.testElevation(regionElevation, elevation)
                if(inEl){
                    const inRegion = this.polygonIsInRegion(value, poly)
                    if(inRegion) return { key, value }
                }
            }
        }

        //else return false
        return false
    }


    /**
     * 
     * @param {object} elevation testing againt with top, bottom, topInclusive 
     * @param {object} elevation to test top / bottom
     * @returns boolean test, true if the elevation to test is within the elevation to test against
     */
    static testElevation({bottom, top, topInclusive}, elevation){
        if ( elevation.top < bottom ) return false;
        if ( elevation.top === elevation.bottom === bottom === top) return true; 
        if ( topInclusive ) return elevation.bottom <= top;
        return elevation.bottom < top;
    }



    /**Generates an object containing bounds for the boundary region associated with the given level
     * 
     * @param {string or level} level level id or the level class
     * @returns object
     */
    getLevelRegionBounds(level){

        const id = level?.id ?? level
        const region = this.levelsRegions.get(id)
        const dim = this.scene.dimensions

        const bounds = {
            clamp: {
                A:{
                    x: dim.sceneX,
                    y: dim.sceneY
                },
                B:{
                    x: dim.sceneX + dim.sceneWidth,
                    y: dim.sceneY + dim.sceneHeight
                }
            },
            gridSize: dim.size,
            scene: this.scene,
            level: id,
            bounds: region.bounds,
            elevation: region.elevation
        }

        return bounds
    }



    /**
     * 
     * @param {object} options 
     *               //bleed boolean
     *               //range object {
     *                          d: int //depth in elevation 
     *                          w: int //width in grid spaces
     *                          h: int //height in grid spaces
     *                      }
     *               //levels array of level ids to restrict search to
    *                //documents array of documents to restrict point to include
     *               //fail object {
     *                  noLevel //fail if no level is found under the given options
     *                  }
     */
    getRandomBoundary(options = {}){
        const {units: {w, h, d}, bleed} = options

        const randomPoint = this.getRandomPointInBoundary(options)

        const widthFactor = w - 1;
        const heightFactor = h - 1;
        const depthFactor = d - 1;

        //establish the shift once
        const shiftW = helper.pickRandom(widthFactor*-1, 0) 
        const shiftH = helper.pickRandom(heightFactor*-1, 0) 
        const shiftD = helper.pickRandom(depthFactor*-1, 0) 

        const startingPoint = point.shiftPoint(
            canvas.grid.getTopLeftPoint(randomPoint.point), 
            {w: shiftW, h: shiftH, d: shiftD}
        )

        const b = dimensionBoundary.locationToBoundary(
            startingPoint, 
            startingPoint.elevation, 
            {w, h, d}, 
            this.scene, 
            {levels: [randomPoint.level]}
        )
        
        return b
    }



    /**Generate a random point from within the boundary
     * 
     * @param {object} options 
    *               //levels array of level ids to restrict search to
    *               //documents array of documents to restrict point to include
    *               //fail object {
    *                  noLevel //fail if no level is found under the given options
    *                  }
     * @returns object {point {x,y,elevation}, string level}
     */
    getRandomPointInBoundary(options = {}){

        //extract options
        const {levels, documents} = options

        //establish levels to test within using the levels passed in else this boundary's levels
        const baseLevels = levels?.length ? levels : this.levelIds

        //variables to hold the documents and levels once filtered down
        let filteredLevels, filteredDocuments

        //if documents are provided, filter the levels to ones found within the documents
        if(documents) {
            filteredLevels = baseLevels.filter(l => documents.some(d => d.locatedInLevel(l)))

            //if no levels remain
            if(!filteredLevels.length){
                //if fail on no levels, return
                if(options.fail?.noLevel) return dangerZone.log(false, 'no available options in test boundary')
            
                //else set levels back to baseLevels
                filteredLevels = baseLevels
            } 
        } else {//else use the base levels
            filteredLevels = baseLevels
        }

        //generate random test level
        const level = filteredLevels.length < 2 ? filteredLevels[0] : helper.pickRandom(filteredLevels);

        //filter the documents to those with a level in this boundary
        if(documents) filteredDocuments = this.#filterDocumentsByBoundaryLevel(documents, [level])

        //if a document still remains, establish that as the new boundary and get a random point from there i
        if(filteredDocuments?.length) {
            //if documents provided, find a target point located in the document boundary
            const document = helper.pickRandom(filteredDocuments)

            //creatte a boundary from this new document
            const documentShape = dimensionBoundary.documentBoundary(document)
            
            //return the test point from that document boundary
            return documentShape.getRandomPointInBoundary({levels: [level]})
        } 

        //get the region for testing
        const region = this.levelsRegions.get(level)

        //get remainder of bounds for iterating
        const {bounds, elevation: {top, bottom, topInclusive}} = this.getLevelRegionBounds(level)

        //establish the boundary points and shift amounts
        const xA = bounds.x;
        const yA = bounds.y;
        const xB = xA + bounds.width;
        const yB = yA + bounds.height;
        const baseTop = topInclusive ? top : (top - 1);
        const baseBottom = bottom;

        //set a max in case all tests fail
        const max = 10000

        //Perform the tests
        let i=0, point = {}, inRegion = false;
        do {
            //pull the next randomly targeted area from within the overall boundary
            point.x = helper.pickRandom(xA, xB)
            point.y = helper.pickRandom(yA, yB)
            point.elevation = helper.pickRandom(baseBottom, baseTop)

            inRegion = region.testPoint(point)

            i++;
        } while(!inRegion && i < max);

        return {point: point, level: level}
    }




    /**Highlights a grid highlight layer with the dimensions of this boundary
     * 
     * @param {object} options {
     *              id //highlight layer name to use for locating the highlight and turning it off
     *              level //id for the level holding the region to highlight
     *              color //the color to use for highlight
     */
    highlight(options = {} ){

        //highlight only if the scene of this boundary matches the canvas scene
        if(canvas.scene.id !== this.scene.id) return

        //set variables
        const color = options.color ?? 16737280
        const name = options.id ?? ''
        const level = options.level ?? helper.getDefaultLevel()
        const region = this.levelsRegions.get(level)

        //the boundary must exist on the level in order to highlight
        if(!region) return dangerZone.log(false, 'Boundary does not exist on this level. No highlighting applied')

        //level must be the visible one
        if(!helper.getVisibleLevel().id === level) return dangerZone.log(false, 'Level to highlight is not visible')

        //append to id for the highlight layer the danger zone prefix
        const hId = 'dz-' + name;

        //the bounds for the given region
        const {x,y, right, bottom} = region.bounds;
        let {x: iX, y: iY} = canvas.grid.getTopLeftPoint({x,y})
        let baseY = iY;

        //add the highlight level
        canvas.interface.grid.addHighlightLayer(hId);

        //iterate through the grids in the region and highlight
        do{
            do{//iterate on Y axis, highlighting each grid in boundary level region
                const options = {x: iX, y: iY, color:color}

                //convert grid to shape
                const polygon = new PIXI.Polygon(canvas.grid.getVertices(options))

                if(this.polygonIsInRegion(region, polygon)){
                    canvas.interface.grid.highlightPosition(hId, options);
                }

                //moves to next grid in downward direction (2)
                const shiftDown = canvas.grid.getShiftedPoint(options, CONST.MOVEMENT_DIRECTIONS.DOWN)
                iY = shiftDown.y; iX = shiftDown.x;
            }
            while(iY < bottom)

            //moves to the next grid in right direction, keeping index of the Y
            const shiftRight = canvas.grid.getShiftedPoint({x: iX, y: baseY}, CONST.MOVEMENT_DIRECTIONS.RIGHT)
            baseY = shiftRight.y; iY = shiftRight.y; iX = shiftRight.x;
        }
        while(iX < right)
    }



    /**Tests a polygon within a region to see if they intersect
     * 
     * @param {region} region 
     * @param {polygon} poly 
     * @returns boolean
     */
    polygonIsInRegion(region, poly){
        const tree = region.polygonTree.intersectPolygon(poly)
        return !tree.isEmpty
    }




    /**Intakes an array of tokens and outputs an array consisting of those tokens that exist within the document bounds. 
     * 
     * @param {array} tokens //an array of token documents
     * @param {array} tokenBoundaries //an array of objects with ids and token boundaries, which can be precalculated and passed in to optimize upstream use of this method {
     *                                  id: token.id,
     *                                  boundary: token boundary
     *                              }
     * @returns  array of tokens
     */
    tokensIn(tokens){

        if(!this.levelsRegions?.size) return

        let kept = [];

        const options = {}
        if(this.stretch) options.stretch = this.stretch
    
        //iterate over tokens, keeping those that exist in the boundary
        for(let token of tokens){
            const{x,y,width,height, elevation} = token
            const shape = new PIXI.Rectangle(x, y, width, height)

            //get elevation
            const tokenDepth = helper.getTokenDepth(token)
            const e = {bottom: elevation, top: elevation + tokenDepth}

            //checks the shape against the region. Will also check level
            if(this.findRegionContainingShape(shape, e, [token.level], options)) kept.push(token)
        }

        return kept
    } 



    /**
     * Checks boundary data for correctness
     * @returns boolen //true = valid boundary, false = invalid
     */
    validate(){

        //check elevations
        if(!this.bottomIsInfinite && !this.topIsInfinite && this.top < this.bottom) {
            dangerZone.log(true, 'Boundary dimensions are invalid - top at a lower elevation than bottom', {boundary: this})
            return false
        }
        return true
    }
}

/*
    options:{
        A: top left coordinate of boundary (x,y)
        B: bottom right coordinate of boundary (x,y)
        retain: bool //prevents the boundary during initialization to locking the boundary points to the grid. Instead, point may be anywhere and not residing on a grid intersection
    }
*/
export class dimensionBoundary extends boundary {

    constructor(...args){
        super(...args)
    }

    /****Initialization Activities */
    _A

    _B

        /** GETTERS */
    //this initial coordinate passed in for top left
    get A(){
        return this._A
    }

    //this initial coordinate passed in for bottom right
    get B(){
        return this._B
    }

    get gridDimensions(){
        const A = this.A;
        const B = this.B;

        const top = canvas.grid.getOffset(A);
        const bottom = canvas.grid.getOffset(B);
        const left = canvas.grid.getOffset({x: A.x, y: B.y});
        const right = canvas.grid.getOffset({x: B.x, y: A.y});

        const w = Math.max(right.j, bottom.j) - Math.min(top.j, left.j);
        const h = Math.max(bottom.i, left.i) - Math.min(top.i, right.i);

        return {w, h}
    }


    /**
     * @override
     */    
    _init(){
        const {A,B} = this.options
        const ax = A.x ?? 0;
        const ay = A.y ?? 0;
        const bx = B.x ?? 0;
        const by = B.y ?? 0;

        this._setA({
            x: Math.min(ax, bx),
            y: Math.min(ay, by)
        });

        this._setB({
            x: Math.max(ax, bx),
            y: Math.max(ay, by)
        });

        //if not set to keep points where they are, locks the boundary points to the grid 
        if(!('retain' in this.options)) this._toTopLeft();

        const x1 = this.A.x;
        const y1 = this.A.y;
        const x2 = this.B.x;
        const y2 = this.B.y;

        const regionData = {
            shapes: [
                {
                    type: 'rectangle',
                    x: Math.min(x1, x2),
                    y: Math.min(y1, y2),
                    width: Math.abs(x2 - x1),
                    height: Math.abs(y2 - y1),
                    hole: false
                }
            ]
        }
        super._setRegionData(regionData)

        super._init()
    }

    
      
    /**Offsets an x or y axis
     * 
     * @param {number} axis x or y
     * @param {boolean} flip performs mirroring
     * @param {scene} scene 
     * @param {number} random a generated random number, often at the global level to keep results consistent
     * @returns 
     */
    static _offsetAxis(axis, flip, scene, random){

        const rand = (min, max) =>
            min === max ? min : (Math.floor(random * (max - min + 1)) + min);

        const value = rand(axis.min, axis.max);

        if (axis.type === "pxl") return value * flip

        if (axis.type === "pct") return Math.floor((value / 100) * scene.dimensions.size) * flip

        return 0
    }

    /**
     * sets x and y for A (top left)
     * @param {object} data 
     */
    _setA(data){
        this._A = data
    }

    /**
     * sets x and y for B (bottom right) 
     * @param {object} data 
     */
    _setB(data){
        this._B = data
    }
   

    /**
     * @override
     */
    _setType(){
        super._setType('dimension')
    }


    
    /**Initialization: lock into grid
     * Used to ensure that that boundary points are locked to the grid points (as opposed to mid-grid)
     */
    _toTopLeft(){    
        this._A = canvas.grid.getTopLeftPoint(this.A);
        this._B = canvas.grid.getTopLeftPoint(this.B);
    }

    
    /**Converts a foundry document into a Danger Zone boundary
     * 
     * @param {document} document 
     * @param {scene} scene
     * @param {object} options  //options not used here are also passed through into the boundary method
     *  {
     *      elevation: {bottom: integar, top: integer}} //used to pass in bottom and top of zone for world zones,
     *  }
     * @returns 
     */
    static documentBoundary(document, scene = document.scene, options = {}){
        const region = helper.documentToRegion(document, scene)

        //generate the new bound
        const {x, y, width, height, radius} = region.shapes[0]
        const {top, bottom} = region.elevation

        options.A = {x, y}
        options.B = {x: x + width ?? radius, y: y + height ?? radius}
        const e = {bottom: options.elevation?.bottom ?? bottom, top: options.elevation?.top ?? top}

        options.levels = region.levels

        const b = new dimensionBoundary(e, scene, options)

        dangerZone.log(false, 'Creating document boundary', {boundary: b, document: document})
        //return the boundary
        return b
    }

    


    /**Generates a new boundary based on a given location and dimensions
     * 
     * @param {*} startingCoords 
     * @param {*} elevation 
     * @param {*} dimension 
     * @param {*} options 
     * @returns 
     */
    static locationToBoundary(startingCoords, elevation, dimension, scene, options={}){

        //Define the ending coordinates for the boundary end point given the start point and dimension
        options.B = point.shiftPoint(startingCoords, dimension)
        options.A = startingCoords;

        //generate the new boundary
        const b = new dimensionBoundary({bottom: elevation, top: elevation + dimension.d}, scene, options)

        dangerZone.log(false,'Creating location dimension boundary...', {newBoundary: b, startingCoords: startingCoords, dimension: dimension, options: options});
        return b
    }



    /**Offsets a boundary based on passed in settings
     * 
     * @param {boundary} bndry 
     * @param {object} globalOffset offset random generated settings at global level {random: number; biRandom: boolean}
     * @param {object} offset offset settings for x and y, typically set on the danger part
     * @param {scene} scene 
     * @returns 
     */
    static offsetBoundary(bndry, globalOffset, offset, scene = canvas.scene){
        const resolveFlip = (flip, flipLocation) => {
            const isBool = typeof flip === "boolean";
            const shouldFlip = isBool ? flip : ['N', 'L', 'B'].includes(flip);
            return shouldFlip && flipLocation ? -1 : 1;
        };

        const opts = {
            offset: {
                x: { flip: resolveFlip(offset.x.flip, globalOffset.x.flipLocation), amt: 0 },
                y: { flip: resolveFlip(offset.y.flip, globalOffset.y.flipLocation), amt: 0 }
            },
            retain: true
        };

        opts.offset.x.amt = dimensionBoundary._offsetAxis(offset.x, opts.offset.x.flip, scene, globalOffset.x.random);
        opts.offset.y.amt = dimensionBoundary._offsetAxis(offset.y, opts.offset.y.flip, scene, globalOffset.y.random);

        opts.A = {
            x: bndry.A.x + opts.offset.x.amt,
            y: bndry.A.y + opts.offset.y.amt
        };

        opts.B = {
            x: bndry.B.x + opts.offset.x.amt,
            y: bndry.B.y + opts.offset.y.amt
        };

        dangerZone.log(false, 'Creating dimension boundary from offset', {
            boundary: this,
            offset,
            originalBoundary: bndry
        });

        return new dimensionBoundary(bndry.elevation, scene, opts);
    }
}


export class point{
    constructor(coords = {x: 0, y: 0}, elevation = null){
        this.coords = coords,
        this.elevation = elevation;
        this.#toTopLeft();
    }
    
    #toTopLeft(){    
        this.coords = canvas.grid.getTopLeftPoint(this.coords);
    }

    static shiftPoint(reference = {}, shift = {}){
        const {w, h, d} = shift

        for(let i=0;i<Math.abs(w);i++){
            reference = canvas.grid.getShiftedPoint(
                reference, 
                w > 0 ? 
                CONST.MOVEMENT_DIRECTIONS.RIGHT : 
                CONST.MOVEMENT_DIRECTIONS.LEFT
             )
            } 
        
        for(let i=0;i<Math.abs(h);i++){
            reference = canvas.grid.getShiftedPoint(
                reference, 
                h > 0 ? 
                CONST.MOVEMENT_DIRECTIONS.DOWN : 
                CONST.MOVEMENT_DIRECTIONS.UP
                )
            }
        
        if(d){
            for(let i=0;i<Math.abs(d);i++){
                reference = canvas.grid.getShiftedPoint(
                    reference, 
                    d > 0 ? 
                    CONST.MOVEMENT_DIRECTIONS.ASCEND : 
                    CONST.MOVEMENT_DIRECTIONS.DESCEND
                    )
            }

        }
        
        return reference
    }
}