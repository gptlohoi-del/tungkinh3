import test from 'node:test';
import assert from 'node:assert/strict';
import {compareVersions,checkManifest} from '../src/ota-logic.mjs';
const base='https://gptlohoi-del.github.io/tungkinh3/';
const good={version:'1.2.1',nativeRevision:1,sha256:'a'.repeat(64),size:123,url:base+'updates/1.2.1.zip'};
test('Semver numeric comparison',()=>{assert.equal(compareVersions('1.2.10','1.2.9'),1);assert.equal(compareVersions('1.2.0','1.2.0'),0);assert.equal(compareVersions('1.1.0','1.2.0'),-1)});
test('Only new, same native major revision allowed',()=>{
 assert.equal(checkManifest(good,{version:'1.2.0',nativeRevision:1},base).newer,true);
 assert.equal(checkManifest(good,{version:'1.2.2',nativeRevision:1},base).newer,false);
 assert.throws(()=>checkManifest({...good,nativeRevision:2},{version:'1.2.0',nativeRevision:1},base));
});
test('Reject untrusted URL and corrupted hash',()=>{
 assert.throws(()=>checkManifest({...good,url:'https://evil.example/update.zip'},{version:'1.2.0',nativeRevision:1},base));
 assert.throws(()=>checkManifest({...good,sha256:'123'},{version:'1.2.0',nativeRevision:1},base));
});
