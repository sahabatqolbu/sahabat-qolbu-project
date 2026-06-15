from pathlib import Path
lines=Path('backend-failed.log').read_text(errors='replace').splitlines()
for i,l in enumerate(lines):
    if 'not ok' in l or '# fail 2' in l:
        print('---',i+1,'---')
        for x in lines[max(0,i-20):min(len(lines),i+40)]: print(x)
