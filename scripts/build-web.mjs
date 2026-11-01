import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
const root=process.cwd(), out=path.join(root,'www');
const standard=['index.html','app-config.js','practice.js','practice.css','enhancements.css','IPA.txt','manifest.json','icon-192.png','icon-512.png','apphub.json','web-version.json'];
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
for(const file of standard) await fs.copyFile(path.join(root,file),path.join(out,file));
// Include every root-level lesson, not just the original lesson 03.
for(const entry of await fs.readdir(root,{withFileTypes:true})) {
  if(entry.isFile() && /\.(mp3|srt)$/i.test(entry.name)) {
    await fs.copyFile(path.join(root,entry.name),path.join(out,entry.name));
  }
}
// Resolve original filenames to packaged sources on every APK/OTA build.
const discovery=spawnSync('python3',['scripts/discover_media.py','--output','www/tracks.json'],{cwd:root,stdio:'inherit'});
if(discovery.error || discovery.status!==0) throw Error('Không tạo được danh sách MP3/SRT: '+(discovery.error?.message || discovery.status));
const media=path.join(root,'media');
await fs.cp(media,path.join(out,'media'),{recursive:true,filter:src=>!src.endsWith('HUONG_DAN_CHEP_MP3_SRT.txt')});
const version=JSON.parse(await fs.readFile(path.join(root,'web-version.json'),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version.version)||!Number.isInteger(version.nativeRevision)) throw Error('web-version.json không hợp lệ');
const baseUrl=process.env.TK3_OTA_BASE_URL?.trim() || 'https://gptlohoi-del.github.io/tungkinh3/';
const base=new URL(baseUrl);
if(base.protocol!=='https:') throw Error('TK3_OTA_BASE_URL phải là HTTPS');
const trailing=base.href.endsWith('/')?base.href:base.href+'/';
await fs.writeFile(path.join(out,'ota-config.json'),JSON.stringify({baseUrl:trailing},null,2)+'\n');
let html=await fs.readFile(path.join(out,'index.html'),'utf8');
// Capacitor/Capgo quản lý web assets; SW chỉ sử dụng khi chạy bản Web/PWA.
const needle="if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {";
if(!html.includes(needle)) throw Error('Không tìm thấy chỗ ngắt đăng ký SW cho APK');
html=html.replace(needle,`if (false && 'serviceWorker' in navigator) {`);
if(!html.includes('</body>')) throw Error('Không tìm thấy </body>');
html=html.replace('</body>','    <script defer src="./native-ota.js"></script>\n</body>');
html=html.replace('Trong App Hub, hãy kiểm tra module kinhtest2 đã được đóng gói cùng cấp với tungkinh3. Xem README.md.','Trong APK riêng, hãy chép MP3/SRT cùng tên gốc vào media/kinhtest2 rồi xuất bản OTA.');
await fs.writeFile(path.join(out,'index.html'),html);
await build({entryPoints:[path.join(root,'src/ota-entry.js')],outfile:path.join(out,'native-ota.js'),bundle:true,platform:'browser',format:'iife',target:'es2020',minify:true});
console.log(`Đã tạo www/ v${version.version}, OTA: ${trailing}`);
