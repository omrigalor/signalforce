"""Read the JSON PRODUCTS literal without executing any legacy JavaScript."""
from pathlib import Path
import json,re,sys,hashlib
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path.home()/'Desktop/Salesforce/Sales Propensity Model/Salesforce Pipeline Intelligence.html'
raw=source.read_text();match=re.search(r'\bconst\s+PRODUCTS\s*=\s*',raw)
if not match:raise SystemExit('No PRODUCTS literal found; nothing imported.')
products,_=json.JSONDecoder().raw_decode(raw[match.end():])
if not isinstance(products,list) or len({p['k'] for p in products})!=len(products):raise SystemExit('Invalid product registry')
normalized=[dict(id=p['k'],legacyId=p['k'],canonicalName=p['n'],aliases=[],family=p['f'],persona=p.get('persona',''),segments=p.get('fit',[]),legacyEdge=p.get('edge',''),competitors=p.get('comp',[]),drivers=p.get('drivers',[]),riskFlag=p.get('risk',False),capabilities=[],prerequisites=[],officialUrl='',verified=False) for p in products]
drivers=sorted({k for p in products for k,w in p.get('drivers',[])})
# Driver names alone cannot establish observation; quarantine them as enriched until sourced.
dictionary=[dict(id=k,classification='enriched',evidenceRequired=True,method='Imported vocabulary; classification requires source review') for k in drivers]
out=root/'src/data';out.mkdir(parents=True,exist_ok=True)
(out/'legacy-products.json').write_text(json.dumps(normalized,indent=2))
(out/'signal-dictionary.json').write_text(json.dumps(dictionary,indent=2))
(out/'legacy-manifest.json').write_text(json.dumps(dict(productCount=len(products),driverCount=len(drivers),sourceName=source.name,sha256=hashlib.sha256(raw.encode()).hexdigest(),importedAt='2026-09-16',note='Registry and driver weights imported. Account scores and prices are not inferred or migrated.'),indent=2))
print(f'Imported {len(products)} products and {len(drivers)} driver keys. Source unchanged.')
