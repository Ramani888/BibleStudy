#!/usr/bin/env python3
"""Answers a running "Review due cards" session in the simulator, one question at a time.

Reads the screen with `maestro hierarchy`, looks the question up in an answers JSON
([{"q": question, "a": answer}, ...]), then runs one tiny Maestro flow to tap or type it.
Much faster than Maestro conditionals (which re-scan the screen once per possible question).

Usage: python3 review_driver.py <device-id> <answers.json> [--miss "<question prefix>"]
"""
import json, re, subprocess, sys, tempfile, time

MAESTRO = '/Users/divyeshramani/.maestro/bin/maestro'
dev, answers_file = sys.argv[1], sys.argv[2]
miss = sys.argv[sys.argv.index('--miss') + 1] if '--miss' in sys.argv else None
answers = {c['q'].strip(): c['a'].strip() for c in json.load(open(answers_file))}


def labels():
    out = subprocess.run([MAESTRO, '--device', dev, 'hierarchy'], capture_output=True, text=True).stdout
    found = []
    def walk(n):
        a = n.get('attributes', {})
        t = (a.get('accessibilityText') or a.get('text') or '').strip()
        b = list(map(int, re.findall(r'\d+', a.get('bounds', ''))))
        if t and len(b) == 4:
            found.append((t, ((b[0] + b[2]) // 2, (b[1] + b[3]) // 2)))
        for c in n.get('children', []):
            walk(c)
    walk(json.JSONDecoder().raw_decode(out[out.index('{'):])[0])  # tool prints trailing text after the JSON
    return found


def run(steps):
    with tempfile.NamedTemporaryFile('w', suffix='.yaml', delete=False) as f:
        f.write('appId: com.getverdance.app\n---\n' + steps)
    r = subprocess.run([MAESTRO, '--device', dev, 'test', f.name], capture_output=True, text=True)
    if 'FAILED' in r.stdout:
        print('  flow failed:', [l for l in r.stdout.splitlines() if 'FAILED' in l])


for n in range(30):
    t0 = time.time()
    ls = labels()
    texts = [t for t, _ in ls]
    if any(t.startswith('Quiz Complete') for t in texts):
        print('results screen reached'); break
    q = next((t for t in texts if t in answers), None) or \
        next((t for t in texts for k in answers if len(t) > 12 and t[:20] == k[:20]), None)
    if not q:
        print('no known question on screen:', texts[:8]); break
    key = q if q in answers else next(k for k in answers if k[:20] == q[:20])
    ans = answers[key]
    wrong = miss and key.startswith(miss)
    opts = [(t, p) for t, p in ls if re.match(r'^[A-D], ', t)]
    typed = not opts and 'Submit' in texts   # the input's placeholder isn't in the hierarchy, but Maestro can match it
    if typed:
        reply = 'not sure' if wrong else ans
        run(f'- tapOn: "Your answer.*"\n- inputText: {json.dumps(reply)}\n- tapOn: "Submit"\n')
    else:
        pick = next(((t, p) for t, p in opts if (t[3:].strip() != ans) == bool(wrong)), None)
        if not pick:
            print('no option for', repr(ans), [t for t, _ in opts]); break
        run(f'- tapOn:\n    point: "{pick[1][0]},{pick[1][1]}"\n')
    run('- extendedWaitUntil:\n    visible: "Continue|Done"\n    timeout: 8000\n- tapOn: "Continue|Done"\n')
    print(f'{n + 1}: {key[:45]!r} -> {"MISS" if wrong else ans!r} ({"typed" if typed else "choice"}) {time.time() - t0:.0f}s')
