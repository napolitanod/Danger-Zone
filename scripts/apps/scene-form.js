import {DangerZoneSceneForm} from './scene-zone-list-form.js';
import {getSceneOptionButton} from './helpers.js';

export class DangerZoneScene extends SceneConfig{
    static get defaultOptions(){
        return super.defaultOptions;
      }
  
    static _init(app, html, data){ 
      const SCENEOPENBUTTON = getSceneOptionButton()
      console.log(html, SCENEOPENBUTTON)
        if(SCENEOPENBUTTON){
          SCENEOPENBUTTON.click(event => {
            const form = new DangerZoneSceneForm(app, app.document.id).render(true);
          });
          html.closest('.application').find('.open-dangerzone').remove();
          let titleElement = html.closest('.application').find('.window-title');
          SCENEOPENBUTTON.insertAfter(titleElement);
        }
      }
  }