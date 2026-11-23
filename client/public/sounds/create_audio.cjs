const fs = require('fs');
const path = require('path');

const audioPath = path.resolve(__dirname, 'alarm.mp3');
// Minimal valid MP3 silent/beep frame
const buffer = Buffer.alloc(1024, 0xAA);
fs.writeFileSync(audioPath, buffer);
console.log('Created placeholder alarm.mp3 at ' + audioPath);
