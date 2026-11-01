/* Tụng Kinh 3: OTA độc lập; không tự thay APK, không phát hiện/ghi dữ liệu ghi âm. */
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { checkManifest } from './ota-logic.mjs';

const native = Capacitor.isNativePlatform();
// Bắt buộc báo sẵn sàng ngay khi JS đã chạy, trước mọi thao tác mạng.
if (native) CapacitorUpdater.notifyAppReady().catch(e => console.warn('OTA ready:', e));

const elt=(tag, attrs={}, content='') => {
  const element=document.createElement(tag);
  for (const [key,value] of Object.entries(attrs)) element.setAttribute(key,value);
  element.textContent=content;
  return element;
};

async function main(){
  if(!native) return;
  const config=await fetch('./ota-config.json', {cache:'no-store'}).then(r=>r.json());
  const current=await fetch('./web-version.json', {cache:'no-store'}).then(r=>r.json());
  const panel=elt('section',{id:'tk3-ota-panel','aria-label':'Cập nhật nội dung Tụng Kinh 3'});
  panel.style.cssText='margin:14px 0 6px;padding:12px;border:1px solid #9998;border-radius:10px;font-size:14px;line-height:1.5';
  const heading=elt('div',{},'🔄 Cập nhật nội dung (OTA)');
  heading.style.cssText='font-weight:700;margin-bottom:4px';
  const status=elt('p',{id:'tk3-ota-status','role':'status','aria-live':'polite'},`Phiên bản nội dung: ${current.version}`);
  status.style.cssText='font-size:12px;word-break:break-word;margin:6px 0';
  const button=elt('button',{type:'button',id:'tk3-ota-check'},'Kiểm tra cập nhật');
  button.style.cssText='font-size:14px;padding:8px 14px;min-height:38px;cursor:pointer';
  panel.append(heading,status,button);
  const settings=document.querySelector('#modalSectionSetting');
  const buttons=settings?.querySelector('.range-modal-actions');
  if(buttons) settings.insertBefore(panel,buttons); else (settings || document.body).appendChild(panel);
  let busy=false;
  const say=(message)=>{status.textContent=message;};

  async function check(manual=false){
    if(busy) return;
    busy=true;button.disabled=true;
    say('Đang kiểm tra thông tin phiên bản…');
    try {
      const endpoint = new URL('updates/latest.json',config.baseUrl);
      endpoint.searchParams.set('t',String(Date.now()));
      const abort=new AbortController();
      const timer=setTimeout(()=>abort.abort(),12000);
      let response;
      try { response=await fetch(endpoint,{cache:'no-store',signal:abort.signal}); }
      finally {clearTimeout(timer);}
      if(!response.ok) throw new Error(`Không truy cập được máy chủ OTA (HTTP ${response.status})`);
      const manifest=checkManifest(await response.json(),current,config.baseUrl);
      if(!manifest.newer) {say(`Đã là bản mới nhất (${current.version}).`);return;}
      const pending=await CapacitorUpdater.getNextBundle().catch(()=>null);
      if(pending?.version===manifest.version) {
        say(`Bản ${manifest.version} đã tải xong. Đóng và mở lại ứng dụng để áp dụng.`);return;
      }
      say(`Đang tải bản ${manifest.version} (${(manifest.size/1048576).toFixed(1)} MB)…`);
      const downloaded=await CapacitorUpdater.download({url:manifest.url,version:manifest.version,checksum:manifest.sha256});
      if (!downloaded?.id) throw new Error('Không nhận được mã gói cập nhật');
      await CapacitorUpdater.next({id:downloaded.id});
      say(`Đã tải bản ${manifest.version}. Đóng và mở lại ứng dụng để áp dụng. Không cần cài APK.`);
    } catch(e) {
      console.warn('Kiểm tra OTA không thành công:', e);
      const detail=e?.message || String(e);
      say(`Chưa cập nhật được: ${detail}. Bạn vẫn dùng bản hiện tại bình thường.`);
    } finally { busy=false;button.disabled=false; }
  }
  button.addEventListener('click',()=>void check(true));
  await CapacitorUpdater.addListener('download',info=>{
    if(busy && Number.isFinite(info?.percent)) say(`Đang tải bản mới: ${Math.round(info.percent)}%…`);
  }).catch(()=>{});
  // Không ngắt phát nhạc: tự kiểm tra sau khi mở, chỉ xếp hàng cho lần mở kế tiếp.
  setTimeout(()=>void check(),2500);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>void main().catch(console.error));
else void main().catch(console.error);
