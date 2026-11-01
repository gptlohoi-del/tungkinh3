#!/usr/bin/env python3
"""Patch fresh `npx cap add android` project with microphone permission once per APK build."""
from pathlib import Path
from xml.etree import ElementTree as ET
r=Path(__file__).resolve().parent.parent
p=r/'android/app/src/main/AndroidManifest.xml'
if not p.exists():raise SystemExit('Chưa có AndroidManifest: chạy npx cap add android trước')
ANDROID='http://schemas.android.com/apk/res/android'
ET.register_namespace('android',ANDROID)
ET.register_namespace('tools','http://schemas.android.com/tools')
tree=ET.parse(p);root=tree.getroot()
for name in ('android.permission.INTERNET','android.permission.RECORD_AUDIO','android.permission.MODIFY_AUDIO_SETTINGS'):
    if not any(x.get('{%s}name'%ANDROID)==name for x in root.findall('uses-permission')):
        ET.SubElement(root,'uses-permission',{'{%s}name'%ANDROID:name})
if not any(x.get('{%s}name'%ANDROID)=='android.hardware.microphone' for x in root.findall('uses-feature')):
    ET.SubElement(root,'uses-feature',{'{%s}name'%ANDROID:'android.hardware.microphone','{%s}required'%ANDROID:'false'})
tree.write(p,encoding='utf-8',xml_declaration=True)
print('Đã thêm quyền RECORD_AUDIO/INTERNET vào AndroidManifest.xml')
