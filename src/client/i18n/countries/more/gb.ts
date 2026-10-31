import type { CountryLanguages } from '../../country.js';

/** The United Kingdom's legal wording for readers of other languages. */
export const GB_MORE: CountryLanguages = {
  ta: {
    recordBroken:
      'இந்தப் பதிவு பொருந்தவில்லை. இந்தத் திரையை உங்கள் சங்கப் பிரதிநிதி, ACAS அல்லது Fair Work Agency இடம் காட்டுங்கள்.',
    leaveBody:
      'விடுமுறை, விடுப்பு அல்லது வீட்டிலிருந்து வேலை நாள் பதிவு செய்யுங்கள். ஒவ்வொரு முடிவும் உங்கள் பதிவில் முத்திரையிடப்படும்.',
    balanceCasual: 'இரக்க விடுப்பு',
    balanceSick: 'நோய்',
    balanceEarned: 'விடுமுறை',
    balanceCompOff: 'TOIL',
    typeCasual: 'இரக்க அல்லது சிறப்பு விடுப்பு',
    typeSick: 'நோய் காரண விடுப்பு',
    typeEarned: 'ஆண்டு விடுமுறை',
    typeCompOff: 'ஈடு ஓய்வு நேரம் (TOIL)',
    typeUnpaid: 'ஊதியமில்லா விடுப்பு',
    typeWfh: 'வீட்டிலிருந்து வேலை',
    compOffNote:
      'அனுமதிக்கப்பட்ட கூடுதல் நேரம் ஊதியமாக அல்லாமல் ஈடு ஓய்வு நேரமாகச் சேமிக்கப்படும்.',
    leaveLawNote:
      'ஆண்டுக்கு 5.6 வாரங்கள் ஊதிய விடுமுறை (5 நாள் வாரத்தில் 28 நாட்கள்), வங்கி விடுமுறைகள் உட்படலாம் (வேலை நேர விதிமுறைகள், விதிகள் 13, 13A). நோய்வாய்ப்பட்ட முதல் நாளிலிருந்தே சட்டப்பூர்வ நோய் ஊதியம் (SSP) வழங்கப்படும்.',
    complaintEntry: 'ரகசியக் குறைபாட்டை எழுப்புங்கள்',
    complaintEntrySub:
      'பாலியல் துன்புறுத்தல், மிரட்டல் அல்லது பாகுபாடு. பெயரிடப்பட்ட தொடர்பாளர்கள் மட்டுமே பார்ப்பார்கள்.',
    complaintTitle: 'ரகசியக் குறைபாடு',
    complaintBody:
      'இது துன்புறுத்தல் குறைபாடுகளைக் கையாள உங்கள் முதலாளி பெயரிட்டவர்களுக்கு மட்டுமே செல்லும், உங்கள் நேரடி மேலாளருக்கோ உரிமையாளருக்கோ அல்ல. நபர்களை விலக்கலாம். இதை எழுப்பியதற்காகப் பழிவாங்கப்படாமல் நீங்கள் பாதுகாக்கப்படுகிறீர்கள்.',
    committeeLabel: 'துன்புறுத்தல் தொடர்பாளர்கள்',
    presiding: 'முதன்மையானவர்',
    noCommittee:
      'உங்கள் முதலாளி இன்னும் யாரையும் பெயரிடவில்லை. இதை அனுப்பலாம்; துன்புறுத்தலைத் தடுக்க நடவடிக்கை எடுக்க வேண்டும் என்று உரிமையாளருக்குத் தெரிவிக்கப்படும். ACAS உம் ஆலோசனை தரும்.',
    excludeLabel: 'இதைப் பார்க்கக்கூடாத தொடர்பாளர்கள்',
    lawNote:
      'பாலியல் துன்புறுத்தலைத் தடுக்க முதலாளிகள் நியாயமான நடவடிக்கைகள் எடுக்க வேண்டும் (சமத்துவச் சட்டம் 2010, பிரிவு 40A). தீர்ப்பாயத்துக்குச் செல்ல முதலில் ACAS இன் ஆரம்ப சமரசத்தைத் தொடர்பு கொள்ளுங்கள்; கோரிக்கைகள் 6 மாதங்களுக்குள்.',
    committeeInbox: 'பெறப்பட்ட குறைபாடுகள்',
    handlerSelf: 'நான் துன்புறுத்தல் குறைபாடுகளைக் கையாள்கிறேன்',
    handlerMember: 'துன்புறுத்தல் குறைபாடுகளைக் கையாள்பவர்',
    handlerSectionBody:
      'எல்லா முதலாளிகளும் பாலியல் துன்புறுத்தலைத் தடுக்க நியாயமான நடவடிக்கைகள் எடுக்க வேண்டும்; அதை எழுப்ப தெளிவான வழியும் கையாளப் பயிற்சி பெற்றவர்களும் இதில் அடங்கும்.',
    flagNoHandler: 'துன்புறுத்தல் தொடர்பாளர்கள் பெயரிடப்படவில்லை',
    serviceFromLabel: 'தொடக்கத் தேதி',
    overtimeRule:
      'சட்டப்பூர்வ கூடுதல் நேர விகிதம் இல்லை: உங்கள் ஒப்பந்தமே அதை நிர்ணயிக்கும். எழுத்துமூலம் விலகாவிட்டால் 17 வாரங்களில் சராசரியாக வாரத்துக்கு 48 மணிக்கு மேல் வேலை செய்ய வைக்க முடியாது; நாட்களுக்கு இடையே 11 மணி நேர ஓய்வு உண்டு.',
    ded_paye: 'வருமான வரி (PAYE)',
    ded_national_insurance: 'தேசியக் காப்பீடு',
    ded_pension: 'பணியிட ஓய்வூதியம்',
    ded_student_loan: 'மாணவர் கடன்',
    ext_acas: 'ACAS',
    ext_eass: 'சமத்துவ ஆலோசனை மற்றும் ஆதரவு சேவை',
    limit_gbAvg: '17 வாரச் சராசரி வாரம் (48 ம வரம்பு)',
    studentRule:
      'மாணவர் விசா: பட்டப்படிப்புக்கு பருவ காலத்தில் வாரத்துக்கு 20 மணி வரை (பட்டப்படிப்புக்குக் கீழ் 10), அதிகாரப்பூர்வ விடுமுறையில் முழுநேரம். 18 வயதுக்குட்பட்டோர்: நாளுக்கு 8 மணி, வாரத்துக்கு 40, 22:00–6:00 வேலை இல்லை (வேலை நேர விதிமுறைகள்).',
  },
  hi: {
    recordBroken:
      'यह रिकॉर्ड मेल नहीं खाता। यह स्क्रीन अपने यूनियन प्रतिनिधि, ACAS या Fair Work Agency को दिखाएँ।',
    leaveBody:
      'छुट्टियाँ, अवकाश या घर से काम का दिन बुक करें। हर फ़ैसला आपके रिकॉर्ड में सील हो जाता है।',
    balanceCasual: 'करुणा अवकाश',
    balanceSick: 'बीमारी',
    balanceEarned: 'छुट्टियाँ',
    balanceCompOff: 'TOIL',
    typeCasual: 'करुणा या विशेष अवकाश',
    typeSick: 'बीमारी के कारण अनुपस्थिति',
    typeEarned: 'वार्षिक छुट्टियाँ',
    typeCompOff: 'बदले का समय (TOIL)',
    typeUnpaid: 'बिना वेतन छुट्टी',
    typeWfh: 'घर से काम',
    compOffNote: 'मंज़ूर अतिरिक्त घंटे भुगतान के बजाय बदले के समय के रूप में जमा होते हैं।',
    leaveLawNote:
      'साल में 5.6 हफ़्ते की सवेतन छुट्टियाँ (5 दिन के हफ़्ते पर 28 दिन), जिनमें बैंक हॉलिडे शामिल हो सकते हैं (कार्य-समय विनियम, नियम 13 और 13A)। वैधानिक बीमारी वेतन (SSP) बीमारी के पहले दिन से मिलता है।',
    complaintEntry: 'गोपनीय शिकायत उठाएँ',
    complaintEntrySub: 'यौन उत्पीड़न, धौंस या भेदभाव। इसे केवल नामित संपर्क देखते हैं।',
    complaintTitle: 'गोपनीय शिकायत',
    complaintBody:
      'यह केवल उन लोगों तक जाती है जिन्हें आपके नियोक्ता ने उत्पीड़न की शिकायतें सँभालने के लिए नामित किया है, आपके लाइन मैनेजर या मालिक तक नहीं। आप लोगों को बाहर रख सकते हैं। शिकायत उठाने पर आप बदले की कार्रवाई से सुरक्षित हैं।',
    committeeLabel: 'उत्पीड़न संपर्क',
    presiding: 'मुख्य',
    noCommittee:
      'आपके नियोक्ता ने अभी किसी को नामित नहीं किया है। आप फिर भी भेज सकते हैं, और मालिक को बताया जाएगा कि उन्हें उत्पीड़न रोकने के क़दम उठाने होंगे। ACAS भी सलाह दे सकता है।',
    excludeLabel: 'संपर्क जो इसे न देखें',
    lawNote:
      'नियोक्ताओं को यौन उत्पीड़न रोकने के उचित क़दम उठाने होंगे (समानता अधिनियम 2010, धारा 40A)। ट्रिब्यूनल जाने से पहले ACAS की शुरुआती सुलह से संपर्क करें; दावे 6 महीने के भीतर करने होते हैं।',
    committeeInbox: 'मिली शिकायतें',
    handlerSelf: 'मैं उत्पीड़न की शिकायतें सँभालता/सँभालती हूँ',
    handlerMember: 'उत्पीड़न की शिकायतें सँभालते हैं',
    handlerSectionBody:
      'सभी नियोक्ताओं को यौन उत्पीड़न रोकने के उचित क़दम उठाने होंगे, जिनमें शिकायत उठाने का साफ़ तरीक़ा और उससे निपटने के लिए प्रशिक्षित लोग शामिल हैं।',
    flagNoHandler: 'कोई उत्पीड़न संपर्क नामित नहीं',
    serviceFromLabel: 'शुरुआत की तारीख़',
    overtimeRule:
      'कोई क़ानूनी ओवरटाइम दर नहीं: आपका अनुबंध तय करता है। लिखित में बाहर न निकलें तो 17 हफ़्तों में औसतन हफ़्ते में 48 घंटे से ज़्यादा काम नहीं करवाया जा सकता, और दिनों के बीच 11 घंटे आराम मिलता है।',
    ded_paye: 'आयकर (PAYE)',
    ded_national_insurance: 'नेशनल इंश्योरेंस',
    ded_pension: 'कार्यस्थल पेंशन',
    ded_student_loan: 'छात्र ऋण',
    ext_acas: 'ACAS',
    ext_eass: 'समानता सलाह और सहायता सेवा',
    limit_gbAvg: '17 हफ़्तों का औसत हफ़्ता (48 घं की सीमा)',
    studentRule:
      'स्टूडेंट वीज़ा: डिग्री स्तर की पढ़ाई में सत्र के दौरान हफ़्ते में 20 घंटे तक (डिग्री से नीचे 10), आधिकारिक छुट्टियों में पूरे समय। 18 से कम: दिन में 8, हफ़्ते में 40 घंटे, 22:00–6:00 काम नहीं (कार्य-समय विनियम)।',
  },
  es: {
    recordBroken:
      'Este registro no coincide. Muestre esta pantalla a su representante sindical, a ACAS o a la Fair Work Agency.',
    leaveBody:
      'Reserve vacaciones, un permiso o un día de teletrabajo. Cada decisión queda sellada en su registro.',
    balanceCasual: 'Permiso por motivos personales',
    balanceSick: 'Enfermedad',
    balanceEarned: 'Vacaciones',
    balanceCompOff: 'TOIL',
    typeCasual: 'Permiso por duelo o especial',
    typeSick: 'Ausencia por enfermedad',
    typeEarned: 'Vacaciones anuales',
    typeCompOff: 'Tiempo libre compensatorio (TOIL)',
    typeUnpaid: 'Permiso sin sueldo',
    typeWfh: 'Teletrabajo',
    compOffNote: 'Las horas extra aprobadas se acumulan como tiempo libre en lugar de pagarse.',
    leaveLawNote:
      '5,6 semanas de vacaciones pagadas al año (28 días con semana de 5 días), que pueden incluir festivos (Working Time Regulations, regs. 13 y 13A). La prestación legal por enfermedad (SSP) se paga desde el primer día.',
    complaintEntry: 'Presentar una queja confidencial',
    complaintEntrySub:
      'Acoso sexual, intimidación o discriminación. Solo los contactos designados la ven.',
    complaintTitle: 'Queja confidencial',
    complaintBody:
      'Esto llega solo a las personas que su empleador designó para atender quejas de acoso, no a su superior directo ni al dueño. Puede excluir personas. Está protegido contra represalias por presentarla.',
    committeeLabel: 'Contactos para casos de acoso',
    presiding: 'responsable',
    noCommittee:
      'Su empleador aún no ha designado a nadie. Puede enviarla igualmente, y se informará al dueño de que debe tomar medidas para prevenir el acoso. ACAS también puede asesorarle.',
    excludeLabel: 'Contactos que no deben ver esto',
    lawNote:
      'El empleador debe tomar medidas razonables para prevenir el acoso sexual (Equality Act 2010, s.40A). Para ir a un tribunal, contacte primero con ACAS para la conciliación previa; el plazo es de 6 meses.',
    committeeInbox: 'Quejas recibidas',
    handlerSelf: 'Atiendo quejas por acoso',
    handlerMember: 'Atiende quejas por acoso',
    handlerSectionBody:
      'Todo empleador debe tomar medidas razonables para prevenir el acoso sexual, incluida una vía clara para denunciarlo y personas formadas para atenderlo.',
    flagNoHandler: 'Sin contactos para casos de acoso',
    serviceFromLabel: 'Fecha de inicio',
    overtimeRule:
      'No hay recargo legal por horas extra: lo fija su contrato. No pueden obligarle a superar una media de 48 horas semanales en 17 semanas salvo que renuncie por escrito, y tiene 11 horas de descanso entre jornadas.',
    ded_paye: 'Impuesto sobre la renta (PAYE)',
    ded_national_insurance: 'National Insurance (seguridad social)',
    ded_pension: 'Pensión de empresa',
    ded_student_loan: 'Préstamo estudiantil',
    ext_acas: 'ACAS',
    ext_eass: 'Servicio de Asesoramiento y Apoyo en Igualdad',
    limit_gbAvg: 'Semana media en 17 semanas (límite de 48 h)',
    studentRule:
      'Visado de estudiante: hasta 20 horas a la semana durante el curso en estudios de grado (10 por debajo), jornada completa en las vacaciones oficiales. Menores de 18: 8 horas al día, 40 a la semana, sin trabajo de 22:00 a 6:00 (Working Time Regulations).',
  },
  fr: {
    recordBroken:
      'Cet enregistrement ne correspond pas. Montrez cet écran à votre représentant syndical, à l’ACAS ou à la Fair Work Agency.',
    leaveBody:
      'Réservez des vacances, un congé ou une journée de télétravail. Chaque décision est scellée dans votre dossier.',
    balanceCasual: 'Congé pour raisons familiales',
    balanceSick: 'Maladie',
    balanceEarned: 'Vacances',
    balanceCompOff: 'TOIL',
    typeCasual: 'Congé pour deuil ou congé spécial',
    typeSick: 'Absence pour maladie',
    typeEarned: 'Congés annuels',
    typeCompOff: 'Repos compensateur (TOIL)',
    typeUnpaid: 'Congé sans solde',
    typeWfh: 'Télétravail',
    compOffNote:
      'Les heures supplémentaires approuvées sont mises de côté en repos au lieu d’être payées.',
    leaveLawNote:
      '5,6 semaines de congés payés par an (28 jours sur une semaine de 5 jours), pouvant inclure les jours fériés (Working Time Regulations, règles 13 et 13A). L’indemnité légale de maladie (SSP) est due dès le premier jour.',
    complaintEntry: 'Déposer une réclamation confidentielle',
    complaintEntrySub:
      'Harcèlement sexuel, intimidation ou discrimination. Seuls les contacts désignés la voient.',
    complaintTitle: 'Réclamation confidentielle',
    complaintBody:
      'Elle n’est transmise qu’aux personnes désignées par votre employeur pour traiter le harcèlement, ni à votre supérieur direct ni au propriétaire. Vous pouvez en exclure. Vous êtes protégé contre les représailles.',
    committeeLabel: 'Contacts harcèlement',
    presiding: 'responsable',
    noCommittee:
      'Votre employeur n’a encore désigné personne. Vous pouvez quand même l’envoyer, et le propriétaire sera informé qu’il doit prendre des mesures contre le harcèlement. L’ACAS peut aussi vous conseiller.',
    excludeLabel: 'Contacts qui ne doivent pas voir ceci',
    lawNote:
      'L’employeur doit prendre des mesures raisonnables pour prévenir le harcèlement sexuel (Equality Act 2010, s.40A). Avant le tribunal, contactez l’ACAS pour la conciliation préalable ; le délai est de 6 mois.',
    committeeInbox: 'Réclamations reçues',
    handlerSelf: 'Je traite les réclamations pour harcèlement',
    handlerMember: 'Traite les réclamations pour harcèlement',
    handlerSectionBody:
      'Tout employeur doit prendre des mesures raisonnables contre le harcèlement sexuel, dont un moyen clair de le signaler et des personnes formées pour le traiter.',
    flagNoHandler: 'Aucun contact harcèlement désigné',
    serviceFromLabel: 'Date de début',
    overtimeRule:
      'Pas de majoration légale des heures sup. : votre contrat la fixe. On ne peut pas vous imposer plus de 48 heures par semaine en moyenne sur 17 semaines, sauf renonciation écrite, et vous avez 11 heures de repos entre deux journées.',
    ded_paye: 'Impôt sur le revenu (PAYE)',
    ded_national_insurance: 'National Insurance (cotisations sociales)',
    ded_pension: 'Retraite d’entreprise',
    ded_student_loan: 'Prêt étudiant',
    ext_acas: 'ACAS',
    ext_eass: 'Service de conseil et de soutien en matière d’égalité',
    limit_gbAvg: 'Semaine moyenne sur 17 semaines (limite de 48 h)',
    studentRule:
      'Visa étudiant : jusqu’à 20 heures par semaine pendant l’année pour un diplôme universitaire (10 en dessous), temps plein pendant les vacances officielles. Moins de 18 ans : 8 heures par jour, 40 par semaine, pas de travail de 22 h à 6 h (Working Time Regulations).',
  },
  de: {
    recordBroken:
      'Dieser Eintrag stimmt nicht. Zeigen Sie diesen Bildschirm Ihrer Gewerkschaftsvertretung, ACAS oder der Fair Work Agency.',
    leaveBody:
      'Buchen Sie Urlaub, Freistellung oder einen Tag im Homeoffice. Jede Entscheidung wird in Ihrem Nachweis versiegelt.',
    balanceCasual: 'Sonderurlaub',
    balanceSick: 'Krankheit',
    balanceEarned: 'Urlaub',
    balanceCompOff: 'TOIL',
    typeCasual: 'Trauer- oder Sonderurlaub',
    typeSick: 'Krankheitsbedingte Abwesenheit',
    typeEarned: 'Jahresurlaub',
    typeCompOff: 'Freizeitausgleich (TOIL)',
    typeUnpaid: 'Unbezahlter Urlaub',
    typeWfh: 'Homeoffice',
    compOffNote:
      'Genehmigte Mehrstunden werden als Freizeitausgleich gutgeschrieben statt bezahlt.',
    leaveLawNote:
      '5,6 Wochen bezahlter Urlaub im Jahr (28 Tage bei einer 5-Tage-Woche), Feiertage können eingerechnet sein (Working Time Regulations, Reg. 13 und 13A). Gesetzliches Krankengeld (SSP) gibt es ab dem ersten Krankheitstag.',
    complaintEntry: 'Vertrauliche Beschwerde einreichen',
    complaintEntrySub:
      'Sexuelle Belästigung, Mobbing oder Diskriminierung. Nur die benannten Ansprechpersonen sehen sie.',
    complaintTitle: 'Vertrauliche Beschwerde',
    complaintBody:
      'Sie geht nur an die Personen, die Ihr Arbeitgeber für Belästigungsbeschwerden benannt hat, nicht an Ihre direkte Führungskraft oder den Inhaber. Sie können Personen ausschließen. Sie sind vor Benachteiligung geschützt.',
    committeeLabel: 'Ansprechpersonen für Belästigung',
    presiding: 'Leitung',
    noCommittee:
      'Ihr Arbeitgeber hat noch niemanden benannt. Sie können es trotzdem senden, und der Inhaber erfährt, dass er Maßnahmen gegen Belästigung ergreifen muss. Auch ACAS berät Sie.',
    excludeLabel: 'Ansprechpersonen, die dies nicht sehen dürfen',
    lawNote:
      'Arbeitgeber müssen angemessene Schritte gegen sexuelle Belästigung unternehmen (Equality Act 2010, s.40A). Vor einer Klage beim Tribunal zuerst ACAS für die Vorabschlichtung kontaktieren; die Frist beträgt 6 Monate.',
    committeeInbox: 'Eingegangene Beschwerden',
    handlerSelf: 'Ich bearbeite Beschwerden über Belästigung',
    handlerMember: 'Bearbeitet Beschwerden über Belästigung',
    handlerSectionBody:
      'Alle Arbeitgeber müssen angemessene Schritte gegen sexuelle Belästigung unternehmen, darunter ein klarer Meldeweg und geschulte Ansprechpersonen.',
    flagNoHandler: 'Keine Ansprechpersonen für Belästigung',
    serviceFromLabel: 'Beginn',
    overtimeRule:
      'Kein gesetzlicher Überstundenzuschlag: Ihr Vertrag legt ihn fest. Ohne schriftlichen Verzicht dürfen Sie im Schnitt über 17 Wochen nicht mehr als 48 Stunden pro Woche arbeiten, und zwischen zwei Arbeitstagen stehen Ihnen 11 Stunden Ruhe zu.',
    ded_paye: 'Einkommensteuer (PAYE)',
    ded_national_insurance: 'National Insurance (Sozialversicherung)',
    ded_pension: 'Betriebsrente',
    ded_student_loan: 'Studienkredit',
    ext_acas: 'ACAS',
    ext_eass: 'Beratungs- und Unterstützungsdienst für Gleichstellung',
    limit_gbAvg: 'Durchschnittswoche über 17 Wochen (Grenze 48 h)',
    studentRule:
      'Studentenvisum: im Semester bis zu 20 Stunden pro Woche im Studium (unterhalb des Bachelorniveaus 10), in den offiziellen Ferien Vollzeit. Unter 18: 8 Stunden am Tag, 40 pro Woche, keine Arbeit von 22 bis 6 Uhr (Working Time Regulations).',
  },
  pt: {
    recordBroken:
      'Este registo não confere. Mostre este ecrã ao seu representante sindical, à ACAS ou à Fair Work Agency.',
    leaveBody:
      'Marque férias, uma licença ou um dia de teletrabalho. Cada decisão fica selada no seu registo.',
    balanceCasual: 'Licença por motivos pessoais',
    balanceSick: 'Doença',
    balanceEarned: 'Férias',
    balanceCompOff: 'TOIL',
    typeCasual: 'Licença por luto ou especial',
    typeSick: 'Ausência por doença',
    typeEarned: 'Férias anuais',
    typeCompOff: 'Folga compensatória (TOIL)',
    typeUnpaid: 'Licença sem vencimento',
    typeWfh: 'Teletrabalho',
    compOffNote: 'As horas extra aprovadas são guardadas como folga em vez de pagas.',
    leaveLawNote:
      '5,6 semanas de férias pagas por ano (28 dias numa semana de 5 dias), que podem incluir feriados (Working Time Regulations, regras 13 e 13A). O subsídio legal de doença (SSP) é pago desde o primeiro dia.',
    complaintEntry: 'Apresentar uma queixa confidencial',
    complaintEntrySub:
      'Assédio sexual, intimidação ou discriminação. Só os contactos designados a veem.',
    complaintTitle: 'Queixa confidencial',
    complaintBody:
      'Isto vai apenas para as pessoas que o seu empregador designou para tratar queixas de assédio, não para a sua chefia direta nem para o dono. Pode excluir pessoas. Está protegido contra retaliações.',
    committeeLabel: 'Contactos para assédio',
    presiding: 'responsável',
    noCommittee:
      'O seu empregador ainda não designou ninguém. Pode enviar na mesma, e o dono será informado de que tem de tomar medidas contra o assédio. A ACAS também pode aconselhá-lo.',
    excludeLabel: 'Contactos que não devem ver isto',
    lawNote:
      'O empregador tem de tomar medidas razoáveis para prevenir o assédio sexual (Equality Act 2010, s.40A). Antes de ir a tribunal, contacte a ACAS para a conciliação prévia; o prazo é de 6 meses.',
    committeeInbox: 'Queixas recebidas',
    handlerSelf: 'Trato queixas de assédio',
    handlerMember: 'Trata queixas de assédio',
    handlerSectionBody:
      'Todos os empregadores têm de tomar medidas razoáveis contra o assédio sexual, incluindo uma forma clara de o denunciar e pessoas com formação para o tratar.',
    flagNoHandler: 'Sem contactos para assédio',
    serviceFromLabel: 'Data de início',
    overtimeRule:
      'Não há valor legal para horas extra: o contrato define-o. Não pode ser obrigado a trabalhar mais de 48 horas por semana em média ao longo de 17 semanas, salvo renúncia por escrito, e tem 11 horas de descanso entre dias de trabalho.',
    ded_paye: 'Imposto sobre o rendimento (PAYE)',
    ded_national_insurance: 'National Insurance (segurança social)',
    ded_pension: 'Pensão da empresa',
    ded_student_loan: 'Empréstimo estudantil',
    ext_acas: 'ACAS',
    ext_eass: 'Serviço de Aconselhamento e Apoio à Igualdade',
    limit_gbAvg: 'Semana média em 17 semanas (limite de 48 h)',
    studentRule:
      'Visto de estudante: até 20 horas por semana em período letivo para licenciatura (10 abaixo desse nível), tempo inteiro nas férias oficiais. Menores de 18: 8 horas por dia, 40 por semana, sem trabalho das 22:00 às 6:00 (Working Time Regulations).',
  },
  ja: {
    recordBroken:
      'この記録は一致しません。この画面を組合の代表、ACAS(助言・斡旋・仲裁局)、またはFair Work Agencyに見せてください。',
    leaveBody:
      '休暇、特別休暇、在宅勤務を予約できます。承認・却下はすべてあなたの記録に封印されます。',
    balanceCasual: '忌引・特別休暇',
    balanceSick: '病気',
    balanceEarned: '年次休暇',
    balanceCompOff: '代休(TOIL)',
    typeCasual: '忌引または特別休暇',
    typeSick: '病気による欠勤',
    typeEarned: '年次有給休暇',
    typeCompOff: '代休(TOIL)',
    typeUnpaid: '無給休暇',
    typeWfh: '在宅勤務',
    compOffNote: '承認された時間外労働は、支払いの代わりに代休として積み立てられます。',
    leaveLawNote:
      '年5.6週間の有給休暇(週5日勤務で28日)。祝日を含む場合があります(労働時間規則13条・13A条)。法定傷病手当(SSP)は病気の初日から支払われます。',
    complaintEntry: '秘密の苦情を申し立てる',
    complaintEntrySub: 'セクハラ、いじめ、差別。指名された担当者だけが見られます。',
    complaintTitle: '秘密の苦情',
    complaintBody:
      '雇用主がハラスメント苦情の担当として指名した人にだけ届き、直属の上司やオーナーには届きません。除外する人を選べます。申し立てを理由とする報復から守られます。',
    committeeLabel: 'ハラスメント担当者',
    presiding: '主担当',
    noCommittee:
      '雇用主はまだ担当者を指名していません。このまま送ることができ、ハラスメント防止策を講じる義務があることがオーナーに伝わります。ACASにも相談できます。',
    excludeLabel: 'この苦情を見せない担当者',
    lawNote:
      '雇用主はセクハラを防ぐために合理的な措置を講じなければなりません(2010年平等法40A条)。審判所に訴える前に、まずACASの事前調停に連絡してください。期限は6か月です。',
    committeeInbox: '受け付けた苦情',
    handlerSelf: '私はハラスメント苦情を担当しています',
    handlerMember: 'ハラスメント苦情の担当',
    handlerSectionBody:
      'すべての雇用主は、申し立ての明確な手段と対応できるよう研修を受けた担当者を含め、セクハラを防ぐ合理的な措置を講じなければなりません。',
    flagNoHandler: 'ハラスメント担当者が未指名',
    serviceFromLabel: '勤務開始日',
    overtimeRule:
      '法定の残業割増はなく、契約で決まります。書面で適用除外に同意しない限り、17週間平均で週48時間を超えて働かせることはできず、勤務日の間には11時間の休息があります。',
    ded_paye: '所得税(PAYE)',
    ded_national_insurance: '国民保険(National Insurance)',
    ded_pension: '職域年金',
    ded_student_loan: '学生ローン',
    ext_acas: 'ACAS',
    ext_eass: '平等相談・支援サービス',
    limit_gbAvg: '17週間の平均(週48時間まで)',
    studentRule:
      '学生ビザ:学位課程は学期中週20時間まで(学位未満は10時間)、公式休暇中はフルタイム。18歳未満:1日8時間・週40時間、22時〜6時の労働は禁止(労働時間規則)。',
  },
  zh: {
    recordBroken:
      '此记录不一致。请把这个页面给你的工会代表、ACAS(咨询、调解和仲裁服务局)或Fair Work Agency看。',
    leaveBody: '预约休假、请假或居家办公日。每项决定都会封存在你的记录里。',
    balanceCasual: '丧假或特别假',
    balanceSick: '病假',
    balanceEarned: '年假',
    balanceCompOff: '补休(TOIL)',
    typeCasual: '丧假或特别假',
    typeSick: '病假缺勤',
    typeEarned: '带薪年假',
    typeCompOff: '补休(TOIL)',
    typeUnpaid: '无薪假',
    typeWfh: '居家办公',
    compOffNote: '经批准的加班时间存为补休,而不是支付工资。',
    leaveLawNote:
      '每年5.6周带薪假期(每周工作5天者为28天),可包括公共假日(《工作时间条例》第13条和第13A条)。法定病假工资(SSP)从生病第一天起支付。',
    complaintEntry: '提出保密申诉',
    complaintEntrySub: '性骚扰、欺凌或歧视。只有指定联络人能看到。',
    complaintTitle: '保密申诉',
    complaintBody:
      '只送达雇主指定处理骚扰申诉的人员,不会送到你的直属经理或老板。你可以排除某些人。你受保护,不会因提出申诉而遭报复。',
    committeeLabel: '骚扰联络人',
    presiding: '负责人',
    noCommittee:
      '你的雇主尚未指定任何人。你仍然可以发送,老板会被告知必须采取措施防止骚扰。ACAS也可以提供咨询。',
    excludeLabel: '不允许查看的联络人',
    lawNote:
      '雇主必须采取合理措施防止性骚扰(《2010年平等法》第40A条)。向劳动法庭起诉前,须先联系ACAS进行早期调解;时限为6个月。',
    committeeInbox: '收到的申诉',
    handlerSelf: '我负责处理骚扰申诉',
    handlerMember: '处理骚扰申诉',
    handlerSectionBody:
      '所有雇主都必须采取合理措施防止性骚扰,包括清晰的申诉途径和受过培训的处理人员。',
    flagNoHandler: '未指定骚扰联络人',
    serviceFromLabel: '开始日期',
    overtimeRule:
      '没有法定加班费率,由合同规定。除非书面放弃,否则不能要求你在17周内平均每周工作超过48小时;两个工作日之间有11小时休息。',
    ded_paye: '所得税(PAYE)',
    ded_national_insurance: '国民保险(National Insurance)',
    ded_pension: '职业养老金',
    ded_student_loan: '学生贷款',
    ext_acas: 'ACAS',
    ext_eass: '平等咨询与支持服务',
    limit_gbAvg: '17周平均每周(上限48小时)',
    studentRule:
      '学生签证:学位课程学期内每周最多20小时(学位以下课程10小时),正式假期可全职。未满18岁:每天8小时、每周40小时,禁止22:00–6:00工作(《工作时间条例》)。',
  },
  ko: {
    recordBroken:
      '이 기록은 일치하지 않습니다. 이 화면을 노조 대표, ACAS(자문·조정·중재청)나 Fair Work Agency에 보여 주세요.',
    leaveBody: '휴가, 휴직이나 재택근무를 예약하세요. 모든 결정은 기록에 봉인됩니다.',
    balanceCasual: '경조·특별휴가',
    balanceSick: '병가',
    balanceEarned: '연차',
    balanceCompOff: '보상휴가(TOIL)',
    typeCasual: '경조 또는 특별휴가',
    typeSick: '질병으로 인한 결근',
    typeEarned: '연차 유급휴가',
    typeCompOff: '보상휴가(TOIL)',
    typeUnpaid: '무급 휴가',
    typeWfh: '재택근무',
    compOffNote: '승인된 초과 근무는 수당 대신 보상휴가로 적립됩니다.',
    leaveLawNote:
      '연 5.6주의 유급휴가(주 5일 근무 시 28일), 공휴일을 포함할 수 있습니다(근로시간규정 제13조·제13A조). 법정 상병수당(SSP)은 아픈 첫날부터 지급됩니다.',
    complaintEntry: '비공개 고충 제기',
    complaintEntrySub: '성희롱, 괴롭힘이나 차별. 지정된 담당자만 볼 수 있습니다.',
    complaintTitle: '비공개 고충',
    complaintBody:
      '사용자가 괴롭힘 고충 담당으로 지정한 사람에게만 전달되며 직속 상사나 사업주에게는 가지 않습니다. 제외할 사람을 고를 수 있습니다. 고충 제기로 인한 보복에서 보호받습니다.',
    committeeLabel: '괴롭힘 담당자',
    presiding: '책임자',
    noCommittee:
      '사용자가 아직 아무도 지정하지 않았습니다. 그래도 보낼 수 있으며, 괴롭힘 예방 조치를 해야 한다는 사실이 사업주에게 전달됩니다. ACAS에서도 상담받을 수 있습니다.',
    excludeLabel: '이 고충을 보지 못하게 할 담당자',
    lawNote:
      '사용자는 성희롱을 막기 위한 합리적인 조치를 해야 합니다(2010년 평등법 제40A조). 심판소에 가기 전에 먼저 ACAS 사전 조정에 연락하세요. 기한은 6개월입니다.',
    committeeInbox: '받은 고충',
    handlerSelf: '저는 괴롭힘 고충을 처리합니다',
    handlerMember: '괴롭힘 고충 담당',
    handlerSectionBody:
      '모든 사용자는 성희롱을 막기 위한 합리적인 조치를 해야 하며, 여기에는 분명한 신고 방법과 교육받은 담당자가 포함됩니다.',
    flagNoHandler: '괴롭힘 담당자 미지정',
    serviceFromLabel: '근무 시작일',
    overtimeRule:
      '법정 초과근무 수당률은 없으며 계약으로 정합니다. 서면으로 적용 제외에 동의하지 않는 한 17주 평균 주 48시간을 넘겨 일하게 할 수 없고, 근무일 사이에는 11시간의 휴식이 있습니다.',
    ded_paye: '소득세(PAYE)',
    ded_national_insurance: '국민보험(National Insurance)',
    ded_pension: '직장연금',
    ded_student_loan: '학자금 대출',
    ext_acas: 'ACAS',
    ext_eass: '평등 상담·지원 서비스',
    limit_gbAvg: '17주 평균 주당 근로(48시간 한도)',
    studentRule:
      '학생 비자: 학위 과정은 학기 중 주 20시간까지(학위 미만 과정은 10시간), 공식 방학에는 전일 근무 가능. 18세 미만: 하루 8시간·주 40시간, 22시~6시 근로 금지(근로시간규정).',
  },
};
