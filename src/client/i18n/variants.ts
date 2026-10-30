import type { Language } from '../../shared/languages.js';
import type { Dict } from './strings.js';

/**
 * Where a language is written differently in another country: British and
 * American English, Mexican Spanish, European Portuguese. The base
 * dictionaries are Indian English, Spain Spanish and Brazilian Portuguese.
 */
export const VARIANTS: Partial<Record<Language, Partial<Dict>>> = {
  'en-GB': {
    phoneLabel: 'Mobile number',
    offline: 'You are offline. Showing what was last saved on this phone.',
  },
  'en-US': {
    phoneLabel: 'Cell phone number',
    phoneTitle: 'What’s your cell phone number?',
    offline: 'You’re offline. Showing what was last saved on this phone.',
    terms:
      'By continuing you agree to the Terms and Privacy Policy. Message and data rates may apply.',
    checkIn: 'Clock in',
    checkOut: 'Clock out',
    checkTitleIn: 'Clock in',
    checkTitleOut: 'Clock out',
    checkedIn: 'Clocked in at {0}',
    checkedOut: 'Clocked out at {0}',
    checkedInEv: 'Clocked in',
    checkedOutEv: 'Clocked out',
    offShift: 'Not clocked in',
    navPay: 'Pay',
    pay: 'Pay',
    periodOf: 'Pay period starting {0}',
  },
  'es-MX': {
    offline: 'Estás sin conexión. Se muestra lo último guardado en este celular.',
    phoneLabel: 'Número de celular',
    phoneBody:
      'Te enviaremos un código de 6 dígitos por SMS. Tu empleador usa este número para agregarte a su centro de trabajo.',
    terms:
      'Al continuar aceptas los Términos y el Aviso de privacidad. Pueden aplicar cargos por SMS.',
    checkIn: 'Checar entrada',
    checkOut: 'Checar salida',
    checkTitleIn: 'Checar entrada',
    checkTitleOut: 'Checar salida',
    checkedIn: 'Entrada checada a las {0}',
    checkedOut: 'Salida checada a las {0}',
    offShift: 'Sin checar',
    noShifts: 'Tus turnos aparecerán aquí después de tu primera checada.',
    savedOffline: 'Sin señal. Guardado en este celular; se enviará automáticamente.',
    queuedCount: '{0} checada pendiente de envío',
    newPhoneTitle: 'Este es un celular nuevo',
    newPhoneBody:
      'Tu supervisor debe aprobar este celular. Mientras tanto, tus checadas se registran pero quedan marcadas para revisión.',
    thisPhone: 'Este celular',
    phoneApproved: 'Aprobado para checar',
    signedOnSite: 'Firmado en este celular, en el sitio',
    signedOffSite: 'Firmado en este celular, fuera del sitio',
    recordIntactBody:
      'Coincide con la copia sellada en este celular. {0} registros, ninguno eliminado.',
    pay: 'Pago',
    askTitle: 'Pregunta sobre este recibo de nómina',
    confirmPayBody:
      'Tu recibo dice {0}. Dinos cuánto recibiste realmente. Solo tú y el dueño lo ven.',
    paymentMatches: 'Gracias. Coincide con tu recibo.',
    takePhoto: 'Tomar una foto',
  },
  'pt-PT': {
    offline: 'Está offline. A mostrar o que foi guardado por último neste telemóvel.',
    phoneTitle: 'Qual é o seu número de telemóvel?',
    phoneBody:
      'Vamos enviar-lhe um código de 6 dígitos. O seu empregador usa este número para o adicionar ao local de trabalho.',
    phoneLabel: 'Número de telemóvel',
    terms:
      'Ao continuar, aceita os Termos e a Política de Privacidade. Podem aplicar-se custos de SMS.',
    joinBody: 'Leia o código QR à entrada do local ou introduza o código de convite da sua chefia.',
    scanSite: 'Ler o QR do local',
    opensCamera: 'Abre a câmara',
    checkIn: 'Registar entrada',
    checkOut: 'Registar saída',
    checkTitleIn: 'Registar entrada',
    checkTitleOut: 'Registar saída',
    checkedIn: 'Entrada registada às {0}',
    checkedOut: 'Saída registada às {0}',
    offShift: 'Entrada por registar',
    sending: 'A selar o seu registo',
    savedOffline: 'Sem rede. Guardado neste telemóvel; será enviado automaticamente.',
    newPhoneTitle: 'Este é um telemóvel novo',
    newPhoneBody:
      'A sua chefia tem de aprovar este telemóvel. Até lá, os seus registos ficam guardados mas marcados para revisão.',
    thisPhone: 'Este telemóvel',
    recordIntact: 'Registo íntegro',
    recordIntactBody: 'Igual à cópia selada neste telemóvel. {0} entradas, nenhuma removida.',
    signedOnSite: 'Assinado neste telemóvel, no local',
    signedOffSite: 'Assinado neste telemóvel, fora do local',
    yourRecord: 'O seu registo',
    pay: 'Vencimento',
    navPay: 'Vencimento',
    netPay: 'Vencimento líquido',
    askTitle: 'Pergunte sobre este recibo de vencimento',
    takePhoto: 'Tirar uma fotografia',
    photo: 'Fotografia',
    speakBody: 'Opinião anónima sobre o seu local de trabalho. Ninguém consegue chegar até si.',
    settings: 'Definições',
    signOut: 'Terminar sessão',
  },
};
