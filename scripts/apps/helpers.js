/**
 * Reviewed for v13. All functions in use retained.
 */

import {dangerZone} from '../danger-zone.js';
import {point, dimensionBoundary} from './dimensions.js'
import {ZoneListForm} from './zone-list-form.js';

export class helper {


  /**Creates a region from a given document
   * 
   * @param {document} document 
   * @param {scene} parent 
   * @param {obj} options 
   *    hole: boolean - if this is creating a hole.
   *    asObject: boolean - if set to true, returns the source object used to create region and not the region
   * @returns region class or shape object
   */
  static documentToRegion(document, parent = document.parent, options = {}){
    
    const documentName = document.documentName;

    //this will represent the object sent in to create the region
    let source 

    //documents have different structures to convert to the correct obj expected by the region constructor
    switch(documentName){
      case 'AmbientLight':
        source = helper.ambientLightRegionSourceDeconstruction(document, options);
        break;
      case 'AmbientSound': 
        source = helper.ambientSoundRegionSourceDeconstruction(document, options);
        break;
      case 'Drawing': 
        source = helper.drawingRegionSourceDeconstruction(document, options);
        break;
      case 'Region':
        source = document.toObject();
        break;
      case 'Scene':
        source = helper.sceneRegionSourceDeconstruction(document, options);
        break;
      case 'Tile':
        source = helper.tileRegionSourceDeconstruction(document, options);
        break;
      case 'Token':
        source = helper.tokenRegionSourceDeconstruction(document, options);
        break;
      case 'Wall':
        source = helper.wallRegionSourceDeconstruction(document, options);
        break;
    }
    console.log(source, document)
    //create the region and return it
    return options.asObject ? source : RegionDocument.implementation.fromSource(source, {parent: parent})
  }



  /**Generates the source object needed to create a region from a ambient light
   * 
   * @param {ambientLight} ambientLight 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static ambientLightRegionSourceDeconstruction(ambientLight, options = {}){
    const {
      name, 
      levels,
      config: { 
        dim: radius
      },
      shape,
      elevation
    } = ambientLight;

    const shapeObj = shape.toObject()

    shapeObj.hole = options.hole;

    return {name: name ?? 'Danger Zone', elevation: {top: elevation + radius, bottom: elevation - radius}, levels, shapes: [shapeObj]};
  }


  /**Generates the source object needed to create a region from a ambient sound
   * 
   * @param {ambientSound} ambientSound 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
  */
  static ambientSoundRegionSourceDeconstruction(ambientSound, options = {}){
    const {
      name, 
      levels,
      radius,
      shape,
      elevation
    } = ambientSound;

    const shapeObj = shape.toObject()

    shapeObj.hole = options.hole;

    return {name: name ?? 'Danger Zone', elevation: {top: elevation + radius, bottom: elevation - radius}, levels, shapes: [shapeObj]};
  }

  /**Generates the source object needed to create a region from a drawing document
   * 
   * @param {drawing} drawing 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static drawingRegionSourceDeconstruction(drawing, options = {}){
    const {
      name, 
      levels,
      shape,
      elevation,
      x,
      y
    } = drawing;

    const shapeObj = shape.toObject()

    shapeObj.hole = options.hole;

    const width = shape.width
    const height = shape.height

    switch(shapeObj.type){
      case 'e':
        let radiusX = width/2;
        let radiusY = height/2;
        Object.assign(shapeObj, {
          type: "ellipse",
          x: x + radiusX,
          y: y + radiusY,
          radiusX,
          radiusY
        })
        break;
      case 'r':
        Object.assign(shapeObj, {
          type: "rectangle",
          x,
          y
        })
        break;
      default:
        const points = shape.points.map((v, i) => v + (i % 2 === 0 ? x : y));
        Object.assign(shapeObj, {
            type: "polygon",
            points
          })
    } 

    return {name: name ?? 'Danger Zone', elevation: {top: elevation, bottom: elevation}, levels, shapes: [shapeObj]};
  }


  /**Generates the source object needed to create a region from a scene document
   * 
   * @param {scene} scene 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static sceneRegionSourceDeconstruction(scene, options = {}){
    const {
      name, 
      dimensions: { 
        sceneWidth: width, 
        sceneHeight: height,
        sceneX: x,
        sceneY: y
      } 
    } = scene;

    const elevation = helper.sceneLevelsElevationBounds(scene, scene.levels)
    const levels = helper.filterLevels(scene, {output: 'ids'})
    const type = "rectangle";
    const {hole} = options;

    return {name: name ?? 'Danger Zone', elevation, levels, shapes: [{type, x, y, height, width, hole}]};
  }

  /**Generates the source object needed to create a region from a tile document
   * 
   * @param {tile} tile 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static tileRegionSourceDeconstruction(tile, options = {}){
    const {
      name, 
      levels,
      shape,
      elevation
    } = tile;

    const shapeObj = shape.toObject()

    shapeObj.hole = options.hole;

    return {name: name ?? 'Danger Zone', elevation: {top: elevation, bottom: elevation}, levels, shapes: [shapeObj]};
  }

  /**Generates the source object needed to create a region from a token document
   * 
   * @param {token} token 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static tokenRegionSourceDeconstruction(token, options = {}){

    //send back if token is invalid
    if(!token?.scene) return

    const {
      name, 
      level,
      elevation,
      x,
      y,
      height: initialHeight,
      width: initialWidth
    } = token;

    const hole = options.hole;

    const type = "rectangle"

    //the token depth calculates using the distance represented for each grid on the scene, multiplied by the width or height of token within the grids, multiplied by danger zone global settings multiplie
    //This is intended to represent how tall the token is
    const tokenDepth = helper.getTokenDepth(token);
    const gridX = token.scene.grid.sizeX
    const gridY = token.scene.grid.sizeY

    //get the token dimensions as on scene
    const width = Math.max(initialWidth * gridX, gridX)
    const height = Math.max(initialHeight * gridY, gridY)

    return {name: name ?? 'Danger Zone', elevation: {top: elevation + tokenDepth, bottom: elevation}, levels: new Set([level]), shapes: [{type, x, y, height, width, hole}]};
  }

  /**Generates the source object needed to create a region from a wall document
   * 
   * @param {wall} wall 
   * @param {obj} options //see documentToRegion for options
   * @returns source object for RegionDocument constructor
   */
  static wallRegionSourceDeconstruction(wall, options = {}){
    const {
      id: name, 
      levels,
      edge: { 
        bounds: {
          width: boundaryWidth, 
          height: boundaryHeight,
          x,
          y
        }
      } 
    } = wall;

    const elevation = helper.sceneLevelsElevationBounds(wall.parent, levels) 
    const type = "line";
    const {hole} = options;

    //create the line
    const length = Math.hypot(boundaryWidth, boundaryHeight);
    const width = 1
    const rotation = Math.atan2(boundaryHeight, boundaryWidth) * 180 / Math.PI;

    return {name: name ?? 'Danger Zone', elevation, levels, shapes: [{type, x, y, width, length, rotation, hole}]};
  }

  static shapeToPolygon(data = {}, type = 'rectangle'){
    const {x,y,width,height} = data
    switch(type){
      case 'rectangle':
        const rect = new PIXI.Rectangle(x, y, width, height)
        return rect.toPolygon()

      case 'circle':
      case 'ellipse':
        return data.polygons[0]

      default:
        const {points} = data
        const polygon = new PIXI.Polygon(points)
        return polygon
        ;
    }

  }


  /**Select true or false at random
   * 
   * @returns boolean at random
   */
  static biRandom() {
    return Math.random() < 0.5 ? true : false
  }


  /**returns the world bottom elevation in the event that the value passed in is infinity or null
   * 
   * @param {int} val 
   * @returns 
   */
  static fallbackElevationBottom(val){
    return (val === Infinity || val === -Infinity || val === null || val === undefined) ? dangerZone.minElevation : val;
  }




  /**returns the world top elevation in the event that the value passed in is infinity or null
   * 
   * @param {int} val 
   * @returns 
   */
  static fallbackElevationTop(val){
    return helper.isInfinite(val) ? dangerZone.maxElevation : val;
  }



  /**returns levels for the given scene, filtered down by the optionally provided set of level ids
   * 
   * @param {document} scene 
   * @param {array} 
   * @param {object} options 
   *    //output {string}: 'ids' use to only output an array of ids versus and array of documents, 'documents' use to output an array of documents
   *    //filterIds {array}: provide an array of ids to be used to filter down the scene levels
   * @returns 
   */
  static filterLevels(scene, options = {output: 'documents', filterIds: []}){
      let levels = [], arr;

      //get the scene levels, filtering if a filter array was provided
      if(scene.levels?.size){
          const lvls = [...scene.levels]
          levels = options.filterIds?.length ? lvls.filter(l => options.filterIds.includes(l.id)) : lvls
      }

      //set the output to either just the ids or the full documents, based on the passed in options
      if(options.output === 'ids'){
        arr = levels.map(lvl => lvl.id)
      } else {
        arr = levels
      }

      return arr
  }

  /**finds how far a token can move in a given x/y grid direction before colliding
   * 
   * @param {token} token 
   * @param {array} param1 
   * @returns position
   */
  static furthestShiftPosition(token, [xGrids, yGrids] = [0,0]){
    let collisionTestX = false, collisionTestY = false, xTest = 0, yTest = 0, test, options =  {type: 'move', mode: "any"};
    const xSign = Math.sign(xGrids); const ySign = Math.sign(yGrids);
    const placeable = canvas.tokens.placeables.find(t => t.id === token.id)
    const max = Math.abs(xGrids) + Math.abs(yGrids)
    let i = 0, position = {x: placeable.x,y: placeable.y};
    do{
        if(!collisionTestX && xTest < Math.abs(xGrids) && (xTest <= yTest || yTest === Math.abs(yGrids))){
          xTest++
          test = point.shiftPoint(position, {w: (1 * xSign), h:0}) 
          collisionTestX = placeable.checkCollision(canvas.grid.getCenterPoint(test), options);
          if(!collisionTestX) position = test
        } else if(!collisionTestY && yTest < Math.abs(yGrids))  {
          yTest++
          test = point.shiftPoint(position, {w: 0, h: (1 * ySign)}) 
          collisionTestY = placeable.checkCollision(canvas.grid.getCenterPoint(test), options);
          if(!collisionTestY) position = test
        }
        dangerZone.log(false,'Wall Collision Test ', {"shiftPos": test, token: token, placeable: placeable,  grids:[xGrids,yGrids]});
        i++
    } while (!collisionTestX && !collisionTestY && i < max);
    return position
  }


  /**Returns the user that owns the actor
   * 
   * @param {token or actor} document 
   * @returns 
   */
  static getActorOwner(document){
    const actor = document.actor ?? document
    const activePlayers = game.users?.players.filter(p => p.active)

    if(!actor?.id || !actor?.ownership || !activePlayers?.length) return

    let user;

    // 1. Player who owns the actor via character assignment
    if (actor.hasPlayerOwner) {
      user = activePlayers.find(u => u.character === actor.id);
    }

    // 2. Player who owns the actor via explicit ownership
    if (!user) {
      user = activePlayers.find(p => actor.ownership[p.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
    }

    //3. Fallback
    if (!user && actor.ownership.default === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
      user = activePlayers[0]
    }
    
    return user  
  }


  /**Selects best level for use in function when level is not provided
   * 
   * @param {string or scene} scene id of scene or scene
   * @returns string id of the level
   */
  static getDefaultLevel(scene){
    
    //get the id, either passed in or on the scene object
    const sceneId = scene?.id ?? scene

    //if scene is unknown or the scene is the current scene, return the level in view
    if(!sceneId || sceneId === canvas.scene.id) {
      return helper.getVisibleLevel().id
    }

    //else return the default level
    const s = game.scenes.get(sceneId)
    if(s) return s.levels.find(l => l.index === 0).id
  }




  /**v13
   * intakes a pointer event and outputs key data elements used in forms
   * @param {object} event 
   * @returns object of event data 
   */
  static getEventData(event){
      const data = {
          target: '',
          targetId: '',
          parent: '',
          action: '',
          parentId: '',
          label: ''
      };

      if (!event) return data;

      const target = event.target.dataset.action
          ? event.target
          : event.target.parentElement;

      const parent = target?.parentElement;

      return {
          target,
          targetId: target?.dataset.id ?? '',
          action: target?.dataset.action ?? '',
          parent,
          parentId: parent?.dataset.id ?? '',
          label: parent?.title ?? ''
      };
  }


  /**Return files from repository that match the pattern. Modeled on a Foundary function.
   * 
   * @param {string} pattern 
   * @returns array of files
   */
  static async getFilesFromPattern(pattern) {
    let source = "data";
    const browseOptions = { wildcard: true };
    
    if ( /\.s3\./.test(pattern) ) {
      source = "s3";
      const {bucket, keyPrefix} = foundry.utils.parseS3URL(pattern);
      if ( bucket ) {
        browseOptions.bucket = bucket;
        pattern = keyPrefix;
      }
    }
    else if ( pattern.startsWith("icons/") ) source = "public";
    const content = await  foundry.applications.apps.FilePicker.implementation.browse(source, pattern, browseOptions);
    return content.files;      
  }


  /**
   * 
   * @param {scene} scene 
   * @param {array} levels array of level ids
   * @returns string of level names
   */
  static getLevelsNames(scene, levels = []){
    if(!levels.length) {
          return 'All levels'
    }
    return scene.levels.filter(lvl => levels.includes(lvl.id)).map(lvl => lvl.name).join(", ")
  }



  /**the level currently visible to GM
   * 
   * @returns level
   */
  static getVisibleLevel(){
    return canvas.scene.levels.find(l => l.isView)
  }



  /**
   * 
   * @param {string} sceneId //the id for the given scene
   * @param {object} options 
   *    //filterIds {array}: provide an array of ids to be used to filter down the scene levels
   * @returns object for use in form input select
   */
  static getSceneLevelList(sceneId, options = {}){
    const list = {};
    const scene = game.scenes.get(sceneId)
    const filterIds = options.filterIds ?? []
    if(scene){
      const levels = filterIds.length ? scene.levels?.contents.filter(l => filterIds.includes(l.id)) : scene.levels.contents
      for (const level of levels.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
        list[level.id] = level.name;
      }
    }
    return list
  }



  /**returns an object of regions on a scene for use as a reference list
   * 
   * @param {string} sceneId 
   * @returns object
   */
  static getSceneRegionList(sceneId){
    let list = {'':'[Use Scene Dimensions]'};
    for (let region of game.scenes.get(sceneId).regions.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
      list[region.id] = region.name;
    }
    return list
  }


  /**Returns documents on a scene that match given tag
   * 
   * @param {string} tag //the tag to return entities for
   * @param {document} scene //the scene to search
   * @returns array of documents
   */
  static getTagEntities(tag, scene){
    let d

    //tags can be added as drawings
    d = scene.getEmbeddedCollection("Drawing").filter(d => d.text === tag);

    //if the tagger module is loaded, that can also be used
    if(dangerZone.MODULES.taggerOn){
        const t = Tagger.getByTag(tag, {caseInsensitive: false, matchAny: true, sceneId: scene.id })
        d = d.concat(t)
    }

    return d
  }

  /**
   * 
   * @param {array} tokens //array of tokens
   * @returns {array} objects // an array of objects that holds token document boundaries and token ids {id: token.id, boundary: boundary}
   */
  static getTokenBoundarys(tokens = []){
      const targetTokenBoundarys = []
      for(let token of tokens){

          //generates a boundary for the token
          const b = dimensionBoundary.documentBoundary(token);

          targetTokenBoundarys.push({id: token.id, boundary: b})
      }

      return targetTokenBoundarys
  }

  static getTokenDepth(token){
    //multiplier used for calculating depth aka standing height of token
    const multiplier = game.settings.get(dangerZone.ID, 'token-depth-multiplier');

    //distance is taken from the scene distance, which is the distance that each grid represents
    const distance = token.parent?.dimensions?.distance ? token.parent?.dimensions?.distance : 1

    //the token depth calculates using the distance represented for each grid on the scene, multiplied by the width or height of token within the grids, multiplied by danger zone global settings multiplie
    //This is intended to represent how tall the token is
    const tokenDepth = (distance * Math.max(token.width, token.height) * multiplier);

    return tokenDepth
  }


  /**
   * Builds an html input from a set of options
   * @param {object} options //{
   *        options: obj of key, value option pairs
   *        allDefaultLable: when selecting 'all' or nothing for optional selects, often this is blank
   *        selected: the value that should be selected to match to the select value
   *        noBlank: bool  set to false to have no blank added
   * }
   * @returns string html options list
  */
  static htmlBuildInput(options){
    let htmlInner = '';
    const value = options.inputValue ?? options.value;
    switch(options.type){
      case 'color':
        htmlInner = `<color-picker name="${options.name}" value="${value}"></color-picker>`
        break;
      case 'range':
        htmlInner = `<range-picker title="${game.i18n.localize(options.label)}" name="${options.name}" value="${value}" min="${options.min}" max="${options.max}" step="0.05"></range-picker>`
        break;
      case 'select':
      case 'options':
        //the options list
        const sortedList = Object.entries(options.options).sort(([,a],[,b]) => a.localeCompare(b))
        let optionList = options.noBlank ? '' : `<option value="">${options.allDefaultLable ?? ''}</option>`;
        for(let i = 0; i < sortedList.length; i++) {
          let selected = '';
          if (sortedList[i][0] === value) selected = ' selected '
          optionList += `<option value="${sortedList[i][0]}"${selected}>${game.i18n.localize(sortedList[i][1])}</option>`;
        }
        if('options') return optionList;

        //the select
        htmlInner = `<select name="${options.name}" value="${value}">${optionList}</select>`
        break;
    }
    let html = `<div class="form-group"><label>${game.i18n.localize(options.label)}</label><div class="form-fields">${htmlInner}</div></div>`
    return html;     
  }

  /**v13
   * 
   * @param {object} options 
   *      html = the html to toggle
   * 
   *      type = the type of toggle
   *            hide = hide if condition met, else show
   *            show = show if condition met, else hide
   * 
   *      id = indicates query selector to use on the element 
   *      
   *      condition = the condition in relation to the event that, when true, hides the element
   *            check = the event's target.checked
   *            eq = target.value equals the test value
   *            greater_than = the events target.value is greater than the test 
   *            less_than = the events target.value is less than the test 
   * 
   *      event = the click event
   * 
   *      test = variable use, what is being tested against
   */

  static htmlToggleElement(form, options){

    let value //the value from the event
    switch(options.condition){
      case 'check':
        value = helper.getEventData(options.event).target.checked 
        break;
      case 'eq':
        value = options.test === helper.getEventData(options.event).target.value ? true : false
        break;
      case 'less_than':
        value = helper.getEventData(options.event).target.value < options.test ? true : false
        break;
    }

    let target
    if(options.id){
      target = options.html.querySelector(`#${options.id}`)
    }

    switch(options.type){
      case 'hide':
        value ? target.classList.add('dz-hidden') : target.classList.remove('dz-hidden')
        break;
      case 'show':
        value ? target.classList.remove('dz-hidden') : target.classList.add('dz-hidden')
        break;
    }  

    form.setPosition()
  }


  /**
   * Checks value for infinity. may include nulls or undefined
   * @param {int} val 
   * @param {boolean} includeNulls 
   * @param {boolean} includeUndefined
   * @returns boolean 
   */
  static isInfinite(val, includeNulls = true, includeUndefined = true){
    return (
        val === Infinity 
        || val === -Infinity 
        || (includeNulls && val === null) 
        || (includeUndefined && val === undefined)
      ) 
      ? true 
      : false
  }



/**Concatenate and array and end with 'and'
 * 
 * @param {array} arr 
 * @returns string
 */
  static joinWithAnd(arr){
    if(arr?.length <= 1) return arr?.[0]
    return [arr.slice(0, arr.length - 1).join(', '), ...arr.slice(-1)].join(' and ')
  }

  /**removes a certain amount of items from the array
   * 
   * @param {array} array 
   * @param {number} limitAmount 
   * @returns array
   */
  static limitArray(array, limitAmount) {
    if(!limitAmount) return []
    return limitAmount !== -1 ? array.slice(0,limitAmount) : array
  }


  /**Return position information between current token position and the update object
   * 
   * @param {token} token 
   * @param {object} update 
   * @returns 
   */
  static measureTokenMovement(token, update){
    const {x, y, elevation} = token
    const coords = {x, y}
    const startPos = {coords, elevation};
    const endPos = {
        coords: {
            x: update.x !== undefined ? update.x : x,
            y: update.y !== undefined ? update.y : y
        },
        elevation: update.elevation !== undefined ? update.elevation : elevation 
    };
    const startGrid = canvas.grid.getOffset(token);
    const endGrid = canvas.grid.getOffset(endPos.coords);
    return {
            start:startPos,
            end: endPos,
            dimensions: {
                h: Math.abs(startGrid.i - endGrid.i),
                w: Math.abs(startGrid.j - endGrid.j),
                d: Math.abs(startPos.elevation - endPos.elevation)
            },
      height: Math.abs(startPos.coords.y - endPos.coords.y ),
      width: Math.abs(startPos.coords.x - endPos.coords.x)
    }
  }


  /**
   * Simple helper to output a name that is unique
   * @param {string} name  //name that you want to ensure is unique
   * @param {set} comparisonName 
   * @returns 
   */
  static nameIterator(name, comparisonNames){
    let i = 1;
    while (comparisonNames.has(`${name}_${i}`)) i++;
    return `${name}_${i}`;
  }


  /**  returns a random value from the array or between two numbers
   * 
   * @param {array or int} a
   * @param {int} 
   * @returns 
   */
  static pickRandom(a, b) {
    if (Array.isArray(a)) {
      return a[Math.floor(Math.random() * a.length)];
    }

    if(a === b) return a

    //convert to integers
    a = a | 0;
    b = b | 0;
  
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }


  /**
   * rolls a d100 for use with calculating likelihood
   * @returns evaluated roll
   */
  static async rollLikelihood(){
    const roll = await new Roll(`1d100`).evaluate()
    return roll
  }


  /**returns the minimum bottom and maximum top for elevation related to a scene's levels, with optional abbility to filter to certain levels
   * 
   * @param {document} scene 
   * @param {array} filterIds 
   * @returns 
   */
  static sceneLevelsElevationBounds(scene, filterIds = []){
      const elevations = this.filterLevels(scene, {filterIds: filterIds, output: 'documents'}).map(l => l.elevation);
      return{
          bottom: Math.min(...elevations.map(e => e.bottom ?? -Infinity)),
          top: Math.max(...elevations.map(e => e.top ?? Infinity))
      }
  }

  /**
   * returns an array of names for a given scene
   * @param {scene} scene //scene document class
   * @returns array
   */
  static sceneLevelsNames(scene){
    return scene.levels.map(lvl => lvl.name)
  }


  /**Shuffles array values
   * 
   * @param {array} array 
   * @returns array
   */
  static shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }


  /**Converts a string to an object
   * 
   * @param {string} string 
   * @param {object} param1 
   * @returns object
   */
  static stringToObj(string, {type = '', notify = false, document = {}}={}) {
    let obj;

    try {
      obj = (new Function( "return " + `{${interpolateString(string, document)}}`) )()
    } catch (e) {
      const error = `${type} ${game.i18n.localize("DANGERZONE.alerts.json-invalid")}`;
      return notify ? ui.notifications?.error(error) : console.log(error);
    }

    return obj;
  }


  /**Waits
   * 
   * @param {number} delay 
   * @returns 
   */
  static wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

function interpolateString(str, obj) {
  return str.replace(/\[\[(.+?)]]/g, function(m, orig){
      return orig.split('.').reduce(function(obj, key){return obj[key]??'';}, obj);
  });
}


export async function requestSavingThrow(tokenUuid, saveType, time){
  const token = await fromUuid(tokenUuid)
  if(!token?.actor) return 
  let dialog, result;
  Hooks.once('renderDialog', async(app, html, options) => {
    dialog = app
  })
  
  const query = token.actor.rollSavingThrow({ability: saveType}, {chatMessage: false})
  const race = helper.wait(time)
  await Promise.race([query, race]).then((value) => {result = value?.[0] ; dialog?.close()})
  return result
}

