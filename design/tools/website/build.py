"""Build Endloop website v2.
out/endloop-website.html  -> artifact preview (images inlined)
out/site/index.html + out/site/img/  -> GitHub Pages (images as files)
"""
import base64, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', '..', '..')  # repo root: reads assets/characters/loop and assets/images
OUT = os.path.join(HERE, 'out')  # out/site/* -> copy index.html + img/ into site/ and the endloop-site repo
os.makedirs(os.path.join(OUT, 'site', 'img'), exist_ok=True)

tpl = open(os.path.join(HERE, 'template.html')).read()
head, body = tpl.split('<!--BODY-->')

wm = open(os.path.join(HERE, 'wordmark.inline.svg')).read()
wm_plain = wm.replace('role="img" aria-label="endloop"', 'aria-hidden="true"')
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>'

GRADS = ['linear-gradient(135deg,#FFB38A,#F0263D)', 'linear-gradient(160deg,#6B5BFF,#1B1464)',
         'linear-gradient(135deg,#F2EBDD,#FFB38A)', 'linear-gradient(200deg,#16895F,#0E3B2C)']
post = '<div class="post"><div class="ph"><span class="av"></span><span class="nm"></span></div><div class="md" style="--g:{g}"></div><div class="ac"><b></b><b></b><b></b></div><div class="tx"></div></div>'
FEED = ''.join(post.format(g=g) for g in GRADS)

EN = ["You didn't lose track of time. You handed it over.", "The feed has no ending. You were supposed to be the ending.",
      "Your phone has started calling you “roommate.”", "Time's up. Go look at something that doesn't refresh.",
      "Shorts are short. Your session isn't.", "Your battery has a longer attention span than you do today.",
      "You're not “just checking.” You're moving in.", "Keep scrolling and you'll reach the ads from 2019."]
TA = ["Time pass-ku open panneenga. Time mothama pass aagiduchu.", "Vera level scrolling. Aana life-la level onnum illa.",
      "Unga thumb-ku oru statue vechidalam pola.", "Reels naalaikum irukum. Indha saayangalam thirumba varadhu.",
      "“Just checking” illa boss. Neenga anga kudi poiteenga.", "Seri, podhum. Screen illadha edhavadhu pannunga."]
def ul(lines, hidden=False):
    a = ' aria-hidden="true"' if hidden else ''
    return '<ul%s>%s</ul>' % (a, ''.join('<li>%s</li>' % l.replace('&', '&amp;') for l in lines))

POSES = set(re.findall(r'\{\{IMG:([a-z-]+)\}\}', tpl))
LUPES = set(re.findall(r'\{\{LUPE:([a-z-]+)\}\}', tpl))
ICONS = set(re.findall(r'\{\{ICON:([a-z-]+)\}\}', tpl))

def webp(path, size, q=82):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((size, size), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return b.getvalue()

imgs, icons, lupes = {}, {}, {}
for p in sorted(LUPES):
    lupes[p] = webp(os.path.join(APP, 'assets/characters/lupe/%s.webp' % p), 420)
for p in sorted(POSES):
    imgs[p] = webp(os.path.join(APP, 'assets/characters/loop/%s.webp' % p), 420)
for i in sorted(ICONS):
    icons[i] = webp(os.path.join(APP, 'assets/images/app-icon-%s.png' % i), 192, 90)

def render(src_for_img, src_for_icon, src_for_lupe):
    h = head + body
    h = (h.replace('{{WORDMARK}}', wm).replace('{{WORDMARK_PLAIN}}', wm_plain)
          .replace('{{CHECK}}', CHECK).replace('{{SHARE}}', SHARE).replace('{{FEED}}', FEED)
          .replace('{{MARQ_EN}}', ul(EN)).replace('{{MARQ_EN_DUP}}', ul(EN, True))
          .replace('{{MARQ_TA}}', ul(TA)).replace('{{MARQ_TA_DUP}}', ul(TA, True)))
    h = re.sub(r'\{\{IMG:([a-z-]+)\}\}', lambda m: src_for_img(m.group(1)), h)
    h = re.sub(r'\{\{LUPE:([a-z-]+)\}\}', lambda m: src_for_lupe(m.group(1)), h)
    h = re.sub(r'\{\{ICON:([a-z-]+)\}\}', lambda m: src_for_icon(m.group(1)), h)
    assert '{{' not in h, re.findall(r'\{\{[^}]+\}\}', h)[:5]
    return h

# artifact preview: everything inline
art = render(lambda n: 'data:image/webp;base64,' + base64.b64encode(imgs[n]).decode(),
             lambda n: 'data:image/webp;base64,' + base64.b64encode(icons[n]).decode(),
             lambda n: 'data:image/webp;base64,' + base64.b64encode(lupes[n]).decode())
open(os.path.join(OUT, 'endloop-website.html'), 'w').write(art)

# site: real files
for n, b in imgs.items(): open(os.path.join(OUT, 'site', 'img', 'loop-%s.webp' % n), 'wb').write(b)
for n, b in icons.items(): open(os.path.join(OUT, 'site', 'img', 'icon-%s.webp' % n), 'wb').write(b)
for n, b in lupes.items(): open(os.path.join(OUT, 'site', 'img', 'lupe-%s.webp' % n), 'wb').write(b)
site = render(lambda n: 'img/loop-%s.webp' % n, lambda n: 'img/icon-%s.webp' % n, lambda n: 'img/lupe-%s.webp' % n)
hd, bd = site.split('</style>', 1)
doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
       '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="icon" href="favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n' + hd + '</style>\n</head>\n<body>\n' + bd + '\n</body>\n</html>\n')
open(os.path.join(OUT, 'site', 'index.html'), 'w').write(doc)
print('lupe', sorted(LUPES), 'poses', sorted(POSES), 'icons', sorted(ICONS))
print('artifact KB', len(art) // 1024, 'site index KB', len(doc) // 1024,
      'img KB', sum(len(b) for b in list(imgs.values()) + list(icons.values()) + list(lupes.values())) // 1024)
