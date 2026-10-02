const fs = require('fs');
const path = require('path');

function getPngDimensions(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  return null;
}

const dir = 'apps/user/public/images/brands';
fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => {
  const buf = fs.readFileSync(path.join(dir, f));
  const dims = getPngDimensions(buf);
  console.log(f.padEnd(16), dims ? `${dims.width}x${dims.height}` : 'other format');
});
