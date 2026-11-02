#!/usr/bin/env python3
"""Patch the fresh Capacitor Android project: permissions, label and icons."""
from pathlib import Path
from shutil import copy2
from xml.etree import ElementTree as ET

root_dir = Path(__file__).resolve().parent.parent
res_dir = root_dir / "android/app/src/main/res"
manifest = root_dir / "android/app/src/main/AndroidManifest.xml"
if not manifest.exists():
    raise SystemExit("Chưa có AndroidManifest: chạy npx cap add android trước")

ANDROID = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID)
ET.register_namespace("tools", "http://schemas.android.com/tools")
attr_name = "{%s}name" % ANDROID

tree = ET.parse(manifest)
xml = tree.getroot()
for name in ("android.permission.INTERNET", "android.permission.RECORD_AUDIO",
             "android.permission.MODIFY_AUDIO_SETTINGS"):
    if not any(p.get(attr_name) == name for p in xml.findall("uses-permission")):
        ET.SubElement(xml, "uses-permission", {attr_name: name})
if not any(f.get(attr_name) == "android.hardware.microphone" for f in xml.findall("uses-feature")):
    ET.SubElement(xml, "uses-feature", {
        attr_name: "android.hardware.microphone",
        "{%s}required" % ANDROID: "false"
    })

application = xml.find("application")
if application is None:
    raise SystemExit("AndroidManifest.xml thiếu thẻ application")
application.set("{%s}label" % ANDROID, "@string/app_name")
application.set("{%s}icon" % ANDROID, "@mipmap/ic_launcher")
application.set("{%s}roundIcon" % ANDROID, "@mipmap/ic_launcher_round")
tree.write(manifest, encoding="utf-8", xml_declaration=True)

strings_file = res_dir / "values/strings.xml"
if not strings_file.exists():
    raise SystemExit("Không có values/strings.xml do Capacitor tạo")
strings_tree = ET.parse(strings_file)
strings_root = strings_tree.getroot()
app_name = next((e for e in strings_root.findall("string")
                 if e.get("name") == "app_name"), None)
if app_name is None:
    app_name = ET.SubElement(strings_root, "string", {"name": "app_name"})
app_name.text = "TungKinh EV"
strings_tree.write(strings_file, encoding="utf-8", xml_declaration=True)

assets_dir = root_dir / "android-assets/res"
if not assets_dir.is_dir():
    raise SystemExit("Thiếu tài nguyên icon trong android-assets/res")
needed = (
    "drawable-nodpi/tk_ev_icon.png",
    "mipmap-anydpi-v26/ic_launcher.xml",
    "mipmap-anydpi-v26/ic_launcher_round.xml",
)
for rel in needed:
    if not (assets_dir / rel).is_file():
        raise SystemExit(f"Thiếu icon: {rel}")
for asset in assets_dir.rglob("*"):
    if asset.is_file():
        dest = res_dir / asset.relative_to(assets_dir)
        dest.parent.mkdir(parents=True, exist_ok=True)
        copy2(asset, dest)
print("Đã đặt tên TungKinh EV, áp icon và cấp quyền cần thiết cho Android")
