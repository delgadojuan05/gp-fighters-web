from pathlib import Path
import re,json,shutil
from PIL import Image
p=Path('PeleaUruguaya'); out=Path('gp-fighters-web/docs/assets'); src=p/'Source/PeleaUruguaya'
def uv(file,name):
 s=(src/file).read_text(); block=s.split(name,1)[1].split('};',1)[0]
 return [[float(x.rstrip('f')) for x in row.split(',') if x.strip()] for row in re.findall(r'\{([^{}]+)\}',block) if re.match(r'\s*[\d.]',row)]
data={
 'JuanV8':uv('V8UV.h','JuanV8UV'), 'Rodri':uv('SpriteUV.h','RodriUV'),
 'RodriAir':uv('SpriteUV.h','RodriAirUV'),'Diego':uv('V16UV.h','DiegoUV'), 'Gabi':uv('V16UV.h','GabiUV'),
 'AnimalsV16':uv('V16UV.h','AnimalsV16UV'), 'Specials':uv('SpriteUV.h','SpecialsUV')}
for name in [*data,'FacesV16','TitleV16','JardinPiscina']:
 im=Image.open(p/'ArtSource'/f'{name}.png')
 if name=='TitleV16': im.thumbnail((1440,900))
 if name=='JardinPiscina': im.thumbnail((1280,720))
 im.save(out/f'{name}.webp','WEBP',quality=88,method=6)
(out/'sprites.json').write_text(json.dumps(data),encoding='utf-8')
for name in ['Hit','Block','Whoosh','Jump','Land','Select','Round','Throw']:
 shutil.copy2(p/'AudioSource'/f'{name}.wav',out/f'{name}.wav')
print('Assets:',sum(x.stat().st_size for x in out.iterdir()),'bytes')
