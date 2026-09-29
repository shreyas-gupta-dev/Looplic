import fs from 'fs';

const filePath = 'C:/Users/Shrey/.gemini/antigravity-ide/brain/0ca38b05-2e07-40f4-b372-840283ad0c4c/.system_generated/steps/130/content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Search for strings like Apple iPhone, Samsung Galaxy, refurbished
const matches = content.match(/Apple iPhone [^<"&]{2,30}/g) || [];
console.log('Unique iPhone names:', [...new Set(matches)].slice(0, 15));

const samsungMatches = content.match(/Samsung Galaxy [^<"&]{2,30}/g) || [];
console.log('Unique Samsung names:', [...new Set(samsungMatches)].slice(0, 15));

// Check self.__next_f
const fMatches = content.match(/self\.__next_f\.push\(\[1,"([^"]+)"\]\)/g) || [];
console.log('Next.js RSC chunks:', fMatches.length);

