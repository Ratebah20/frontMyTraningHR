/**
 * Utilitaire d'export d'un élément SVG (graphique Recharts) en image PNG.
 *
 * Principe :
 * 1. Cloner le SVG et inliner les styles calculés (fill, stroke, fonts...)
 *    pour que le rendu soit identique hors du DOM.
 * 2. Sérialiser le clone (XMLSerializer) et le charger dans une Image
 *    via une data URL.
 * 3. Dessiner l'image sur un canvas (avec fond peint et facteur d'échelle)
 *    puis déclencher le téléchargement du PNG.
 *
 * Limites : seul le contenu du <svg> est capturé. Les éléments HTML
 * superposés par Recharts (Legend, Tooltip) ne font pas partie du SVG
 * et n'apparaissent donc pas dans le PNG.
 */

export interface ExportSvgToPngOptions {
  /** Couleur de fond peinte derrière le graphique (défaut: blanc). */
  background?: string;
  /** Facteur d'échelle du PNG (défaut: 2 pour un rendu net en slide). */
  scale?: number;
}

/** Propriétés de style pertinentes pour le rendu d'un SVG. */
const SVG_STYLE_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'opacity',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
  'visibility',
  'display',
];

/**
 * Copie les styles calculés des éléments du SVG source vers le clone.
 * Les deux arbres ont exactement la même structure (cloneNode(true)),
 * on peut donc les parcourir en parallèle.
 */
function inlineComputedStyles(source: SVGSVGElement, target: SVGSVGElement): void {
  const sourceElements: Element[] = [source, ...Array.from(source.querySelectorAll('*'))];
  const targetElements: Element[] = [target, ...Array.from(target.querySelectorAll('*'))];

  sourceElements.forEach((sourceEl, index) => {
    const targetEl = targetElements[index];
    if (!targetEl || !(targetEl instanceof SVGElement || targetEl instanceof HTMLElement)) {
      return;
    }

    const computed = window.getComputedStyle(sourceEl);
    SVG_STYLE_PROPERTIES.forEach((property) => {
      const value = computed.getPropertyValue(property);
      if (value) {
        targetEl.style.setProperty(property, value);
      }
    });
  });
}

/** Charge une data URL dans un objet Image (asynchrone). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Impossible de convertir le graphique SVG en image'));
    image.src = src;
  });
}

/** Déclenche le téléchargement d'une data URL via un lien temporaire. */
function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporte un élément SVG en fichier PNG téléchargé par le navigateur.
 *
 * @param svgEl    Élément SVG à exporter (ex: le svg rendu par Recharts).
 * @param filename Nom du fichier (l'extension .png est ajoutée si absente).
 * @param options  Fond et facteur d'échelle.
 */
export async function exportSvgElementToPng(
  svgEl: SVGSVGElement,
  filename: string,
  options: ExportSvgToPngOptions = {},
): Promise<void> {
  const { background = '#ffffff', scale = 2 } = options;

  const rect = svgEl.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  if (width <= 0 || height <= 0) {
    throw new Error('Le graphique est invisible ou de taille nulle');
  }

  // 1. Cloner et inliner les styles calculés
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svgEl, clone);

  // Dimensions explicites pour un rendu fiable hors DOM
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // 2. Sérialiser et charger dans une Image via data URL
  const svgString = new XMLSerializer().serializeToString(clone);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  const image = await loadImage(dataUrl);

  // 3. Dessiner sur canvas (fond d'abord, puis le graphique) et télécharger
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D non disponible dans ce navigateur');
  }

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  triggerDownload(canvas.toDataURL('image/png'), filename);
}

export interface ExportElementToPngOptions {
  /** Couleur de fond peinte derrière l'élément (défaut: blanc). */
  background?: string;
  /** Facteur d'échelle du PNG (défaut: 2 pour un rendu net en slide). */
  scale?: number;
}

/**
 * Exporte un élément HTML (ex: grille de tuiles KPI) en fichier PNG téléchargé.
 *
 * Utilise html2canvas chargé dynamiquement : la librairie ne rejoint le bundle
 * principal qu'au premier export, pas au chargement de la page.
 *
 * @param el       Élément HTML à capturer (doit être visible à l'écran).
 * @param filename Nom du fichier (l'extension .png est ajoutée si absente).
 * @param options  Fond et facteur d'échelle.
 */
export async function exportElementToPng(
  el: HTMLElement,
  filename: string,
  options: ExportElementToPngOptions = {},
): Promise<void> {
  const { background = '#ffffff', scale = 2 } = options;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error("L'élément à exporter est invisible ou de taille nulle");
  }

  // Import dynamique : html2canvas reste hors du bundle principal
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(el, {
    backgroundColor: background,
    scale,
    useCORS: true,
    logging: false,
  });

  triggerDownload(canvas.toDataURL('image/png'), filename);
}
