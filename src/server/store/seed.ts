import type {
  Workplace,
  WorkerProfile,
  LedgerEvent,
  OvertimeClaim,
  WorkerNotification,
  HazardReport,
  AnonymousFeedbackEntry,
  DeductionItem,
} from '../../shared/types.js';
import { append } from '../../shared/ledger/ledger.js';
import { evaluateSeverityFloor } from '../../shared/rules/severity.js';
import type { StoreSnapshot } from './store.js';

export const DEMO_TODAY = '2026-10-27'; // Tuesday
export const CURRENT_WEEK_START = '2026-10-19'; // Previous week Mon-Sat + current Mon-Tue

export function buildSeedSnapshot(): StoreSnapshot {
  const workplaces: Workplace[] = [
    {
      id: 'wp-tower-b',
      name: 'Tower B Construction Site',
      nameTa: 'டவர் B கட்டுமானத் தளம்',
      nameHi: 'टॉवर B निर्माण स्थल',
      sector: 'construction',
      checkinCode: 'TOWERB-GATE',
      supervisorName: 'Supervisor Ravi',
      nextPayDate: '2026-10-31T18:00:00Z',
      zones: [
        {
          id: 'z-scaffold-a',
          workplaceId: 'wp-tower-b',
          name: 'Scaffold A',
          nameTa: 'ஸ்காஃபோல்ட் A',
          nameHi: 'स्कैफोल्ड A',
          code: 'TB-SCAF-A',
          icon: '🪜',
        },
        {
          id: 'z-scaffold-b',
          workplaceId: 'wp-tower-b',
          name: 'Scaffold B',
          nameTa: 'ஸ்காஃபோல்ட் B',
          nameHi: 'स्कैफोल्ड B',
          code: 'TB-SCAF-B',
          icon: '🏗️',
        },
        {
          id: 'z-basement',
          workplaceId: 'wp-tower-b',
          name: 'Basement',
          nameTa: 'அடித்தளம் (Basement)',
          nameHi: 'बेसमेंट',
          code: 'TB-BASE',
          icon: '🕳️',
        },
        {
          id: 'z-crane',
          workplaceId: 'wp-tower-b',
          name: 'Crane bay',
          nameTa: 'கிரேன் பகுதி',
          nameHi: 'क्रेन बे',
          code: 'TB-CRANE',
          icon: '⚙️',
        },
        {
          id: 'z-gate-b',
          workplaceId: 'wp-tower-b',
          name: 'Site gate',
          nameTa: 'தள நுழைவாயில்',
          nameHi: 'साइट गेट',
          code: 'TB-GATE',
          icon: '🚧',
        },
      ],
    },
    {
      id: 'wp-campus',
      name: 'Campus Facilities',
      nameTa: 'கல்லூரி வளாகப் பராமரிப்பு',
      nameHi: 'कैंपस सुविधाएं',
      sector: 'campus',
      checkinCode: 'CAMPUS-GATE',
      supervisorName: 'Supervisor Meenakshi',
      nextPayDate: '2026-10-31T18:00:00Z',
      zones: [
        {
          id: 'z-hostel-a',
          workplaceId: 'wp-campus',
          name: 'Hostel Block A',
          nameTa: 'விடுதி பிளாக் A',
          nameHi: 'हॉस्टल ब्लॉक A',
          code: 'CP-HOSTEL-A',
          icon: '🏢',
        },
        {
          id: 'z-academic',
          workplaceId: 'wp-campus',
          name: 'Academic Block',
          nameTa: 'கல்வி வளாகம்',
          nameHi: 'शैक्षणिक ब्लॉक',
          code: 'CP-ACAD',
          icon: '🏫',
        },
        {
          id: 'z-cafeteria',
          workplaceId: 'wp-campus',
          name: 'Cafeteria kitchen',
          nameTa: 'உணவக சமையலறை',
          nameHi: 'कैफेटेरिया रसोई',
          code: 'CP-CAFE',
          icon: '🍲',
        },
        {
          id: 'z-labs',
          workplaceId: 'wp-campus',
          name: 'Labs',
          nameTa: 'ஆய்வகங்கள் (Labs)',
          nameHi: 'प्रयोगशालाएं',
          code: 'CP-LABS',
          icon: '🧪',
        },
        {
          id: 'z-campus-gate',
          workplaceId: 'wp-campus',
          name: 'Main gate',
          nameTa: 'பிரதான நுழைவாயில்',
          nameHi: 'मुख्य द्वार',
          code: 'CP-GATE',
          icon: '🛂',
        },
      ],
    },
  ];

  const workers: WorkerProfile[] = [
    // 8 Construction workers
    {
      id: 'w-murugan',
      name: 'Murugan K.',
      nameTa: 'முருகன் க.',
      nameHi: 'मुरुगन के.',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Bar Bender & Mason',
      roleTa: 'கம்பி கட்டும் தொழிலாளி',
      roleHi: 'सरिया और राजमिस्त्री',
      team: 'Structural Crew',
      hourlyRate: 100,
      dailyWage: 800,
      preferredLanguage: 'ta',
      missedShifts14d: 0,
      otTrend3Weeks: [4, 7, 11],
    },
    {
      id: 'w-rajesh',
      name: 'Rajesh Kumar',
      nameTa: 'ராஜேஷ் குமார்',
      nameHi: 'राजेश कुमार',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Scaffolder',
      roleTa: 'ஸ்காஃபோல்ட் தொழிலாளி',
      roleHi: 'स्कैफोल्डर',
      team: 'Structural Crew',
      hourlyRate: 95,
      dailyWage: 760,
      preferredLanguage: 'hi',
      missedShifts14d: 2,
      otTrend3Weeks: [6, 9, 14],
    },
    {
      id: 'w-senthil',
      name: 'Senthil V.',
      nameTa: 'செந்தில் வி.',
      nameHi: 'सेंथिल वी.',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Site Electrician',
      roleTa: 'தள எலக்ட்ரீஷியன்',
      roleHi: 'साइट इलेक्ट्रीशियन',
      team: 'Structural Crew',
      hourlyRate: 115,
      dailyWage: 920,
      preferredLanguage: 'ta',
    },
    {
      id: 'w-imran',
      name: 'Imran Basha',
      nameTa: 'இம்ரான் பாஷா',
      nameHi: 'इमरान बाशा',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Crane Rigger',
      roleTa: 'கிரேன் உதவியாளர்',
      roleHi: 'क्रेन रिगर',
      team: 'Structural Crew',
      hourlyRate: 105,
      dailyWage: 840,
      preferredLanguage: 'en',
    },
    {
      id: 'w-Suresh',
      name: 'Suresh Paswan',
      nameTa: 'சுரேஷ் பஸ்வான்',
      nameHi: 'सुरेश पासवान',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Concrete Mixer Operator',
      roleTa: 'கான்கிரீட் மிக்சர் ஆபரேட்டர்',
      roleHi: 'कंक्रीट मिक्सर ऑपरेटर',
      team: 'Structural Crew',
      hourlyRate: 95,
      dailyWage: 760,
      preferredLanguage: 'hi',
    },
    {
      id: 'w-velu',
      name: 'Velu M.',
      nameTa: 'வேலு எம்.',
      nameHi: 'वेलू एम.',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Carpenter',
      roleTa: 'தச்சர்',
      roleHi: 'बढ़ई',
      team: 'Structural Crew',
      hourlyRate: 100,
      dailyWage: 800,
      preferredLanguage: 'ta',
    },
    {
      id: 'w-dinesh',
      name: 'Dinesh Yadav',
      nameTa: 'தினேஷ் யாதவ்',
      nameHi: 'दिनेश यादव',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'General Helper',
      roleTa: 'உதவியாளர்',
      roleHi: 'हेल्पर',
      team: 'Structural Crew',
      hourlyRate: 80,
      dailyWage: 640,
      preferredLanguage: 'hi',
    },
    {
      id: 'w-anbu',
      name: 'Anbu R.',
      nameTa: 'அன்பு ஆர்.',
      nameHi: 'अन्बु आर.',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      role: 'Plumber',
      roleTa: 'பிளம்பர்',
      roleHi: 'प्लंबर',
      team: 'Structural Crew',
      hourlyRate: 100,
      dailyWage: 800,
      preferredLanguage: 'ta',
    },

    // 8 Campus Facilities workers
    {
      id: 'w-lakshmi',
      name: 'Lakshmi S.',
      nameTa: 'லட்சுமி எஸ்.',
      nameHi: 'लक्ष्मी एस.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Campus Security Guard (Night Shift)',
      roleTa: 'வளாகப் பாதுகாப்பு (இரவுப் பணி)',
      roleHi: 'कैंपस सुरक्षा गार्ड (नाइट शिफ्ट)',
      team: 'Campus Security & Operations',
      hourlyRate: 90,
      dailyWage: 720,
      preferredLanguage: 'ta',
      missedShifts14d: 0,
      otTrend3Weeks: [8, 16, 28],
    },
    {
      id: 'w-kavitha',
      name: 'Kavitha P.',
      nameTa: 'கவிதா பி.',
      nameHi: 'कविता पी.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Hostel Housekeeping Staff',
      roleTa: 'விடுதி தூய்மைப் பணியாளர்',
      roleHi: 'हॉस्टल हाउसकीपिंग स्टाफ',
      team: 'Campus Security & Operations',
      hourlyRate: 80,
      dailyWage: 640,
      preferredLanguage: 'ta',
    },
    {
      id: 'w-ramesh',
      name: 'Ramesh Tiwari',
      nameTa: 'ரமேஷ் திவாரி',
      nameHi: 'रमेश तिवारी',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Main Gate Security',
      roleTa: 'நுழைவாயில் பாதுகாப்பு',
      roleHi: 'मुख्य द्वार सुरक्षा गार्ड',
      team: 'Campus Security & Operations',
      hourlyRate: 90,
      dailyWage: 720,
      preferredLanguage: 'hi',
    },
    {
      id: 'w-selvi',
      name: 'Selvi N.',
      nameTa: 'செல்வி என்.',
      nameHi: 'सेल्वी एन.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Academic Block Housekeeping',
      roleTa: 'கல்வி வளாக தூய்மைப் பணி',
      roleHi: 'एकेडमिक ब्लॉक हाउसकीपिंग',
      team: 'Campus Security & Operations',
      hourlyRate: 80,
      dailyWage: 640,
      preferredLanguage: 'ta',
    },
    {
      id: 'w-prakash',
      name: 'Prakash J.',
      nameTa: 'பிரகாஷ் ஜே.',
      nameHi: 'प्रकाश जे.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Electrical Maintenance Technician',
      roleTa: 'மின்சார பராமரிப்பாளர்',
      roleHi: 'इलेक्ट्रिकल मेंटेनेंस तकनीशियन',
      team: 'Campus Security & Operations',
      hourlyRate: 110,
      dailyWage: 880,
      preferredLanguage: 'en',
    },
    {
      id: 'w-shanti',
      name: 'Shanti Devi',
      nameTa: 'சாந்தி தேவி',
      nameHi: 'शांति देवी',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Cafeteria Sanitation Staff',
      roleTa: 'உணவக தூய்மைப் பணியாளர்',
      roleHi: 'कैफेटेरिया सफाई कर्मचारी',
      team: 'Campus Security & Operations',
      hourlyRate: 80,
      dailyWage: 640,
      preferredLanguage: 'hi',
    },
    {
      id: 'w-mani',
      name: 'Manikandan T.',
      nameTa: 'மணிகண்டன் டி.',
      nameHi: 'मणिकंदन टी.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Plumbing & Water Maintenance',
      roleTa: 'குழாய் & குடிநீர் பராமரிப்பு',
      roleHi: 'प्लंबिंग और जल रखरखाव',
      team: 'Campus Security & Operations',
      hourlyRate: 100,
      dailyWage: 800,
      preferredLanguage: 'ta',
    },
    {
      id: 'w-deepa',
      name: 'Deepa R.',
      nameTa: 'தீபா ஆர்.',
      nameHi: 'दीपा आर.',
      workplaceId: 'wp-campus',
      sector: 'campus',
      role: 'Lab Attendant & Safety Assistant',
      roleTa: 'ஆய்வக உதவியாளர்',
      roleHi: 'लैब सहायक',
      team: 'Campus Security & Operations',
      hourlyRate: 95,
      dailyWage: 760,
      preferredLanguage: 'en',
    },
  ];

  const chains: Record<string, LedgerEvent[]> = {};

  function addShiftToChain(
    workerId: string,
    date: string,
    inTime: string,
    outTime: string | null,
    zoneCode: string
  ): { inId: string; outId?: string } {
    let ch = chains[workerId] ?? [];
    const inId = `ev-${workerId}-${date}-in`;
    ch = append(ch, {
      id: inId,
      workerId,
      type: 'CHECK_IN',
      createdAt: `${date}T${inTime}:00Z`,
      payload: {
        date,
        timestamp: inTime,
        zoneCode,
        source: 'qr',
      },
    });
    let outId: string | undefined;
    if (outTime) {
      outId = `ev-${workerId}-${date}-out`;
      ch = append(ch, {
        id: outId,
        workerId,
        type: 'CHECK_OUT',
        createdAt: `${date}T${outTime}:00Z`,
        payload: {
          date,
          timestamp: outTime,
          zoneCode,
          source: 'qr',
        },
      });
    }
    chains[workerId] = ch;
    return { inId, outId };
  }

  // Build Murugan's shifts (Week of Oct 19 - Oct 24, plus Oct 26-27)
  // Monday Oct 19: 09:00 - 17:00 (8h)
  addShiftToChain('w-murugan', '2026-10-19', '09:00', '17:00', 'TB-SCAF-B');
  // Tuesday Oct 20: 09:00 - 20:40 originally, then Supervisor Ravi edited checkout to 18:00 with a weak reason!
  const muruganTue = addShiftToChain('w-murugan', '2026-10-20', '09:00', '20:40', 'TB-SCAF-B');
  chains['w-murugan'] = append(chains['w-murugan'], {
    id: 'ev-w-murugan-2026-10-20-edit1',
    workerId: 'w-murugan',
    type: 'EDIT',
    createdAt: '2026-10-21T07:30:00Z',
    payload: {
      targetEventId: muruganTue.outId!,
      field: 'timestamp',
      oldValue: '20:40',
      newValue: '18:00',
      reason: 'Standard site closing time adjustment',
      editorId: 'admin-ravi',
      editorName: 'Supervisor Ravi',
    },
  });
  // Wednesday Oct 21: 09:00 - 17:00 (8h)
  addShiftToChain('w-murugan', '2026-10-21', '09:00', '17:00', 'TB-SCAF-B');
  // Thursday Oct 22: 09:00 - 18:00 (9h -> 1h OT)
  addShiftToChain('w-murugan', '2026-10-22', '09:00', '18:00', 'TB-SCAF-B');
  // Friday Oct 23: 09:00 - 17:00 (8h)
  addShiftToChain('w-murugan', '2026-10-23', '09:00', '17:00', 'TB-SCAF-B');
  // Saturday Oct 24: 09:00 - 20:40 (11.67h -> 3.67h extra recorded! Covers his 2h Saturday slab pour claim!)
  addShiftToChain('w-murugan', '2026-10-24', '09:00', '20:40', 'TB-SCAF-B');

  // Build Lakshmi's shifts (7 nights in a row: Oct 20 to Oct 26, 12-hour shifts 20:00 -> 08:00, and one 6-hour rest gap on Oct 24 where she worked 08:00 -> 20:00 then came back at 02:00 / or ended at 14:00 and returned at 20:00!)
  // Let's make Oct 20 - Oct 23: 20:00 to 08:00 (12h night shift crossing midnight)
  addShiftToChain('w-lakshmi', '2026-10-20', '20:00', '08:00', 'CP-HOSTEL-A');
  addShiftToChain('w-lakshmi', '2026-10-21', '20:00', '08:00', 'CP-HOSTEL-A');
  addShiftToChain('w-lakshmi', '2026-10-22', '20:00', '08:00', 'CP-HOSTEL-A');
  // Oct 23: 20:00 to 10:00 (14h shift), then Oct 24 starts at 16:00 -> 04:00 (6h rest gap on 24 Oct!)
  addShiftToChain('w-lakshmi', '2026-10-23', '20:00', '10:00', 'CP-HOSTEL-A');
  addShiftToChain('w-lakshmi', '2026-10-24', '16:00', '04:00', 'CP-HOSTEL-A');
  // Oct 25: 20:00 to 09:30 (13.5h -> 5.5h extra, covers part of her claim)
  addShiftToChain('w-lakshmi', '2026-10-25', '20:00', '09:30', 'CP-HOSTEL-A');
  // Oct 26 (7th night in a row!): 20:00 to 08:00
  addShiftToChain('w-lakshmi', '2026-10-26', '20:00', '08:00', 'CP-HOSTEL-A');

  // Add shifts for other workers so attendance today (2026-10-27) and overtime owed look realistic
  const otherConstructionWorkers = [
    'w-rajesh',
    'w-senthil',
    'w-imran',
    'w-Suresh',
    'w-velu',
    'w-dinesh',
    'w-anbu',
  ];
  otherConstructionWorkers.forEach((wid, idx) => {
    for (const d of ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24']) {
      const outTime = idx < 3 ? '19:00' : '17:00';
      addShiftToChain(wid, d, '09:00', outTime, 'TB-GATE');
    }
    // Today Oct 27 attendance: first 5 checked in
    if (idx < 5) {
      addShiftToChain(wid, DEMO_TODAY, idx === 4 ? '09:35' : '08:55', null, 'TB-GATE');
    }
  });

  const otherCampusWorkers = [
    'w-kavitha',
    'w-ramesh',
    'w-selvi',
    'w-prakash',
    'w-shanti',
    'w-mani',
    'w-deepa',
  ];
  otherCampusWorkers.forEach((wid, idx) => {
    for (const d of ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24']) {
      const outTime = idx < 2 ? '18:30' : '17:00';
      addShiftToChain(wid, d, '09:00', outTime, 'CP-GATE');
    }
    if (idx < 5) {
      addShiftToChain(wid, DEMO_TODAY, idx === 3 ? '09:25' : '08:50', null, 'CP-GATE');
    }
  });

  const deductions: Record<string, DeductionItem[]> = {
    'w-murugan': [
      {
        id: 'ded-1',
        type: 'Canteen Tea & Meals',
        amount: 150,
        reason: 'Weekly site canteen coupon',
      },
      {
        id: 'ded-2',
        type: 'Equipment charge',
        amount: 200,
        reason: '', // Unexplained deduction! Flagged by pay rule
      },
    ],
    'w-lakshmi': [
      {
        id: 'ded-lak-1',
        type: 'Staff Welfare Fund',
        amount: 100,
        reason: 'Monthly campus welfare contribution',
      },
    ],
  };

  const notifications: WorkerNotification[] = [
    {
      id: 'notif-murugan-edit-1',
      workerId: 'w-murugan',
      workplaceId: 'wp-tower-b',
      type: 'SHIFT_EDITED',
      date: '2026-10-20',
      oldValue: '20:40',
      newValue: '18:00',
      supervisorName: 'Supervisor Ravi',
      reason: 'Standard site closing time adjustment',
      editEventId: 'ev-w-murugan-2026-10-20-edit1',
      status: 'unread',
      createdAt: '2026-10-21T07:30:00Z',
    },
  ];

  const claims: OvertimeClaim[] = [
    {
      id: 'claim-rajesh-1',
      workerId: 'w-rajesh',
      workerName: 'Rajesh Kumar',
      workplaceId: 'wp-tower-b',
      date: '2026-10-22',
      extraHours: 3,
      reason: 'Unloading steel rods from late truck at Gate B',
      detectedLanguage: 'hi',
      matchStatus: 'partly_supported',
      supportedHours: 2,
      evidence: {
        shiftDate: '2026-10-22',
        recordedCheckIn: '09:00',
        recordedCheckOut: '19:00',
        originalCheckOut: '19:00',
        recordedExtraHours: 2,
        claimedExtraHours: 3,
        supportedExtraHours: 2,
        hadSupervisorEdit: false,
        explanation: 'Shift receipt (09:00–19:00) covers 2h of the 3h claimed.',
      },
      resolutionStatus: 'pending',
      createdAt: '2026-10-25T14:20:00Z',
      kind: 'overtime_claim',
    },
    {
      id: 'claim-lakshmi-1',
      workerId: 'w-lakshmi',
      workerName: 'Lakshmi S.',
      workplaceId: 'wp-campus',
      date: '2026-10-25',
      extraHours: 6,
      reason: 'Morning relief guard arrived late after festival weekend',
      detectedLanguage: 'ta',
      matchStatus: 'partly_supported',
      supportedHours: 5.5,
      evidence: {
        shiftDate: '2026-10-25',
        recordedCheckIn: '20:00',
        recordedCheckOut: '09:30',
        originalCheckOut: '09:30',
        recordedExtraHours: 5.5,
        claimedExtraHours: 6,
        supportedExtraHours: 5.5,
        hadSupervisorEdit: false,
        explanation: 'Shift receipt (20:00–09:30) covers 5.5h of the 6h claimed.',
      },
      resolutionStatus: 'pending',
      createdAt: '2026-10-26T10:15:00Z',
      kind: 'overtime_claim',
    },
  ];

  // Hazards:
  // - Scaffold B has 4 near-misses in the last 10 days -> hotspot (>= 3)
  // - One critical electrical hazard is past its deadline -> escalated
  // - Hostel Block A has an exposed-wiring hazard that has been acknowledged
  const scafFloor = evaluateSeverityFloor('construction', 'scaffold', 'medium');
  const elecFloor = evaluateSeverityFloor('construction', 'electrical', 'critical');
  const fallFloor = evaluateSeverityFloor('construction', 'fall_from_height', 'low');
  const campusElecFloor = evaluateSeverityFloor('campus', 'electrical', 'medium');
  const campusLabFloor = evaluateSeverityFloor('campus', 'chemical_lab', 'high');

  const hazards: HazardReport[] = [
    {
      id: 'haz-tb-1',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      zoneId: 'z-basement',
      zoneName: 'Basement',
      workerId: 'w-senthil',
      hazardType: 'electrical',
      description: 'Water seepage near temporary 415V distribution box without rubber mat',
      englishSummary: 'Live 415V junction box exposed to water pooling in basement Pump Room.',
      aiSeverity: 'critical',
      floorSeverity: elecFloor.floorSeverity,
      finalSeverity: elecFloor.finalSeverity,
      floorApplied: elecFloor.floorApplied,
      ruleRef: elecFloor.ruleRef,
      status: 'received',
      createdAt: '2026-10-26T06:00:00Z',
      deadlineAt: '2026-10-26T08:00:00Z', // Past deadline -> Escalated!
      detectedLanguage: 'ta',
    },
    {
      id: 'haz-tb-scaf-1',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      zoneId: 'z-scaffold-b',
      zoneName: 'Scaffold B',
      workerId: 'w-murugan',
      hazardType: 'scaffold',
      description: '4வது மாடி சாரக்கட்டில் தடுப்பு கம்பி (guardrail) கழன்று உள்ளது',
      englishSummary: 'Loose outer guardrail coupler on 4th-level Scaffold B platform.',
      aiSeverity: 'medium',
      floorSeverity: scafFloor.floorSeverity,
      finalSeverity: scafFloor.finalSeverity,
      floorApplied: scafFloor.floorApplied,
      ruleRef: scafFloor.ruleRef,
      status: 'received',
      createdAt: '2026-10-26T15:00:00Z',
      deadlineAt: '2026-10-28T15:00:00Z',
      detectedLanguage: 'ta',
    },
    {
      id: 'haz-tb-scaf-2',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      zoneId: 'z-scaffold-b',
      zoneName: 'Scaffold B',
      workerId: 'w-rajesh',
      hazardType: 'fall_from_height',
      description: 'स्कैफोल्ड B पर लाइफलाइन रस्सी का हुक टूटा हुआ है',
      englishSummary: 'Safety harness lifeline anchor hook damaged on Scaffold B east face.',
      aiSeverity: 'low',
      floorSeverity: fallFloor.floorSeverity,
      finalSeverity: fallFloor.finalSeverity,
      floorApplied: fallFloor.floorApplied,
      ruleRef: fallFloor.ruleRef,
      status: 'acknowledged',
      createdAt: '2026-10-24T11:00:00Z',
      acknowledgedAt: '2026-10-24T12:30:00Z',
      deadlineAt: '2026-10-28T11:00:00Z',
      detectedLanguage: 'hi',
    },
    {
      id: 'haz-tb-scaf-3',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      zoneId: 'z-scaffold-b',
      zoneName: 'Scaffold B',
      hazardType: 'scaffold',
      description: 'Wet wooden plank slipping near Scaffold B ladder access',
      englishSummary: 'Unsecured wet toe-board plank at Scaffold B access ladder.',
      aiSeverity: 'high',
      floorSeverity: scafFloor.floorSeverity,
      finalSeverity: scafFloor.finalSeverity,
      floorApplied: scafFloor.floorApplied,
      ruleRef: scafFloor.ruleRef,
      status: 'resolved',
      createdAt: '2026-10-21T09:00:00Z',
      acknowledgedAt: '2026-10-21T10:00:00Z',
      resolvedAt: '2026-10-21T16:00:00Z',
      deadlineAt: '2026-10-22T09:00:00Z',
      detectedLanguage: 'en',
    },
    {
      id: 'haz-tb-scaf-4',
      workplaceId: 'wp-tower-b',
      sector: 'construction',
      zoneId: 'z-scaffold-b',
      zoneName: 'Scaffold B',
      hazardType: 'fall_from_height',
      description: 'Debris net gap between 3rd and 4th floor on Scaffold B',
      englishSummary: 'Gap in catch netting below Scaffold B bricklaying bay.',
      aiSeverity: 'medium',
      floorSeverity: fallFloor.floorSeverity,
      finalSeverity: fallFloor.finalSeverity,
      floorApplied: fallFloor.floorApplied,
      ruleRef: fallFloor.ruleRef,
      status: 'acknowledged',
      createdAt: '2026-10-23T14:00:00Z',
      acknowledgedAt: '2026-10-23T15:10:00Z',
      deadlineAt: '2026-10-29T14:00:00Z',
      detectedLanguage: 'en',
    },
    {
      id: 'haz-cp-hostel-1',
      workplaceId: 'wp-campus',
      sector: 'campus',
      zoneId: 'z-hostel-a',
      zoneName: 'Hostel Block A',
      workerId: 'w-lakshmi',
      hazardType: 'electrical',
      description: 'हॉस्टल ब्लॉक A में बिजली का तार खुला लटक रहा है',
      englishSummary:
        'Exposed live electrical wire hanging near Hostel Block A ground-floor corridor.',
      aiSeverity: 'medium',
      floorSeverity: campusElecFloor.floorSeverity,
      finalSeverity: campusElecFloor.finalSeverity,
      floorApplied: campusElecFloor.floorApplied,
      ruleRef: campusElecFloor.ruleRef,
      status: 'acknowledged',
      createdAt: '2026-10-26T21:00:00Z',
      acknowledgedAt: '2026-10-26T22:15:00Z',
      deadlineAt: '2026-10-28T21:00:00Z',
      detectedLanguage: 'hi',
    },
    {
      id: 'haz-cp-labs-1',
      workplaceId: 'wp-campus',
      sector: 'campus',
      zoneId: 'z-labs',
      zoneName: 'Labs',
      workerId: 'w-deepa',
      hazardType: 'chemical_lab',
      description: 'Fume hood exhaust fan tripping repeatedly in Chemistry Lab 2',
      englishSummary: 'Exhaust ventilation fan failure in Chemistry Lab 2 solvent storage area.',
      aiSeverity: 'high',
      floorSeverity: campusLabFloor.floorSeverity,
      finalSeverity: campusLabFloor.finalSeverity,
      floorApplied: campusLabFloor.floorApplied,
      ruleRef: campusLabFloor.ruleRef,
      status: 'received',
      createdAt: '2026-10-27T04:00:00Z',
      deadlineAt: '2026-10-28T04:00:00Z',
      detectedLanguage: 'en',
    },
  ];

  // Feedback:
  // - Construction group ('wp-tower-b', 'Structural Crew') has 6 responses -> visible (>= 5)
  // - Campus group ('wp-campus', 'Campus Security & Operations') has 3 responses -> hidden (< 5)
  const feedback: AnonymousFeedbackEntry[] = [
    {
      id: 'fb-tb-1',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText:
        'சனிக்கிழமை மாலை கூடுதல் நேரம் வேலை செய்தாலும் பதிவேட்டில் குறைத்து எழுதப்படுகிறது.',
      cleanTextEnglish:
        'Evening overtime hours on Saturdays are being recorded lower than actual checkout times.',
      removed: ['name', 'time'],
      themes: ['overtime_pay', 'supervisor_conduct'],
      sentiment: -0.7,
      createdAt: '2026-10-22T18:00:00Z',
    },
    {
      id: 'fb-tb-2',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText:
        'धूप में काम करते समय ऊपरी मंजिल पर पीने के पानी का ड्रम दोपहर तक खाली हो जाता है।',
      cleanTextEnglish:
        'Drinking water drums on upper floors run empty by afternoon during hot shifts.',
      removed: ['place'],
      themes: ['drinking_water_toilets', 'rest_breaks'],
      sentiment: -0.6,
      createdAt: '2026-10-23T17:30:00Z',
    },
    {
      id: 'fb-tb-3',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText:
        'Safety harness straps on the upper scaffold need replacement before monsoon winds.',
      cleanTextEnglish:
        'Safety harness straps on the upper scaffold need replacement before monsoon winds.',
      removed: ['name'],
      themes: ['safety_gear'],
      sentiment: -0.5,
      createdAt: '2026-10-24T16:10:00Z',
    },
    {
      id: 'fb-tb-4',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText:
        'Supervisor asks workers to sign paper sheet without showing overtime calculation.',
      cleanTextEnglish:
        'Supervisor asks workers to sign paper sheet without showing overtime calculation.',
      removed: ['name', 'personal_detail'],
      themes: ['overtime_pay', 'supervisor_conduct'],
      sentiment: -0.8,
      createdAt: '2026-10-25T19:00:00Z',
    },
    {
      id: 'fb-tb-5',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText: 'மதிய உணவு இடைவேளை கான்கிரீட் ஊற்றும் நாட்களில் 15 நிமிடமாகக் குறைக்கப்படுகிறது.',
      cleanTextEnglish:
        'Lunch rest break is cut short to 15 minutes on slab concrete pouring days.',
      removed: ['name', 'time'],
      themes: ['rest_breaks'],
      sentiment: -0.6,
      createdAt: '2026-10-26T18:20:00Z',
    },
    {
      id: 'fb-tb-6',
      workplaceId: 'wp-tower-b',
      team: 'Structural Crew',
      cleanText: 'कैंटीन और उपकरण के नाम पर बिना बताए पैसे काटे जा रहे हैं।',
      cleanTextEnglish: 'Wage deductions are being made for equipment without clear explanation.',
      removed: ['name'],
      themes: ['overtime_pay'],
      sentiment: -0.75,
      createdAt: '2026-10-26T20:00:00Z',
    },
    // Campus: 3 responses (below 5 threshold)
    {
      id: 'fb-cp-1',
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      cleanText:
        'Night shift guards are scheduled 7 nights continuously without a rotation day off.',
      cleanTextEnglish:
        'Night shift guards are scheduled 7 nights continuously without a rotation day off.',
      removed: ['name', 'place'],
      themes: ['shift_scheduling', 'rest_breaks'],
      sentiment: -0.7,
      createdAt: '2026-10-24T08:30:00Z',
    },
    {
      id: 'fb-cp-2',
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      cleanText: 'இரவுப் பணியில் குடிநீர் மற்றும் தேநீர் வசதி விடுதிப் பகுதியில் இல்லை.',
      cleanTextEnglish:
        'Drinking water and hot tea are unavailable near hostel gates during night duty.',
      removed: ['place'],
      themes: ['drinking_water_toilets'],
      sentiment: -0.5,
      createdAt: '2026-10-25T07:45:00Z',
    },
    {
      id: 'fb-cp-3',
      workplaceId: 'wp-campus',
      team: 'Campus Security & Operations',
      cleanText: 'When morning relief is late, extra morning hours are not added to monthly slip.',
      cleanTextEnglish:
        'When morning relief is late, extra morning hours are not added to monthly slip.',
      removed: ['name', 'time'],
      themes: ['overtime_pay', 'shift_scheduling'],
      sentiment: -0.65,
      createdAt: '2026-10-26T09:10:00Z',
    },
  ];

  return {
    workplaces,
    workers,
    chains,
    deductions,
    claims,
    notifications,
    hazards,
    feedback,
  };
}
