
const searchParams = (new URL(import.meta.url)).searchParams;
const moduleUrl = searchParams.get('m');
const defaultExportObjectPath = searchParams.get('de');

await import(moduleUrl);
export default eval(defaultExportObjectPath);  // TODO: Remove eval().
