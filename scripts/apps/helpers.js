import {taggerOn} from '../index.js';
import {dangerZone} from '../danger-zone.js';
import {point} from './dimensions.js'

export function circleAreaGrid(xLoc,yLoc,w,h){
  if((!xLoc &&!yLoc) || (yLoc===h&&!xLoc) || (xLoc===w&&!yLoc) || (xLoc===w&&yLoc===h)){return false}
  return true
}

export function furthestShiftPosition(token, [xGrids, yGrids] = [0,0]){
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

export function getActorOwner(document){
    const actor = document.actor ?? document
    const activePlayers = game.users?.players.filter(p => p.active)
    if(!actor?.id || !actor?.ownership || !activePlayers || !activePlayers.length) return
    let user;
    if (actor.hasPlayerOwner) user = activePlayers.find(u => u.character === actor.id);
    if (!user) user = activePlayers.find(p => actor.ownership[p.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
    if (!user && actor.ownership.default === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) user = activePlayers[0]
    return user  
}

export async function getFilesFromPattern(pattern) {
    let source = "data";
    const browseOptions = { wildcard: true };
    
    if ( /\.s3\./.test(pattern) ) {
      source = "s3";
      const {bucket, keyPrefix} = FilePicker.parseS3URL(pattern);
      if ( bucket ) {
        browseOptions.bucket = bucket;
        pattern = keyPrefix;
      }
    }
    else if ( pattern.startsWith("icons/") ) source = "public";
    const content = await FilePicker.browse(source, pattern, browseOptions);
    return content.files;      
}

export async function getTagEntities(tag, scene){
  const d = scene.getEmbeddedCollection("Drawing").filter(d => d.text === tag);
  if(taggerOn){
      const t = await Tagger.getByTag(tag, {caseInsensitive: false, matchAll: false, sceneId: scene.id })
      return d.concat(t)
  }
  return d
}

export function joinWithAnd(arr){
  if(arr?.length <= 1) return arr?.[0]
  return [arr.slice(0, arr.length - 1).join(', '), ...arr.slice(-1)].join(' and ')
}

export async function maybe(){
  const roll = await new Roll(`1d100`).evaluate({async: true})
  return roll
}

export function rayIntersectsGrid(coords, r){
  const topLeft = canvas.grid.getTopLeftPoint(coords);
  const xl = topLeft.x; const yl = topLeft.y;
  const [xc,yc] = canvas.grid.getCenter(xl, yl);
  const wg = (xc - xl) * 2, hg = (yc - yl) * 2;
  if(r.intersectSegment([xl, yl, xl+wg, yl]) || r.intersectSegment([xl, yl, xl, yl+hg])
      || r.intersectSegment([xl, yl+hg, xl+wg, yl+hg]) || r.intersectSegment([xl+wg, yl, xl+wg, yl+hg])
      ){
          return true
      }
  return false
}

export async function requestSavingThrow(tokenUuid, saveType, time){
  const token = await fromUuid(tokenUuid)
  if(!token) return 
  let dialog, result;
  Hooks.once('renderDialog', async(app, html, options) => {
    dialog = app
  })
  
  const query = token.actor.rollAbilitySave(saveType, {chatMessage: false})
  const race = wait(time)
  await Promise.race([query, race]).then((value) => {result = value; dialog?.close()})
  return result
}

export function limitArray(array, limitAmount) {
  if(!limitAmount) return []
  return limitAmount !== -1 ? array.slice(0,limitAmount) : array
}

export function shuffleArray(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function stringToObj(string, {type = '', notify = false, document = {}}={}) {
  let obj;
  const error = `${type} ${game.i18n.localize("DANGERZONE.alerts.json-invalid")}`;
  try {
      obj = (new Function( "return " + `{${interpolateString(string, document)}}`) )()
  } catch (e) {
      return notify ? ui.notifications?.error(error) : console.log(error);
  }
  return obj;
}

function interpolateString(str, obj) {
  return str.replace(/\[\[(.+?)]]/g, function(m, orig){
      return orig.split('.').reduce(function(obj, key){return obj[key]??'';}, obj);
  });
}

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
