"""Build dist/script-strokes.js from scripts/script-strokes.json (stroke-order notes for 書き方練習).
AI-written from Thai school handwriting conventions; entries with "u": 1 have details that are not confirmed."""
import json,pathlib
P=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((P/'scripts/script-strokes.json').read_text())
(P/'dist/script-strokes.js').write_text('// Stroke-order notes for writing practice. Built by scripts/build-script-strokes.py (AI-written; u=1: details unconfirmed).\nconst SCRIPT_STROKES='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(d),'entries')
