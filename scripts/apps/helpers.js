import {taggerOn} from '../index.js';
import {dangerZone} from '../danger-zone.js';

export function circleAreaGrid(xLoc,yLoc,w,h){
  if((!xLoc &&!yLoc) || (yLoc===h&&!xLoc) || (xLoc===w&&!yLoc) || (xLoc===w&&yLoc===h)){return false}
  return true
}

export function furthestShiftPosition(token, [xGrids, yGrids] = [0,0]){
  let x = token.data.x,y = token.data.y, collisionTest = true;
  const xSign = Math.sign(xGrids); const ySign = Math.sign(yGrids);
  const placeable = canvas.tokens.placeables.find(t => t.id === token.id)
  do{
      let [xTest,yTest] = canvas.grid.grid.shiftPosition(placeable.x, placeable.y, xGrids, yGrids)
      collisionTest = placeable.checkCollision({x: xTest,y: yTest});
      if(!collisionTest){x = xTest,y = yTest}
      dangerZone.log(false,'Wall Collision Test ', {"shiftPos": [x,y], token: token, placeable: placeable, test: collisionTest, grids:[xGrids,yGrids]});
      if(xGrids > yGrids){xGrids = xGrids -(1 * xSign)} else {yGrids = yGrids -(1 * ySign)} 
  } while (collisionTest && (!xGrids || !yGrids));
  return [x,y]
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
  const d = scene.getEmbeddedCollection("Drawing").filter(d => d.data.text === tag);
  if(taggerOn){
      const t = await Tagger.getByTag(tag, {caseInsensitive: false, matchAll: false, sceneId: scene.id })
      return d.concat(t)
  }
  return d
}

export function rayIntersectsGrid([yPos,xPos], r){
  const [xl,yl] = canvas.grid.grid.getPixelsFromGridPosition(yPos, xPos);
  const [xc,yc] = canvas.grid.grid.getCenter(xl, yl);
  const wg = (xc - xl) * 2, hg = (yc - yl) * 2;
  if(r.intersectSegment([xl, yl, xl+wg, yl]) || r.intersectSegment([xl, yl, xl, yl+hg])
      || r.intersectSegment([xl, yl+hg, xl+wg, yl+hg]) || r.intersectSegment([xl+wg, yl, xl+wg, yl+hg])
      ){
          return true
      }
  return false
}

export function stringToObj(string, identifier = '', notify = false) {
  let obj;
  const error = `${identifier} ${game.i18n.localize("DANGERZONE.alerts.json-invalid")}`;
  try {
      obj = (new Function( "return " + `{${string}}`) )()
  } catch (e) {
      return notify ? ui.notifications?.error(error) : console.log(error);
  }
  return obj;
}

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
