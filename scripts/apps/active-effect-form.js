export class DangerZoneTypeActiveEffectForm extends ActiveEffectConfig {
  constructor(app, ...args) {
    super(...args);
    this.parent = app
    }

    static get defaultOptions(){
        const defaults = super.defaultOptions;

        return foundry.utils.mergeObject(defaults, {
          height: "600px",
          title : game.i18n.localize("DANGERZONE.zone-active-effect-form.form-name")
        });
      }

    getData(options) {
      const data = super.getData(options);
      return data
    }

    activateListeners(html) {
      super.activateListeners(html);
    }

    _onEffectControl(event) {
      event.preventDefault();
      const button = event.currentTarget;
      switch (button.dataset.action) {
        case "add":
          return this._addEffectChange(button);
        case "delete":
          return button.closest(".effect-change").remove();
      }
    }
  
   _addEffectChange(button) {
      super._addEffectChange(button)
      const changes = button.closest(".tab").querySelector(".changes-list");
      const last = changes.lastElementChild;
      const idx = last ? last.dataset.index + + 1 : 0;
      const change = $(`<li class="effect-change flexrow" data-index="${idx}"><div class="key"><input type="text" name="changes.${idx}.key" value=""/></div><div class="mode"><select name="changes.${idx}.mode" data-dtype="Number">
        <option value="0">Custom</option><option value="1">Multiply</option><option value="2" selected="">Add</option><option value="3">Downgrade</option><option value="4">Upgrade</option><option value="5">Override</option></select></div>
        <div class="value"><input type="text" name="changes.${idx}.value" value="0"/></div>
      </li>`);
      let del = $('<div>').addClass("effect-controls").append($('<a>').addClass("effect-control").attr("data-action", "delete").click(this._onEffectControl).append($('<i>').addClass("fas fa-trash")))
      change.append(del);
      changes.appendChild(change[0]);
    }  
  
    async _updateObject(event, formData) {
      const expandedData = foundry.utils.expandObject(formData);
      this.parent.effect = expandedData;
    }
}