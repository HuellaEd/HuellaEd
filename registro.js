const NOTAS_DATA=[];
var INASIST_DATA=[];

// ── NOTAS ──
async function renderBoletin1(){
  var areas=AREAS;
  var esPrimerCiclo=_cicloActual==='primer_ciclo';
  var rowList=window.__students&&Object.keys(gradesData).length>0
    ?window.__students.map(function(s){return {a:s.full_name,n:areas.map(function(area){
        var v=gradesData[s.id]&&gradesData[s.id][area]!=null?gradesData[s.id][area]:null;
        return v==null?null:(esPrimerCiclo?v:parseFloat(v));
      })};})
    :NOTAS_DATA.map(function(r){return {a:r.a,n:r.n.slice()};});
  var html='<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:480px;">';
  html+='<thead><tr style="background:var(--verde);color:#fff;">';
  html+='<th style="padding:7px 5px;text-align:left;">Alumno</th>';
  areas.forEach(a=>{html+=`<th style="padding:7px 3px;text-align:center;">${a}</th>`;});
  if(!esPrimerCiclo)html+='<th style="padding:7px 3px;text-align:center;">Prom</th>';
  html+='<th style="padding:7px 3px;text-align:center;">Faltas</th>';
  html+='<th style="padding:7px 5px;text-align:left;">Estado</th>';
  html+='</tr></thead><tbody>';

  rowList.forEach((r,i)=>{
    var validScores=r.n.filter(function(v){return v!=null;});
    var prom=(!esPrimerCiclo&&validScores.length)?(validScores.reduce((a,b)=>a+b,0)/validScores.length).toFixed(1):'—';
    var desap=esPrimerCiclo?validScores.filter(function(v){return v==='R'||v==='D';}).length:validScores.filter(n=>n<APROBADO).length;
    var inasist=INASIST_DATA.find(x=>x.a===r.a)||{m:0,ab:0,my:0};
    var totalF=inasist.m+inasist.ab+inasist.my;
    var bg=i%2===0?'#fff':'#F5F2EE';

    var alertaF=totalF>=10?'🔴':totalF>=7?'🟠':totalF>=5?'🟡':'';
    var alertaN=desap>0?`✗${desap}`:'';
    var estado=(alertaF||alertaN)?[alertaF,alertaN].filter(Boolean).join(' '):'✅';

    var cells=r.n.map(n=>{
      if(n==null)return '<td style="padding:5px 3px;text-align:center;color:var(--gris);">—</td>';
      if(esPrimerCiclo){
        var low=n==='R'||n==='D';
        return `<td style="padding:5px 3px;text-align:center;color:${low?'#C0392B':'var(--negro)'};font-weight:${low?'bold':'normal'};background:${low?'#FDE8E8':'transparent'};">${n}</td>`;
      }
      return `<td style="padding:5px 3px;text-align:center;color:${n>=APROBADO?'var(--negro)':'#C0392B'};font-weight:${n<APROBADO?'bold':'normal'};background:${n<APROBADO?'#FDE8E8':'transparent'};">${n}</td>`;
    }).join('');
    var pc=prom!=='—'&&parseFloat(prom)>=APROBADO?'var(--verde)':'#C0392B';
    var fcol=totalF>=10?'#C0392B':totalF>=7?'var(--terracota)':totalF>=5?'#B7950B':'var(--negro)';
    var promCell=esPrimerCiclo?'':`<td style="padding:5px 3px;text-align:center;font-weight:bold;color:${pc};">${prom}</td>`;

    html+=`<tr style="background:${bg};">
      <td style="padding:5px;font-size:10px;">${r.a}</td>
      ${cells}
      ${promCell}
      <td style="padding:5px 3px;text-align:center;font-weight:bold;color:${fcol};">${totalF}</td>
      <td style="padding:5px;font-size:10px;">${estado}</td>
    </tr>`;
  });
  html+='</tbody></table>';
  html+='<div style="margin-top:7px;font-size:10px;color:var(--gris);">L=Lengua · M=Matemática · CS=Cs.Sociales · CN=Cs.Naturales · I=Inglés · EA=Ed.Artística · EF=Ed.Física · Faltas: 🔴+10 · 🟠7-9 · 🟡5-6</div>';

  // Sección resumen inasistencias
  await cargarInasistDataReal();
  var mesesB1=MESES_POR_TRIMESTRE[gradesPeriodo]||MESES_POR_TRIMESTRE['1'];
  var trimNombre=gradesPeriodo==='1'?'1er':gradesPeriodo==='2'?'2do':'3er';
  html+='<div style="margin-top:16px;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--negro);">Inasistencias — '+trimNombre+' Trimestre</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">';
  html+='<div style="background:var(--crema);border-radius:9px;padding:10px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--verde);">'+DIAS+'</div><div style="font-size:10px;color:var(--gris);">Días hábiles</div><div style="font-size:9px;color:var(--gris);">'+mesesB1.map(m=>m.n).join(' · ')+'</div></div>';
  
  var criticos=INASIST_DATA.filter(r=>r.total>=10);
  var acumulacion=INASIST_DATA.filter(r=>r.total>=7&&r.total<10);
  var intermitente=INASIST_DATA.filter(r=>r.total>=5&&r.total<7);
  var promFaltas=INASIST_DATA.length?(INASIST_DATA.reduce((s,r)=>s+r.total,0)/INASIST_DATA.length).toFixed(1):'—';
  
  html+='<div style="background:var(--crema);border-radius:9px;padding:10px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--verde);">'+promFaltas+'</div><div style="font-size:10px;color:var(--gris);">Promedio faltas</div><div style="font-size:9px;color:var(--gris);">por alumno</div></div>';
  html+='<div style="background:var(--crema);border-radius:9px;padding:10px;text-align:center;"><div style="font-size:18px;font-weight:700;color:'+(criticos.length>0?'#C0392B':'var(--verde)')+'">'+criticos.length+'</div><div style="font-size:10px;color:var(--gris);">Alertas críticas</div><div style="font-size:9px;color:var(--gris);">+10 faltas</div></div>';
  html+='</div>';

  // Tabla inasistencias compacta
  html+='<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:360px;">';
  html+='<thead><tr style="background:var(--verde);color:#fff;"><th style="padding:6px 5px;text-align:left;">Alumno</th>'+mesesB1.map(m=>'<th style="padding:6px 3px;text-align:center;">'+m.n+'</th>').join('')+'<th style="padding:6px 3px;text-align:center;">Total</th><th style="padding:6px 3px;text-align:center;">%</th><th style="padding:6px 5px;text-align:left;">Estado</th></tr></thead><tbody>';
  INASIST_DATA.forEach((r,i)=>{
    var t=r.total;
    var pct=DIAS>0?Math.round((DIAS-t)/DIAS*100):0;
    var est,bg;
    if(t>=10){est='🔴 Crítico';bg='#FDE8E8';}
    else if(t>=7){est='🟠 Acum.';bg='#FDF0E8';}
    else if(t>=5){est='🟡 Interm.';bg='#FDFAE8';}
    else{est='✅';bg=i%2===0?'#fff':'#F5F2EE';}
    var celdasMes=r.porMes.map(function(n){return '<td style="padding:5px 3px;text-align:center;">'+n+'</td>';}).join('');
    html+='<tr style="background:'+bg+';"><td style="padding:5px;font-size:10px;">'+r.a+'</td>'+celdasMes+'<td style="padding:5px 3px;text-align:center;font-weight:bold;">'+t+'</td><td style="padding:5px 3px;text-align:center;">'+pct+'%</td><td style="padding:5px;font-size:10px;">'+est+'</td></tr>';
  });
  html+='</tbody></table>';
  
  document.getElementById('boletin-1-contenido').innerHTML=html;
}


async function renderBoletin2(){
  var cont=document.getElementById('boletin-2-contenido');
  if(!cont)return;
  cont.innerHTML='<div style="text-align:center;color:var(--gris);font-size:12px;padding:14px;">Cargando datos parciales...</div>';
  var areas=AREAS;

  // Cargar notas del período 2 (probablemente vacías por ahora)
  var notasP2={};
  if(window.__sb&&window.__students){
    try{
      var user=(await window.__sb.auth.getUser()).data.user;
      if(user){
        var res=await window.__sb.from('grades').select('student_id,subject_id,score').eq('teacher_id',user.id).eq('period','2');
        if(res.data){
          res.data.forEach(function(g){
            if(!notasP2[g.student_id])notasP2[g.student_id]={};
            var code=SUBJECT_CODES[g.subject_id];
            if(code)notasP2[g.student_id][code]=g.score;
          });
        }
      }
    }catch(e){}
  }

  // Cargar asistencia real del 2do trimestre (1 jun en adelante, hasta hoy)
  var asistenciaP2={};
  var hoy=new Date();
  var inicioT2='2026-06-01';
  var finRango=fechaHoyArgentina();
  if(window.__sb&&window.__students){
    try{
      var user2=(await window.__sb.auth.getUser()).data.user;
      if(user2){
        var resA=await window.__sb.from('attendance').select('student_id,status,date').eq('teacher_id',user2.id).gte('date',inicioT2).lte('date',finRango);
        if(resA.data){
          resA.data.forEach(function(r){
            if(!asistenciaP2[r.student_id])asistenciaP2[r.student_id]={presente:0,ausente:0,tardanza:0,justificado:0};
            if(asistenciaP2[r.student_id][r.status]!=null)asistenciaP2[r.student_id][r.status]++;
          });
        }
      }
    }catch(e){}
  }

  var rowList=(window.__students||[]).map(function(s){
    return {
      id:s.id,a:s.full_name,
      n:areas.map(function(area){return notasP2[s.id]&&notasP2[s.id][area]!=null?parseFloat(notasP2[s.id][area]):null;})
    };
  });

  var html='<div style="font-size:11px;color:var(--gris);margin-bottom:10px;background:var(--verde-bg);border-radius:8px;padding:8px 11px;">📊 Datos parciales del trimestre en curso (desde el 1° de junio hasta hoy). Las notas se completan a medida que las cargás.</div>';
  html+='<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:480px;">';
  html+='<thead><tr style="background:var(--verde);color:#fff;">';
  html+='<th style="padding:7px 5px;text-align:left;">Alumno</th>';
  areas.forEach(function(a){html+='<th style="padding:7px 3px;text-align:center;">'+a+'</th>';});
  html+='<th style="padding:7px 3px;text-align:center;">Prom</th>';
  html+='<th style="padding:7px 3px;text-align:center;">Faltas</th>';
  html+='<th style="padding:7px 3px;text-align:center;">% Asist.</th>';
  html+='</tr></thead><tbody>';

  rowList.forEach(function(r,i){
    var validScores=r.n.filter(function(v){return v!=null;});
    var prom=validScores.length?(validScores.reduce(function(a,b){return a+b;},0)/validScores.length).toFixed(1):'—';
    var bg=i%2===0?'#fff':'#F5F2EE';
    var asist=asistenciaP2[r.id]||{presente:0,ausente:0,tardanza:0,justificado:0};
    var totalDias=asist.presente+asist.ausente+asist.tardanza+asist.justificado;
    var totalF=asist.ausente+asist.justificado;
    var pctAsist=totalDias?Math.round(asist.presente/totalDias*100):null;

    var cells=r.n.map(function(n){
      return n!=null?'<td style="padding:5px 3px;text-align:center;color:'+(n>=APROBADO?'var(--negro)':'#C0392B')+';font-weight:'+(n<APROBADO?'bold':'normal')+';">'+n+'</td>'
        :'<td style="padding:5px 3px;text-align:center;color:var(--gris);">—</td>';
    }).join('');

    var pc=prom!=='—'&&parseFloat(prom)>=APROBADO?'var(--verde)':(prom==='—'?'var(--gris)':'#C0392B');

    html+='<tr style="background:'+bg+';">';
    html+='<td style="padding:5px;font-weight:600;">'+r.a+'</td>';
    html+=cells;
    html+='<td style="padding:5px 3px;text-align:center;font-weight:bold;color:'+pc+';">'+prom+'</td>';
    html+='<td style="padding:5px 3px;text-align:center;">'+(totalDias?totalF:'—')+'</td>';
    html+='<td style="padding:5px 3px;text-align:center;">'+(pctAsist!=null?pctAsist+'%':'—')+'</td>';
    html+='</tr>';
  });
  html+='</tbody></table>';

  cont.innerHTML=html;
}

var CONCEPTUALES=['S','MB','B','R','D'];
var _cicloActual=null;

function renderNotas(ciclo){
  _cicloActual=ciclo;
  var tb=document.getElementById('notas-tbody');
  if(!tb||!window.__students)return;
  var esPrimerCiclo=ciclo==='primer_ciclo';
  var promTh=document.querySelector('#tabla-notas [data-col="prom"]');
  if(promTh)promTh.style.display=esPrimerCiclo?'none':'';
  var statsWrap=document.getElementById('stats-areas-wrap');
  if(statsWrap)statsWrap.style.display=esPrimerCiclo?'none':'';
  tb.innerHTML=window.__students.map(function(s,i){
    var bg=i%2===0?'#fff':'#F5F2EE';
    var cells=AREAS.map(function(area){
      var sc=gradesData[s.id]&&gradesData[s.id][area]!=null?gradesData[s.id][area]:'';
      if(esPrimerCiclo){
        var low=sc==='R'||sc==='D';
        var opts=['<option value=""></option>'].concat(CONCEPTUALES.map(function(o){return '<option value="'+o+'"'+(o===sc?' selected':'')+'>'+o+'</option>';})).join('');
        return '<td style="padding:3px 2px;text-align:center;"><select data-sid="'+s.id+'" data-area="'+area+'" onchange="updateGrade(this)" style="width:40px;padding:3px 1px;text-align:center;border:1.5px solid '+(low?'#C0392B':'var(--gris-claro)')+';border-radius:6px;font-size:12px;background:'+(low?'#FDE8E8':'transparent')+';font-weight:'+(low?'bold':'normal')+';font-family:inherit;color:inherit;">'+opts+'</select></td>';
      }
      var low=sc!==''&&parseFloat(sc)<APROBADO;
      return '<td style="padding:3px 2px;text-align:center;"><input type="number" min="1" max="10" step="0.5" value="'+sc+'" data-sid="'+s.id+'" data-area="'+area+'" onchange="updateGrade(this)" style="width:36px;padding:3px 2px;text-align:center;border:1.5px solid '+(low?'#C0392B':'var(--gris-claro)')+';border-radius:6px;font-size:12px;background:'+(low?'#FDE8E8':'transparent')+';font-weight:'+(low?'bold':'normal')+';font-family:inherit;color:inherit;"></td>';
    }).join('');
    if(esPrimerCiclo){
      return '<tr style="background:'+bg+'"><td style="padding:5px;font-size:10px;white-space:nowrap;">'+s.full_name+'</td>'+cells+'</tr>';
    }
    var vals=AREAS.map(function(area){return gradesData[s.id]&&gradesData[s.id][area]!=null?parseFloat(gradesData[s.id][area]):null;}).filter(function(v){return v!==null;});
    var prom=vals.length?(vals.reduce(function(a,b){return a+b;},0)/vals.length).toFixed(1):'—';
    var pc=vals.length&&parseFloat(prom)>=APROBADO?'var(--verde)':'#C0392B';
    return '<tr style="background:'+bg+'"><td style="padding:5px;font-size:10px;white-space:nowrap;">'+s.full_name+'</td>'+cells+'<td style="padding:5px 3px;text-align:center;font-weight:bold;color:'+pc+';font-size:12px;">'+prom+'</td></tr>';
  }).join('');
  if(!esPrimerCiclo)renderStatsAreas();
}

function renderStatsAreas(){
  var sd=document.getElementById('stats-areas');
  if(!sd||!window.__students)return;
  if(_cicloActual==='primer_ciclo'){sd.innerHTML='';return;}
  sd.innerHTML=AREAS.map(function(area){
    var vals=window.__students.map(function(s){return gradesData[s.id]&&gradesData[s.id][area]!=null?parseFloat(gradesData[s.id][area]):null;}).filter(function(v){return v!==null;});
    if(!vals.length)return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><div style="width:26px;font-size:10px;font-weight:700;">'+area+'</div><div style="font-size:10px;color:var(--gris);">—</div></div>';
    var p=(vals.reduce(function(a,b){return a+b;},0)/vals.length).toFixed(1);
    var ap=vals.filter(function(v){return v>=APROBADO;}).length;
    var pct=Math.round(ap/vals.length*100);
    var col=pct>=80?'var(--verde)':pct>=60?'var(--terracota)':'#C0392B';
    return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><div style="width:26px;font-size:10px;font-weight:700;">'+area+'</div><div style="flex:1;height:7px;background:var(--gris-claro);border-radius:3px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:3px;"></div></div><div style="font-size:10px;color:'+col+';font-weight:700;width:55px;">'+pct+'% · '+p+'</div></div>';
  }).join('');
}

async function updateGrade(input){
  var sid=input.dataset.sid;
  var area=input.dataset.area;
  var esPrimerCiclo=_cicloActual==='primer_ciclo';
  var val=input.value===''?null:(esPrimerCiclo?input.value:parseFloat(input.value));
  if(!gradesData[sid])gradesData[sid]={};
  gradesData[sid][area]=val;
  var low=esPrimerCiclo?(val==='R'||val==='D'):(val!==null&&val<APROBADO);
  input.style.borderColor=low?'#C0392B':'var(--gris-claro)';
  input.style.background=low?'#FDE8E8':'transparent';
  input.style.fontWeight=low?'bold':'normal';
  var row=input.closest('tr');
  if(row&&_cicloActual!=='primer_ciclo'){
    var vals=AREAS.map(function(a){return gradesData[sid]&&gradesData[sid][a]!=null?parseFloat(gradesData[sid][a]):null;}).filter(function(v){return v!==null;});
    var prom=vals.length?(vals.reduce(function(a,b){return a+b;},0)/vals.length).toFixed(1):'—';
    var pc=vals.length&&parseFloat(prom)>=APROBADO?'var(--verde)':'#C0392B';
    var cells=row.querySelectorAll('td');
    var promCell=cells[cells.length-1];
    if(promCell){promCell.textContent=prom;promCell.style.color=pc;}
  }
  renderStatsAreas();
}

function cambiarPeriodoNotas(p){
  gradesPeriodo=p;
  ['1','2','3'].forEach(function(n){var btn=document.getElementById('notas-p'+n);if(btn)btn.className='tab-btn'+(n===p?' active':'');});
  initGrades();
}

async function initGrades(){
  if(!window.__students)return;
  if(window.__teacherReadyPromise)await window.__teacherReadyPromise;
  var ciclo=_adecDeriveCiclo(window.__teacherGrade);
  if(!window.__sb){
    if(gradesPeriodo==='1'){
      var nameMap={};window.__students.forEach(function(s){nameMap[s.full_name]=s.id;});
      gradesData={};
      NOTAS_DATA.forEach(function(r){var sid=nameMap[r.a];if(!sid)return;gradesData[sid]={};AREAS.forEach(function(area,i){gradesData[sid][area]=r.n[i];});});
    }else{gradesData={};}
    renderNotas(ciclo);return;
  }
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var res=await window.__sb.from('grades').select('student_id,subject_id,score,grade_conceptual').eq('teacher_id',user.id).eq('period',gradesPeriodo);
  if(res.error){
    // CRÍTICO: si falla, NO vaciar gradesData — dejar lo que ya hubiera en pantalla en vez de un boletín en blanco.
    alert('⚠️ No se pudieron cargar las notas guardadas (error de conexión). Tus datos siguen guardados — recargá la página para reintentar.');
    return;
  }
  gradesData={};
  if(res.data&&res.data.length){
    res.data.forEach(function(g){if(!gradesData[g.student_id])gradesData[g.student_id]={};var code=SUBJECT_CODES[g.subject_id];if(code)gradesData[g.student_id][code]=g.score!=null?g.score:g.grade_conceptual;});
  }else if(gradesPeriodo==='1'){
    var nameMap={};window.__students.forEach(function(s){nameMap[s.full_name]=s.id;});
    NOTAS_DATA.forEach(function(r){var sid=nameMap[r.a];if(!sid)return;gradesData[sid]={};AREAS.forEach(function(area,i){gradesData[sid][area]=r.n[i];});});
  }
  renderNotas(ciclo);
}

async function guardarNotas(){
  if(!window.__sb||!window.__students)return;
  var btn=document.getElementById('notas-save-btn');
  var msg=document.getElementById('notas-save-msg');
  btn.disabled=true;btn.textContent='Guardando…';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user){btn.disabled=false;btn.textContent='Guardar notas';return;}
  var esPrimerCiclo=_cicloActual==='primer_ciclo';
  var records=[];
  window.__students.forEach(function(s){
    AREAS.forEach(function(area){
      var score=gradesData[s.id]&&gradesData[s.id][area]!=null?gradesData[s.id][area]:null;
      if(score===null)return;
      if(esPrimerCiclo){
        records.push({student_id:s.id,teacher_id:user.id,subject_id:SUBJECT_IDS[area],period:gradesPeriodo,score:null,grade_conceptual:score,updated_at:new Date().toISOString()});
      }else{
        records.push({student_id:s.id,teacher_id:user.id,subject_id:SUBJECT_IDS[area],period:gradesPeriodo,score:parseFloat(score),grade_conceptual:null,updated_at:new Date().toISOString()});
      }
    });
  });
  var res=await window.__sb.from('grades').upsert(records,{onConflict:'student_id,subject_id,period'});
  btn.disabled=false;btn.textContent='Guardar notas';
  msg.style.display='block';
  if(res.error){msg.style.color='#C0392B';msg.textContent='Error: '+res.error.message;}
  else{msg.style.color='var(--verde)';msg.textContent='✅ Notas guardadas';setTimeout(function(){msg.style.display='none';},3000);window.registrarActividad&&window.registrarActividad('notas',{periodo:gradesPeriodo,cantidad:records.length});}
}

// ── INASISTENCIAS ──
var MESES_POR_TRIMESTRE={
  '1':[{n:'Mar',m:3},{n:'Abr',m:4},{n:'May',m:5}],
  '2':[{n:'Jun',m:6},{n:'Jul',m:7},{n:'Ago',m:8}],
  '3':[{n:'Sep',m:9},{n:'Oct',m:10},{n:'Nov',m:11},{n:'Dic',m:12}]
};
var _inasistCargada=false;
var DIAS=0; // se recalcula siempre con cargarInasistDataReal(), contando fechas reales con asistencia tomada
async function cargarInasistDataReal(){
  if(!window.__sb||!window.__students||!window.__students.length){INASIST_DATA=[];DIAS=0;return INASIST_DATA;}
  var meses=MESES_POR_TRIMESTRE[gradesPeriodo]||MESES_POR_TRIMESTRE['1'];
  var mesesNums=meses.map(function(mes){return mes.m;});
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    // Traemos TODOS los registros (presente y ausente), porque DIAS se calcula
    // contando fechas distintas en las que se tomó asistencia, sin importar el resultado.
    var {data:registros}=await window.__sb.from('attendance')
      .select('student_id,date,status')
      .eq('teacher_id',user.id);
    registros=registros||[];
    // Filtrar solo registros dentro de los meses del trimestre activo
    var registrosTrim=registros.filter(function(r){
      var d=new Date(r.date+'T12:00:00');
      return mesesNums.indexOf(d.getMonth()+1)>-1;
    });
    // DIAS = cantidad de fechas distintas en que se tomó asistencia en este trimestre
    var fechasDistintas=Array.from(new Set(registrosTrim.map(function(r){return r.date;})));
    DIAS=fechasDistintas.length;

    var ausentesTrim=registrosTrim.filter(function(r){return r.status==='ausente';});
    INASIST_DATA=window.__students.map(function(s){
      var faltasAlumno=ausentesTrim.filter(function(a){return a.student_id===s.id;});
      var porMes=meses.map(function(mes){
        return faltasAlumno.filter(function(a){
          var d=new Date(a.date+'T12:00:00');
          return d.getMonth()+1===mes.m;
        }).length;
      });
      return {a:s.full_name,porMes:porMes,total:porMes.reduce(function(s,n){return s+n;},0)};
    });
    _inasistCargada=true;
  }catch(e){
    console.log('Error al cargar inasistencias reales:',e);
    INASIST_DATA=[];
    DIAS=0;
  }
  return INASIST_DATA;
}
async function renderInasistencias(){
  var tb=document.getElementById('inasist-tbody');
  if(!tb)return;
  var meses=MESES_POR_TRIMESTRE[gradesPeriodo]||MESES_POR_TRIMESTRE['1'];

  // Reconstruir encabezado completo (cantidad de columnas de mes varía: 3 en trim 1 y 2, 4 en trim 3)
  var theadTr=document.querySelector('#tabla-inasistencias thead tr');
  if(theadTr){
    theadTr.innerHTML='<th style="padding:7px 5px;text-align:left;">Alumno</th>'
      +meses.map(function(mes){return '<th style="padding:7px 3px;text-align:center;">'+mes.n+'</th>';}).join('')
      +'<th style="padding:7px 3px;text-align:center;">Total</th><th style="padding:7px 3px;text-align:center;">%</th><th style="padding:7px 5px;text-align:left;">Estado</th>';
  }
  var tabla=document.querySelector('#tabla-inasistencias table');
  if(tabla)tabla.setAttribute('data-cols',meses.length+3);

  var tituloEl=document.getElementById('inasist-titulo');
  if(tituloEl)tituloEl.textContent='Inasistencias — '+DIAS+' días hábiles';

  var colspanTotal=meses.length+3;
  tb.innerHTML='<tr><td colspan="'+colspanTotal+'" style="text-align:center;padding:14px;color:var(--gris);font-size:11px;">Cargando…</td></tr>';
  await cargarInasistDataReal();
  if(!INASIST_DATA.length){tb.innerHTML='<tr><td colspan="'+colspanTotal+'" style="text-align:center;padding:14px;color:var(--gris);font-size:11px;">No hay alumnos o datos de asistencia cargados.</td></tr>';return;}
  tb.innerHTML=INASIST_DATA.map((r,i)=>{
    var t=r.total;
    var pct=DIAS>0?Math.round((DIAS-t)/DIAS*100):0;
    var est,bg;
    if(t>=10){est='🔴 Crítico';bg='#FDE8E8';}else if(t>=7){est='🟠 Acum.';bg='#FDF0E8';}else if(t>=5){est='🟡 Interm.';bg='#FDFAE8';}else{est='✅';bg=i%2===0?'#fff':'#F5F2EE';}
    var celdasMes=r.porMes.map(function(n){return '<td style="padding:5px 3px;text-align:center;font-size:11px;">'+n+'</td>';}).join('');
    return '<tr style="background:'+bg+';"><td style="padding:5px;font-size:10px;">'+r.a+'</td>'+celdasMes+'<td style="padding:5px 3px;text-align:center;font-size:11px;font-weight:bold;">'+t+'</td><td style="padding:5px 3px;text-align:center;font-size:11px;">'+pct+'%</td><td style="padding:5px;font-size:10px;">'+est+'</td></tr>';
  }).join('');
}

// ── ASISTENCIA ──
var asistenciaHoy = {};

function abrirAsistencia() {
  document.getElementById('modal-asistencia').style.display = 'block';
  document.getElementById('asist-fecha').value = fechaHoyArgentina();
  document.getElementById('asist-msg').style.display = 'none';
  cargarAsistenciaFecha();
}

function cerrarAsistencia() {
  document.getElementById('modal-asistencia').style.display = 'none';
}

async function abrirCancelarDia(){
  var fecha=document.getElementById('asist-fecha').value;
  if(!fecha){alert('Elegí primero una fecha.');return;}
  var fechaLegible=new Date(fecha+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  var motivo=window.prompt('¿Por qué motivo se cancela el '+fechaLegible+'? (ej: "Bajante", "Marea alta", "Paro")');
  if(motivo===null)return; // canceló el prompt
  await confirmarCancelarDia(fecha,motivo.trim()||'Sin motivo especificado');
}
async function confirmarCancelarDia(fecha,motivo){
  if(!window.__sb)return;
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    var {error}=await window.__sb.from('dias_cancelados').upsert({
      teacher_id:user.id,date:fecha,motivo:motivo
    },{onConflict:'teacher_id,date'});
    if(error)throw error;
    _diasCanceladosCache=null; // invalidar cache para que se recargue con el dato nuevo
    alert('✅ Día '+fecha+' marcado como cancelado ('+motivo+').');
    cargarAsistenciaFecha();
  }catch(e){
    console.log('Error al cancelar día:',e);
    alert('⚠️ No se pudo guardar la cancelación. Probá de nuevo.');
  }
}

async function cargarAsistenciaFecha() {
  var fecha = document.getElementById('asist-fecha').value;
  if (!fecha || !window.__students || !window.__students.length) return;

  var avisoCancelado=document.getElementById('asist-dia-cancelado-aviso');
  if(avisoCancelado){
    var user0=(await window.__sb.auth.getUser()).data.user;
    var cancelados0=await cargarDiasCancelados(user0.id);
    if(cancelados0.indexOf(fecha)>-1){
      avisoCancelado.style.display='block';
      avisoCancelado.textContent='🌊 Este día está marcado como SIN CLASE (cancelado). Si tomás asistencia igual, se va a guardar, pero no va a contar para la alerta de "asistencia pendiente".';
    }else{
      avisoCancelado.style.display='none';
    }
  }

  var nuevaAsistencia = {};
  window.__students.forEach(function(s) {
    nuevaAsistencia[s.id] = { status: 'presente', notes: '' };
  });

  if (window.__sb) {
    var user = (await window.__sb.auth.getUser()).data.user;
    if (user) {
      var { data, error } = await window.__sb.from('attendance')
        .select('student_id, status, notes')
        .eq('teacher_id', user.id)
        .eq('date', fecha);
      if (error) {
        // CRÍTICO: si falla la consulta, NO asumir "presente" para todos sin avisar.
        // Eso sería mostrar un dato incorrecto como si fuera correcto.
        alert('⚠️ No se pudo cargar la asistencia guardada para esta fecha (error de conexión). NO se muestra el estado real todavía — recargá la página antes de tomar asistencia, para no sobrescribir datos guardados por error.');
        return;
      }
      if (data && data.length) {
        data.forEach(function(r) {
          nuevaAsistencia[r.student_id] = { status: r.status, notes: r.notes || '' };
        });
      }
    }
  }
  asistenciaHoy = nuevaAsistencia;

  renderAsistencia();
}

function renderAsistencia() {
  if (!window.__students) return;
  var statuses = ['presente','ausente','justificado','tardanza'];
  var labels   = { presente:'P', ausente:'A', justificado:'J', tardanza:'T' };
  var clases   = { presente:'ap', ausente:'aa', justificado:'aj', tardanza:'at' };

  document.getElementById('asist-lista').innerHTML = window.__students.map(function(s) {
    var estado = (asistenciaHoy[s.id] || {}).status || 'presente';
    var btns = statuses.map(function(st) {
      var cls = 'asist-btn' + (estado === st ? ' ' + clases[st] : '');
      return '<button class="' + cls + '" onclick="setEstadoAlumno(\'' + s.id + '\',\'' + st + '\')">' + labels[st] + '</button>';
    }).join('');
    return '<div class="asist-row" id="asist-row-' + s.id + '">'
      + '<span class="asist-nom">' + s.full_name + '</span>'
      + '<div class="asist-btns">' + btns + '</div>'
      + '</div>';
  }).join('');

  actualizarResumenAsist();
}

function setEstadoAlumno(studentId, status) {
  if (!asistenciaHoy[studentId]) asistenciaHoy[studentId] = {};
  asistenciaHoy[studentId].status = status;
  var clases = { presente:'ap', ausente:'aa', justificado:'aj', tardanza:'at' };
  var statuses = ['presente','ausente','justificado','tardanza'];
  var row = document.getElementById('asist-row-' + studentId);
  if (row) row.querySelectorAll('.asist-btn').forEach(function(btn, i) {
    btn.className = 'asist-btn' + (statuses[i] === status ? ' ' + clases[status] : '');
  });
  actualizarResumenAsist();
}

function actualizarResumenAsist() {
  var c = { presente:0, ausente:0, justificado:0, tardanza:0 };
  Object.values(asistenciaHoy).forEach(function(v) { if (c[v.status] !== undefined) c[v.status]++; });
  var el = document.getElementById('asist-resumen');
  el.style.display = 'block';
  el.innerHTML = '✅ ' + c.presente + ' presentes &nbsp;·&nbsp; ❌ ' + c.ausente + ' ausentes &nbsp;·&nbsp; 📝 ' + c.justificado + ' justificados &nbsp;·&nbsp; ⏰ ' + c.tardanza + ' tardanzas';
}

async function guardarAsistencia() {
  var fecha = document.getElementById('asist-fecha').value;
  var btn = document.getElementById('asist-guardar-btn');
  var msg = document.getElementById('asist-msg');
  if (!window.__sb || !window.__students || !fecha) return;

  btn.disabled = true;
  btn.textContent = 'Guardando…';
  msg.style.display = 'none';

  var user = (await window.__sb.auth.getUser()).data.user;
  if (!user) { btn.disabled = false; btn.textContent = 'Guardar asistencia'; return; }

  var records = window.__students.map(function(s) {
    var est = asistenciaHoy[s.id] || {};
    return { student_id: s.id, teacher_id: user.id, date: fecha, status: est.status || 'presente', notes: est.notes || null };
  });

  var { error } = await window.__sb.from('attendance').upsert(records, { onConflict: 'student_id,date' });

  btn.disabled = false;
  btn.textContent = 'Guardar asistencia';
  msg.style.display = 'block';
  if (error) {
    msg.style.color = '#C0392B';
    msg.textContent = 'Error: ' + error.message;
  } else {
    msg.style.color = 'var(--verde)';
    msg.textContent = '✅ Asistencia guardada';
    setTimeout(function(){ msg.style.display = 'none'; }, 3000);
    window.registrarActividad&&window.registrarActividad('asistencia',{fecha:fecha,cantidad:records.length});
  }
}

// ── CARGA DE ASISTENCIA POR FOTO ──
var _fotoAsistDatos=null;

async function procesarFotoAsistencia(input){
  var file=input.files[0];
  if(!file)return;
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}

  document.getElementById('modal-confirmar-foto').style.display='block';
  document.getElementById('confirmar-foto-msg').textContent='Leyendo el registro con IA, puede tardar unos segundos...';
  document.getElementById('confirmar-foto-tabla').innerHTML='';
  document.getElementById('confirmar-foto-resultado').textContent='';

  try{
    var base64=await blobToBase64(file);
    var mediaType=file.type||'image/jpeg';
    var base64Data=base64.split(',')[1];

    var nombresAlumnos=(window.__students||[]).map(function(s){return s.full_name;});
    var anioActual=new Date().getFullYear();

    var promptTexto='Esta imagen es un REGISTRO DE ASISTENCIA escolar manuscrito con formato de matriz: una fila por alumno, una columna por cada día del mes. Los códigos habituales son: 1 = presente, 3 = ausente (a veces hay otros códigos como T para tardanza o J para justificado, pero usá 1 y 3 como los más comunes).\n\n';
    promptTexto+='LISTA DE ALUMNOS REALES DEL CURSO en orden (usá estos nombres exactos, no inventes otros, y respetá el orden de filas de la foto para asociarlos):\n'+nombresAlumnos.join('\n')+'\n\n';
    promptTexto+='Identificá qué mes y año corresponde (si no se ve el año, asumí '+anioActual+'). Identificá el número de día de cada columna (los encabezados L M M J V indican el día de la semana, y debajo el número de día del mes).\n\n';
    promptTexto+='Respondé SOLO con un JSON válido, sin texto antes ni después, con este formato exacto:\n';
    promptTexto+='{"mes":1-12,"anio":YYYY,"dias":[numero_dia1,numero_dia2,...],"alumnos":[{"nombre":"nombre exacto de la lista","valores":["presente","ausente",null,...]}]}\n\n';
    promptTexto+='El array "valores" debe tener la MISMA cantidad de elementos que "dias", en el mismo orden (una entrada por columna/día). Usá "presente" para el código 1, "ausente" para el código 3, "tardanza" o "justificado" si detectás otro código distinto, y null si la celda está vacía o no se puede leer con certeza. Mejor poner null que inventar.';

    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',max_tokens:4000,
        messages:[{role:'user',content:[
          {type:'image',source:{type:'base64',media_type:mediaType,data:base64Data}},
          {type:'text',text:promptTexto}
        ]}]
      })
    });
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var data=await res.json();
    var texto=(data.content&&data.content[0]&&data.content[0].text)||'';
    var m=texto.match(/```json([\s\S]*?)```/)||texto.match(/(\{[\s\S]*\})/);
    var parsed=JSON.parse(m?m[1]:texto);

    if(!parsed.dias||!parsed.dias.length||!parsed.alumnos||!parsed.alumnos.length){
      document.getElementById('confirmar-foto-msg').innerHTML='<span style="color:#C0392B;">No se pudo leer el registro con certeza. Probá con una foto más clara, con buena luz y sin sombras sobre la tabla.</span>';
      input.value='';
      return;
    }

    var mesStr=String(parsed.mes).padStart(2,'0');
    _fotoAsistDatos={mes:parsed.mes,anio:parsed.anio,dias:parsed.dias,alumnos:parsed.alumnos,mesStr:mesStr};

    var totalCeldas=parsed.alumnos.reduce(function(acc,a){return acc+a.valores.filter(function(v){return v!=null;}).length;},0);
    document.getElementById('confirmar-foto-msg').innerHTML='Detecté <strong>'+parsed.dias.length+' días</strong> de <strong>'+parsed.anio+'-'+mesStr+'</strong> para <strong>'+parsed.alumnos.length+' alumnos</strong> ('+totalCeldas+' registros leídos). Revisá la tabla, corregí lo que haga falta y guardá:';

    var statusOpts={presente:'✅',ausente:'❌',tardanza:'⏰',justificado:'📋'};
    var html='<div style="overflow-x:auto;"><table style="border-collapse:collapse;font-size:10.5px;min-width:'+(150+parsed.dias.length*42)+'px;">';
    html+='<thead><tr style="background:var(--verde);color:#fff;"><th style="padding:5px 7px;text-align:left;position:sticky;left:0;background:var(--verde);">Alumno</th>';
    parsed.dias.forEach(function(d){html+='<th style="padding:5px 4px;text-align:center;">'+d+'</th>';});
    html+='</tr></thead><tbody>';
    parsed.alumnos.forEach(function(al,ai){
      html+='<tr style="background:'+(ai%2===0?'#fff':'#F5F2EE')+';"><td style="padding:4px 7px;font-weight:600;white-space:nowrap;position:sticky;left:0;background:'+(ai%2===0?'#fff':'#F5F2EE')+';">'+al.nombre+'</td>';
      al.valores.forEach(function(v,vi){
        var sel='<select onchange="_fotoAsistDatos.alumnos['+ai+'].valores['+vi+']=this.value===\'vacio\'?null:this.value" style="font-size:13px;border:1px solid var(--gris-claro);border-radius:5px;width:38px;padding:2px;text-align:center;">';
        sel+='<option value="vacio"'+(!v?' selected':'')+'>—</option>';
        Object.keys(statusOpts).forEach(function(k){sel+='<option value="'+k+'"'+(v===k?' selected':'')+'>'+statusOpts[k]+'</option>';});
        sel+='</select>';
        html+='<td style="padding:2px;text-align:center;">'+sel+'</td>';
      });
      html+='</tr>';
    });
    html+='</tbody></table></div>';
    document.getElementById('confirmar-foto-tabla').innerHTML=html;
    input.value='';
  }catch(e){
    document.getElementById('confirmar-foto-msg').innerHTML='<span style="color:#C0392B;">Error al leer la foto: '+e.message+'</span>';
    input.value='';
  }
}

async function guardarDesdeFoto(){
  if(!_fotoAsistDatos||!_fotoAsistDatos.alumnos||!_fotoAsistDatos.alumnos.length)return;
  if(!window.__sb){alert('Sin conexión a la base');return;}
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var nombreToId={};
  (window.__students||[]).forEach(function(s){nombreToId[s.full_name]=s.id;});

  var msgEl=document.getElementById('confirmar-foto-resultado');
  msgEl.style.color='var(--gris)';msgEl.textContent='Guardando...';

  var anio=_fotoAsistDatos.anio;
  var mesStr=_fotoAsistDatos.mesStr;
  var filas=[];
  _fotoAsistDatos.alumnos.forEach(function(al){
    var sid=nombreToId[al.nombre];
    if(!sid)return;
    al.valores.forEach(function(v,i){
      if(!v)return;
      var dia=_fotoAsistDatos.dias[i];
      var diaStr=String(dia).padStart(2,'0');
      var fechaCelda=anio+'-'+mesStr+'-'+diaStr;
      filas.push({teacher_id:user.id,student_id:sid,date:fechaCelda,status:v,notes:''});
    });
  });

  if(!filas.length){msgEl.style.color='#C0392B';msgEl.textContent='No se pudo asociar ningún registro a un alumno real';return;}

  var {error}=await window.__sb.from('attendance').upsert(filas,{onConflict:'student_id,date'});
  if(error){
    msgEl.style.color='#C0392B';msgEl.textContent='Error al guardar: '+error.message;
    return;
  }
  msgEl.style.color='var(--verde)';msgEl.textContent='✅ Se guardaron '+filas.length+' registros de asistencia ('+_fotoAsistDatos.alumnos.length+' alumnos × '+_fotoAsistDatos.dias.length+' días)';
  setTimeout(function(){
    document.getElementById('modal-confirmar-foto').style.display='none';
    var fechaInput=document.getElementById('asist-fecha');
    if(fechaInput){var ultimoDia=String(_fotoAsistDatos.dias[_fotoAsistDatos.dias.length-1]).padStart(2,'0');fechaInput.value=anio+'-'+mesStr+'-'+ultimoDia;cargarAsistenciaFecha();}
  },1500);
}