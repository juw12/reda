// Facts and reference content. Every medical statement here follows the
// EAACI/GA²LEN/EuroGuiDerm/APAAACI urticaria guideline (Zuberbier et al., Allergy 2022)
// and the BAD chronic urticaria guideline 2021. Text is { id, en }.

export const UAS_WHEALS = [
  { v: 0, id: 'Tidak ada', en: 'None', hint: { id: '0 bentol', en: '0 wheals' } },
  { v: 1, id: 'Ringan', en: 'Mild', hint: { id: 'kurang dari 20 dalam 24 jam', en: 'fewer than 20 in 24 h' } },
  { v: 2, id: 'Sedang', en: 'Moderate', hint: { id: '20 sampai 50 dalam 24 jam', en: '20 to 50 in 24 h' } },
  { v: 3, id: 'Berat', en: 'Intense', hint: { id: 'lebih dari 50, atau bentol besar menyatu', en: 'more than 50, or large merged areas' } },
];

export const UAS_ITCH = [
  { v: 0, id: 'Tidak gatal', en: 'None', hint: { id: 'tidak gatal sama sekali', en: 'no itch at all' } },
  { v: 1, id: 'Ringan', en: 'Mild', hint: { id: 'ada, tapi tidak mengganggu', en: 'present but not annoying' } },
  { v: 2, id: 'Sedang', en: 'Moderate', hint: { id: 'mengganggu, tapi aktivitas dan tidur tetap jalan', en: 'troublesome, but daily life and sleep go on' } },
  { v: 3, id: 'Berat', en: 'Intense', hint: { id: 'mengganggu aktivitas atau tidur', en: 'disturbs daily life or sleep' } },
];

export const BAND_TEXT = {
  free: { id: 'Bebas bentol & gatal', en: 'Itch- and wheal-free' },
  well: { id: 'Terkontrol baik', en: 'Well controlled' },
  mild: { id: 'Aktivitas ringan', en: 'Mild activity' },
  moderate: { id: 'Aktivitas sedang', en: 'Moderate activity' },
  severe: { id: 'Aktivitas berat', en: 'Severe activity' },
};

// Things people log. Grouped so the chip list stays scannable.
export const FACTOR_GROUPS = [
  {
    id: 'body',
    label: { id: 'Tubuh & kulit', en: 'Body & skin' },
    items: [
      { id: 'heat', id_: 'Panas / mandi air panas', en: 'Heat / hot shower' },
      { id: 'sweat', id_: 'Keringat / olahraga', en: 'Sweat / exercise' },
      { id: 'tight', id_: 'Baju ketat / tekanan tas', en: 'Tight clothes / bag strap' },
      { id: 'scratch', id_: 'Menggaruk / gesekan', en: 'Scratching / rubbing' },
      { id: 'cold', id_: 'Dingin / AC / air dingin', en: 'Cold / AC / cold water' },
      { id: 'sun', id_: 'Sinar matahari', en: 'Sunlight' },
    ],
  },
  {
    id: 'intake',
    label: { id: 'Makan, minum, obat', en: 'Food, drink, medicine' },
    items: [
      { id: 'nsaid', id_: 'Obat nyeri (ibuprofen, aspirin, asam mefenamat)', en: 'Painkiller (ibuprofen, aspirin, mefenamic acid)' },
      { id: 'alcohol', id_: 'Alkohol', en: 'Alcohol' },
      { id: 'spicy', id_: 'Makanan pedas', en: 'Spicy food' },
      { id: 'seafood', id_: 'Seafood', en: 'Seafood' },
      { id: 'new-med', id_: 'Obat / suplemen baru', en: 'New medicine / supplement' },
    ],
  },
  {
    id: 'life',
    label: { id: 'Hari ini', en: 'Today' },
    items: [
      { id: 'stress', id_: 'Stres', en: 'Stress' },
      { id: 'poor-sleep', id_: 'Kurang tidur', en: 'Poor sleep' },
      { id: 'infection', id_: 'Sedang flu / batuk / sakit', en: 'Cold, cough or illness' },
      { id: 'period', id_: 'Menstruasi', en: 'Period' },
    ],
  },
];

export const FACTOR_IDS = FACTOR_GROUPS.flatMap((group) => group.items.map((item) => item.id));

export function factorLabel(id, lang) {
  if (id.startsWith('food:')) return id.slice(5);
  for (const group of FACTOR_GROUPS) {
    const item = group.items.find((entry) => entry.id === id);
    if (item) return lang === 'id' ? item.id_ : item.en;
  }
  return id;
}

// Second-generation H1 antihistamines, standard licensed adult once-daily dose.
export const DRUGS = [
  { id: 'cetirizine', name: 'Cetirizine', dose: '10 mg' },
  { id: 'levocetirizine', name: 'Levocetirizine', dose: '5 mg' },
  { id: 'loratadine', name: 'Loratadine', dose: '10 mg' },
  { id: 'desloratadine', name: 'Desloratadine', dose: '5 mg' },
  { id: 'fexofenadine', name: 'Fexofenadine', dose: '180 mg' },
  { id: 'bilastine', name: 'Bilastine', dose: '20 mg' },
  { id: 'rupatadine', name: 'Rupatadine', dose: '10 mg' },
];

export const LADDER = [
  {
    step: 1,
    title: { id: 'Antihistamin generasi 2, dosis standar', en: 'Second-generation antihistamine, standard dose' },
    body: {
      id: 'Satu tablet sehari, setiap hari, bukan hanya saat kambuh. Nilai lagi setelah 2 sampai 4 minggu.',
      en: 'One tablet a day, every day, not only on bad days. Review after 2 to 4 weeks.',
    },
  },
  {
    step: 2,
    title: { id: 'Naikkan dosis sampai 4x', en: 'Up-dose to as much as 4x' },
    body: {
      id: 'Obat yang sama, sampai 4 tablet sehari. Hanya atas saran dokter.',
      en: 'Same medicine, up to 4 tablets a day. Only on a doctor’s advice.',
    },
  },
  {
    step: 3,
    title: { id: 'Tambah omalizumab', en: 'Add omalizumab' },
    body: {
      id: 'Suntikan tiap 4 minggu dari dokter spesialis, ditambahkan ke antihistamin.',
      en: 'An injection every 4 weeks from a specialist, added to the antihistamine.',
    },
  },
  {
    step: 4,
    title: { id: 'Tambah siklosporin', en: 'Add ciclosporin' },
    body: {
      id: 'Untuk yang belum terkontrol dengan omalizumab. Perlu pemantauan dokter spesialis.',
      en: 'If omalizumab is not enough. Needs specialist monitoring.',
    },
  },
];

export const AVOID = [
  {
    id: { id: 'Obat nyeri golongan NSAID: ibuprofen, aspirin, asam mefenamat, diklofenak, naproksen. Parasetamol biasanya aman.', en: 'NSAID painkillers: ibuprofen, aspirin, mefenamic acid, diclofenac, naproxen. Paracetamol is usually fine.' },
  },
  { id: { id: 'Alkohol.', en: 'Alcohol.' } },
  { id: { id: 'Panas berlebih: mandi air panas, kamar pengap.', en: 'Too much heat: hot showers, stuffy rooms.' } },
  { id: { id: 'Baju ketat, tali tas berat, ikat pinggang kencang.', en: 'Tight clothes, heavy bag straps, tight belts.' } },
  { id: { id: 'Stres berat dan kurang tidur.', en: 'Heavy stress and poor sleep.' } },
  {
    id: {
      id: 'Obat tekanan darah berakhiran -pril (misalnya kaptopril) bisa memicu bengkak. Jangan berhenti sendiri, bicarakan dengan dokter.',
      en: 'Blood-pressure medicines ending in -pril (e.g. captopril) can trigger swelling. Do not stop them yourself; talk to your doctor.',
    },
  },
];

export const COMFORT = [
  { id: { id: 'Kompres dingin 10 sampai 15 menit di area gatal.', en: 'Cool compress for 10 to 15 minutes on itchy skin.' } },
  { id: { id: 'Losion kalamin atau bedak dingin.', en: 'Calamine lotion or cooling powder.' } },
  { id: { id: 'Mandi air hangat-suam, bukan panas.', en: 'Lukewarm showers, not hot.' } },
  { id: { id: 'Baju katun longgar.', en: 'Loose cotton clothes.' } },
  { id: { id: 'Kuku pendek; tekan atau tepuk, jangan garuk.', en: 'Short nails; press or pat instead of scratching.' } },
  { id: { id: 'Pelembap tanpa pewangi.', en: 'Fragrance-free moisturiser.' } },
];

export const DONT = [
  {
    id: {
      id: 'Steroid jangka panjang, termasuk obat racikan yang berisi deksametason. Cepat meredakan, tapi bentol kembali dan efek sampingnya serius. Hanya kursus singkat saat kambuh berat, dari dokter.',
      en: 'Long-term steroids, including mixed "racikan" pills that contain dexamethasone. They work fast, but the hives come back and side effects are serious. Only short courses for bad flares, from a doctor.',
    },
  },
  {
    id: {
      id: 'Antihistamin generasi 1 (misalnya CTM / klorfeniramin) sebagai obat harian. Membuat kantuk dan tidak dianjurkan pedoman.',
      en: 'First-generation antihistamines (e.g. chlorpheniramine, "CTM") as the daily medicine. They cause drowsiness and the guideline advises against them.',
    },
  },
  {
    id: {
      id: 'Berpantang banyak makanan tanpa bukti. Makanan jarang menjadi penyebab biduran kronis.',
      en: 'Cutting out lots of foods without evidence. Food is rarely the cause of chronic hives.',
    },
  },
];

export const RED_FLAGS = [
  { id: 'Bibir, lidah atau tenggorokan bengkak', en: 'Swollen lips, tongue or throat' },
  { id: 'Sesak napas, mengi, atau sulit menelan', en: 'Trouble breathing, wheezing or swallowing' },
  { id: 'Pusing berat atau pingsan', en: 'Dizziness or fainting' },
  { id: 'Muntah bersama bentol', en: 'Vomiting together with the hives' },
];

export const DOCTOR_TESTS = [
  { id: 'Darah lengkap (hitung jenis)', en: 'Full blood count with differential' },
  { id: 'CRP atau LED (penanda radang)', en: 'CRP or ESR (inflammation)' },
  { id: 'IgG anti-TPO (tiroid)', en: 'IgG anti-TPO (thyroid antibodies)' },
  { id: 'IgE total', en: 'Total IgE' },
];

export const DOCTOR_QUESTIONS = [
  { id: 'Antihistamin mana dan berapa tablet sehari untuk saya?', en: 'Which antihistamine and how many tablets a day for me?' },
  { id: 'Kalau belum terkontrol setelah 2 sampai 4 minggu, langkah berikutnya apa?', en: 'If it is not controlled after 2 to 4 weeks, what is the next step?' },
  { id: 'Perlukah tes darah (darah lengkap, CRP, anti-TPO, IgE total)?', en: 'Do I need blood tests (blood count, CRP, anti-TPO, total IgE)?' },
  { id: 'Apakah obat rutin saya ada yang bisa memperburuk biduran?', en: 'Could any of my regular medicines make the hives worse?' },
  { id: 'Kapan dan bagaimana menurunkan dosis kalau sudah terkontrol?', en: 'When and how do I step down once it is controlled?' },
];

// Reference photos: Wikimedia Commons, freely licensed. Shown with credit.
export const PHOTOS = {
  'dermo-writing': { file: 'assets/ref/dermo-writing.jpg', author: 'Mysid', license: 'Public domain', page: 'https://commons.wikimedia.org/wiki/File:Dermatographic_urticaria.jpg' },
  'dermo-back': { file: 'assets/ref/dermo-back.jpg', author: 'Nandini Velho', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Dermographism_back.jpg' },
  'cold-ice': { file: 'assets/ref/cold-ice.jpg', author: 'Allergyresearch', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Cold_urticaria_inducible.jpg' },
  'cold-arm': { file: 'assets/ref/cold-arm.jpg', author: 'SecretName101', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Cold_urticaria_IMG_3728.jpg' },
  'pressure-test': { file: 'assets/ref/pressure-test.jpg', author: 'Allergyresearch (Magerl)', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Test_pressure_urticaria_2_Copyright_Magerl.jpg' },
  'pressure-back': { file: 'assets/ref/pressure-back.jpg', author: 'Genzpro', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pressure_Urticaria_Symptoms.jpg' },
  cholinergic: { file: 'assets/ref/cholinergic.jpg', author: 'PKeMcG', license: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:A_male_displaying_cholinergic_urticaria_on_the_volar_aspect_of_the_forearm.jpg' },
  'hives-back': { file: 'assets/ref/hives-back.jpg', author: 'Psixtras', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Hives_urticaria.jpg' },
  'hives-arm': { file: 'assets/ref/hives-arm.jpg', author: 'Heckat', license: 'Public domain', page: 'https://commons.wikimedia.org/wiki/File:Urticaria_arm.jpg' },
  'hives-torso': { file: 'assets/ref/hives-torso.jpg', author: 'Wikimedia Commons user', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Urticaria12.2024.jpg' },
  'angio-lip': { file: 'assets/ref/angio-face.jpg', author: 'Boussetta N. et al.', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Angioedema_of_the_face.jpg' },
  'angio-eye': { file: 'assets/ref/angio-lip.jpg', author: 'Ravn', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Angioedema.jpg' },
};

// Self-tests for inducible (physical) urticaria. Home versions of the guideline provocation tests.
// timers: seconds; `read` = wait before reading the result.
export const TESTS = [
  {
    id: 'dermo',
    name: { id: 'Tes garukan (dermografisme)', en: 'Scratch test (dermographism)' },
    checks: { id: 'Apakah gesekan atau garukan memicu bentol.', en: 'Whether rubbing or scratching sets off wheals.' },
    common: { id: 'Jenis biduran fisik yang paling sering.', en: 'The most common physical type.' },
    safety: null,
    steps: [
      { id: 'Pilih kulit lengan bawah bagian dalam yang sedang bersih dari bentol.', en: 'Pick clear skin on the inner forearm.' },
      { id: 'Gores kulit dengan tekanan sedang memakai benda tumpul (tutup pulpen atau kuku), sepanjang 5 sampai 10 cm.', en: 'Stroke the skin firmly with something blunt (pen cap or fingernail), 5 to 10 cm long.' },
      { id: 'Tunggu 10 menit. Jangan digaruk.', en: 'Wait 10 minutes. Do not scratch.' },
    ],
    timer: { read: 600 },
    positive: { id: 'Garis merah menonjol dan gatal persis di jalur goresan.', en: 'A raised, itchy red line exactly along the stroke.' },
    negative: { id: 'Hanya garis merah datar atau putih yang hilang cepat. Itu normal.', en: 'Only a flat red or white line that fades fast. That is normal.' },
    photos: ['dermo-writing', 'dermo-back'],
    ifPositive: {
      id: 'Pakai baju longgar, hindari menggaruk, dan beri tahu dokter. Dokter bisa memastikan dengan alat FricTest.',
      en: 'Wear loose clothes, avoid scratching, and tell your doctor. A doctor can confirm with a FricTest device.',
    },
  },
  {
    id: 'cold',
    name: { id: 'Tes es batu (dingin)', en: 'Ice cube test (cold)' },
    checks: { id: 'Apakah dingin memicu bentol.', en: 'Whether cold sets off wheals.' },
    common: { id: 'Cukup sering, terutama setelah berenang atau kena AC.', en: 'Fairly common, often noticed after swimming or AC.' },
    safety: {
      id: 'Jangan lakukan jika pernah sesak, pingsan atau bengkak tenggorokan karena dingin atau berenang. Itu urusan dokter.',
      en: 'Skip this if cold or swimming has ever made you short of breath, faint, or swell in the throat. That is for a doctor.',
    },
    steps: [
      { id: 'Masukkan es batu ke kantong plastik tipis.', en: 'Put an ice cube in a thin plastic bag.' },
      { id: 'Tempelkan di lengan bawah bagian dalam selama 5 menit.', en: 'Hold it on the inner forearm for 5 minutes.' },
      { id: 'Angkat, lalu tunggu 10 menit sambil kulit menghangat.', en: 'Remove it and wait 10 minutes while the skin warms up.' },
    ],
    timer: { apply: 300, read: 600 },
    positive: { id: 'Bentol menonjol berbentuk kotak seukuran es batu.', en: 'A raised wheal in the square shape of the ice cube.' },
    negative: { id: 'Kulit hanya merah sebentar lalu normal.', en: 'Skin is briefly red, then normal.' },
    photos: ['cold-ice', 'cold-arm'],
    ifPositive: {
      id: 'Hati-hati saat berenang, minum es, dan masuk ruangan dingin. Jangan berenang sendirian. Beri tahu dokter; mungkin perlu obat darurat.',
      en: 'Take care with swimming, iced drinks and cold rooms. Never swim alone. Tell your doctor; you may need emergency medicine.',
    },
  },
  {
    id: 'pressure',
    name: { id: 'Tes tekanan (tali tas)', en: 'Pressure test (bag strap)' },
    checks: { id: 'Apakah tekanan lama memicu bengkak dalam beberapa jam.', en: 'Whether long pressure causes deep swelling hours later.' },
    common: { id: 'Bengkak muncul terlambat, sering di bahu, telapak kaki atau pinggang.', en: 'The swelling is delayed, often on shoulders, soles or waist.' },
    safety: null,
    steps: [
      { id: 'Isi tas dengan sekitar 7 kg (misalnya 7 botol air 1 liter).', en: 'Fill a bag with about 7 kg (e.g. seven 1-litre bottles of water).' },
      { id: 'Gantungkan talinya di bahu atau paha selama 15 menit.', en: 'Hang the strap over your shoulder or thigh for 15 minutes.' },
      { id: 'Periksa bekas tekanan setelah sekitar 6 jam.', en: 'Check the pressed spot after about 6 hours.' },
    ],
    timer: { apply: 900 },
    positive: { id: 'Bengkak dalam, kemerahan dan nyeri atau gatal di bekas tali, muncul beberapa jam kemudian.', en: 'Deep, red, sore or itchy swelling where the strap pressed, hours later.' },
    negative: { id: 'Hanya bekas tali biasa yang hilang dalam setengah jam.', en: 'Just a normal strap mark that fades within half an hour.' },
    photos: ['pressure-test', 'pressure-back'],
    ifPositive: {
      id: 'Pakai tali tas lebar, ganti bahu, hindari ikat pinggang kencang. Beri tahu dokter.',
      en: 'Use wide straps, switch shoulders, avoid tight belts. Tell your doctor.',
    },
  },
  {
    id: 'heat',
    name: { id: 'Tes hangat (panas)', en: 'Warm test (heat)' },
    checks: { id: 'Apakah panas di satu titik memicu bentol.', en: 'Whether heat on one spot sets off wheals.' },
    common: { id: 'Jarang.', en: 'Rare.' },
    safety: { id: 'Air hangat, bukan mendidih. Sekitar 44°C: hangat tapi masih nyaman disentuh.', en: 'Warm water, not boiling. About 44°C: warm but still comfortable to touch.' },
    steps: [
      { id: 'Isi gelas atau botol logam dengan air hangat sekitar 44°C.', en: 'Fill a glass or metal bottle with water at about 44°C.' },
      { id: 'Tempelkan di lengan bawah bagian dalam selama 5 menit.', en: 'Hold it on the inner forearm for 5 minutes.' },
      { id: 'Angkat, tunggu 10 menit.', en: 'Remove it and wait 10 minutes.' },
    ],
    timer: { apply: 300, read: 600 },
    positive: { id: 'Bentol menonjol tepat seukuran dasar gelas.', en: 'A raised wheal the size of the glass base.' },
    negative: { id: 'Hanya merah hangat yang cepat hilang.', en: 'Only warm redness that fades quickly.' },
    photos: [],
    figure: 'heat',
    ifPositive: { id: 'Mandi air suam, hindari sumber panas langsung. Beri tahu dokter.', en: 'Use lukewarm water, avoid direct heat. Tell your doctor.' },
  },
  {
    id: 'cholinergic',
    name: { id: 'Tes keringat (kolinergik)', en: 'Sweat test (cholinergic)' },
    checks: { id: 'Apakah berkeringat memicu bentol kecil-kecil.', en: 'Whether sweating sets off tiny wheals.' },
    common: { id: 'Sering pada usia muda; muncul saat olahraga, mandi panas, makanan pedas atau tegang.', en: 'Common in young adults; shows up with exercise, hot showers, spicy food or nerves.' },
    safety: {
      id: 'Berhenti bila pusing, mengi atau sesak. Jangan lakukan sendirian jika pernah sesak saat olahraga.',
      en: 'Stop if you feel dizzy, wheezy or short of breath. Do not do it alone if exercise has ever made you breathless.',
    },
    steps: [
      { id: 'Olahraga ringan (lari di tempat, naik tangga) sampai berkeringat, 15 sampai 30 menit.', en: 'Exercise (jog on the spot, stairs) until you sweat, 15 to 30 minutes.' },
      { id: 'Perhatikan kulit selama berolahraga dan 15 menit sesudahnya.', en: 'Watch your skin during exercise and for 15 minutes after.' },
    ],
    timer: { apply: 900, read: 900 },
    positive: { id: 'Bentol kecil 1 sampai 3 mm, gatal atau perih, dengan lingkaran merah, terutama di dada dan lengan.', en: 'Tiny 1 to 3 mm itchy or prickly bumps with red halos, mostly on chest and arms.' },
    negative: { id: 'Kulit merah karena olahraga tanpa bentol.', en: 'Red from exercise, but no bumps.' },
    photos: ['cholinergic'],
    ifPositive: { id: 'Dinginkan tubuh perlahan, pakai baju yang menyerap keringat. Beri tahu dokter.', en: 'Cool down gradually and wear sweat-wicking clothes. Tell your doctor.' },
  },
  {
    id: 'sun',
    name: { id: 'Amati: sinar matahari', en: 'Observe: sunlight' },
    checks: { id: 'Apakah bentol muncul di kulit yang terkena matahari.', en: 'Whether wheals show up on sun-exposed skin.' },
    common: { id: 'Jarang. Jangan sengaja memancing; cukup amati.', en: 'Rare. Do not provoke it on purpose; just observe.' },
    safety: { id: 'Tes cahaya hanya dilakukan dokter dengan alat khusus.', en: 'Light testing is done only by doctors with special lamps.' },
    steps: [
      { id: 'Saat beraktivitas di luar, perhatikan kulit yang terbuka (lengan, leher).', en: 'When outdoors, watch exposed skin (arms, neck).' },
      { id: 'Catat jika bentol muncul dalam beberapa menit hanya di area yang terkena matahari.', en: 'Note if wheals appear within minutes only where the sun hit.' },
    ],
    timer: null,
    positive: { id: 'Bentol hanya di area terkena matahari, muncul dalam menit, hilang dalam jam.', en: 'Wheals only on sun-exposed skin, within minutes, gone within hours.' },
    negative: { id: 'Bentol muncul di mana saja, tidak terkait matahari.', en: 'Wheals anywhere, unrelated to sun.' },
    photos: [],
    figure: 'sun',
    ifPositive: { id: 'Pakai baju lengan panjang dan tabir surya. Beri tahu dokter.', en: 'Wear long sleeves and sunscreen. Tell your doctor.' },
  },
];

// "Is this biduran?" gallery.
export const LOOK = [
  { photo: 'hives-back', cap: { id: 'Bentol biduran: menonjol, merah atau pucat di tengah, gatal. Tiap bentol hilang dalam 24 jam.', en: 'Hives: raised, red or pale centre, itchy. Each wheal fades within 24 hours.' } },
  { photo: 'hives-arm', cap: { id: 'Bentol bisa menyatu membentuk peta.', en: 'Wheals can merge into map-like patches.' } },
  { photo: 'hives-torso', cap: { id: 'Bentol tersebar di badan.', en: 'Wheals spread over the body.' } },
  { photo: 'angio-lip', cap: { id: 'Angioedema: bengkak lebih dalam, sering di bibir atau kelopak mata, bisa 2 sampai 3 hari.', en: 'Angioedema: deeper swelling, often lips or eyelids, can last 2 to 3 days.' }, warn: true },
  { photo: 'angio-eye', cap: { id: 'Bengkak wajah. Jika lidah atau tenggorokan ikut bengkak, segera ke IGD.', en: 'Facial swelling. If the tongue or throat swells too, go to the ER now.' }, warn: true },
];

export const SOURCES = [
  { label: 'Zuberbier T. et al. EAACI/GA²LEN/EuroGuiDerm/APAAACI guideline for urticaria. Allergy 2022', url: 'https://onlinelibrary.wiley.com/doi/10.1111/all.15090' },
  { label: 'Sabroe R.A. et al. BAD guidelines for chronic urticaria 2021. Br J Dermatol 2022', url: 'https://academic.oup.com/bjd/article/186/3/398/6705777' },
  { label: 'Ryan D. et al. Management pathway for urticaria in primary care. Clin Transl Allergy 2022', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9533216/' },
];
