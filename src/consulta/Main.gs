/**
 * Módulo de Consulta: página pública de consulta de créditos.
 */

function doGet() {
  const html = HtmlService.createTemplateFromFile('Page')
    .evaluate()
    .setTitle(`Consulta de Créditos ${CONFIG.direccion.sigla}`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  if (CONFIG.direccion.favicon) html.setFaviconUrl(CONFIG.direccion.favicon);
  return html;
}
