#!/bin/bash
set -e
cd "$(dirname "$0")"
required=(
  ".github/workflows/build-apk.yml"
  "android/variables.gradle"
  "android/app/src/main/res/values/styles.xml"
  "android/app/src/main/res/xml/file_paths.xml"
  "android/app/src/main/java/de/wuestenpilger/alltagsbegleiter/MainActivity.java"
  "www/index.html"
  "www/synchronisation.html"
  "www/alltagsbegleiter-view.js"
)
for f in "${required[@]}"; do
  test -f "$f" || { echo "FEHLT: $f"; exit 1; }
done
grep -q 'versionCode 2200' android/app/build.gradle
grep -q 'versionName "22.0"' android/app/build.gradle
grep -q 'Alltagsbegleiter-Version-22.0-APK' .github/workflows/build-apk.yml
node --check www/alltagsbegleiter-view.js
node --check www/alltagsbegleiter-sync.js
node --check www/shared-store.js
echo "OK: Alltagsbegleiter 22.0 Masterprojekt vollständig geprüft."
