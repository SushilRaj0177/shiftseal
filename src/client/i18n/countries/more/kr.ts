import type { CountryLanguages } from '../../country.js';

/** South Korea's legal wording for readers of other languages. */
export const KR_MORE: CountryLanguages = {
  ta: {
    recordBroken:
      'இந்தப் பதிவு பொருந்தவில்லை. இந்தத் திரையை மண்டல தொழிலாளர் அலுவலகத்தின் தொழிலாளர் ஆய்வாளரிடம் அல்லது உங்கள் சங்கத்திடம் காட்டுங்கள்.',
    leaveBody:
      'விடுப்பு அல்லது வீட்டிலிருந்து வேலை கேளுங்கள். ஒவ்வொரு முடிவும் உங்கள் பதிவில் முத்திரையிடப்படும்.',
    balanceCasual: 'குடும்ப நிகழ்வு விடுப்பு',
    balanceSick: 'நோய் விடுப்பு',
    balanceEarned: 'ஆண்டு விடுப்பு',
    balanceCompOff: 'ஈடு விடுப்பு',
    typeCasual: 'குடும்ப நிகழ்வு விடுப்பு',
    typeSick: 'நோய் விடுப்பு',
    typeEarned: 'ஆண்டு ஊதிய விடுப்பு (yeoncha)',
    typeCompOff: 'ஈடு விடுப்பு',
    typeUnpaid: 'ஊதியமில்லா விடுப்பு',
    typeWfh: 'வீட்டிலிருந்து வேலை',
    compOffNote:
      'அனுமதிக்கப்பட்ட கூடுதல் நேரம் கூடுதல் ஊதியத்துக்குப் பதிலாக ஈடு விடுப்பாக மாறும் (ஊழியர் பிரதிநிதியுடன் எழுத்துபூர்வ ஒப்பந்தத்துடன்).',
    leaveLawNote:
      'முதல் ஆண்டில் ஒவ்வொரு முழு மாதத்துக்கும் ஒரு நாள்; 80% வருகையுடன் ஒரு ஆண்டுக்குப் பிறகு 15 நாட்கள், மூன்றாம் ஆண்டு முதல் ஒவ்வொரு 2 ஆண்டுக்கும் 1 கூடுதல், 25 வரை (தொழிலாளர் தரச் சட்டம், பிரிவு 60).',
    complaintEntry: 'துன்புறுத்தலைப் புகாரளிக்கவும்',
    complaintEntrySub:
      'பணியிட அல்லது பாலியல் துன்புறுத்தல். நியமிக்கப்பட்ட பணியாளர்கள் மட்டுமே பார்ப்பார்கள்.',
    complaintTitle: 'ரகசியப் புகார்',
    complaintBody:
      'இது உங்கள் பணியிடத்தின் நியமிக்கப்பட்ட பணியாளர்களுக்கு மட்டுமே செல்லும், உங்கள் மேலாளருக்கோ உரிமையாளருக்கோ அல்ல. பார்க்கக்கூடாதவர்களைத் தேர்ந்தெடுக்கலாம். புகாரளித்ததற்காகப் பாதகமாக நடத்துவது சட்டப்படி தடை.',
    committeeLabel: 'துன்புறுத்தல் புகார் பணியாளர்கள்',
    presiding: 'பொறுப்பாளர்',
    noCommittee:
      'உங்கள் பணியிடம் புகார்களைப் பெற இன்னும் யாரையும் நியமிக்கவில்லை. இதை அனுப்பலாம்; ஒருவர் தேவை என்று உரிமையாளருக்குத் தெரிவிக்கப்படும். வேலைவாய்ப்பு மற்றும் தொழிலாளர் அமைச்சகத்திடம் மனுவும் தாக்கல் செய்யலாம்.',
    excludeLabel: 'இதைப் பார்க்கக்கூடாத பணியாளர்கள்',
    lawNote:
      'புகார் வந்தால், முதலாளி தாமதமின்றி நடுநிலையாக விசாரித்து பாதிக்கப்பட்டவரைப் பாதுகாக்க வேண்டும் (தொழிலாளர் தரச் சட்டம், பிரிவு 76-3).',
    committeeInbox: 'புகார் இன்பாக்ஸ்',
    handlerSelf: 'நான் துன்புறுத்தல் புகார்களைப் பெறுகிறேன்',
    handlerMember: 'துன்புறுத்தல் புகார்களைப் பெறுபவர்',
    handlerSectionBody:
      '5 அல்லது அதற்கு மேற்பட்ட ஊழியர்கள் உள்ள பணியிடங்கள் துன்புறுத்தல் புகார்களைத் தாமதமின்றி விசாரித்து, தடுப்பு மற்றும் நடவடிக்கைகளை வேலை விதிகளில் குறிப்பிட வேண்டும்.',
    flagNoHandler: 'துன்புறுத்தல் புகார்களைப் பெற யாரும் இல்லை',
    serviceFromLabel: 'பணியில் சேர்ந்த தேதி',
    overtimeRule:
      'நாளுக்கு 8 மணி அல்லது வாரத்துக்கு 40 மணிக்கு மேல் கூடுதல் நேரம் (+50%), வாரத்துக்கு 52 மணி வரை. 22:00–6:00 இரவு வேலைக்கு 50% கூடுதல்.',
    ded_national_pension: 'தேசிய ஓய்வூதியம்',
    ded_health_insurance: 'சுகாதாரக் காப்பீடு',
    ded_long_term_care: 'நீண்டகாலப் பராமரிப்புக் காப்பீடு',
    ded_employment_insurance: 'வேலைவாய்ப்புக் காப்பீடு',
    ded_income_tax: 'வருமான வரி',
    ded_local_income_tax: 'உள்ளூர் வருமான வரி',
    ext_moel: 'வேலைவாய்ப்பு மற்றும் தொழிலாளர் அமைச்சகம் (மனு)',
    limit_krWeek: 'இந்த வார நேரம் (52 மணி வரம்பு)',
    studentRule:
      'வெளிநாட்டு மாணவர்கள் (D-2): TOPIK 3 (3–4ஆம் ஆண்டு: TOPIK 4) இருந்தால் வார நாட்களில் 25 மணி, இல்லையெனில் 10; முதுநிலை மாணவர்கள் 30; வார இறுதி, விடுமுறையில் வரம்பு இல்லை. முதலில் பகுதிநேர வேலை அனுமதி தேவை. 18 வயதுக்குட்பட்டோர்: நாளுக்கு 7 மணி, வாரத்துக்கு 35; இரவு, விடுமுறை வேலைக்கு ஒப்புதலும் அனுமதியும் தேவை (தொழிலாளர் தரச் சட்டம், பிரிவுகள் 69–70).',
  },
  hi: {
    recordBroken:
      'यह रिकॉर्ड मेल नहीं खाता। यह स्क्रीन क्षेत्रीय श्रम कार्यालय के श्रम निरीक्षक या अपनी यूनियन को दिखाएँ।',
    leaveBody: 'छुट्टी या घर से काम का दिन माँगें। हर फ़ैसला आपके रिकॉर्ड में सील हो जाता है।',
    balanceCasual: 'पारिवारिक अवसर की छुट्टी',
    balanceSick: 'बीमारी की छुट्टी',
    balanceEarned: 'वार्षिक छुट्टी',
    balanceCompOff: 'प्रतिपूरक छुट्टी',
    typeCasual: 'पारिवारिक अवसर की छुट्टी',
    typeSick: 'बीमारी की छुट्टी',
    typeEarned: 'वार्षिक सवेतन छुट्टी (yeoncha)',
    typeCompOff: 'प्रतिपूरक छुट्टी',
    typeUnpaid: 'बिना वेतन छुट्टी',
    typeWfh: 'घर से काम',
    compOffNote:
      'मंज़ूर अतिरिक्त घंटे प्रीमियम वेतन की जगह प्रतिपूरक छुट्टी बनते हैं (कर्मचारी प्रतिनिधि से लिखित समझौते के साथ)।',
    leaveLawNote:
      'पहले साल हर पूरे महीने पर एक दिन; 80% उपस्थिति के साथ एक साल बाद 15 दिन, तीसरे साल से हर 2 साल पर 1 और, अधिकतम 25 (श्रम मानक अधिनियम, अनुच्छेद 60)।',
    complaintEntry: 'उत्पीड़न की शिकायत करें',
    complaintEntrySub: 'कार्यस्थल या यौन उत्पीड़न। इसे केवल नामित कर्मचारी देखते हैं।',
    complaintTitle: 'गोपनीय शिकायत',
    complaintBody:
      'यह केवल आपके कार्यस्थल के नामित कर्मचारियों तक जाती है, आपके मैनेजर या मालिक तक नहीं। आप चुन सकते हैं कि कौन इसे न देखे। शिकायत करने पर बुरा बर्ताव क़ानूनन मना है।',
    committeeLabel: 'उत्पीड़न शिकायत कर्मचारी',
    presiding: 'प्रमुख',
    noCommittee:
      'आपके कार्यस्थल ने अभी शिकायतें लेने के लिए किसी को नामित नहीं किया है। आप फिर भी भेज सकते हैं, और मालिक को बताया जाएगा कि यह ज़रूरी है। आप रोज़गार और श्रम मंत्रालय में याचिका भी दे सकते हैं।',
    excludeLabel: 'कर्मचारी जो इसे न देखें',
    lawNote:
      'शिकायत आने पर नियोक्ता को बिना देरी निष्पक्ष जाँच करनी होगी और प्रभावित व्यक्ति की रक्षा करनी होगी (श्रम मानक अधिनियम, अनुच्छेद 76-3)।',
    committeeInbox: 'शिकायत इनबॉक्स',
    handlerSelf: 'मैं उत्पीड़न की शिकायतें लेता/लेती हूँ',
    handlerMember: 'उत्पीड़न की शिकायतें लेते हैं',
    handlerSectionBody:
      '5 या अधिक कर्मचारियों वाले कार्यस्थलों को उत्पीड़न की शिकायतों की बिना देरी जाँच करनी होगी और रोकथाम व कार्रवाई के क़दम कार्य नियमों में लिखने होंगे।',
    flagNoHandler: 'उत्पीड़न की शिकायतें लेने वाला कोई नहीं',
    serviceFromLabel: 'नियुक्ति की तारीख़',
    overtimeRule:
      'दिन में 8 या हफ़्ते में 40 घंटे से ज़्यादा ओवरटाइम (+50%), हफ़्ते में अधिकतम 52 घंटे। 22:00–6:00 पर 50% रात्रि प्रीमियम।',
    ded_national_pension: 'राष्ट्रीय पेंशन',
    ded_health_insurance: 'स्वास्थ्य बीमा',
    ded_long_term_care: 'दीर्घकालिक देखभाल बीमा',
    ded_employment_insurance: 'रोज़गार बीमा',
    ded_income_tax: 'आयकर',
    ded_local_income_tax: 'स्थानीय आयकर',
    ext_moel: 'रोज़गार और श्रम मंत्रालय (याचिका)',
    limit_krWeek: 'इस हफ़्ते के घंटे (52 घंटे की सीमा)',
    studentRule:
      'अंतरराष्ट्रीय छात्र (D-2): TOPIK 3 (तीसरे–चौथे साल में TOPIK 4) के साथ हफ़्ते के दिनों में 25 घंटे, उसके बिना 10; स्नातकोत्तर 30; सप्ताहांत और छुट्टियों में कोई सीमा नहीं। पहले पार्ट-टाइम काम की अनुमति चाहिए। 18 से कम: दिन में 7, हफ़्ते में 35 घंटे; रात और छुट्टी के काम के लिए सहमति और मंज़ूरी चाहिए (श्रम मानक अधिनियम, अनुच्छेद 69–70)।',
  },
  es: {
    recordBroken:
      'Este registro no coincide. Muestre esta pantalla a un inspector de la oficina regional de trabajo o a su sindicato.',
    leaveBody:
      'Pida un permiso o un día de teletrabajo. Cada decisión queda sellada en su registro.',
    balanceCasual: 'Eventos familiares',
    balanceSick: 'Enfermedad',
    balanceEarned: 'Vacaciones',
    balanceCompOff: 'Descanso compensatorio',
    typeCasual: 'Permiso por evento familiar',
    typeSick: 'Baja por enfermedad',
    typeEarned: 'Vacaciones anuales pagadas (yeoncha)',
    typeCompOff: 'Descanso compensatorio',
    typeUnpaid: 'Permiso sin sueldo',
    typeWfh: 'Teletrabajo',
    compOffNote:
      'Las horas extra aprobadas se convierten en descanso compensatorio en lugar de recargo (con acuerdo escrito con el representante de los trabajadores).',
    leaveLawNote:
      'Un día por cada mes completo el primer año; 15 días tras un año con 80 % de asistencia, más 1 cada 2 años desde el tercero, hasta 25 (Ley de Normas Laborales, art. 60).',
    complaintEntry: 'Denunciar acoso',
    complaintEntrySub: 'Acoso laboral o sexual. Solo el personal designado lo ve.',
    complaintTitle: 'Denuncia confidencial',
    complaintBody:
      'Esto llega solo al personal designado de su lugar de trabajo, no a su jefe ni al dueño. Puede elegir personal que no debe verla. La ley prohíbe el trato desfavorable por denunciar.',
    committeeLabel: 'Personal para denuncias de acoso',
    presiding: 'responsable',
    noCommittee:
      'Su lugar de trabajo aún no ha nombrado a nadie para recibir denuncias. Puede enviarla igualmente, y se informará al dueño de que hace falta. También puede presentar una petición ante el Ministerio de Empleo y Trabajo.',
    excludeLabel: 'Personal que no debe ver esto',
    lawNote:
      'Al recibir una denuncia, el empleador debe investigar de forma objetiva y sin demora y proteger a la persona afectada (Ley de Normas Laborales, art. 76-3).',
    committeeInbox: 'Denuncias recibidas',
    handlerSelf: 'Recibo denuncias de acoso',
    handlerMember: 'Recibe denuncias de acoso',
    handlerSectionBody:
      'Los lugares de trabajo con 5 o más empleados deben investigar sin demora las denuncias de acoso y fijar en su reglamento las medidas de prevención y respuesta.',
    flagNoHandler: 'Nadie para recibir denuncias de acoso',
    serviceFromLabel: 'Fecha de contratación',
    overtimeRule:
      'Horas extra a partir de 8 horas al día o 40 a la semana (+50 %), hasta 52 horas semanales. De 22:00 a 6:00 se añade un recargo nocturno del 50 %.',
    ded_national_pension: 'Pensión nacional',
    ded_health_insurance: 'Seguro de salud',
    ded_long_term_care: 'Seguro de dependencia',
    ded_employment_insurance: 'Seguro de empleo',
    ded_income_tax: 'Impuesto sobre la renta',
    ded_local_income_tax: 'Impuesto local sobre la renta',
    ext_moel: 'Ministerio de Empleo y Trabajo (petición)',
    limit_krWeek: 'Horas esta semana (límite de 52 h)',
    studentRule:
      'Estudiantes internacionales (D-2): 25 horas entre semana con TOPIK 3 (3.º y 4.º curso: TOPIK 4), 10 sin él; posgrado 30; sin límite en fines de semana ni vacaciones. Antes hace falta el permiso de trabajo a tiempo parcial. Menores de 18: 7 horas al día y 35 a la semana; el trabajo nocturno y en festivos requiere consentimiento y autorización (Ley de Normas Laborales, arts. 69–70).',
  },
  fr: {
    recordBroken:
      'Cet enregistrement ne correspond pas. Montrez cet écran à un inspecteur du bureau régional du travail ou à votre syndicat.',
    leaveBody:
      'Demandez un congé ou une journée de télétravail. Chaque décision est scellée dans votre dossier.',
    balanceCasual: 'Événements familiaux',
    balanceSick: 'Maladie',
    balanceEarned: 'Congés annuels',
    balanceCompOff: 'Repos compensateur',
    typeCasual: 'Congé pour événement familial',
    typeSick: 'Congé maladie',
    typeEarned: 'Congés payés annuels (yeoncha)',
    typeCompOff: 'Repos compensateur',
    typeUnpaid: 'Congé sans solde',
    typeWfh: 'Télétravail',
    compOffNote:
      'Les heures supplémentaires approuvées deviennent du repos compensateur au lieu d’une majoration (avec un accord écrit avec le représentant des salariés).',
    leaveLawNote:
      'Un jour par mois complet la première année ; 15 jours après un an avec 80 % de présence, plus 1 tous les 2 ans à partir de la troisième année, jusqu’à 25 (Loi sur les normes du travail, art. 60).',
    complaintEntry: 'Signaler un harcèlement',
    complaintEntrySub: 'Harcèlement moral ou sexuel. Seul le personnel désigné le voit.',
    complaintTitle: 'Signalement confidentiel',
    complaintBody:
      'Il n’est transmis qu’au personnel désigné de votre lieu de travail, ni à votre responsable ni au propriétaire. Vous pouvez exclure des personnes. La loi interdit tout traitement défavorable pour avoir signalé.',
    committeeLabel: 'Personnel chargé des signalements',
    presiding: 'responsable',
    noCommittee:
      'Votre lieu de travail n’a encore désigné personne pour recevoir les signalements. Vous pouvez quand même l’envoyer, et le propriétaire sera informé que c’est nécessaire. Vous pouvez aussi déposer une requête auprès du ministère de l’Emploi et du Travail.',
    excludeLabel: 'Personnes qui ne doivent pas voir ceci',
    lawNote:
      'Dès qu’un signalement est fait, l’employeur doit enquêter objectivement sans délai et protéger la personne concernée (Loi sur les normes du travail, art. 76-3).',
    committeeInbox: 'Signalements reçus',
    handlerSelf: 'Je reçois les signalements de harcèlement',
    handlerMember: 'Reçoit les signalements de harcèlement',
    handlerSectionBody:
      'Les lieux de travail de 5 salariés ou plus doivent enquêter sans délai sur les signalements et inscrire les mesures de prévention et de réponse dans leur règlement.',
    flagNoHandler: 'Personne pour recevoir les signalements',
    serviceFromLabel: 'Date d’embauche',
    overtimeRule:
      'Heures supplémentaires au-delà de 8 heures par jour ou 40 par semaine (+50 %), jusqu’à 52 heures par semaine. De 22 h à 6 h, majoration de nuit de 50 %.',
    ded_national_pension: 'Retraite nationale',
    ded_health_insurance: 'Assurance maladie',
    ded_long_term_care: 'Assurance dépendance',
    ded_employment_insurance: 'Assurance chômage',
    ded_income_tax: 'Impôt sur le revenu',
    ded_local_income_tax: 'Impôt local sur le revenu',
    ext_moel: 'Ministère de l’Emploi et du Travail (requête)',
    limit_krWeek: 'Heures cette semaine (plafond de 52 h)',
    studentRule:
      'Étudiants internationaux (D-2) : 25 heures en semaine avec le TOPIK 3 (3e–4e année : TOPIK 4), 10 sans ; 30 en master et doctorat ; pas de plafond le week-end ni pendant les vacances. Il faut d’abord une autorisation de travail à temps partiel. Moins de 18 ans : 7 heures par jour, 35 par semaine ; nuit et jours fériés avec accord et autorisation (loi sur les normes du travail, arts. 69–70).',
  },
  de: {
    recordBroken:
      'Dieser Eintrag stimmt nicht. Zeigen Sie diesen Bildschirm einem Arbeitsinspektor des regionalen Arbeitsamts oder Ihrer Gewerkschaft.',
    leaveBody:
      'Beantragen Sie Urlaub oder einen Tag im Homeoffice. Jede Entscheidung wird in Ihrem Nachweis versiegelt.',
    balanceCasual: 'Familienanlässe',
    balanceSick: 'Krankheit',
    balanceEarned: 'Jahresurlaub',
    balanceCompOff: 'Ausgleichsurlaub',
    typeCasual: 'Urlaub für Familienanlässe',
    typeSick: 'Krankheitsurlaub',
    typeEarned: 'Bezahlter Jahresurlaub (yeoncha)',
    typeCompOff: 'Ausgleichsurlaub',
    typeUnpaid: 'Unbezahlter Urlaub',
    typeWfh: 'Homeoffice',
    compOffNote:
      'Genehmigte Mehrstunden werden statt Zuschlag zu Ausgleichsurlaub (mit schriftlicher Vereinbarung mit der Arbeitnehmervertretung).',
    leaveLawNote:
      'Im ersten Jahr ein Tag je vollem Monat; nach einem Jahr mit 80 % Anwesenheit 15 Tage, ab dem dritten Jahr alle 2 Jahre 1 mehr, bis 25 (Arbeitsstandardgesetz, Art. 60).',
    complaintEntry: 'Belästigung melden',
    complaintEntrySub: 'Mobbing oder sexuelle Belästigung. Nur die benannten Personen sehen es.',
    complaintTitle: 'Vertrauliche Meldung',
    complaintBody:
      'Dies geht nur an die benannten Personen Ihres Arbeitsplatzes, nicht an Ihre Vorgesetzten oder den Inhaber. Sie können Personen ausschließen. Benachteiligung wegen einer Meldung ist gesetzlich verboten.',
    committeeLabel: 'Meldestelle für Belästigung',
    presiding: 'Leitung',
    noCommittee:
      'Ihr Arbeitsplatz hat noch niemanden für Meldungen benannt. Sie können es trotzdem senden, und der Inhaber erfährt, dass jemand nötig ist. Sie können auch eine Petition beim Ministerium für Beschäftigung und Arbeit einreichen.',
    excludeLabel: 'Personen, die dies nicht sehen dürfen',
    lawNote:
      'Nach einer Meldung muss der Arbeitgeber unverzüglich objektiv ermitteln und die betroffene Person schützen (Arbeitsstandardgesetz, Art. 76-3).',
    committeeInbox: 'Eingegangene Meldungen',
    handlerSelf: 'Ich nehme Meldungen über Belästigung entgegen',
    handlerMember: 'Nimmt Meldungen entgegen',
    handlerSectionBody:
      'Arbeitsplätze mit 5 oder mehr Beschäftigten müssen Meldungen unverzüglich untersuchen und Präventions- und Reaktionsschritte in der Arbeitsordnung festlegen.',
    flagNoHandler: 'Niemand nimmt Meldungen entgegen',
    serviceFromLabel: 'Einstellungsdatum',
    overtimeRule:
      'Überstunden ab 8 Stunden am Tag oder 40 in der Woche (+50 %), bis 52 Stunden pro Woche. 22:00–6:00 Uhr kommt ein Nachtzuschlag von 50 % hinzu.',
    ded_national_pension: 'Staatliche Rente',
    ded_health_insurance: 'Krankenversicherung',
    ded_long_term_care: 'Pflegeversicherung',
    ded_employment_insurance: 'Arbeitslosenversicherung',
    ded_income_tax: 'Einkommensteuer',
    ded_local_income_tax: 'Kommunale Einkommensteuer',
    ext_moel: 'Ministerium für Beschäftigung und Arbeit (Petition)',
    limit_krWeek: 'Stunden diese Woche (Grenze 52 h)',
    studentRule:
      'Internationale Studierende (D-2): mit TOPIK 3 (3.–4. Studienjahr: TOPIK 4) 25 Stunden an Werktagen, sonst 10; Masterstudierende 30; am Wochenende und in den Ferien ohne Grenze. Vorher ist eine Teilzeit-Arbeitserlaubnis nötig. Unter 18: 7 Stunden am Tag, 35 pro Woche; Nacht- und Feiertagsarbeit nur mit Zustimmung und Genehmigung (Arbeitsstandardgesetz, Art. 69–70).',
  },
  pt: {
    recordBroken:
      'Este registo não confere. Mostre este ecrã a um inspetor do gabinete regional do trabalho ou ao seu sindicato.',
    leaveBody:
      'Peça uma licença ou um dia de teletrabalho. Cada decisão fica selada no seu registo.',
    balanceCasual: 'Eventos familiares',
    balanceSick: 'Doença',
    balanceEarned: 'Férias',
    balanceCompOff: 'Folga compensatória',
    typeCasual: 'Licença por evento familiar',
    typeSick: 'Licença por doença',
    typeEarned: 'Férias anuais pagas (yeoncha)',
    typeCompOff: 'Folga compensatória',
    typeUnpaid: 'Licença sem vencimento',
    typeWfh: 'Teletrabalho',
    compOffNote:
      'As horas extra aprovadas tornam-se folga compensatória em vez de acréscimo (com acordo escrito com o representante dos trabalhadores).',
    leaveLawNote:
      'Um dia por cada mês completo no primeiro ano; 15 dias após um ano com 80% de assiduidade, mais 1 a cada 2 anos a partir do terceiro, até 25 (Lei das Normas Laborais, art. 60).',
    complaintEntry: 'Denunciar assédio',
    complaintEntrySub: 'Assédio laboral ou sexual. Só as pessoas designadas o veem.',
    complaintTitle: 'Denúncia confidencial',
    complaintBody:
      'Isto vai apenas para as pessoas designadas do seu local de trabalho, não para a sua chefia nem para o dono. Pode excluir pessoas. A lei proíbe o tratamento desfavorável por denunciar.',
    committeeLabel: 'Pessoas que recebem denúncias',
    presiding: 'responsável',
    noCommittee:
      'O seu local de trabalho ainda não designou ninguém para receber denúncias. Pode enviar na mesma, e o dono será informado de que é necessário. Também pode apresentar uma petição ao Ministério do Emprego e do Trabalho.',
    excludeLabel: 'Pessoas que não devem ver isto',
    lawNote:
      'Quando há uma denúncia, o empregador tem de investigar de forma objetiva e sem demora e proteger a pessoa afetada (Lei das Normas Laborais, art. 76-3).',
    committeeInbox: 'Denúncias recebidas',
    handlerSelf: 'Recebo denúncias de assédio',
    handlerMember: 'Recebe denúncias de assédio',
    handlerSectionBody:
      'Locais de trabalho com 5 ou mais trabalhadores têm de investigar sem demora as denúncias e definir no regulamento as medidas de prevenção e resposta.',
    flagNoHandler: 'Ninguém para receber denúncias de assédio',
    serviceFromLabel: 'Data de contratação',
    overtimeRule:
      'Horas extra acima de 8 horas por dia ou 40 por semana (+50%), até 52 horas semanais. Das 22:00 às 6:00 acresce um prémio noturno de 50%.',
    ded_national_pension: 'Pensão nacional',
    ded_health_insurance: 'Seguro de saúde',
    ded_long_term_care: 'Seguro de cuidados prolongados',
    ded_employment_insurance: 'Seguro de emprego',
    ded_income_tax: 'Imposto sobre o rendimento',
    ded_local_income_tax: 'Imposto local sobre o rendimento',
    ext_moel: 'Ministério do Emprego e do Trabalho (petição)',
    limit_krWeek: 'Horas esta semana (limite de 52 h)',
    studentRule:
      'Estudantes internacionais (D-2): 25 horas nos dias úteis com TOPIK 3 (3.º–4.º ano: TOPIK 4), 10 sem ele; pós-graduação 30; sem limite ao fim de semana nem nas férias. É preciso primeiro a autorização de trabalho a tempo parcial. Menores de 18: 7 horas por dia, 35 por semana; trabalho noturno e em feriados exige consentimento e autorização (Lei das Normas Laborais, arts. 69–70).',
  },
  ja: {
    recordBroken:
      'この記録は一致しません。この画面を地方雇用労働庁の勤労監督官、または労働組合に見せてください。',
    leaveBody: '休暇や在宅勤務を申請できます。承認・却下はすべてあなたの記録に封印されます。',
    balanceCasual: '慶弔休暇',
    balanceSick: '病気休暇',
    balanceEarned: '年次休暇',
    balanceCompOff: '補償休暇',
    typeCasual: '慶弔休暇',
    typeSick: '病気休暇',
    typeEarned: '年次有給休暇(ヨンチャ)',
    typeCompOff: '補償休暇',
    typeUnpaid: '無給休暇',
    typeWfh: '在宅勤務',
    compOffNote:
      '承認された時間外労働は、割増賃金の代わりに補償休暇になります(労働者代表との書面合意が必要)。',
    leaveLawNote:
      '1年目は1か月皆勤ごとに1日。出勤率80%以上で1年勤務すると15日、3年目から2年ごとに1日加算、最大25日(勤労基準法第60条)。',
    complaintEntry: 'ハラスメントを申告する',
    complaintEntrySub: '職場内いじめやセクハラ。指定された担当者だけが見られます。',
    complaintTitle: '秘密の申告',
    complaintBody:
      '職場の指定担当者にだけ届き、上司やオーナーには届きません。見せたくない担当者を選べます。申告を理由とする不利益な扱いは法律で禁止されています。',
    committeeLabel: 'ハラスメント申告の担当者',
    presiding: '責任者',
    noCommittee:
      'この職場ではまだ申告の受付担当者が決まっていません。このまま送ることができ、担当者が必要であることがオーナーに伝わります。雇用労働部に陳情することもできます。',
    excludeLabel: 'この申告を見せない担当者',
    lawNote:
      '申告があった場合、使用者は遅滞なく客観的に調査し、被害を受けた人を保護しなければなりません(勤労基準法第76条の3)。',
    committeeInbox: '申告の受信箱',
    handlerSelf: '私はハラスメント申告を受け付けます',
    handlerMember: 'ハラスメント申告の受付担当',
    handlerSectionBody:
      '従業員5人以上の職場は、ハラスメントの申告を遅滞なく調査し、予防と対応の手順を就業規則に定める必要があります。',
    flagNoHandler: 'ハラスメント申告の受付担当がいない',
    serviceFromLabel: '入社日',
    overtimeRule:
      '1日8時間・週40時間を超えると延長労働(+50%)、週52時間まで。22時〜6時は夜間割増50%。',
    ded_national_pension: '国民年金',
    ded_health_insurance: '健康保険',
    ded_long_term_care: '長期療養保険',
    ded_employment_insurance: '雇用保険',
    ded_income_tax: '所得税',
    ded_local_income_tax: '地方所得税',
    ext_moel: '雇用労働部(陳情)',
    limit_krWeek: '今週の労働時間(上限52時間)',
    studentRule:
      '留学生(D-2):学部生はTOPIK3級(3・4年生は4級)以上で平日週25時間、未満は10時間、大学院生は30時間。週末と休暇中は上限なし。事前に時間制就業許可が必要です。18歳未満:1日7時間・週35時間、夜間・休日労働は本人の同意と認可が必要(勤労基準法第69・70条)。',
  },
  zh: {
    recordBroken: '此记录不一致。请把这个页面给地方雇佣劳动厅的劳动监督官或你的工会看。',
    leaveBody: '申请休假或居家办公。每项决定都会封存在你的记录里。',
    balanceCasual: '婚丧假',
    balanceSick: '病假',
    balanceEarned: '年假',
    balanceCompOff: '补休',
    typeCasual: '婚丧假',
    typeSick: '病假',
    typeEarned: '带薪年假(年次)',
    typeCompOff: '补休',
    typeUnpaid: '无薪假',
    typeWfh: '居家办公',
    compOffNote: '经批准的加班时间转为补休,代替加班费(须与员工代表签订书面协议)。',
    leaveLawNote:
      '第一年每满勤一个月1天;工作满一年且出勤率达80%后15天,从第三年起每2年加1天,最多25天(《劳动基准法》第60条)。',
    complaintEntry: '举报骚扰',
    complaintEntrySub: '职场欺凌或性骚扰。只有指定人员能看到。',
    complaintTitle: '保密举报',
    complaintBody:
      '只送达你工作场所的指定人员,不会送到你的上司或老板。你可以选择不允许查看的人员。法律禁止因举报而受到不利对待。',
    committeeLabel: '骚扰举报受理人员',
    presiding: '负责人',
    noCommittee:
      '你的工作场所尚未指定受理举报的人员。你仍然可以发送,老板会被告知必须指定。你也可以向雇佣劳动部提交请愿。',
    excludeLabel: '不允许查看的人员',
    lawNote: '收到举报后,雇主必须立即进行客观调查,并保护受害人(《劳动基准法》第76条之3)。',
    committeeInbox: '举报收件箱',
    handlerSelf: '我负责受理骚扰举报',
    handlerMember: '受理骚扰举报',
    handlerSectionBody:
      '5名及以上员工的工作场所必须立即调查骚扰举报,并在工作规则中规定预防和应对措施。',
    flagNoHandler: '无人受理骚扰举报',
    serviceFromLabel: '入职日期',
    overtimeRule:
      '每天超过8小时或每周超过40小时为加班(+50%),每周最多52小时。22:00–6:00另加50%夜班津贴。',
    ded_national_pension: '国民年金',
    ded_health_insurance: '健康保险',
    ded_long_term_care: '长期护理保险',
    ded_employment_insurance: '雇佣保险',
    ded_income_tax: '所得税',
    ded_local_income_tax: '地方所得税',
    ext_moel: '雇佣劳动部(请愿)',
    limit_krWeek: '本周工时(上限52小时)',
    studentRule:
      '国际学生(D-2):本科生TOPIK 3级(三、四年级4级)以上工作日每周25小时,未达标10小时;研究生30小时;周末和假期不限。须先取得兼职许可。未满18岁:每天7小时、每周35小时;夜间和节假日工作须本人同意并经批准(《劳动基准法》第69、70条)。',
  },
};
