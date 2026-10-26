"""GeoHesap.html derleyici. İki düzende çalışır:
   gapp/src/*.js  -> gapp/dist/GeoHesap.html
   program/kaynak/*.js -> program/GeoHesap.html   (kaynak klasöründen: python build.py)"""
import pathlib, sys
here = pathlib.Path(__file__).resolve().parent
if (here / 'engine.js').exists():          # program/kaynak düzeni
    S, out_path = here, here.parent / 'GeoHesap.html'
else:                                       # geliştirme düzeni
    S, out_path = here / 'src', here / 'dist' / 'GeoHesap.html'
files = ['engine.js', 'example.js', 'soils.js', 'draw.js', 'docx.js', 'report.js', 'ui.js']
missing = [f for f in files + ['index.html', 'style.css'] if not (S / f).exists()]
if missing: sys.exit('Eksik kaynak dosya: ' + ', '.join(missing))
html = (S / 'index.html').read_text(encoding='utf-8')
css = (S / 'style.css').read_text(encoding='utf-8')
js = '\n'.join((S / f).read_text(encoding='utf-8') for f in files).replace('</script', '<\\/script')
out = html.replace('/*CSS*/', css).replace('/*JS*/', js)
out_path.parent.mkdir(exist_ok=True)
out_path.write_text(out, encoding='utf-8')
print('ok', out_path, len(out))
