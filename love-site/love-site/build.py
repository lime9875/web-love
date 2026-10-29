"""يبني نسخة نهائية في ملف واحد: dist/love.html
الصور والرسايل بتتشفّر بكلمة السر (SECRET في data.js).
المتطلبات: python3 و node و  pip install cryptography
التشغيل:   python3 build.py
"""
import base64, hashlib, json, os, subprocess
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding="utf-8").read()

# اقرأ data.js عن طريق node
js = ("const vm=require('vm'),fs=require('fs');const c={};vm.createContext(c);"
      "vm.runInContext(fs.readFileSync('data.js','utf8')+';__o={LOGIN:LOGIN,SECRET:SECRET,PRIVATE:PRIVATE}',c);"
      "console.log(JSON.stringify(c.__o))")
data = json.loads(subprocess.check_output(["node", "-e", js], cwd=here))

# حوّل مسارات الصور لـ data URI
for ph in data["PRIVATE"]["photos"]:
    with open(os.path.join(here, ph["src"]), "rb") as f:
        ph["src"] = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

# التشفير: PBKDF2 + AES-GCM
salt, iv = os.urandom(16), os.urandom(12)
key = hashlib.pbkdf2_hmac("sha256", data["SECRET"].encode(), salt, 150000, 32)
ct = AESGCM(key).encrypt(iv, json.dumps(data["PRIVATE"], ensure_ascii=False).encode("utf-8"), None)
blob = base64.b64encode(salt + iv + ct).decode()

html = rd("index.html")
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + rd("style.css") + "</style>")
html = html.replace('<script src="data.js"></script>',
    "<script>\nvar LOGIN = " + json.dumps(data["LOGIN"], ensure_ascii=False) + ";\nvar BLOB = \"" + blob + "\";\n</script>")
html = html.replace('<script src="app.js"></script>', "<script>\n" + rd("app.js") + "</script>")

os.makedirs(os.path.join(here, "dist"), exist_ok=True)
out = os.path.join(here, "dist", "love.html")
open(out, "w", encoding="utf-8").write(html)
print("تم:", out)
