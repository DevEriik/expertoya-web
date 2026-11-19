/**
 * Utilidad de análisis y prevención de fraudes para el chat de ExpertoYa.
 * Detecta intentos de evasión de la plataforma, intercambio de teléfonos, CBU/CVU,
 * alias bancarios, emails y transacciones por fuera del sistema de custodia (Escrow).
 */

export type TipoRiesgoSeguridad = 'TELEFONO' | 'BANCARIO' | 'EMAIL' | 'FUERA_PLATAFORMA';

export interface ResultadoSeguridad {
  esRiesgoso: boolean;
  tipoRiesgo: TipoRiesgoSeguridad | null;
  titulo: string;
  mensaje: string;
  consejo: string;
}

// Correo electrónico (evaluado primero para evitar que dominios web colisionen con alias)
const REGEX_EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\b(mi\s+mail|mi\s+correo|pasame\s+tu\s+mail|pasame\s+tu\s+correo|escribime\s+al\s+mail)\b/i;

// CBU o CVU de 22 dígitos (típico en Argentina, con o sin separadores) o mención directa
const REGEX_CBU_CVU = /\b(?:\d[\s.-]?){22}\b|\b(cbu|cvu)\b/i;

// Alias bancario:
// 1) Mención explícita de alias ('alias ...', 'mi alias', 'pasame tu alias')
// 2) 3 palabras separadas por puntos (estándar BCRA): palabra.palabra.palabra (mínimo 2 letras)
// 3) Billeteras virtuales argentinas: palabra.mp, palabra.uala, palabra.bru, palabra.lemon, etc.
const REGEX_ALIAS_BANCARIO = /\b(?:alias\b|mi\s+alias|pasame\s+(?:tu\s+)?alias|[a-zA-Z0-9_-]{2,25}\.(?:mp|uala|bru|lemon|nx|modo|reba)\b|[a-zA-Z0-9_-]{2,20}\.[a-zA-Z0-9_-]{2,20}\.[a-zA-Z0-9_-]{2,20}\b)/i;

// Palabras clave bancarias y transferencias
const REGEX_KEYWORDS_BANCARIAS = /\b(transferencia|transferir|transferime|te\s+transfiero|transfiero|cuenta\s+bancaria|caja\s+de\s+ahorro|mercadopago|mercado\s+pago|ual[aá]|brubank|lemon\s+cash|cuenta\s+dni|dep[oó]sito\s+bancario|banco\s+(?:galicia|santander|macro|naci[oó]n|nacion|provincia|bbva))\b/i;

// Frases de intento de pago en efectivo o coordinación fuera de la plataforma
const REGEX_FUERA_PLATAFORMA = /\b(en\s+efectivo|pago\s+en\s+efectivo|pagar\s+en\s+efectivo|te\s+pago\s+en\s+efectivo|abono\s+en\s+efectivo|cobro\s+en\s+efectivo|efectivo\s+en\s+mano|en\s+mano|mano\s+a\s+mano|d[oó]lares\s+en\s+mano|usd\s+en\s+mano|en\s+d[oó]lares|te\s+(?:lo\s+)?pago\s+ah[ií]|te\s+(?:lo\s+)?pago\s+cuando\s+vengas|por\s+afuera|por\s+fuera|arregl(?:ar|amos|emos)\s+por\s+(?:afuera|fuera)|hac(?:er|emos)\s+por\s+(?:afuera|fuera)|vamos\s+por\s+(?:afuera|fuera)|sin\s+la\s+app|fuera\s+de\s+la\s+app|sin\s+la\s+aplicaci[oó]n|fuera\s+de\s+la\s+aplicaci[oó]n|fuera\s+de\s+la\s+plataforma|sin\s+comisi[oó]n|sin\s+comision|ahorr(?:ar|amos|as)\s+(?:la\s+)?comisi[oó]n|evitar\s+la\s+comisi[oó]n|por\s+privado|al\s+privado|por\s+md|por\s+dm|habl(?:ar|amos|ame)\s+por\s+privado|escrib(?:ir|ime|o)\s+por\s+privado|por\s+izquierda|en\s+negro)\b/i;

// Menciones a WhatsApp, contacto telefónico o redes
const REGEX_KEYWORDS_TELEFONO = /\b(whats?app|wsp|wpp|wasap|whasap|watsap|whats|llam(?:ar|ame|áame|ada)|te\s+llamo|mi\s+cel(?:u|ular)?|mi\s+tel(?:[eé]fono)?|mi\s+n[uú]mero|mi\s+contacto|pasame\s+tu\s+(?:cel(?:u|ular)?|tel(?:[eé]fono)?|n[uú]mero|num|whats?app|wsp|wpp|contacto)|te\s+paso\s+mi\s+(?:cel(?:u|ular)?|tel(?:[eé]fono)?|n[uú]mero|num|whats?app|wsp|wpp|contacto)|agendame|agéndame|agregame|agrégame|escribime\s+al|mandame\s+un\s+(?:whats?app|wsp|wpp|mensaje\s+al)|instagram|mi\s+ig|telegram|facebook)\b/i;

// Regex para teléfonos (considerando formatos argentinos e internacionales con prefijos, espacios y guiones)
const REGEX_TELEFONO = /(?:(?:\+|00)?54\s*9?\s*)?(?:11|[2368]\d{2,3})?[\s.-]?(?:15[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b|\b\d{8,11}\b/;

export const analizarSeguridadMensaje = (texto: string): ResultadoSeguridad => {
  if (!texto || texto.trim().length === 0) {
    return {
      esRiesgoso: false,
      tipoRiesgo: null,
      titulo: '',
      mensaje: '',
      consejo: '',
    };
  }

  const limpio = texto.trim();

  // 1. Detección de Email
  if (REGEX_EMAIL.test(limpio)) {
    return {
      esRiesgoso: true,
      tipoRiesgo: 'EMAIL',
      titulo: 'Correo Electrónico Detectado',
      mensaje: 'Detectamos una dirección o solicitud de correo electrónico.',
      consejo:
        'Toda la documentación, fotos y presupuestos se gestionan de forma segura desde este chat sin necesidad de intercambiar correos privados.',
    };
  }

  // 2. Detección de datos bancarios (máxima criticidad)
  if (REGEX_CBU_CVU.test(limpio) || REGEX_ALIAS_BANCARIO.test(limpio) || REGEX_KEYWORDS_BANCARIAS.test(limpio)) {
    return {
      esRiesgoso: true,
      tipoRiesgo: 'BANCARIO',
      titulo: 'Datos Bancarios Detectados',
      mensaje: 'Detectamos información bancaria, alias o transferencias externas.',
      consejo:
        'Los pagos fuera de ExpertoYa no están cubiertos por el Seguro de Garantía ni el Pago Protegido (Escrow). Para tu protección, no abones por transferencia externa.',
    };
  }

  // 3. Detección de acuerdos fuera de la plataforma o en efectivo
  if (REGEX_FUERA_PLATAFORMA.test(limpio)) {
    return {
      esRiesgoso: true,
      tipoRiesgo: 'FUERA_PLATAFORMA',
      titulo: 'Intento de Pago Fuera de Plataforma',
      mensaje: 'Recuerda que coordinar o pagar en efectivo por fuera de ExpertoYa te deja sin cobertura.',
      consejo:
        'Ante cualquier desperfecto, trabajo incompleto o estafa, solo podemos asistirte y respaldar tu dinero si el servicio y el pago se gestionan en la app.',
    };
  }

  // 4. Detección de teléfonos y WhatsApp
  if (REGEX_KEYWORDS_TELEFONO.test(limpio) || REGEX_TELEFONO.test(limpio)) {
    return {
      esRiesgoso: true,
      tipoRiesgo: 'TELEFONO',
      titulo: 'Contacto Personal Detectado',
      mensaje: 'Se detectaron posibles números telefónicos o menciones a WhatsApp.',
      consejo:
        'Mantén la conversación en el chat de ExpertoYa para contar con registro auditable, soporte legal y resolución inmediata de reclamos.',
    };
  }

  return {
    esRiesgoso: false,
    tipoRiesgo: null,
    titulo: '',
    mensaje: '',
    consejo: '',
  };
};
