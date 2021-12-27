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