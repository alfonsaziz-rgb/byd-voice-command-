export interface CommandMapping {
  id: string;
  chinese: string;
  pinyin: string;
  arabic: string;
  english: string;
  keywords: string[];
}

export const COMMAND_DATABASE: CommandMapping[] = [
  {
    id: 'open_all_windows',
    chinese: '打开所有车窗',
    pinyin: 'Dǎkāi suǒyǒu chēchuāng',
    arabic: 'افتح جميع النوافذ',
    english: 'Open all windows',
    keywords: ['open', 'windows', 'افتح', 'شباك', 'شبابيك', 'سكر'],
  },
  {
    id: 'close_all_windows',
    chinese: '关闭所有车窗',
    pinyin: 'Guānbì suǒyǒu chēchuāng',
    arabic: 'اغلق جميع النوافذ',
    english: 'Close all windows',
    keywords: ['close', 'shut', 'windows', 'سكر', 'اغلق', 'شبابيك'],
  },
  {
    id: 'open_sunroof',
    chinese: '打开天窗',
    pinyin: 'Dǎkāi tiānchuāng',
    arabic: 'افتح فتحة السقف',
    english: 'Open sunroof',
    keywords: ['sunroof', 'open', 'فتحة', 'سقف', 'افتح'],
  },
  {
    id: 'close_sunroof',
    chinese: '关闭天窗',
    pinyin: 'Guānbì tiānchuāng',
    arabic: 'اغلق حاتبة السقف',
    english: 'Close sunroof',
    keywords: ['sunroof', 'close', 'فتحة', 'سقف', 'سكر', 'اغلق'],
  },
  {
    id: 'ac_on',
    chinese: '打开空调',
    pinyin: 'Dǎkāi kōngtiáo',
    arabic: 'شغل المكيف',
    english: 'Turn on AC',
    keywords: ['ac', 'air', 'conditioning', 'on', 'cool', 'شغل', 'مكيف', 'تبريد'],
  },
  {
    id: 'ac_off',
    chinese: '关闭空调',
    pinyin: 'Guānbì kōngtiáo',
    arabic: 'اطفي المكيف',
    english: 'Turn off AC',
    keywords: ['ac', 'off', 'stop', 'مكيف', 'اطفي', 'بند'],
  },
  {
    id: 'temp_up',
    chinese: '调高温度',
    pinyin: 'Tiáogāo wēndù',
    arabic: 'ارفع درجة الحرارة',
    english: 'Increase temperature',
    keywords: ['hotter', 'increase', 'temperature', 'warm', 'ارفع', 'حرارة', 'بردان', 'برد'],
  },
  {
    id: 'temp_down',
    chinese: '调低温度',
    pinyin: 'Tiáodī wēndù',
    arabic: 'خفض درجة الحرارة',
    english: 'Decrease temperature',
    keywords: ['colder', 'decrease', 'temperature', 'cool', 'نزل', 'خفض', 'حرارة', 'حار', 'فطست'],
  },
  {
    id: 'open_trunk',
    chinese: '打开后备箱',
    pinyin: 'Dǎkāi hòubèixiāng',
    arabic: 'افتح الشنطة',
    english: 'Open trunk',
    keywords: ['trunk', 'boot', 'open', 'شنطة', 'خلفي', 'دبة'],
  },
  {
    id: 'max_cooling',
    chinese: '开启极速制冷',
    pinyin: 'Kāiqǐ jísù zhìlěng',
    arabic: 'تبريد سريع',
    english: 'Max cooling',
    keywords: ['max', 'cooling', 'fast', 'ثلج', 'تبريد', 'اقوى'],
  },
  {
    id: 'navi_home',
    chinese: '导航回家',
    pinyin: 'Dǎoháng huíjiā',
    arabic: 'وديني البيت',
    english: 'Navigate home',
    keywords: ['home', 'navigate', 'go', 'بيت', 'منزل', 'البيت', 'روح'],
  },
  {
    id: 'ventilation',
    chinese: '开启座椅通风',
    pinyin: 'Kāiqǐ zuòyǐ tōngfēng',
    arabic: 'تهوية المقاعد',
    english: 'Seat ventilation',
    keywords: ['seat', 'cool', 'ventilation', 'كراسي', 'مقاعد', 'تبريد', 'مروحة'],
  },
  {
    id: 'wake_up',
    chinese: '你好，小迪',
    pinyin: 'Nǐ hǎo, xiǎo dí',
    arabic: 'مرحباً بي واي دي',
    english: 'Hello BYD',
    keywords: ['byd', 'بي واي دي', 'بي وايدي', 'بي اودي', 'بي وايد', 'hey byd', 'hello byd', 'b y d', 'بيعدي', 'بي عدي', 'بيعدي'],
  }
];
