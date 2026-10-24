"""Fetch pinned upstream binaries and verify SHA256 before staging them."""
from pathlib import Path
import hashlib
import json
import os
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(os.environ.get('LOCALAPPDATA', Path.home())) / 'G4T0XX/BuildCache/NetTunnelDeps'
CACHE.mkdir(parents=True, exist_ok=True)
for asset in json.loads((ROOT / 'android/dependencies.json').read_text(encoding='utf-8')):
    target = CACHE / asset['name']
    expected = asset['digest']
    if not expected or not expected.startswith('sha256:'):
        raise RuntimeError('Dependency digest is required')
    def valid():
        return target.is_file() and 'sha256:' + hashlib.file_digest(target.open('rb'), 'sha256').hexdigest() == expected
    if not valid():
        urllib.request.urlretrieve(asset['url'], target)
    if not valid():
        raise RuntimeError('Dependency integrity failure: ' + target.name)
    if target.suffix == '.aar':
        destination = ROOT / 'android/app/libs/hev-socks5-tunnel.aar'
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, destination)
    elif target.name == 'Xray-android-arm64-v8a.zip':
        with zipfile.ZipFile(target) as archive:
            executable = ROOT / 'android/app/src/runtime/jniLibs/arm64-v8a/libxray.so'
            executable.parent.mkdir(parents=True, exist_ok=True)
            executable.write_bytes(archive.read('xray'))
            notices = ROOT / 'android/app/src/main/assets/licenses'
            notices.mkdir(parents=True, exist_ok=True)
            for name in archive.namelist():
                if 'LICENSE' in name.upper() and not name.endswith('/'):
                    (notices / ('Xray-' + Path(name).name)).write_bytes(archive.read(name))
    print(target.name, 'verified')

shutil.copytree(ROOT / "android/licenses", ROOT / "android/app/src/main/assets/licenses/Hev", dirs_exist_ok=True)
