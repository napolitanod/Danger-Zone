export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

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