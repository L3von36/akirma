/**
 * AKIRMA EVENTS - data.js
 * Centralized data for all pages.
 */

const SERVICES = [
  { 
    id: 1, 
    name: 'Wedding Planning', 
    nameAm: 'የሰርግ ዝግጅት', 
    desc: 'Traditional and modern Ethiopian weddings tailored to your dreams.', 
    descAm: 'እንደ ህልምዎ የተዘጋጁ ባህላዊ እና ዘመናዊ የኢትዮጵያ ሰርጎች።', 
    iconName: 'Heart', 
    order: 1,
    features: ['Venue selection & setup', 'Traditional Habesha décor', 'Guest coordination', 'Photography & video liaison', 'Full day-of management'],
    iconPath: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z'
  },
  { 
    id: 2, 
    name: 'Corporate Events', 
    nameAm: 'የኮርፖሬት ዝግጅቶች', 
    desc: 'Professional conferences, product launches, and business meetings.', 
    descAm: 'ሙያዊ ኮንፈረንሶች፣ የምርት ማስጀመሪያዎች እና የንግድ ስብሰባዎች።', 
    iconName: 'Briefcase', 
    order: 2,
    features: ['Conference setup & AV', 'Branded stage & backdrop', 'Corporate catering', 'Live streaming support', 'Registration management'],
    iconPath: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114-48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z'
  },
  { 
    id: 3, 
    name: 'Cultural & Religious Events', 
    nameAm: 'ባህላዊ እና ሃይማኖታዊ', 
    desc: 'Timket, Meskel, holidays, and large-scale church gatherings.', 
    descAm: 'ጥምቀት፣ መስቀል፣ በዓላት እና ትላልቅ የቤተክርስቲያን ጉባኤዎች።', 
    iconName: 'Star', 
    order: 3,
    features: ['Traditional decorations', 'Cultural ceremony planning', 'Large crowd management', 'Religious protocol adherence', 'Sound system for ceremonies'],
    iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z'
  },
  { 
    id: 4, 
    name: 'Concerts & Festivals', 
    nameAm: 'ኮንሰርቶች እና ፌስቲቫሎች', 
    desc: 'Full-scale stage, sound, and crowd management for major events.', 
    descAm: 'ለታላላቅ ዝግጅቶች ሙሉ የመድረክ፣ የድምጽ እና የህዝብ አስተዳደር።', 
    iconName: 'Music', 
    order: 4,
    features: ['Stage design & construction', 'Professional sound engineering', 'Lighting rigs & effects', 'Artist coordination', 'Security & crowd control'],
    iconPath: 'm9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z'
  },
  { 
    id: 5, 
    name: 'Decoration & Setup', 
    nameAm: 'ዲኮር እና ቅንብር', 
    desc: 'Breathtaking venue design, lighting, and cultural aesthetics.', 
    descAm: 'አስደናቂ የቦታ ንድፍ፣ መብራት እና ባህላዊ ውበት።', 
    iconName: 'Palette', 
    order: 5,
    features: ['Floral arrangements', 'Custom stage backdrops', 'Table & chair styling', 'Entrance gate decoration', 'Balloon & fabric design'],
    iconPath: 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42'
  },
  { 
    id: 6, 
    name: 'Advert & Promotion', 
    nameAm: 'ማስታወቂያ እና ማስተዋወቂያ', 
    desc: 'Strategic marketing campaigns and promotional materials for your events.', 
    descAm: 'ለዝግጅቶችዎ ስልታዊ የግብይት ዘመቻዎች እና የማስተዋወቂያ ቁሳቁሶች።', 
    iconName: 'Megaphone', 
    order: 6,
    features: ['Event banner printing', 'Social media promotion', 'Digital invitations', 'Branded materials', 'Pre-event publicity'],
    iconPath: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46'
  },
  { 
    id: 7, 
    name: 'Event Organization', 
    nameAm: 'የዝግጅት አደረጃጀት', 
    desc: 'Complete end-to-end event planning and coordination services.', 
    descAm: 'ሙሉ ለሙሉ የዝግጅት እቅድ እና ቅንጅት አገልግሎቶች።', 
    iconName: 'Calendar', 
    order: 7,
    features: ['Full event timeline planning', 'Vendor management', 'On-site coordination team', 'Run-of-show management', 'Post-event reporting'],
    iconPath: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5'
  },
  { 
    id: 8, 
    name: 'Stage & Tent Rental', 
    nameAm: 'መድረክ እና ድንኳን ኪራይ', 
    desc: 'Professional stage setups and high-quality tent rentals.', 
    descAm: 'ፕሮፌሽናል የመድረክ ማዘጋጃ እና ከፍተኛ ጥራት ያለው የድንኳን ኪራይ።', 
    iconName: 'Home', 
    order: 8,
    features: ['Aluminum tent systems', 'Wooden & metal stages', 'Indoor/outdoor options', 'Delivery & setup included', 'Any event size capacity'],
    iconPath: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
  },
  { 
    id: 9, 
    name: 'Sound & Light Supply', 
    nameAm: 'ድምጽ እና መብራት አቅርቦት', 
    desc: 'State-of-the-art audio and lighting equipment for any event size.', 
    descAm: 'ለማንኛውም የዝግጅት መጠን ዘመናዊ የድምጽ እና የብርሃን መሳሪያዎች።', 
    iconName: 'Lightbulb', 
    order: 9,
    features: ['Line array speaker systems', 'Mixing consoles', 'LED wash & spot lights', 'Moving head fixtures', 'Trained sound engineers'],
    iconPath: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'
  },
  { 
    id: 10, 
    name: 'Chair & Table Supply', 
    nameAm: 'ወንበር እና ጠረጴዛ አቅርቦት', 
    desc: 'Elegant furniture rentals to accommodate all your guests.', 
    descAm: 'ሁሉንም እንግዶችዎን ለማስተናገድ የሚያምር የቤት ዕቃ ኪራይ።', 
    iconName: 'Armchair', 
    order: 10,
    features: ['Chiavari & banquet chairs', 'Round & rectangular tables', 'Chair & table covers', 'Delivery & collection', 'Up to 5,000 pieces available'],
    iconPath: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.006v1.902a2.25 2.25 0 0 1-1.883 2.22 17.93 17.93 0 0 1-6.617 0 2.25 2.25 0 0 1-1.883-2.22V10.5c0-.878.616-1.722 1.5-2.006M12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
  },
  { 
    id: 11, 
    name: 'Catering Supply', 
    nameAm: 'የምግብ አቅርቦት', 
    desc: 'Delicious catering services with traditional and modern cuisine.', 
    descAm: 'ባህላዊ እና ዘመናዊ ምግብ ያለው ጣፋጭ የምግብ አቅርቦት አገልግሎት።', 
    iconName: 'UtensilsCrossed', 
    order: 11,
    features: ['Traditional Ethiopian cuisine', 'International menu options', 'Trained serving staff', 'Buffet & plated service', 'Full kitchen equipment'],
    iconPath: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 4.5c0 1.036.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.839 1.875-1.875m-12 0v6.75c0 1.035.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.84 1.875-1.875v-6.75M5.25 12h13.5'
  },
  { 
    id: 12, 
    name: 'Kids Game Material Supply', 
    nameAm: 'የልጆች ጨዋታ እቃ አቅርቦት', 
    desc: 'Fun and safe entertainment equipment for children at your events.', 
    descAm: 'በዝግጅቶችዎ ላይ ለልጆች አስደሳች እና ደህንነቱ የተጠበቀ የመዝናኛ መሳሪያዎች።', 
    iconName: 'Baby', 
    order: 12,
    features: ['Inflatable bounce houses', 'Slides & obstacle courses', 'Face painting setup', 'Trained child supervisors', 'All safety certified'],
    iconPath: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z'
  },
];

const FEATURED_EVENTS = [
  { id: 1, title: 'AASTU Student Sport Opening Ceremony', titleAm: 'የአአሳይቶ ተማሪዎች ስፖርት መክፈቻ ሥነ-ስርዓት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'AASTU', locationAm: 'አአሳይቶ', year: '2025', image: 'images/events/Aastu student sport opening ceremony.jpg', featured: true },
  { id: 2, title: 'AA City Gov Peace & Security Celebration (20,000 People)', titleAm: 'የአዲስ አበባ ከተማ አስተዳደር የሰላም እና ፀጥታ አከባበር (20,000 ሰው)', category: 'Government', categoryAm: 'መንግስታዊ', location: 'Abebe Bikila Stadium', locationAm: 'አበበ ቢቂላ ስታዲየም', year: '2024', image: 'images/events/Addis ababa city government peace and security 20,000 celebrating ceremony to abebe bikila stadium.jpg', featured: true },
  { id: 3, title: 'Traditional Wedding Decoration', titleAm: 'ባህላዊ የሰርግ ዲኮር', category: 'Wedding', categoryAm: 'ሰርግ', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/Traditional wedding decoration.jpg', featured: true },
  { id: 4, title: 'AASTU Students Award', titleAm: 'የአአሳይቶ ተማሪዎች ሽልማት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'AASTU', locationAm: 'አአሳይቶ', year: '2024', image: 'images/events/Aastu students award.jpg', featured: true },
];

const ALL_EVENTS = [
  ...FEATURED_EVENTS,
  { id: 5, title: 'AA City Gov Peace & Security Celebration (15,000 People)', titleAm: 'የአዲስ አበባ ከተማ አስተዳደር የሰላም እና ፀጥታ አከባበር (15,000 ሰው)', category: 'Government', categoryAm: 'መንግስታዊ', location: 'Minilik School', locationAm: 'ምኒልክ ትምህርት ቤት', year: '2024', image: 'images/events/Addis ababa city government peace and security 15,000 peoples celebrating ceremony to minilik school.jpg', featured: false },
  { id: 6, title: 'All University Students Award Ceremony', titleAm: 'የሁሉም ዩኒቨርሲቲ ተማሪዎች የሽልማት ሥነ-ስርዓት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/All university students award ceremony.jpg', featured: false },
  { id: 7, title: 'Big Aluminum Tent & Flower Stand', titleAm: 'ትልቅ የአሉሚኒየም ድንኳን እና የአበባ ማስቀመጫ', category: 'Decoration', categoryAm: 'ዲኮር', location: 'Exhibition Center', locationAm: 'ኤግዚቢሽን ማዕከል', year: '2024', image: 'images/events/Big aluminum tent and flower stand to exhibition center.jpg', featured: false },
  { id: 8, title: 'Carpet & Chair Setup - Adwa Museum', titleAm: 'ምንጣፍ እና ወንበር ዝግጅት - ዓድዋ ሙዚየም', category: 'Decoration', categoryAm: 'ዲኮር', location: 'Adwa Museum', locationAm: 'ዓድዋ ሙዚየም', year: '2024', image: 'images/events/Carpet and chair close works to adwa musium.jpg', featured: false },
  { id: 9, title: 'Full Package Meeting Hall Setup', titleAm: 'የመሰብሰቢያ አዳራሽ ሙሉ ፓኬጅ ዝግጅት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/Full package to meeting hall.jpg', featured: false },
  { id: 10, title: 'Gate Decoration', titleAm: 'የበሩ ዲኮር ዝግጅት', category: 'Decoration', categoryAm: 'ዲኮር', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/Gate together decoration.jpg', featured: false },
  { id: 11, title: 'Government Meeting Ceremony - Capital Hotel', titleAm: 'የመንግስት ስብሰባ ሥነ-ስርዓት - ካፒታል ሆቴል', category: 'Government', categoryAm: 'መንግስታዊ', location: 'Capital Hotel', locationAm: 'ካፒታል ሆቴል', year: '2024', image: 'images/events/Government meeting ceremony to capital hotel.jpg', featured: false },
  { id: 12, title: 'VIP Stage & Decor - Adwa Museum', titleAm: 'ቪአይፒ መድረክ እና ዲኮር - ዓድዋ ሙዚየም', category: 'Decoration', categoryAm: 'ዲኮር', location: 'Adwa Museum', locationAm: 'ዓድዋ ሙዚየም', year: '2024', image: 'images/events/Screen stage adey abeba carpet vip table Curtain and chair works to adwa musim.jpg', featured: false },
  { id: 13, title: 'Screen Stage & Backdrop - Adwa Museum', titleAm: 'ስክሪን መድረክ እና ዳራ - ዓድዋ ሙዚየም', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Adwa Museum', locationAm: 'ዓድዋ ሙዚየም', year: '2024', image: 'images/events/Screen stage and backdrop works to adwa musiem.jpg', featured: false },
  { id: 14, title: 'Screen Stage & Backdrop - AASTU University', titleAm: 'ስክሪን መድረክ እና ዳራ - አአሳይቶ ዩኒቨርሲቲ', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'AASTU', locationAm: 'አአሳይቶ', year: '2024', image: 'images/events/Screen stage snd backdrop works to aastu university.jpg', featured: false },
  { id: 15, title: 'Sport Academy Meeting - Haile Grand Hotel', titleAm: 'የስፖርት አካዳሚ ስብሰባ - ሃይሌ ግራንድ ሆቴል', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Haile Grand Hotel', locationAm: 'ሃይሌ ግራንድ ሆቴል', year: '2024', image: 'images/events/Sport academy meeting ceremony to haile grand hotel.jpg', featured: false },
  { id: 16, title: 'Students Closing Ceremony', titleAm: 'የተማሪዎች መዝጊያ ሥነ-ስርዓት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/Students closing ceremony.jpg', featured: false },
  { id: 17, title: 'Luxury Event Display', titleAm: 'ልዩ የዝግጅት ማሳያ', category: 'Social', categoryAm: 'ማህበራዊ', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: '2024', image: 'images/events/photo_2026-01-29_22-06-34.jpg', featured: false },
];

const TESTIMONIALS = [
  { id: 1, quote: "Their logistical precision and focus on security made our city-wide events seamless. A truly professional team.", quoteAm: "ለከተማችን ሰላም እና ፀጥታ አስተዳደር የምናዘጋጃቸውን ዝግጅቶች በከፍተኛ ጥንቃቄ እና በሙያዊ ብቃት አከናውነዋል።", author: "Hon. Midekssa Kebede", authorAm: "የተከበሩ አቶ ሚዴቅሳ ከበደ", role: "Deputy Head, AA Peace & Security Bureau", roleAm: "የአዲስ አበባ ከተማ ሰላም እና ፀጥታ ቢሮ ምክትል ሀላፊ", order: 1 },
  { id: 2, quote: "The most reliable partner for sub-city development events. They deliver excellence every single time.", quoteAm: "ለክፍለ ከተማችን የልማት ዝግጅቶች እጅግ አስተማማኝ አጋር ናቸው። ሁልጊዜም ጥራቱን የጠበቀ አገልግሎት ይሰጣሉ።", author: "Hon. Tsige Jima", authorAm: "የተከበሩ ወ/ሮ ፅጌ ጂማ", role: "Deputy Manager, Lemi Kura Sub-city", roleAm: "የለሚ ኩራ ክ/ከተማ ምክትል ስራ አስኪያጅ", order: 2 },
  { id: 3, quote: "Innovation and culture perfectly blended. They handled our university summit with world-class standards.", quoteAm: "ቴክኖሎጂን ከባህል ጋር ፍጹም አዋህደዋል። የዩኒቨርስቲያችንን ስብሰባ በዓለም አቀፍ ደረጃ አከናውነዋል።", author: "Dr. Dereje", authorAm: "ዶክተር ደረጄ", role: "Director, AA Science & Technology University", roleAm: "የአዲስ አበባ ሳይንስ እና ቴክኖሎጂ ዩኒቨርስቲ ዳይሬክተር", order: 3 },
];

const FAQS = [
  { id: 1, q: "How far in advance should I book?", qAm: "ከዝግጅቱ ስንት ጊዜ በፊት መያዝ አለብኝ?", a: "For major weddings and large conferences, we recommend booking at least 15-30 Days in advance. Smaller corporate events can be often arranged within 15-30 Days.", aAm: "ለትላልቅ ሰርጎች እና ለትናንሽ የኮርፖሬት ዝግጅቶች ቢያንስ ከ15-30 ቀናት በፊት ቢይዙ ይመከራል።", order: 1 },
  { id: 2, q: "Do you handle events outside of Addis Ababa?", qAm: "ከአዲስ አበባ ውጭ ዝግጅቶችን ታዘጋጃላችሁ?", a: "Yes! We coordinate destination weddings and corporate retreats across Ethiopia, including Lalibela, Bahir Dar, and Hawassa.", aAm: "አዎ! በኢትዮጵያ ውስጥ በማንኛውም ቦታ (ላሊበላ፣ ባህር ዳር፣ ሀዋሳ...) ዝግጅቶችን እናዘጋጃለን።", order: 2 },
  { id: 3, q: "What is your payment structure?", qAm: "የክፍያ ሁኔታው እንዴት ነው?", a: "We typically require a 30% deposit to secure your date, 40% midway through planning, and the final 30% one week before the event.", aAm: "ቀኑን ለመያዝ 30%፣ በዝግጅት ሂደት ላይ 40%፣ እና ዝግጅቱ ከመጀመሩ ከአንድ ሳምንት በፊት ቀሪውን 30% ክፍያ እንቀበላለን።", order: 3 },
];

const T = {
  en: {
    nav: { home: 'Home', services: 'Services', events: 'Events', testimonials: 'Testimonials', contact: 'Contact', book: 'Book an Event', gallery: 'Gallery', about: 'About' },
    hero: { headline_main: 'Crafting Unforgettable Moments Across Ethiopia', subheadline: 'From traditional weddings to corporate conferences, we bring your vision to life with cultural elegance and professional execution.', cta_primary: 'Request a Quote', cta_secondary: 'View Our Events' },
    services: { title: 'Our Services', description: 'We provide comprehensive event management services designed to make every occasion extraordinary.' },
    events: { title: 'Featured Events', description: 'Explore our portfolio of successfully delivered events across Ethiopia.', cta: 'View Portfolio', view_gallery: 'View Gallery' },
    why_us: { title: 'Why Choose Us?', description: 'We combine international standards with local expertise to deliver seamless, world-class events in Ethiopia.', reasons: ['Experienced local event professionals', 'Reliable wide network of Ethiopian vendors', 'On-time and on-budget delivery guarantee', 'Deeply culturally aware planning and design', 'End-to-end event management from A to Z'], placeholder: 'Professional Team' },
    testimonials: { title: 'What Our Clients Say', description: "Don't just take our word for it. Here is feedback from some of our happy clients." },
    contact: { title: "Let's Plan Your Next Event", description: 'Ready to create something unforgettable? Fill out the form, and our team will get back to you with a personalized proposal.', labels: { phone: 'Phone', email: 'Email', location: 'Location', name: 'Full Name', eventType: 'Event Type', message: 'Message', submit: 'Send Inquiry', date: 'Event Date' }, form: { name_placeholder: 'John Doe', email_placeholder: 'john@example.com', phone_placeholder: '+251...', message_placeholder: 'Tell us about your event...', types: ['Wedding', 'Corporate', 'Cultural', 'Other'] } },
    footer: { description: 'Your premier partner for creating unforgettable experiences in Ethiopia. Professional, reliable, and culturally rooted.', quick_links: 'Quick Links', services_title: 'Services', connect: 'Connect With Us', newsletter: 'Subscribe to our newsletter', email_placeholder: 'Email address', go: 'Go', rights: '© 2025 Akirma Events PLC. All rights reserved.', privacy: 'Privacy Policy', terms: 'Terms of Service', pricelist: 'Price List (PDF)' },
    faq: { title: 'Frequently Asked Questions', description: 'Everything you need to know about our event planning process.' },
    estimator: { title: 'Budget Estimator', description: 'Get a quick estimate for your event in seconds.', labels: { guests: 'Number of Guests', service_level: 'Service Level', total: 'Estimated Total', range: 'Estimated Range (ETB)', disclaimer: 'This is an approximation based on current market rates.' }, levels: ['Essential', 'Premium', 'Elite'] },
    chat: { greeting: 'Hello! How can we help you today?', telegram: 'Chat on Telegram', whatsapp: 'Chat on WhatsApp', we_are_online: 'We are online' },
    identity: {
      title: 'Our Strategic Foundation', subtitle: 'Built on excellence, driven by results.',
      vision: { title: 'Vision', content: 'To be the leading events management service provider for corporate events, delivering exceptional experiences and exceeding client expectations.' },
      mission: { title: 'Mission', content: 'To create memorable and impactful corporate events that engage and inspire attendees, leaving a lasting impression on both clients and participants.' },
      goals: { title: 'Core Goals', items: [
        { title: 'Client Satisfaction', desc: 'Strive to consistently meet and surpass client expectations by providing top-notch event management services.' },
        { title: 'Exceptional Experiences', desc: 'Create unique and innovative event concepts that captivate attendees and leave a lasting impression.' },
        { title: 'Professionalism & Reliability', desc: 'Establish a reputation for delivering events with the utmost professionalism and reliability.' },
        { title: 'Growth & Expansion', desc: 'Expand the client base by consistently delivering successful events.' },
        { title: 'Industry Leadership', desc: 'Become an industry leader in corporate event management, consistently setting trends and raising the standard of excellence.' },
      ]},
      objectives: { title: 'Strategic Objectives', items: [
        'Offer comprehensive event planning services tailored to the specific needs and requirements of corporate clients.',
        'Provide meticulous attention to detail in all aspects of event management, including venue selection, logistics, catering, audiovisuals, and entertainment.',
        'Collaborate closely with clients to understand their brand identity, values, and objectives, to ensure the event aligns perfectly with their vision.',
        'Implement effective marketing and promotion strategies to create buzz and attract the desired target audience.',
        'Utilize technology and event management tools to streamline processes, enhance efficiency, and deliver superior results.',
        'Foster strong relationships with vendors and suppliers to ensure access to high-quality and reliable services.',
        'Continuously stay updated with the latest trends and innovations in the events industry, incorporating them into event concepts and design.',
        'Monitor and evaluate the success of each event, gathering feedback from clients and attendees, and implementing improvements for future events.',
      ]}
    }
  },
  am: {
    nav: { home: 'መነሻ', services: 'አገልግሎቶች', events: 'ዝግጅቶች', testimonials: 'ምስክርነቶች', contact: 'ያግኙን', book: 'ዝግጅት ይያዙ', gallery: 'ጋለሪ', about: 'ስለ እኛ' },
    hero: { headline_main: 'የማይረሱ ትውስታዎችን በመላ ኢትዮጵያ እንፈጥራለን', subheadline: 'ከባህላዊ ሰርግ እስከ ኮርፖሬት ስብሰባዎች፣ ራዕይዎን በባህላዊ ውበት እና በሙያዊ ብቃት ወደ እውን እንለውጣለን።', cta_primary: 'ዋጋ ይጠይቁ', cta_secondary: 'ዝግጅቶቻችንን ይመልከቱ' },
    services: { title: 'አገልግሎቶቻችን', description: 'እያንዳንዱን ዝግጅት ልዩ ለማድረግ የተነደፉ አጠቃላይ የዝግጅት አስተዳደር አገልግሎቶችን እንሰጣለን።' },
    events: { title: 'ተለይተው የቀረቡ', description: 'በመላው ኢትዮጵያ በተሳካ ሁኔታ ያከናወንናቸውን ዝግጅቶች ይመልከቱ።', cta: 'ፖርትፎሊዮ ይመልከቱ', view_gallery: 'ጋለሪ ይመልከቱ' },
    why_us: { title: 'ለምን እኛን ይምረጡ?', description: 'ዓለም አቀፍ ደረጃዎችን ከአካባቢ እውቀት ጋር በማጣመር እንከን የለሽ ዝግጅቶችን በኢትዮጵያ እናቀርባለን።', reasons: ['ልምድ ያላቸው የአካባቢ ዝግጅት ባለሙያዎች', 'ሰፊ እና አስተማማኝ አቅራቢዎች መረብ', 'በሰዓቱ እና በበጀት የማስረከብ ዋስትና', 'ባህልን ያገናዘበ እቅድ እና ንድፍ', 'ከሀ እስከ ፖ የተሟላ የዝግጅት አስተዳደር'], placeholder: 'ፕሮፌሽናል ቡድን' },
    testimonials: { title: 'ደንበኞቻችን ምን ይላሉ', description: "የእኛን ቃል ብቻ አይስሙ። ከተወሰኑ ደስተኛ ደንበኞቻችን የተሰጠ አስተያየት እነሆ።" },
    contact: { title: 'የሚቀጥለውን ዝግጅትዎን እናቅድ', description: 'የማይረሳ ነገር ለመፍጠር ዝግጁ ነዎት? ቅጹን ይሙሉ፣ እና ቡድናችን ከግል ፕሮፖዛል ጋር ይመለስልዎታል።', labels: { phone: 'ስልክ', email: 'ኢሜይል', location: 'አድራሻ', name: 'ሙሉ ስም', eventType: 'የዝግጅት አይነት', message: 'መልእክት', submit: 'ጥያቄ ላክ', date: 'የዝግጅት ቀን' }, form: { name_placeholder: 'አበበ ከበደ', email_placeholder: 'abebe@example.com', phone_placeholder: '+251...', message_placeholder: 'ስለ ዝግጅትዎ ይንገሩን...', types: ['ሰርግ', 'ኮርፖሬት', 'ባህላዊ', 'ሌላ'] } },
    footer: { description: 'የማይረሱ ልምዶችን በኢትዮጵያ ለመፍጠር ቀዳሚ አጋርዎ። ፕሮፌሽናል፣ አስተማማኝ እና በባህል የጎለበተ።', quick_links: 'ፈጣን ሊንኮች', services_title: 'አገልግሎቶች', connect: 'ይከታተሉን', newsletter: 'ለጋዜጣችን ይመዝገቡ', email_placeholder: 'የኢሜይል አድራሻ', go: 'ሂድ', rights: '© 2025 አክርማ ኢቨንት ኃ.የተ.የግ.ማ. መብቱ በህግ የተጠበቀ ነው።', privacy: 'የግላዊነት ፖሊሲ', terms: 'የአገልግሎት ውሎች', pricelist: 'የዋጋ ዝርዝር (ፒዲኤፍ)' },
    faq: { title: 'ተደጋጋሚ ጥያቄዎች', description: 'ስለ ዝግጅት ማዘጋጀት ሂደት ማወቅ የሚገባዎት ነገሮች።' },
    estimator: { title: 'የዋጋ ግምት ማስያ', description: 'ለዝግጅትዎ የሚሆን ግምታዊ ዋጋ በጥቂት ሰከንዶች ውስጥ ያግኙ።', labels: { guests: 'የእንግዶች ብዛት', service_level: 'የአገልግሎት ደረጃ', total: 'ግምታዊ ጠቅላላ ዋጋ', range: 'ግምታዊ ዋጋ (በብር)', disclaimer: 'ይህ ዋጋ በወቅታዊ የገበያ ሁኔታ ላይ የተመሰረተ ግምት ነው።' }, levels: ['መደበኛ', 'ከፍተኛ', 'ልዩ'] },
    chat: { greeting: 'ሰላም! እንዴት ልንረዳዎ እንችላለን?', telegram: 'በቴሌግራም ያግኙን', whatsapp: 'በዋትስአፕ ያግኙን', we_are_online: 'መስመር ላይ ነን' },
    identity: {
      title: 'የእኛ ስልታዊ መሠረት', subtitle: 'በልህቀት ላይ የተገነባ፣ በውጤት የሚመራ።',
      vision: { title: 'ራዕይ', content: 'በኢትዮጵያ የኮርፖሬት ዝግጅቶች አስተዳደር ቀዳሚ በመሆን፣ ልዩ ልምዶችን መስጠት እና የደንበኞችን ፍላጎት ማርካት።' },
      mission: { title: 'ተልዕኮ', content: 'በደንበኞች እና በተሳታፊዎች ዘንድ ዘላቂ ትውስታን የሚተዉ፣ የሚስቡ እና የሚያነቃቁ ተፅእኖ ፈጣሪ የኮርፖሬት ዝግጅቶችን መፍጠር።' },
      goals: { title: 'ዋና ግቦች', items: [
        { title: 'የደንበኛ እርካታ', desc: 'ከፍተኛ ጥራት ያለው አገልግሎት በመስጠት የደንበኞችን ፍላጎት በቋሚነት ማሟላት እና ማለፍ።' },
        { title: 'ልዩ ተሞክሮዎች', desc: 'ተሳታፊዎችን የሚስቡ እና ዘላቂ ትውስታን የሚተዉ አዳዲስ የዝግጅት ሃሳቦችን መፍጠር።' },
        { title: 'ሙያዊ ብቃት እና አስተማማኝነት', desc: 'ዝግጅቶችን በከፍተኛ ሙያዊ ብቃት እና አስተማማኝነት በማከናወን መልካም ስም መገንባት።' },
        { title: 'እድገት እና መስፋፋት', desc: 'የተሳካ ዝግጅቶችን በቋሚነት በማቅረብ የደንበኞችን ቁጥር ማሳደግ።' },
        { title: 'የኢንዱስትሪ መሪነት', desc: 'በኮርፖሬት ዝግጅት አስተዳደር ዘርፍ አዳዲስ አዝማሚያዎችን በመፍጠር የኢንዱስትሪው መሪ መሆን።' },
      ]},
      objectives: { title: 'ስልታዊ ዓላማዎች', items: [
        'ለኮርፖሬት ደንበኞች ልዩ ፍላጎት እና መስፈርት የተዘጋጁ አጠቃላይ የዝግጅት እቅድ አገልግሎቶችን ማቅረብ።',
        'በሁሉም የዝግጅት አስተዳደር ዘርፎች (ቦታ መረጣ፣ ሎጂስቲክስ፣ ምግብ፣ ኦዲዮ-ቪዥዋል እና መዝናኛ) ጥንቃቄ የተሞላበት ትኩረት መስጠት።',
        'ደንበኞች ካላቸው የምርት መለያ፣ እሴቶች እና ዓላማዎች ጋር የሚጣጣም ዝግጅት እንዲሆን ከደንበኞች ጋር በቅርብ መስራት።',
        'ተፈላጊውን ታዳሚ ለመሳብ ውጤታማ የግብይት እና የማስተዋወቂያ ስልቶችን መተግበር።',
        'ሂደቶችን ለማቀላጠፍ፣ ቅልጥፍናን ለመጨመር እና የተሻለ ውጤት ለማምጣት ቴክኖሎጂን እና የዝግጅት አስተዳደር መሳሪያዎችን መጠቀም።',
        'ከፍተኛ ጥራት ያለው እና አስተማማኝ አገልግሎት ለማግኘት ከአቅራቢዎች ጋር ጠንካራ ግንኙነት መፍጠር።',
        'በዝግጅት ኢንዱስትሪ ውስጥ ካሉ የቅርብ ጊዜ አዝማሚያዎች እና ፈጠራዎች ጋር በቋሚነት መራመድ።',
        'የእያንዳንዱን ዝግጅት ስኬት መገምገም፣ አስተያየቶችን መሰብሰብ እና ለወደፊት ዝግጅቶች መሻሻሎችን ማድረግ።',
      ]}
    }
  }
};
