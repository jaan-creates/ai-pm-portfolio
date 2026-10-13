import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'.janu-live';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.gs')||f.endsWith('.js'));
const terms=['pre-maintenance','RUNTIME_BUDGET','runtimeBudgetOk_',"openCircuit_('Worker Runtime'","healthSet_('Worker Runtime'"];
const out=[];
function ranges(src){
  const rs=[];const re=/function\s+([A-Za-z_$][\w$]*)\s*\(/g;let m;
  while((m=re.exec(src))){
    const start=m.index,open=src.indexOf('{',re.lastIndex);if(open<0)continue;
    let d=0,q=null,e=false,line=false,block=false,end=-1;
    for(let i=open;i<src.length;i++){const c=src[i],n=src[i+1]||'';
      if(line){if(c==='\n')line=false;continue}
      if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
      if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}
      if(c==='/'&&n==='/'){line=true;i++;continue}
      if(c==='/'&&n==='*'){block=true;i++;continue}
      if(c==='"'||c==="'"||c.charCodeAt(0)===96){q=c;continue}
      if(c==='{')d++;else if(c==='}'&&--d===0){end=i+1;break}
    }
    if(end>0)rs.push({name:m[1],start,end});
  }
  return rs;
}
for(const f of files){
  const src=fs.readFileSync(path.join(root,f),'utf8'),rs=ranges(src);
  for(const term of terms){
    let pos=0;
    while((pos=src.indexOf(term,pos))>=0){
      const fn=rs.find(r=>pos>=r.start&&pos<r.end);
      const body=fn?src.slice(fn.start,fn.end):'';
      out.push({
        file:f,
        term,
        function:fn?fn.name:'TOP_LEVEL',
        functionLength:fn?fn.end-fn.start:0,
        termOffsetInFunction:fn?pos-fn.start:pos,
        contains:{
          phase1OneJobTickCore:body.includes('phase1OneJobTickCore_'),
          nextQ:body.includes('nextQ_('),
          processQ:body.includes('processQ_('),
          orchestrate:body.includes('orchestrate_('),
          maintenance:/maintenance/i.test(body),
          closeCircuit:body.includes("closeCircuit_('Worker Runtime'"),
          healthSetRuntime:body.includes("healthSet_('Worker Runtime'"),
          openCircuitRuntime:body.includes("openCircuit_('Worker Runtime'")
        }
      });
      pos+=term.length;
    }
  }
}
console.log(JSON.stringify({status:'PASS',contract:'WORKER-RUNTIME-OPENER-DIAG-001',occurrences:out},null,2));
