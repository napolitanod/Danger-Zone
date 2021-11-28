import {DangerZoneSceneForm} from './scene-zone-list-form.js';

export class DangerZoneScene extends SceneConfig{
    static get defaultOptions(){
        return super.defaultOptions;
      }
  
    static _init(app, html, data){ 
        let opt = game.settings.get('danger-zone', 'scene-header');   
        if(opt !== 'N' && game.user.isGM){
          let icn = '<i class="fas fa-radiation"></i>';
          if(opt === 'B'){
              icn+='Zones'
            }  

          let openButton = $(`<a class="open-dangerzone" title="Danger Zone Config">` + icn + `</a>`);

          openButton.click(event => {
            const form = new DangerZoneSceneForm(app, app.document.id).render(true);
          });

          html.closest('.app').find('.open-dangerzone').remove();
          let titleElement = html.closest('.app').find('.window-title');
          openButton.insertAfter(titleElement);
        }
      }
  }