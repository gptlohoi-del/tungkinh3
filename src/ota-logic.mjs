// Pure helpers: the same checks are tested in Node and used in the WebView.
export function parseVersion(s) {
  if (typeof s !== 'string' || !/^\d+\.\d+\.\d+$/.test(s)) throw new Error('Phiên bản phải có dạng x.y.z');
  return s.split('.').map(Number);
}
export function compareVersions(a,b) {
  const va=parseVersion(a), vb=parseVersion(b);
  for(let i=0;i<3;i++) if(va[i]!==vb[i]) return va[i]>vb[i]?1:-1;
  return 0;
}
export function checkManifest(m, current, baseUrl) {
  if(!m || typeof m !== 'object') throw new Error('latest.json không hợp lệ');
  const version=m.version;
  parseVersion(version);
  if (!Number.isInteger(m.nativeRevision) || m.nativeRevision !== current.nativeRevision) {
    throw new Error('Bản mới đòi hỏi phiên bản APK native khác; không thể cập nhật OTA.');
  }
  if(typeof m.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(m.sha256)) throw new Error('Thiếu SHA-256 hợp lệ');
  if (!Number.isSafeInteger(m.size) || m.size <= 0) throw new Error('Kích thước gói không hợp lệ');
  const base=new URL(baseUrl), url=new URL(m.url);
  if(base.protocol!=='https:' || url.protocol!=='https:' || url.origin!==base.origin || !url.pathname.startsWith(base.pathname+'updates/')) {
    throw new Error('Đường dẫn gói cập nhật không thuộc máy chủ HTTPS tin cậy');
  }
  if(!url.pathname.endsWith('.zip')) throw new Error('Đường dẫn cập nhật không phải ZIP');
  return { ...m, url:url.href, newer:compareVersions(version,current.version)>0 };
}
