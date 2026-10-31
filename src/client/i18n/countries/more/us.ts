import type { CountryLanguages } from '../../country.js';

/** The United States' legal wording for readers of other languages. */
export const US_MORE: CountryLanguages = {
  ta: {
    recordBroken:
      'இந்தப் பதிவு பொருந்தவில்லை. இந்தத் திரையை தொழிலாளர் துறையின் ஊதிய மற்றும் நேரப் பிரிவு, உங்கள் மாநிலத் தொழிலாளர் துறை அல்லது உங்கள் சங்கத்திடம் காட்டுங்கள்.',
    leaveBody:
      'PTO, நோய் நேரம் அல்லது வீட்டிலிருந்து வேலை நாள் கேளுங்கள். ஒவ்வொரு முடிவும் உங்கள் பதிவில் முத்திரையிடப்படும்.',
    balanceCasual: 'தனிப்பட்ட',
    balanceSick: 'நோய் நேரம்',
    balanceEarned: 'PTO',
    balanceCompOff: 'ஈடு நேரம்',
    typeCasual: 'தனிப்பட்ட நாள்',
    typeSick: 'ஊதிய நோய் நேரம்',
    typeEarned: 'ஊதிய விடுமுறை நேரம் (PTO)',
    typeCompOff: 'ஈடு நேரம் (comp time)',
    typeUnpaid: 'ஊதியமில்லா விடுப்பு (FMLA)',
    typeWfh: 'வீட்டிலிருந்து வேலை',
    compOffNote:
      'தனியார் முதலாளிகள் விலக்கில்லாத ஊழியர்களுக்குக் கூடுதல் நேர ஊதியம் தர வேண்டும்; அதை ஈடு நேரமாக மாற்ற முடியாது.',
    leaveLawNote:
      'கூட்டாட்சி அளவில் ஊதிய விடுமுறை இல்லை; PTO நிறுவனக் கொள்கை. பல மாநிலங்கள் ஊதிய நோய் நேரத்தைக் கட்டாயமாக்குகின்றன (கலிபோர்னியா: குறைந்தது 40 மணி அல்லது 5 நாட்கள்). 50+ ஊழியர்கள் உள்ள இடங்களில் FMLA 12 வாரம் வரை ஊதியமில்லா விடுப்பு தருகிறது.',
    complaintEntry: 'துன்புறுத்தலைப் புகாரளிக்கவும்',
    complaintEntrySub:
      'பாலியல் துன்புறுத்தல் அல்லது பாகுபாடு. புகார்களைப் பெறப் பெயரிடப்பட்டவர்கள் மட்டுமே பார்ப்பார்கள்.',
    complaintTitle: 'ரகசியப் புகார்',
    complaintBody:
      'இது துன்புறுத்தல் புகார்களைப் பெற உங்கள் முதலாளி பெயரிட்டவர்களுக்கு மட்டுமே செல்லும், உங்கள் மேலாளருக்கோ உரிமையாளருக்கோ அல்ல. நபர்களை விலக்கலாம். புகாரளித்ததற்காகப் பழிவாங்குவது சட்டவிரோதம்.',
    committeeLabel: 'துன்புறுத்தல் புகார் தொடர்பாளர்கள்',
    presiding: 'முதன்மையானவர்',
    noCommittee:
      'உங்கள் முதலாளி இன்னும் யாரையும் பெயரிடவில்லை. இதை அனுப்பலாம்; புகார் வழி எதிர்பார்க்கப்படுகிறது என்று உரிமையாளருக்குத் தெரிவிக்கப்படும். EEOC அல்லது உங்கள் மாநில நிறுவனத்திடமும் புகார் தாக்கல் செய்யலாம்.',
    excludeLabel: 'இதைப் பார்க்கக்கூடாத தொடர்பாளர்கள்',
    lawNote:
      'EEOC இடம் புகார் பொதுவாக நிகழ்வுக்குப் பிறகு 180 நாட்களுக்குள் (பல மாநிலங்களில் 300 நாட்கள்). கலிபோர்னியாவும் நியூயார்க்கும் தங்கள் மாநில நிறுவனங்களிடம் 3 ஆண்டுகள் அனுமதிக்கின்றன.',
    committeeInbox: 'பெறப்பட்ட புகார்கள்',
    handlerSelf: 'நான் துன்புறுத்தல் புகார்களைப் பெறுகிறேன்',
    handlerMember: 'துன்புறுத்தல் புகார்களைப் பெறுபவர்',
    handlerSectionBody:
      'Title VII இன் கீழான முதலாளிகள் (15+ ஊழியர்கள்) துன்புறுத்தலைப் புகாரளிக்கத் தெளிவான வழி தர வேண்டும். கலிபோர்னியா (5+) மற்றும் நியூயார்க் (எல்லா முதலாளிகளும்) எழுத்துமூலக் கொள்கையும் பயிற்சியும் கோருகின்றன.',
    flagNoHandler: 'துன்புறுத்தல் புகார் தொடர்பாளர்கள் இல்லை',
    serviceFromLabel: 'பணியில் சேர்ந்த தேதி',
    overtimeRule:
      'விலக்கில்லாத ஊழியர்களுக்கு வேலை வாரத்தில் 40 மணிக்குப் பிறகு வழக்கமான விகிதத்தின் 1.5×. கலிபோர்னியாவில் நாளுக்கு 8 மணிக்குப் பிறகும், 12 மணிக்குப் பிறகு 2×.',
    ded_federal_income_tax: 'கூட்டாட்சி வருமான வரி',
    ded_social_security: 'சமூகப் பாதுகாப்பு',
    ded_medicare: 'மெடிகேர்',
    ded_state_income_tax: 'மாநில வருமான வரி',
    ded_retirement_401k: '401(k) ஓய்வூதியச் சேமிப்பு',
    ded_health_insurance: 'சுகாதாரக் காப்பீடு',
    ext_eeoc: 'அமெரிக்க சம வேலைவாய்ப்பு ஆணையம் (EEOC)',
    ext_crd: 'கலிபோர்னியா சிவில் உரிமைகள் துறை',
    ext_nydhr: 'நியூயார்க் மாநில மனித உரிமைப் பிரிவு',
    limit_usWeek: 'இந்த வேலை வாரம் (40 மணிக்குப் பிறகு கூடுதல் நேரம்)',
    limit_caDay: 'இன்று (8 மணிக்குப் பிறகு கூடுதல் நேரம்)',
    studentRule:
      'F-1 மாணவர்கள்: பருவ காலத்தில் வளாகத்துக்குள் வாரத்துக்கு 20 மணி வரை, விடுமுறையில் முழுநேரம்; வளாகத்துக்கு வெளியே வேலைக்கு CPT அல்லது OPT தேவை. 16 வயதுக்குக் கீழ்: பள்ளி நாளில் 3 மணி, பள்ளி வாரத்தில் 18, காலை 7 – மாலை 7 (FLSA). பல மாநிலங்கள் கூடுதல் விதிகள் வைத்துள்ளன.',
  },
  hi: {
    recordBroken:
      'यह रिकॉर्ड मेल नहीं खाता। यह स्क्रीन श्रम विभाग के वेतन और घंटा प्रभाग, अपने राज्य के श्रम विभाग या अपनी यूनियन को दिखाएँ।',
    leaveBody:
      'PTO, बीमारी का समय या घर से काम का दिन माँगें। हर फ़ैसला आपके रिकॉर्ड में सील हो जाता है।',
    balanceCasual: 'निजी',
    balanceSick: 'बीमारी का समय',
    balanceEarned: 'PTO',
    balanceCompOff: 'बदले का समय',
    typeCasual: 'निजी दिन',
    typeSick: 'सवेतन बीमारी का समय',
    typeEarned: 'सवेतन छुट्टी का समय (PTO)',
    typeCompOff: 'बदले का समय (comp time)',
    typeUnpaid: 'बिना वेतन छुट्टी (FMLA)',
    typeWfh: 'घर से काम',
    compOffNote:
      'निजी नियोक्ताओं को ग़ैर-छूट वाले कर्मचारियों को ओवरटाइम का भुगतान करना होता है; उसे बदले के समय से नहीं बदला जा सकता।',
    leaveLawNote:
      'संघीय स्तर पर सवेतन छुट्टी नहीं है; PTO कंपनी की नीति है। कई राज्य सवेतन बीमारी का समय अनिवार्य करते हैं (कैलिफ़ोर्निया: कम से कम 40 घंटे या 5 दिन)। 50+ कर्मचारियों वाले नियोक्ताओं पर FMLA 12 हफ़्ते तक बिना वेतन छुट्टी देता है।',
    complaintEntry: 'उत्पीड़न की शिकायत करें',
    complaintEntrySub: 'यौन उत्पीड़न या भेदभाव। इसे केवल शिकायतें लेने के लिए नामित लोग देखते हैं।',
    complaintTitle: 'गोपनीय शिकायत',
    complaintBody:
      'यह केवल उन लोगों तक जाती है जिन्हें आपके नियोक्ता ने उत्पीड़न की शिकायतें लेने के लिए नामित किया है, आपके मैनेजर या मालिक तक नहीं। आप लोगों को बाहर रख सकते हैं। शिकायत करने पर बदला लेना ग़ैरक़ानूनी है।',
    committeeLabel: 'उत्पीड़न शिकायत संपर्क',
    presiding: 'मुख्य',
    noCommittee:
      'आपके नियोक्ता ने अभी किसी को नामित नहीं किया है। आप फिर भी भेज सकते हैं, और मालिक को बताया जाएगा कि शिकायत का रास्ता अपेक्षित है। आप EEOC या अपने राज्य की एजेंसी में भी शिकायत दर्ज कर सकते हैं।',
    excludeLabel: 'संपर्क जो इसे न देखें',
    lawNote:
      'EEOC में शिकायत आम तौर पर घटना के 180 दिनों के भीतर करनी होती है (कई राज्यों में 300 दिन)। कैलिफ़ोर्निया और न्यूयॉर्क अपनी राज्य एजेंसियों में 3 साल देते हैं।',
    committeeInbox: 'मिली शिकायतें',
    handlerSelf: 'मैं उत्पीड़न की शिकायतें लेता/लेती हूँ',
    handlerMember: 'उत्पीड़न की शिकायतें लेते हैं',
    handlerSectionBody:
      'Title VII के दायरे वाले नियोक्ताओं (15+ कर्मचारी) को उत्पीड़न की शिकायत का साफ़ तरीक़ा देना चाहिए। कैलिफ़ोर्निया (5+) और न्यूयॉर्क (सभी नियोक्ता) लिखित नीति और प्रशिक्षण अनिवार्य करते हैं।',
    flagNoHandler: 'कोई उत्पीड़न शिकायत संपर्क नहीं',
    serviceFromLabel: 'नियुक्ति की तारीख़',
    overtimeRule:
      'ग़ैर-छूट वाले कर्मचारियों को कार्य-सप्ताह में 40 घंटे के बाद सामान्य दर का 1.5×। कैलिफ़ोर्निया में दिन में 8 घंटे के बाद भी, और 12 के बाद 2×।',
    ded_federal_income_tax: 'संघीय आयकर',
    ded_social_security: 'सोशल सिक्योरिटी',
    ded_medicare: 'मेडिकेयर',
    ded_state_income_tax: 'राज्य आयकर',
    ded_retirement_401k: '401(k) सेवानिवृत्ति बचत',
    ded_health_insurance: 'स्वास्थ्य बीमा',
    ext_eeoc: 'अमेरिकी समान रोज़गार अवसर आयोग (EEOC)',
    ext_crd: 'कैलिफ़ोर्निया नागरिक अधिकार विभाग',
    ext_nydhr: 'न्यूयॉर्क राज्य मानवाधिकार प्रभाग',
    limit_usWeek: 'यह कार्य-सप्ताह (40 घं के बाद ओवरटाइम)',
    limit_caDay: 'आज (8 घं के बाद ओवरटाइम)',
    studentRule:
      'F-1 छात्र: सत्र के दौरान कैंपस पर हफ़्ते में 20 घंटे तक, छुट्टियों में पूरे समय; कैंपस के बाहर काम के लिए CPT या OPT चाहिए। 16 से कम: स्कूल के दिन 3 घंटे, स्कूल वाले हफ़्ते में 18, सुबह 7 से शाम 7 (FLSA)। कई राज्य अपने नियम जोड़ते हैं।',
  },
  es: {
    recordBroken:
      'Este registro no coincide. Muestre esta pantalla a la División de Salarios y Horas del Departamento de Trabajo, al departamento de trabajo de su estado o a su sindicato.',
    leaveBody:
      'Pida PTO, tiempo por enfermedad o un día de teletrabajo. Cada decisión queda sellada en su registro.',
    balanceCasual: 'Personal',
    balanceSick: 'Enfermedad',
    balanceEarned: 'PTO',
    balanceCompOff: 'Tiempo compensatorio',
    typeCasual: 'Día personal',
    typeSick: 'Tiempo pagado por enfermedad',
    typeEarned: 'Tiempo libre pagado (PTO)',
    typeCompOff: 'Tiempo compensatorio (comp time)',
    typeUnpaid: 'Permiso sin sueldo (FMLA)',
    typeWfh: 'Teletrabajo',
    compOffNote:
      'Los empleadores privados deben pagar las horas extra a los empleados no exentos; no se pueden cambiar por tiempo compensatorio.',
    leaveLawNote:
      'No hay vacaciones pagadas a nivel federal; el PTO es política de la empresa. Muchos estados exigen tiempo pagado por enfermedad (California: al menos 40 horas o 5 días). La FMLA da hasta 12 semanas sin sueldo en empresas con 50 o más empleados.',
    complaintEntry: 'Denunciar acoso',
    complaintEntrySub:
      'Acoso sexual o discriminación. Solo las personas designadas para recibir denuncias la ven.',
    complaintTitle: 'Denuncia confidencial',
    complaintBody:
      'Esto llega solo a las personas que su empleador designó para recibir denuncias de acoso, no a su jefe ni al dueño. Puede excluir personas. Las represalias por denunciar son ilegales.',
    committeeLabel: 'Contactos para denuncias de acoso',
    presiding: 'responsable',
    noCommittee:
      'Su empleador aún no ha designado a nadie. Puede enviarla igualmente, y se informará al dueño de que se espera una vía de denuncia. También puede presentar un cargo ante la EEOC o la agencia de su estado.',
    excludeLabel: 'Contactos que no deben ver esto',
    lawNote:
      'El cargo ante la EEOC suele presentarse dentro de los 180 días del incidente (300 días en muchos estados). California y Nueva York permiten 3 años ante sus agencias estatales.',
    committeeInbox: 'Denuncias recibidas',
    handlerSelf: 'Recibo denuncias de acoso',
    handlerMember: 'Recibe denuncias de acoso',
    handlerSectionBody:
      'Los empleadores sujetos al Título VII (15 o más empleados) deben ofrecer una vía clara para denunciar el acoso. California (5 o más) y Nueva York (todos) exigen una política escrita y formación.',
    flagNoHandler: 'Sin contactos para denuncias de acoso',
    serviceFromLabel: 'Fecha de contratación',
    overtimeRule:
      'Los empleados no exentos cobran 1,5 veces su tarifa normal después de 40 horas en la semana laboral. En California también después de 8 horas al día, y el doble después de 12.',
    ded_federal_income_tax: 'Impuesto federal sobre la renta',
    ded_social_security: 'Seguro Social',
    ded_medicare: 'Medicare',
    ded_state_income_tax: 'Impuesto estatal sobre la renta',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: 'Seguro médico',
    ext_eeoc: 'Comisión de Igualdad de Oportunidades en el Empleo (EEOC)',
    ext_crd: 'Departamento de Derechos Civiles de California',
    ext_nydhr: 'División de Derechos Humanos del Estado de Nueva York',
    limit_usWeek: 'Esta semana laboral (horas extra después de 40 h)',
    limit_caDay: 'Hoy (horas extra después de 8 h)',
    studentRule:
      'Estudiantes F-1: trabajo en el campus hasta 20 horas semanales durante el curso, jornada completa en vacaciones; fuera del campus hace falta CPT u OPT. Menores de 16: 3 horas en día lectivo, 18 en semana lectiva, de 7 a. m. a 7 p. m. (FLSA). Muchos estados añaden sus propias normas.',
  },
  fr: {
    recordBroken:
      'Cet enregistrement ne correspond pas. Montrez cet écran à la division Salaires et horaires du ministère du Travail, au service du travail de votre État ou à votre syndicat.',
    leaveBody:
      'Demandez des PTO, des congés maladie ou une journée de télétravail. Chaque décision est scellée dans votre dossier.',
    balanceCasual: 'Personnel',
    balanceSick: 'Maladie',
    balanceEarned: 'PTO',
    balanceCompOff: 'Repos compensateur',
    typeCasual: 'Jour personnel',
    typeSick: 'Congé maladie payé',
    typeEarned: 'Congés payés (PTO)',
    typeCompOff: 'Repos compensateur (comp time)',
    typeUnpaid: 'Congé sans solde (FMLA)',
    typeWfh: 'Télétravail',
    compOffNote:
      'Les employeurs privés doivent payer les heures supplémentaires des salariés non exemptés ; elles ne peuvent pas être converties en repos.',
    leaveLawNote:
      'Pas de congés payés au niveau fédéral ; les PTO relèvent de la politique de l’entreprise. Beaucoup d’États imposent des congés maladie payés (Californie : au moins 40 heures ou 5 jours). La FMLA donne jusqu’à 12 semaines non payées dans les entreprises de 50 salariés ou plus.',
    complaintEntry: 'Signaler un harcèlement',
    complaintEntrySub:
      'Harcèlement sexuel ou discrimination. Seules les personnes désignées le voient.',
    complaintTitle: 'Signalement confidentiel',
    complaintBody:
      'Il n’est transmis qu’aux personnes désignées par votre employeur pour recevoir les signalements, ni à votre responsable ni au propriétaire. Vous pouvez en exclure. Les représailles sont illégales.',
    committeeLabel: 'Contacts pour le harcèlement',
    presiding: 'responsable',
    noCommittee:
      'Votre employeur n’a encore désigné personne. Vous pouvez quand même l’envoyer, et le propriétaire sera informé qu’une procédure de signalement est attendue. Vous pouvez aussi saisir l’EEOC ou l’agence de votre État.',
    excludeLabel: 'Contacts qui ne doivent pas voir ceci',
    lawNote:
      'Une plainte auprès de l’EEOC doit en général être déposée dans les 180 jours (300 jours dans de nombreux États). La Californie et New York accordent 3 ans auprès de leurs agences.',
    committeeInbox: 'Signalements reçus',
    handlerSelf: 'Je reçois les signalements de harcèlement',
    handlerMember: 'Reçoit les signalements de harcèlement',
    handlerSectionBody:
      'Les employeurs soumis au Titre VII (15 salariés ou plus) doivent offrir un moyen clair de signaler le harcèlement. La Californie (5 ou plus) et New York (tous) exigent une politique écrite et une formation.',
    flagNoHandler: 'Aucun contact pour le harcèlement',
    serviceFromLabel: 'Date d’embauche',
    overtimeRule:
      'Les salariés non exemptés touchent 1,5 fois leur taux normal au-delà de 40 heures dans la semaine. En Californie aussi au-delà de 8 heures par jour, et le double au-delà de 12.',
    ded_federal_income_tax: 'Impôt fédéral sur le revenu',
    ded_social_security: 'Sécurité sociale',
    ded_medicare: 'Medicare',
    ded_state_income_tax: 'Impôt d’État sur le revenu',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: 'Assurance santé',
    ext_eeoc: 'Commission pour l’égalité des chances dans l’emploi (EEOC)',
    ext_crd: 'Département des droits civiques de Californie',
    ext_nydhr: 'Division des droits humains de l’État de New York',
    limit_usWeek: 'Cette semaine (heures sup. après 40 h)',
    limit_caDay: 'Aujourd’hui (heures sup. après 8 h)',
    studentRule:
      'Étudiants F-1 : travail sur le campus jusqu’à 20 heures par semaine pendant l’année, temps plein pendant les vacances ; hors campus, il faut le CPT ou l’OPT. Moins de 16 ans : 3 heures un jour d’école, 18 une semaine d’école, de 7 h à 19 h (FLSA). Beaucoup d’États ajoutent leurs règles.',
  },
  de: {
    recordBroken:
      'Dieser Eintrag stimmt nicht. Zeigen Sie diesen Bildschirm der Lohn- und Arbeitszeitabteilung des Arbeitsministeriums, der Arbeitsbehörde Ihres Bundesstaats oder Ihrer Gewerkschaft.',
    leaveBody:
      'Beantragen Sie PTO, Krankheitszeit oder einen Tag im Homeoffice. Jede Entscheidung wird in Ihrem Nachweis versiegelt.',
    balanceCasual: 'Persönlich',
    balanceSick: 'Krankheit',
    balanceEarned: 'PTO',
    balanceCompOff: 'Zeitausgleich',
    typeCasual: 'Persönlicher Tag',
    typeSick: 'Bezahlte Krankheitszeit',
    typeEarned: 'Bezahlte Freizeit (PTO)',
    typeCompOff: 'Zeitausgleich (comp time)',
    typeUnpaid: 'Unbezahlter Urlaub (FMLA)',
    typeWfh: 'Homeoffice',
    compOffNote:
      'Private Arbeitgeber müssen nicht freigestellten Beschäftigten Überstunden bezahlen; sie dürfen nicht durch Zeitausgleich ersetzt werden.',
    leaveLawNote:
      'Auf Bundesebene gibt es keinen bezahlten Urlaub; PTO ist Firmenpolitik. Viele Bundesstaaten schreiben bezahlte Krankheitszeit vor (Kalifornien: mindestens 40 Stunden oder 5 Tage). Das FMLA gibt bis zu 12 Wochen unbezahlt bei Arbeitgebern mit 50+ Beschäftigten.',
    complaintEntry: 'Belästigung melden',
    complaintEntrySub:
      'Sexuelle Belästigung oder Diskriminierung. Nur die benannten Personen sehen es.',
    complaintTitle: 'Vertrauliche Meldung',
    complaintBody:
      'Dies geht nur an die Personen, die Ihr Arbeitgeber für Meldungen über Belästigung benannt hat, nicht an Ihre Vorgesetzten oder den Inhaber. Sie können Personen ausschließen. Vergeltung ist rechtswidrig.',
    committeeLabel: 'Ansprechpersonen für Belästigung',
    presiding: 'Leitung',
    noCommittee:
      'Ihr Arbeitgeber hat noch niemanden benannt. Sie können es trotzdem senden, und der Inhaber erfährt, dass ein Meldeweg erwartet wird. Sie können sich auch an die EEOC oder die Behörde Ihres Bundesstaats wenden.',
    excludeLabel: 'Ansprechpersonen, die dies nicht sehen dürfen',
    lawNote:
      'Eine Beschwerde bei der EEOC ist in der Regel binnen 180 Tagen fällig (in vielen Staaten 300 Tage). Kalifornien und New York erlauben 3 Jahre bei ihren eigenen Behörden.',
    committeeInbox: 'Eingegangene Meldungen',
    handlerSelf: 'Ich nehme Meldungen über Belästigung entgegen',
    handlerMember: 'Nimmt Meldungen entgegen',
    handlerSectionBody:
      'Arbeitgeber unter Title VII (15+ Beschäftigte) sollten einen klaren Meldeweg bieten. Kalifornien (5+) und New York (alle Arbeitgeber) verlangen eine schriftliche Richtlinie und Schulungen.',
    flagNoHandler: 'Keine Ansprechpersonen für Belästigung',
    serviceFromLabel: 'Einstellungsdatum',
    overtimeRule:
      'Nicht freigestellte Beschäftigte erhalten das 1,5-Fache ihres Stundensatzes nach 40 Stunden in der Arbeitswoche. In Kalifornien auch nach 8 Stunden am Tag, und das Doppelte nach 12.',
    ded_federal_income_tax: 'Bundeseinkommensteuer',
    ded_social_security: 'Social Security',
    ded_medicare: 'Medicare',
    ded_state_income_tax: 'Einkommensteuer des Bundesstaats',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: 'Krankenversicherung',
    ext_eeoc: 'Kommission für Chancengleichheit im Beruf (EEOC)',
    ext_crd: 'Bürgerrechtsbehörde Kalifornien',
    ext_nydhr: 'Menschenrechtsabteilung des Staates New York',
    limit_usWeek: 'Diese Arbeitswoche (Überstunden nach 40 h)',
    limit_caDay: 'Heute (Überstunden nach 8 h)',
    studentRule:
      'F-1-Studierende: auf dem Campus bis zu 20 Stunden pro Woche im Semester, in den Ferien Vollzeit; außerhalb des Campus nur mit CPT oder OPT. Unter 16: 3 Stunden an Schultagen, 18 in Schulwochen, 7–19 Uhr (FLSA). Viele Bundesstaaten haben eigene Regeln.',
  },
  pt: {
    recordBroken:
      'Este registo não confere. Mostre este ecrã à Divisão de Salários e Horas do Departamento do Trabalho, ao departamento do trabalho do seu estado ou ao seu sindicato.',
    leaveBody:
      'Peça PTO, tempo por doença ou um dia de teletrabalho. Cada decisão fica selada no seu registo.',
    balanceCasual: 'Pessoal',
    balanceSick: 'Doença',
    balanceEarned: 'PTO',
    balanceCompOff: 'Tempo compensatório',
    typeCasual: 'Dia pessoal',
    typeSick: 'Tempo pago por doença',
    typeEarned: 'Folgas pagas (PTO)',
    typeCompOff: 'Tempo compensatório (comp time)',
    typeUnpaid: 'Licença sem vencimento (FMLA)',
    typeWfh: 'Teletrabalho',
    compOffNote:
      'Os empregadores privados têm de pagar horas extra aos trabalhadores não isentos; não podem ser trocadas por tempo compensatório.',
    leaveLawNote:
      'Não há férias pagas a nível federal; o PTO é política da empresa. Muitos estados exigem tempo pago por doença (Califórnia: pelo menos 40 horas ou 5 dias). A FMLA dá até 12 semanas sem vencimento em empresas com 50 ou mais trabalhadores.',
    complaintEntry: 'Denunciar assédio',
    complaintEntrySub:
      'Assédio sexual ou discriminação. Só as pessoas designadas para receber denúncias a veem.',
    complaintTitle: 'Denúncia confidencial',
    complaintBody:
      'Isto vai apenas para as pessoas que o seu empregador designou para receber denúncias de assédio, não para a sua chefia nem para o dono. Pode excluir pessoas. Retaliar por denunciar é ilegal.',
    committeeLabel: 'Contactos para denúncias de assédio',
    presiding: 'responsável',
    noCommittee:
      'O seu empregador ainda não designou ninguém. Pode enviar na mesma, e o dono será informado de que se espera um canal de denúncia. Também pode apresentar queixa à EEOC ou à agência do seu estado.',
    excludeLabel: 'Contactos que não devem ver isto',
    lawNote:
      'A queixa à EEOC deve, em geral, ser apresentada em 180 dias (300 dias em muitos estados). A Califórnia e Nova Iorque permitem 3 anos junto das suas agências estaduais.',
    committeeInbox: 'Denúncias recebidas',
    handlerSelf: 'Recebo denúncias de assédio',
    handlerMember: 'Recebe denúncias de assédio',
    handlerSectionBody:
      'Os empregadores abrangidos pelo Título VII (15 ou mais trabalhadores) devem oferecer uma forma clara de denunciar o assédio. A Califórnia (5 ou mais) e Nova Iorque (todos) exigem política escrita e formação.',
    flagNoHandler: 'Sem contactos para denúncias de assédio',
    serviceFromLabel: 'Data de contratação',
    overtimeRule:
      'Os trabalhadores não isentos recebem 1,5 vezes o valor normal após 40 horas na semana de trabalho. Na Califórnia também após 8 horas por dia, e o dobro após 12.',
    ded_federal_income_tax: 'Imposto federal sobre o rendimento',
    ded_social_security: 'Segurança Social',
    ded_medicare: 'Medicare',
    ded_state_income_tax: 'Imposto estadual sobre o rendimento',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: 'Seguro de saúde',
    ext_eeoc: 'Comissão para a Igualdade de Oportunidades no Emprego (EEOC)',
    ext_crd: 'Departamento de Direitos Civis da Califórnia',
    ext_nydhr: 'Divisão de Direitos Humanos do Estado de Nova Iorque',
    limit_usWeek: 'Esta semana de trabalho (horas extra após 40 h)',
    limit_caDay: 'Hoje (horas extra após 8 h)',
    studentRule:
      'Estudantes F-1: trabalho no campus até 20 horas por semana durante as aulas, tempo inteiro nas férias; fora do campus é preciso CPT ou OPT. Menores de 16: 3 horas em dia de escola, 18 em semana de escola, das 7h às 19h (FLSA). Muitos estados juntam regras próprias.',
  },
  ja: {
    recordBroken:
      'この記録は一致しません。この画面を労働省の賃金時間部、州の労働局、または労働組合に見せてください。',
    leaveBody:
      'PTO、病気休暇、在宅勤務を申請できます。承認・却下はすべてあなたの記録に封印されます。',
    balanceCasual: '私用',
    balanceSick: '病気休暇',
    balanceEarned: 'PTO',
    balanceCompOff: '代休',
    typeCasual: '私用休暇',
    typeSick: '有給の病気休暇',
    typeEarned: '有給休暇(PTO)',
    typeCompOff: '代休(comp time)',
    typeUnpaid: '無給休暇(FMLA)',
    typeWfh: '在宅勤務',
    compOffNote:
      '民間の雇用主は適用対象の従業員に残業代を払わなければならず、代休と交換することはできません。',
    leaveLawNote:
      '連邦法上の有給休暇はなく、PTOは会社の方針です。多くの州は有給の病気休暇を義務づけています(カリフォルニア州:40時間または5日以上)。従業員50人以上の職場では、FMLAで最大12週間の無給休暇が取れます。',
    complaintEntry: 'ハラスメントを報告する',
    complaintEntrySub: 'セクハラや差別。報告の受付担当として指名された人だけが見られます。',
    complaintTitle: '秘密の報告',
    complaintBody:
      '雇用主がハラスメント報告の受付担当として指名した人にだけ届き、上司やオーナーには届きません。除外する人を選べます。報告を理由とする報復は違法です。',
    committeeLabel: 'ハラスメント報告の担当者',
    presiding: '主担当',
    noCommittee:
      '雇用主はまだ担当者を指名していません。このまま送ることができ、報告窓口が求められることがオーナーに伝わります。EEOCや州の機関に申し立てることもできます。',
    excludeLabel: 'この報告を見せない担当者',
    lawNote:
      'EEOCへの申し立ては通常、出来事から180日以内(多くの州では300日)です。カリフォルニア州とニューヨーク州は、州の機関への申し立てに3年を認めています。',
    committeeInbox: '受け付けた報告',
    handlerSelf: '私はハラスメント報告を受け付けます',
    handlerMember: 'ハラスメント報告の受付担当',
    handlerSectionBody:
      '公民権法第7編の対象となる雇用主(15人以上)は、ハラスメントを報告する明確な方法を用意すべきです。カリフォルニア州(5人以上)とニューヨーク州(全雇用主)は書面の方針と研修を義務づけています。',
    flagNoHandler: 'ハラスメント報告の担当者なし',
    serviceFromLabel: '入社日',
    overtimeRule:
      '適用対象の従業員は、週40時間を超えると通常賃金の1.5倍。カリフォルニア州では1日8時間を超えても1.5倍、12時間を超えると2倍。',
    ded_federal_income_tax: '連邦所得税',
    ded_social_security: '社会保障税',
    ded_medicare: 'メディケア',
    ded_state_income_tax: '州所得税',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: '医療保険',
    ext_eeoc: '米国雇用機会均等委員会(EEOC)',
    ext_crd: 'カリフォルニア州公民権局',
    ext_nydhr: 'ニューヨーク州人権局',
    limit_usWeek: '今週(40時間を超えると残業)',
    limit_caDay: '今日(8時間を超えると残業)',
    studentRule:
      'F-1学生:授業期間中は学内で週20時間まで、休暇中はフルタイム。学外での就労にはCPTかOPTが必要です。16歳未満:登校日は3時間、登校週は18時間、午前7時〜午後7時(公正労働基準法)。州ごとの規則もあります。',
  },
  zh: {
    recordBroken: '此记录不一致。请把这个页面给劳工部工资工时司、你所在州的劳工部门或你的工会看。',
    leaveBody: '申请带薪休假(PTO)、病假或居家办公。每项决定都会封存在你的记录里。',
    balanceCasual: '个人假',
    balanceSick: '病假',
    balanceEarned: 'PTO',
    balanceCompOff: '补休',
    typeCasual: '个人假日',
    typeSick: '带薪病假',
    typeEarned: '带薪休假(PTO)',
    typeCompOff: '补休(comp time)',
    typeUnpaid: '无薪假(FMLA)',
    typeWfh: '居家办公',
    compOffNote: '私营雇主必须向非豁免员工支付加班费,不能以补休代替。',
    leaveLawNote:
      '联邦层面没有带薪年假,PTO属于公司政策。许多州要求提供带薪病假(加州:至少40小时或5天)。员工50人以上的雇主须依FMLA提供最多12周无薪假。',
    complaintEntry: '举报骚扰',
    complaintEntrySub: '性骚扰或歧视。只有被指定受理举报的人能看到。',
    complaintTitle: '保密举报',
    complaintBody:
      '只送达雇主指定受理骚扰举报的人员,不会送到你的经理或老板。你可以排除某些人。因举报而报复是违法的。',
    committeeLabel: '骚扰举报联络人',
    presiding: '负责人',
    noCommittee:
      '你的雇主尚未指定任何人。你仍然可以发送,老板会被告知应当设立举报途径。你也可以向EEOC或所在州的机构投诉。',
    excludeLabel: '不允许查看的联络人',
    lawNote:
      '向EEOC投诉通常须在事发后180天内提出(许多州为300天)。加州和纽约州允许在3年内向州机构投诉。',
    committeeInbox: '收到的举报',
    handlerSelf: '我负责受理骚扰举报',
    handlerMember: '受理骚扰举报',
    handlerSectionBody:
      '受《民权法》第七章约束的雇主(15人以上)应提供清晰的骚扰举报途径。加州(5人以上)和纽约州(所有雇主)要求书面政策和培训。',
    flagNoHandler: '无骚扰举报联络人',
    serviceFromLabel: '入职日期',
    overtimeRule:
      '非豁免员工每周工作超过40小时,按正常工资的1.5倍支付。加州每天超过8小时也按1.5倍,超过12小时按2倍。',
    ded_federal_income_tax: '联邦所得税',
    ded_social_security: '社会保障税',
    ded_medicare: '联邦医疗保险(Medicare)',
    ded_state_income_tax: '州所得税',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: '医疗保险',
    ext_eeoc: '美国平等就业机会委员会(EEOC)',
    ext_crd: '加州民权部',
    ext_nydhr: '纽约州人权司',
    limit_usWeek: '本工作周(超过40小时为加班)',
    limit_caDay: '今天(超过8小时为加班)',
    studentRule:
      'F-1学生:学期内校内工作每周最多20小时,假期可全职;校外工作须有CPT或OPT。未满16岁:上学日最多3小时、上学周最多18小时,早7点至晚7点(《公平劳动标准法》)。许多州另有规定。',
  },
  ko: {
    recordBroken:
      '이 기록은 일치하지 않습니다. 이 화면을 노동부 임금·근로시간국, 주 노동부나 노동조합에 보여 주세요.',
    leaveBody: 'PTO, 병가나 재택근무를 신청하세요. 모든 결정은 기록에 봉인됩니다.',
    balanceCasual: '개인',
    balanceSick: '병가',
    balanceEarned: 'PTO',
    balanceCompOff: '보상휴가',
    typeCasual: '개인 휴무일',
    typeSick: '유급 병가',
    typeEarned: '유급휴가(PTO)',
    typeCompOff: '보상휴가(comp time)',
    typeUnpaid: '무급 휴가(FMLA)',
    typeWfh: '재택근무',
    compOffNote:
      '민간 사용자는 비면제 근로자에게 초과근무 수당을 지급해야 하며, 보상휴가로 바꿀 수 없습니다.',
    leaveLawNote:
      '연방 차원의 유급휴가는 없으며 PTO는 회사 정책입니다. 많은 주가 유급 병가를 의무화합니다(캘리포니아: 최소 40시간 또는 5일). 근로자 50명 이상인 사용자는 FMLA에 따라 최대 12주의 무급휴가를 줘야 합니다.',
    complaintEntry: '괴롭힘 신고',
    complaintEntrySub: '성희롱이나 차별. 신고를 받도록 지정된 사람만 볼 수 있습니다.',
    complaintTitle: '비공개 신고',
    complaintBody:
      '사용자가 괴롭힘 신고를 받도록 지정한 사람에게만 전달되며 상사나 사업주에게는 가지 않습니다. 제외할 사람을 고를 수 있습니다. 신고에 대한 보복은 불법입니다.',
    committeeLabel: '괴롭힘 신고 담당자',
    presiding: '책임자',
    noCommittee:
      '사용자가 아직 아무도 지정하지 않았습니다. 그래도 보낼 수 있으며, 신고 경로가 필요하다는 사실이 사업주에게 전달됩니다. EEOC나 주 기관에 진정할 수도 있습니다.',
    excludeLabel: '이 신고를 보지 못하게 할 담당자',
    lawNote:
      'EEOC 진정은 보통 사건 후 180일 안에 해야 합니다(많은 주에서는 300일). 캘리포니아와 뉴욕은 주 기관에 3년까지 허용합니다.',
    committeeInbox: '받은 신고',
    handlerSelf: '저는 괴롭힘 신고를 받습니다',
    handlerMember: '괴롭힘 신고 담당',
    handlerSectionBody:
      '민권법 제7편 적용 사용자(15명 이상)는 괴롭힘을 신고할 분명한 방법을 제공해야 합니다. 캘리포니아(5명 이상)와 뉴욕(모든 사용자)은 서면 정책과 교육을 의무화합니다.',
    flagNoHandler: '괴롭힘 신고 담당자 없음',
    serviceFromLabel: '입사일',
    overtimeRule:
      '비면제 근로자는 주 40시간을 넘으면 통상 임금의 1.5배를 받습니다. 캘리포니아에서는 하루 8시간을 넘어도 1.5배, 12시간을 넘으면 2배입니다.',
    ded_federal_income_tax: '연방 소득세',
    ded_social_security: '사회보장세',
    ded_medicare: '메디케어',
    ded_state_income_tax: '주 소득세',
    ded_retirement_401k: '401(k)',
    ded_health_insurance: '건강보험',
    ext_eeoc: '미국 고용기회균등위원회(EEOC)',
    ext_crd: '캘리포니아 민권국',
    ext_nydhr: '뉴욕주 인권국',
    limit_usWeek: '이번 근로 주(40시간 초과 시 초과근무)',
    limit_caDay: '오늘(8시간 초과 시 초과근무)',
    studentRule:
      'F-1 학생: 학기 중 교내 근무 주 20시간까지, 방학에는 전일 근무 가능. 교외 근무는 CPT나 OPT가 필요합니다. 16세 미만: 등교일 3시간, 등교 주간 18시간, 오전 7시~오후 7시(공정근로기준법). 많은 주가 별도 규칙을 둡니다.',
  },
};
