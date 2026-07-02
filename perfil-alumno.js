// perfil-alumno.js -- Perfil Academico Funcional, DEI, Ficha
// Extraido de index.html -- Sesion 4 de modularizacion
// Depende de: core.js (_perfilStudentId, _perfilUserId, gradesData)
//             registro.js (initGrades)

// CORTE 1 (index.html L2640)
function cerrarPerfilAcademico(){ document.getElementById('modal-perfil-academico').style.display='none'; }

// CORTE 2 -- Sub-bloque A1 (index.html L2888-2991) -- funciones QR

function urlPerfilAlumno(studentId){
  return window.location.origin+window.location.pathname+'?alumno='+studentId;
}

function dibujarQREnContenedor(contenedorEl,url,tamano,ajustarAlContenedor){
  contenedorEl.innerHTML='';
  if(typeof qrcode==='undefined'){
    contenedorEl.innerHTML='<div style="font-size:11px;color:#C0392B;">No se pudo cargar el generador de QR. Revisá tu conexión.</div>';
    return;
  }
  var qr=qrcode(0,'M');
  qr.addData(url);
  qr.make();
  var tam=tamano||5;
  contenedorEl.innerHTML=qr.createSvgTag(tam,4);
  if(ajustarAlContenedor){
    var svgEl=contenedorEl.querySelector('svg');
    if(svgEl){svgEl.style.width='100%';svgEl.style.height='100%';svgEl.style.display='block';}
  }
}

var _perfCirculoMostrandoQR=false;
function toggleQRenCirculo(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  var circulo=document.getElementById('perf-ini');
  if(!_perfCirculoMostrandoQR){
    // Mostrar el QR mini dentro del círculo
    circulo.innerHTML='';
    circulo.style.background='#fff';
    circulo.style.padding='6px';
    circulo.style.boxSizing='border-box';
    dibujarQREnContenedor(circulo,urlPerfilAlumno(s.id),2,true);
    _perfCirculoMostrandoQR=true;
  }else{
    // Volver a mostrar las iniciales, y abrir el modal grande para imprimir
    circulo.innerHTML='';
    circulo.style.background='rgba(255,255,255,0.18)';
    circulo.style.padding='0';
    circulo.textContent=nameToInitials(s.full_name);
    _perfCirculoMostrandoQR=false;
    abrirQRAlumno();
  }
}

function abrirQRAlumno(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  document.getElementById('qr-alumno-nombre').textContent=s.full_name;
  var cont=document.getElementById('qr-alumno-canvas-container');
  dibujarQREnContenedor(cont,urlPerfilAlumno(s.id),6);
  document.getElementById('modal-qr-alumno').style.display='block';
}

function cerrarQRAlumno(){
  document.getElementById('modal-qr-alumno').style.display='none';
}

function imprimirQRAlumno(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  var svgHtml=document.getElementById('qr-alumno-canvas-container').innerHTML;
  var ventana=window.open('','_blank');
  ventana.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>QR - '+s.full_name+'</title>'
    +'<style>body{font-family:sans-serif;text-align:center;padding:40px;}h2{margin-bottom:20px;}p{font-size:11px;color:#888;margin-top:16px;}</style></head><body>'
    +'<h2>'+s.full_name+'</h2>'
    +svgHtml
    +'<p>Escanear con la cámara para ver el perfil en HuellaED</p>'
    +'</body></html>');
  ventana.document.close();
  setTimeout(function(){ventana.print();},300);
}

function abrirQRGrado(){
  var students=window.__students||[];
  if(!students.length){alert('No hay alumnos cargados todavía');return;}
  var grid=document.getElementById('qr-grado-grid');
  grid.innerHTML='';
  students.forEach(function(s){
    var item=document.createElement('div');
    item.style.cssText='text-align:center;border:1px solid var(--gris-claro);border-radius:9px;padding:10px;';
    var nombreDiv=document.createElement('div');
    nombreDiv.style.cssText='font-size:10px;font-weight:700;margin-bottom:6px;color:var(--negro);';
    nombreDiv.textContent=s.full_name;
    var qrDiv=document.createElement('div');
    item.appendChild(nombreDiv);
    item.appendChild(qrDiv);
    grid.appendChild(item);
    dibujarQREnContenedor(qrDiv,urlPerfilAlumno(s.id),3);
  });
  document.getElementById('modal-qr-grado').style.display='block';
}

function imprimirHojaQRGrado(){
  var gradoEl=document.getElementById('qr-grado-grid');
  var ventana=window.open('','_blank');
  ventana.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>QR del grado</title>'
    +'<style>body{font-family:sans-serif;padding:20px;}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}.item{text-align:center;border:1px solid #ddd;border-radius:8px;padding:10px;page-break-inside:avoid;}.item div:first-child{font-size:11px;font-weight:700;margin-bottom:6px;}</style></head><body>'
    +'<div class="grid">'+gradoEl.innerHTML.replace(/<div style="text-align:center;border:1px solid var\(--gris-claro\);border-radius:9px;padding:10px;">/g,'<div class="item">')+'</div>'
    +'</body></html>');
  ventana.document.close();
  setTimeout(function(){ventana.print();},300);
}

// CORTE 2 -- Sub-bloque A2 (index.html L2992-3166) -- abrirPerfilAcademico

async function abrirPerfilAcademico(studentId){
  _perfilStudentId=studentId;
  var s=(window.__students||[]).find(function(st){return st.id===studentId;});
  if(!s)return;
  document.getElementById('modal-perfil-academico').style.display='block';
  _perfCirculoMostrandoQR=false;
  var circuloIni=document.getElementById('perf-ini');
  circuloIni.style.background='rgba(255,255,255,0.18)';
  circuloIni.style.padding='0';
  circuloIni.textContent=nameToInitials(s.full_name);
  document.getElementById('perf-nombre').textContent=s.full_name;
  var esDif=s.has_differential||false;
  var badgeEl=document.getElementById('perf-badge');
  badgeEl.innerHTML=(esDif
    ?'<span style="color:#C8845A;font-weight:700;">⚡ Atención diferenciada</span> <button onclick="toggleDiferenciado()" style="background:rgba(200,132,90,0.15);border:1px solid #C8845A;color:#C8845A;border-radius:5px;padding:1px 7px;font-size:10px;cursor:pointer;font-family:inherit;">quitar</button>'
    :'<span style="color:rgba(255,255,255,0.7);">'+(window.__teacherGrade||'6to Año')+'</span> <button onclick="toggleDiferenciado()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.4);color:white;border-radius:5px;padding:1px 7px;font-size:10px;cursor:pointer;font-family:inherit;">+ marcar diferenciado</button>');
  var body=document.getElementById('perf-body');
  body.innerHTML='<div style="text-align:center;padding:32px;color:var(--gris);font-size:13px;">Cargando…</div>';
  if(!window.__sb)return;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  _perfilUserId=user.id;

  var gradesRes,attendRes,diffRes;
  try {
    var results=await Promise.all([
      window.__sb.from('grades').select('subject_id,score').eq('student_id',studentId).eq('teacher_id',user.id).eq('period',gradesPeriodo),
      window.__sb.from('attendance').select('status').eq('student_id',studentId).eq('teacher_id',user.id),
      s.has_differential
        ?window.__sb.from('differential_profiles').select('*').eq('student_id',studentId).maybeSingle()
        :Promise.resolve({data:null})
    ]);
    gradesRes=results[0]; attendRes=results[1]; diffRes=results[2];
  } catch(e) {
    body.innerHTML='<div style="text-align:center;padding:32px;">'
      +'<div style="font-size:28px;margin-bottom:12px;">⚠️</div>'
      +'<div style="font-size:14px;font-weight:600;color:#C0392B;margin-bottom:8px;">No se pudo cargar el perfil</div>'
      +'<div style="font-size:12px;color:var(--gris);margin-bottom:18px;">Verificá tu conexión y volvé a intentar.</div>'
      +'<button onclick="abrirPerfilAcademico(\''+studentId+'\')" style="background:var(--verde);color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-right:8px;">🔄 Reintentar</button>'
      +'<button onclick="cerrarPerfilAcademico()" style="background:var(--crema);color:var(--negro);border:1.5px solid var(--gris-claro);border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cerrar</button>'
      +'</div>';
    return;
  }

  // Grades
  var sg={};
  if(gradesRes.data)gradesRes.data.forEach(function(g){var c=SUBJECT_CODES[g.subject_id];if(c)sg[c]=g.score;});

  // Attendance
  var att={presente:0,ausente:0,tardanza:0,justificado:0};
  if(attendRes.data)attendRes.data.forEach(function(r){if(att[r.status]!==undefined)att[r.status]++;});

  var html='';
  var trName=gradesPeriodo==='1'?'1er':gradesPeriodo==='2'?'2do':'3er';

  // ── Notas ──
  var validVals=AREAS.map(function(a){return sg[a]!=null?parseFloat(sg[a]):null;}).filter(function(v){return v!==null;});
  var prom=validVals.length?(validVals.reduce(function(a,b){return a+b;},0)/validVals.length).toFixed(1):'—';
  var promCol=validVals.length&&parseFloat(prom)>=APROBADO?'var(--verde)':'#C0392B';
  html+='<div style="margin-bottom:16px;">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Notas · '+trName+' Trimestre</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">';
  AREAS.forEach(function(area){
    var val=sg[area]!=null?parseFloat(sg[area]):null;
    var low=val!==null&&val<APROBADO;
    var bg=val===null?'var(--crema)':low?'#FDE8E8':'var(--verde-bg)';
    var col=val===null?'var(--gris)':low?'#C0392B':'var(--verde)';
    html+='<div style="background:'+bg+';border-radius:9px;padding:8px 4px;text-align:center;">'
      +'<div style="font-size:9px;font-weight:700;color:var(--gris);margin-bottom:3px;">'+area+'</div>'
      +'<div style="font-size:15px;font-weight:700;color:'+col+';">'+(val!==null?val:'—')+'</div></div>';
  });
  html+='<div style="background:'+promCol+';border-radius:9px;padding:8px 4px;text-align:center;">'
    +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);margin-bottom:3px;">PROM</div>'
    +'<div style="font-size:15px;font-weight:700;color:#fff;">'+prom+'</div></div>';
  html+='</div></div>';

  // ── Asistencia ──
  var total=att.presente+att.ausente+att.tardanza+att.justificado;
  html+='<div style="margin-bottom:16px;">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Asistencia</div>';
  if(!total){
    html+='<div style="font-size:12px;color:var(--gris);padding:10px;text-align:center;">Sin registros de asistencia</div>';
  }else{
    var attItems=[
      {l:'Presentes',k:'presente',col:'var(--verde)',bg:'var(--verde-bg)'},
      {l:'Ausentes',k:'ausente',col:'#C0392B',bg:'#FDE8E8'},
      {l:'Tardanzas',k:'tardanza',col:'var(--terracota)',bg:'#FDF0E8'},
      {l:'Justif.',k:'justificado',col:'#2980B9',bg:'#EBF5FB'}
    ];
    html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">';
    attItems.forEach(function(d){
      html+='<div style="background:'+d.bg+';border-radius:9px;padding:8px 4px;text-align:center;">'
        +'<div style="font-size:9px;font-weight:700;color:'+d.col+';margin-bottom:3px;">'+d.l.toUpperCase()+'</div>'
        +'<div style="font-size:18px;font-weight:700;color:'+d.col+';">'+att[d.k]+'</div></div>';
    });
    html+='</div>';
    var pctAtt=Math.round(att.presente/total*100);
    html+='<div style="margin-top:8px;height:5px;background:var(--gris-claro);border-radius:3px;overflow:hidden;">'
      +'<div style="width:'+pctAtt+'%;height:100%;background:var(--verde);border-radius:3px;"></div></div>'
      +'<div style="font-size:10px;color:var(--gris);margin-top:4px;text-align:right;">'+pctAtt+'% de asistencia · '+total+' días registrados</div>';
  }
  html+='</div>';

  // ── Perfil diferencial ──
  if(s.has_differential){
    html+='<div id="perf-dif-section" style="background:var(--crema);border-radius:12px;padding:14px;">';
    html+='<div style="font-size:11px;font-weight:700;color:var(--terracota);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">⚡ Perfil diferencial</div>';
    html+='<div style="font-size:11px;font-weight:600;color:var(--negro);margin-bottom:5px;">Descripción / Diagnóstico</div>';
    html+='<textarea id="dif-descripcion" rows="2" style="width:100%;padding:9px;border:1.5px solid var(--gris-claro);border-radius:9px;font-size:12px;font-family:inherit;box-sizing:border-box;resize:vertical;background:var(--blanco);"></textarea>';
    html+='<div style="font-size:11px;font-weight:600;color:var(--negro);margin:10px 0 5px;">Necesidades de aprendizaje</div>';
    html+='<textarea id="dif-necesidades" rows="2" style="width:100%;padding:9px;border:1.5px solid var(--gris-claro);border-radius:9px;font-size:12px;font-family:inherit;box-sizing:border-box;resize:vertical;background:var(--blanco);"></textarea>';
    html+='<div style="font-size:11px;font-weight:600;color:var(--negro);margin:10px 0 5px;">Adaptaciones pedagógicas</div>';
    html+='<textarea id="dif-adaptaciones" rows="2" style="width:100%;padding:9px;border:1.5px solid var(--gris-claro);border-radius:9px;font-size:12px;font-family:inherit;box-sizing:border-box;resize:vertical;background:var(--blanco);"></textarea>';
    html+='<div id="perf-dif-msg" style="font-size:11px;text-align:center;margin:8px 0;display:none;"></div>';
    html+='<button onclick="guardarPerfilDif(\''+studentId+'\')" style="width:100%;background:var(--terracota);color:#fff;border:none;border-radius:9px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;font-family:inherit;">Guardar perfil diferencial</button>';
    html+='</div>';
  }

  // ── Observaciones ──
  html+='<div style="margin-bottom:16px;">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Observaciones</div>';
  html+='<div id="obs-lista"><div style="font-size:12px;color:var(--gris);text-align:center;padding:8px;">Cargando…</div></div>';
  html+='<textarea id="obs-nueva" rows="2" placeholder="Escribí una observación…" style="width:100%;padding:9px;border:1.5px solid var(--gris-claro);border-radius:9px;font-size:12px;font-family:inherit;box-sizing:border-box;resize:none;background:var(--blanco);margin-top:10px;"></textarea>';
  html+='<div id="obs-msg" style="font-size:11px;text-align:center;display:none;margin:5px 0;"></div>';
  html+='<button onclick="guardarObservacionAlumno()" style="width:100%;background:var(--verde);color:#fff;border:none;border-radius:9px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;margin-top:6px;font-family:inherit;">Guardar observación</button>';
  html+='</div>';

  // ── Archivos y evidencias ──
  html+='<div style="margin-top:0;">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Archivos y evidencias</div>';
  html+='<label style="display:flex;align-items:center;gap:10px;background:var(--crema);border:1.5px dashed var(--gris-claro);border-radius:10px;padding:12px;cursor:pointer;margin-bottom:10px;">'
    +'<span style="font-size:22px;">📎</span>'
    +'<span style="font-size:12px;color:var(--gris);">Subir foto, PDF o documento</span>'
    +'<input type="file" id="archivo-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style="display:none;" onchange="subirArchivoAlumno()">'
    +'</label>';
  html+='<div id="archivo-msg" style="font-size:11px;text-align:center;margin-bottom:6px;display:none;"></div>';
  html+='<div id="archivo-progress" style="height:4px;background:var(--gris-claro);border-radius:2px;margin-bottom:10px;display:none;">'
    +'<div id="archivo-progress-bar" style="height:100%;background:var(--verde);border-radius:2px;width:0%;transition:width 0.4s;"></div></div>';
  html+='<div id="archivos-lista"><div style="text-align:center;font-size:12px;color:var(--gris);padding:8px;">Cargando archivos…</div></div>';
  html+='</div>';

  // ── Adecuaciones ──
  html+='<div style="margin-top:16px;margin-bottom:16px;">';
  html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1.5px;">🧩 Adecuaciones</div>';
  html+='<button onclick="abrirNuevaAdecuacionParaAlumno(\''+studentId+'\')" style="background:var(--verde-bg);border:1.5px solid var(--verde);color:var(--verde);border-radius:7px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">+ Nueva</button>';
  html+='</div>';
  html+='<div id="perf-adecuaciones-lista"><div style="text-align:center;font-size:12px;color:var(--gris);padding:8px;">Cargando…</div></div>';
  html+='</div>';

  // Botón generar perfil académico funcional
  html+='<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gris-claro);">';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px;">';
  html+='<button onclick="generarPerfilAcademico()" style="background:linear-gradient(135deg,#2D5F4F,#3A7A65);color:#fff;border:none;border-radius:11px;padding:12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🤖 Perfil académico</button>';
  html+='<button onclick="abrirModalInforme()" style="background:linear-gradient(135deg,#C8973A,#D4A84B);color:#fff;border:none;border-radius:11px;padding:12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📄 Generar informe</button>';
  html+='</div>';
  if(s.has_differential){
    html+='<button onclick="abrirAsistenteDEI()" style="width:100%;background:linear-gradient(135deg,#C05A3A,#D4724A);color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px;">📋 Generar DEI</button>';
  }
  html+='<div style="font-size:10px;color:var(--gris);text-align:center;">Solo con datos reales de Supabase — nunca inventa</div>';
  html+='</div>';

  body.innerHTML=html;

  if(s.has_differential&&diffRes.data){
    document.getElementById('dif-descripcion').value=diffRes.data.descripcion||'';
    document.getElementById('dif-necesidades').value=diffRes.data.necesidades||'';
    document.getElementById('dif-adaptaciones').value=diffRes.data.adaptaciones||'';
  }

  cargarObservacionesAlumno();
  cargarArchivosAlumno();
  cargarAdecuacionesAlumno();
  cargarUltimoPerfilAcademico(studentId);
}

// CORTE 2 -- Sub-bloque A3 (index.html L3168-3332) -- cargarAdecuaciones, verTrazabilidad, cargarUltimoPerfil, compararPAF

async function cargarAdecuacionesAlumno(){
  var cont=document.getElementById('perf-adecuaciones-lista');
  if(!cont||!_perfilStudentId)return;
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    var{data}=await window.__sb.from('adecuaciones_generadas')
      .select('id,created_at,tipo_resultado,requiere_ppi,estado,contenido_generado,actividad_original_id,dificultades(nombre)')
      .eq('teacher_id',user.id)
      .eq('alumno_id',_perfilStudentId)
      .order('created_at',{ascending:false});
    var items=data||[];
    if(!items.length){
      cont.innerHTML='<div style="font-size:11px;color:var(--gris);text-align:center;padding:8px;">Sin adecuaciones generadas todavía.</div>';
      return;
    }
    cont.innerHTML=items.map(function(a){
      var fecha=new Date(a.created_at).toLocaleDateString('es-AR');
      var ppiTag=a.requiere_ppi?'<span style="background:#FDF0E8;color:#C05A3A;border:1px solid #D4815A;border-radius:5px;padding:1px 6px;font-size:9px;font-weight:700;margin-left:6px;">⚠️ PPI</span>':'';
      var estadoTag=a.estado==='aprobada'
        ?'<span style="background:var(--verde-bg);color:var(--verde);border-radius:5px;padding:1px 6px;font-size:9px;font-weight:700;margin-left:4px;">✅ Aprobada</span>'
        :'<span style="background:var(--crema);color:var(--gris);border-radius:5px;padding:1px 6px;font-size:9px;margin-left:4px;">Borrador</span>';
      var dif=a.dificultades?a.dificultades.nombre:'Dificultad desconocida';
      var origen=a.actividad_original_id?'Material guardado':'Texto libre';
      return'<div style="border:1px solid var(--gris-claro);border-radius:9px;padding:10px;margin-bottom:7px;background:var(--blanco);">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">'
        +'<div style="font-size:12px;font-weight:600;color:var(--negro);flex:1;">'+dif+ppiTag+estadoTag+'</div>'
        +'<div style="font-size:10px;color:var(--gris);flex-shrink:0;margin-left:8px;">'+fecha+'</div></div>'
        +'<div style="font-size:10px;color:var(--gris);margin-bottom:6px;">Origen: '+origen+'</div>'
        +'<div onclick="toggleAdecuacionDetalle(this)" style="font-size:11px;color:var(--verde);cursor:pointer;font-weight:600;">▶ Ver contenido</div>'
        +'<div style="display:none;margin-top:8px;">'
        +'<textarea style="width:100%;padding:9px;border:1.5px solid var(--gris-claro);border-radius:8px;font-size:11px;font-family:inherit;box-sizing:border-box;resize:vertical;min-height:100px;background:var(--crema);" data-adec-id="'+a.id+'">'+a.contenido_generado.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea>'
        +(a.estado!=='aprobada'?'<button onclick="aprobarAdecuacionEnPerfil(\''+a.id+'\',this)" style="margin-top:5px;background:var(--verde);color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">✅ Aprobar</button>':'')
        +'</div>'
        +'</div>';
    }).join('');
  }catch(e){
    if(cont)cont.innerHTML='<div style="font-size:11px;color:var(--terracota);text-align:center;padding:8px;">Error al cargar adecuaciones.</div>';
    console.error('cargarAdecuacionesAlumno:',e);
  }
}
function toggleAdecuacionDetalle(el){
  var det=el.nextElementSibling;
  var open=det.style.display==='block';
  det.style.display=open?'none':'block';
  el.textContent=open?'▶ Ver contenido':'▼ Ocultar contenido';
}
async function aprobarAdecuacionEnPerfil(id,btn){
  var ta=btn.previousElementSibling;
  var contenido=ta?ta.value.trim():'';
  try{
    await window.__sb.from('adecuaciones_generadas').update({estado:'aprobada',contenido_generado:contenido}).eq('id',id);
    btn.textContent='✅ Aprobada';btn.style.background='#888';btn.disabled=true;
  }catch(e){alert('Error al aprobar: '+e.message);}
}
async function abrirNuevaAdecuacionParaAlumno(studentId){
  document.getElementById('modal-perfil-academico').style.display='none';
  await abrirAdecuaciones();
  var sel=document.getElementById('adec-alumno');
  if(sel){sel.value=studentId;sel.dispatchEvent(new Event('change'));}
}
async function verTrazabilidadPAF(){
  if(!window.__sb||!_perfilStudentId)return;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {data,error}=await window.__sb.from('perfiles_generados')
    .select('contenido,created_at')
    .eq('teacher_id',user.id)
    .eq('student_id',_perfilStudentId)
    .eq('tipo','academico_traza')
    .order('created_at',{ascending:false})
    .limit(1);
  if(error||!data||!data.length){
    alert('No hay trazabilidad guardada para este alumno todavía.\nGenerá el Perfil Académico Funcional primero.');
    return;
  }
  var traza=data[0].contenido;
  var fecha=new Date(data[0].created_at).toLocaleString('es-AR');
  // Mostrar en un modal simple reutilizando el estilo ya existente en la app
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto;';
  modal.innerHTML='<div style="background:var(--blanco);border-radius:14px;padding:20px;max-width:680px;width:100%;margin:auto;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    +'<strong style="font-size:14px;color:var(--verde);">🔍 Trazabilidad del PAF</strong>'
    +'<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--gris);">✕</button>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--gris);margin-bottom:12px;">Última generación: '+fecha+'</div>'
    +'<pre style="font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-word;background:#F5F3EF;border-radius:9px;padding:14px;line-height:1.6;max-height:65vh;overflow-y:auto;">'+traza.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>'
    +'</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

async function cargarUltimoPerfilAcademico(studentId){
  if(!window.__sb)return;
  try{
    var userL=(await window.__sb.auth.getUser()).data.user;
    if(!userL)return;
    var {data}=await window.__sb.from('perfiles_generados')
      .select('contenido,created_at')
      .eq('teacher_id',userL.id).eq('student_id',studentId).eq('tipo','academico')
      .order('created_at',{ascending:false}).limit(2);
    if(!data||!data.length)return;
    var s=(window.__students||[]).find(function(st){return st.id===studentId;});
    var nombre=s?s.full_name:'';
    var fecha=new Date(data[0].created_at).toLocaleDateString('es-AR');
    var body=document.getElementById('perf-body');
    var prevD=document.getElementById('perfil-academico-guardado');
    if(prevD)prevD.remove();
    var div=document.createElement('div');
    div.id='perfil-academico-guardado';
    div.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid var(--gris-claro);';

    // Chequear si hay observaciones más nuevas que este PAF, para el aviso de "desactualizado"
    var avisoDesactualizado='';
    try{
      var fechaPaf=new Date(data[0].created_at);
      var hace3meses=new Date();hace3meses.setMonth(hace3meses.getMonth()-MESES_PAF_DESACTUALIZADO);
      if(fechaPaf<=hace3meses){
        var {data:notaNueva}=await window.__sb.from('notas_rapidas')
          .select('created_at').eq('teacher_id',userL.id).eq('student_id',studentId)
          .gt('created_at',data[0].created_at).limit(1);
        if(notaNueva&&notaNueva.length){
          avisoDesactualizado='<div style="background:var(--terracota-bg);border:1.5px solid var(--terracota);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:11.5px;color:var(--terracota);font-weight:600;">🔄 Hay información nueva desde la última vez que generaste el PAF (hace más de '+MESES_PAF_DESACTUALIZADO+' meses). Puede valer la pena regenerarlo.</div>';
        }
      }
    }catch(eDesact){console.log('No se pudo chequear desactualización del PAF:',eDesact);}

    var botonComparar=data.length>1
      ?'<button onclick="compararPAF(\''+studentId+'\')" class="save-btn" style="margin-top:7px;font-size:12px;width:100%;background:var(--crema);color:var(--verde);border:1.5px solid var(--verde-claro);">📊 Comparar con el PAF anterior</button>'
      :'';

    div.innerHTML=avisoDesactualizado
      +'<div style="font-size:11px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🤖 Último perfil académico generado · '+fecha+'</div>'
      +'<div id="perfil-guardado-texto" style="background:var(--crema);border-radius:10px;padding:14px;font-size:12px;color:var(--negro);line-height:1.75;border:1px solid var(--gris-claro);max-height:300px;overflow-y:auto;">'+data[0].contenido+'</div>'
      +'<button onclick="imprimirInforme(\''+nombre.replace(/'/g,"\\'")+'\',\'Perfil Académico Funcional\',document.getElementById(\'perfil-guardado-texto\').innerHTML)" class="save-btn" style="margin-top:7px;font-size:12px;width:100%;">🖨️ Imprimir / Guardar como PDF</button>'
      +botonComparar;
    body.appendChild(div);
    window.__pafsComparacion=window.__pafsComparacion||{};
    window.__pafsComparacion[studentId]=data;
  }catch(e){console.log('Sin perfil previo guardado');}
}

function compararPAF(studentId){
  var pafs=(window.__pafsComparacion||{})[studentId];
  if(!pafs||pafs.length<2)return;
  var s=(window.__students||[]).find(function(st){return st.id===studentId;});
  var nombre=s?s.full_name:'';
  var fechaActual=new Date(pafs[0].created_at).toLocaleDateString('es-AR');
  var fechaAnterior=new Date(pafs[1].created_at).toLocaleDateString('es-AR');
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto;';
  modal.innerHTML='<div style="background:var(--blanco);border-radius:14px;padding:20px;max-width:900px;width:100%;margin:auto;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    +'<strong style="font-size:14px;color:var(--verde);">📊 Comparar PAF — '+nombre+'</strong>'
    +'<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--gris);">✕</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    +'<div><div style="font-size:10.5px;font-weight:700;color:var(--gris);text-transform:uppercase;margin-bottom:6px;">Anterior · '+fechaAnterior+'</div>'
    +'<div style="background:var(--crema);border-radius:10px;padding:12px;font-size:11.5px;color:var(--negro);line-height:1.7;border:1px solid var(--gris-claro);max-height:60vh;overflow-y:auto;">'+pafs[1].contenido+'</div></div>'
    +'<div><div style="font-size:10.5px;font-weight:700;color:var(--verde);text-transform:uppercase;margin-bottom:6px;">Actual · '+fechaActual+'</div>'
    +'<div style="background:var(--verde-bg);border-radius:10px;padding:12px;font-size:11.5px;color:var(--negro);line-height:1.7;border:1px solid var(--verde-claro);max-height:60vh;overflow-y:auto;">'+pafs[0].contenido+'</div></div>'
    +'</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

// CORTE 2 -- Sub-bloque B (index.html L3336-3738) -- generarPerfilAcademico, abrirModalInforme, cerrarModalInforme, instrucciones, generarInforme

async function generarPerfilAcademico(){
 try{
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s){alert('No se encontró el alumno. Cerrá el perfil y volvé a abrirlo.');return;}
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  var nombre=s.full_name;

  // ── SOLO DATOS REALES DE SUPABASE ──
  // Notas cargadas en la app
  var notas=gradesData[_perfilStudentId]||{};
  var areas=['L','M','CS','CN','I','EA','EF'];
  var areaNames={L:'Lengua',M:'Matemática',CS:'Cs.Sociales',CN:'Cs.Naturales',I:'Inglés',EA:'Ed.Artística',EF:'Ed.Física'};
  var notasReales=areas.filter(function(a){return notas[a]!=null;});
  var notasTexto=notasReales.length>0
    ?notasReales.map(function(a){return areaNames[a]+': '+notas[a];}).join('\n')
    :'Sin notas cargadas en el sistema.';

  // perfilDif se carga desde Supabase más abajo, junto con fichaTexto
  var perfilDif='';

  // Observaciones del docente (consultadas DIRECTO de Supabase, no desde el DOM —
  // leer del DOM generaba una condición de carrera: si se generaba el perfil antes de que
  // cargarObservacionesAlumno() terminara de pintar la lista, el prompt quedaba vacío aunque
  // el alumno SÍ tuviera observaciones reales guardadas. Esto ya incluye, automáticamente,
  // varias fuentes que se copian a notas_rapidas en el momento de cargarse: reunión familiar
  // (acta), documentos adjuntos (aviso + análisis de contenido si es PDF/imagen), y
  // grabaciones de lectura (transcripción).
  var obsTexto='';
  try{
    if(window.__sb){
      var userObs=(await window.__sb.auth.getUser()).data.user;
      if(userObs){
        var {data:dataObs,error:errObs}=await window.__sb.from('notas_rapidas')
          .select('content,created_at')
          .eq('teacher_id',userObs.id)
          .eq('student_id',_perfilStudentId)
          .order('created_at',{ascending:false})
          .limit(20);
        if(!errObs&&dataObs&&dataObs.length>0){
          obsTexto='OBSERVACIONES REGISTRADAS POR EL DOCENTE (incluye notas sueltas, reuniones familiares, documentos adjuntados con su análisis, y transcripciones de lecturas grabadas):\n';
          dataObs.forEach(function(n){
            var fecha=new Date(n.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'});
            obsTexto+='['+fecha+'] '+n.content+'\n';
          });
        }else{
          obsTexto='Observaciones: sin observaciones cargadas en el sistema aún.\n';
        }
      }
    }
  }catch(eObs){
    console.log('No se pudo cargar observaciones para el PAF:',eObs);
    obsTexto='Observaciones: no se pudieron cargar (error de conexión).\n';
  }

  // Ficha de conocimiento (perfil inicial del alumno, tabla differential_profiles)
  // Es una fuente distinta del "perfil diferencial" de arriba: estos son los campos del
  // formulario inicial (primera impresión, cómo aprende, matemática, lectura/escritura, funciona/no, otros).
  // IMPORTANTE: todo este bloque está en su propio try/catch para que, si falla la consulta
  // a Supabase (sesión expirada, red, etc.), el PAF se siga generando solo sin esa fuente,
  // en vez de detener TODA la función en silencio.
  var fichaTexto='';
  var pctAsistTexto='—';
  var pctAsistNumero=null;
  try{
    if(window.__sb){
      var userFicha=(await window.__sb.auth.getUser()).data.user;
      if(userFicha){
        try{
          var {data:dataFicha,error:errFicha}=await window.__sb.from('differential_profiles')
            .select('primera_impresion,como_aprende,comprension_consignas,autonomia,matematica,lectura_escritura,emocional,funciona_no,algo_mas,descripcion,necesidades,adaptaciones')
            .eq('student_id',_perfilStudentId)
            .maybeSingle();
          if(!errFicha&&dataFicha){
            var camposFicha=[];
            if(dataFicha.primera_impresion)camposFicha.push('Primera impresión: '+dataFicha.primera_impresion);
            if(dataFicha.como_aprende)camposFicha.push('Cómo aprende: '+dataFicha.como_aprende);
            if(dataFicha.comprension_consignas)camposFicha.push('Comprensión de consignas: '+dataFicha.comprension_consignas);
            if(dataFicha.autonomia)camposFicha.push('Autonomía y organización: '+dataFicha.autonomia);
            if(dataFicha.matematica)camposFicha.push('Matemática: '+dataFicha.matematica);
            if(dataFicha.lectura_escritura)camposFicha.push('Lectura y escritura: '+dataFicha.lectura_escritura);
            if(dataFicha.emocional)camposFicha.push('Cuando algo le cuesta (emocional): '+dataFicha.emocional);
            if(dataFicha.funciona_no)camposFicha.push('Qué funciona / qué no: '+dataFicha.funciona_no);
            if(dataFicha.algo_mas)camposFicha.push('Otras observaciones: '+dataFicha.algo_mas);
            if(camposFicha.length>0){
              fichaTexto='FICHA DE CONOCIMIENTO (perfil inicial cargado por el docente):\n'+camposFicha.join('\n')+'\n';
            }
            if(dataFicha.descripcion||dataFicha.necesidades||dataFicha.adaptaciones){
              perfilDif='PERFIL DIFERENCIAL (cargado por el docente):\n';
              if(dataFicha.descripcion)perfilDif+='Descripción: '+dataFicha.descripcion+'\n';
              if(dataFicha.necesidades)perfilDif+='Necesidades: '+dataFicha.necesidades+'\n';
              if(dataFicha.adaptaciones)perfilDif+='Adaptaciones: '+dataFicha.adaptaciones+'\n';
            }else if(s.has_differential){
              perfilDif='Perfil diferencial: marcado como atención diferenciada pero sin datos cargados aún.\n';
            }
          }
        }catch(eFicha){console.log('No se pudo cargar ficha de conocimiento para el PAF:',eFicha);}

        // Asistencia: porcentaje de presentes sobre el total de registros del alumno
        try{
          var {data:dataAsist,error:errAsist}=await window.__sb.from('attendance')
            .select('status')
            .eq('teacher_id',userFicha.id)
            .eq('student_id',_perfilStudentId);
          if(!errAsist&&dataAsist&&dataAsist.length>0){
            var totalRegistros=dataAsist.length;
            var totalPresentes=dataAsist.filter(function(r){return r.status==='presente';}).length;
            pctAsistNumero=Math.round((totalPresentes/totalRegistros)*100);
            pctAsistTexto=pctAsistNumero+'% ('+totalPresentes+' de '+totalRegistros+' días registrados)';
          }
        }catch(eAsist){console.log('No se pudo calcular asistencia para el PAF:',eAsist);}
      }
    }
  }catch(eSesion){
    console.log('No se pudo obtener la sesión para ficha/asistencia, el PAF sigue sin esas fuentes:',eSesion);
  }
  var asistTextoPrompt='ASISTENCIA: '+(pctAsistNumero!==null?pctAsistTexto:'Sin registros de asistencia cargados en el sistema.')+'\n';

  var prompt='Generá el Perfil Académico Funcional de '+nombre+', alumno de '+(window.__teacherGrade||'6to Año')+' de la Escuela La Concepción, Tigre, 2026. Docente: '+(window.__teacherName||'Docente')+'.\n\n';
  prompt+='INSTRUCCIÓN CRÍTICA: Usá ÚNICAMENTE los datos que aparecen abajo. NO inventes información, NO supongas conductas, NO agregues datos que no estén aquí. Si hay campos vacíos o sin datos, indicalo explícitamente en el informe.\n\n';
  prompt+='DATOS REALES DEL ALUMNO EN EL SISTEMA:\n\n';
  prompt+='NOTAS 1er TRIMESTRE (aprobado: 7):\n'+notasTexto+'\n\n';
  prompt+=asistTextoPrompt+'\n';
  if(fichaTexto)prompt+=fichaTexto+'\n';
  if(perfilDif)prompt+=perfilDif+'\n';
  prompt+=obsTexto+'\n';
  prompt+='SECCIONES DEL PERFIL:\n';
  prompt+='1. Perfil académico basado en las notas registradas\n';
  prompt+='2. Asistencia (solo el dato registrado arriba, sin inventar causas)\n';
  if(fichaTexto)prompt+='3. Ficha de conocimiento (solo lo registrado arriba)\n';
  prompt+=(fichaTexto?'4':'3')+'. Observaciones del docente (incluye notas sueltas, reuniones familiares, documentos adjuntados con su análisis, y transcripciones de lecturas grabadas, solo lo registrado arriba)\n';
  prompt+=(fichaTexto?'5':'4')+'. Fortalezas identificadas (solo si hay datos que las sustenten)\n';
  prompt+=(fichaTexto?'6':'5')+'. Áreas a fortalecer (solo si hay datos que las sustenten)\n';
  if(s.has_differential)prompt+=(fichaTexto?'7':'6')+'. Consideraciones para la atención diferenciada (solo datos cargados)\n';
  prompt+='\nSi alguna sección no tiene datos suficientes, escribí: "Sin datos registrados para esta sección." Tono profesional, tercera persona, lenguaje escolar argentino.';

  var body=document.getElementById('perf-body');
  if(!body){alert('Abrí el perfil del alumno primero');return;}
  // Cargar notas si no están en memoria
  if(!gradesData[_perfilStudentId]||Object.keys(gradesData[_perfilStudentId]).length===0){
    await initGrades();
  }
  var loadDiv=document.createElement('div');
  loadDiv.style.cssText='background:var(--verde-bg);border-radius:12px;padding:18px;margin-top:10px;text-align:center;';
  loadDiv.innerHTML='<div style="font-size:24px;margin-bottom:8px;">🤖</div><div style="font-size:13px;font-weight:600;color:var(--verde);">Generando perfil con datos reales...</div>';
  body.appendChild(loadDiv);
  loadDiv.scrollIntoView({behavior:'smooth'});

  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2000,messages:[{role:'user',content:prompt}]})
    });
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var data=await res.json();
    var texto=(data.content&&data.content[0]&&data.content[0].text)||'';
    loadDiv.remove();
    var htmlTexto=markdownToHtml(texto);
    var iniciales=nombre.split(',').map(function(p){return p.trim().charAt(0);}).join('').toUpperCase().substring(0,2);
    var promReal=notasReales.length>0?(notasReales.reduce(function(a,k){return a+notas[k];},0)/notasReales.length).toFixed(1):'—';
    var pctAsistReal=pctAsistNumero!==null?pctAsistNumero+'%':'—';
    var alertasReal=s.has_differential?'DEI':'0';
    var resultDiv=document.createElement('div');
    resultDiv.id='perfil-academico-doc';
    resultDiv.style.cssText='margin-top:16px;border-radius:14px;overflow:hidden;border:1px solid var(--gris-claro);';
    resultDiv.innerHTML=''
      +'<div style="background:linear-gradient(135deg,#2D5F4F,#3A7A65);padding:18px 20px;display:flex;align-items:center;gap:14px;">'
      +'<div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:900;flex-shrink:0;">'+iniciales+'</div>'
      +'<div><div style="font-family:inherit;font-weight:800;font-size:15px;color:#fff;">'+nombre+'</div><div style="font-size:10.5px;color:rgba(255,255,255,.8);margin-top:2px;">'+(window.__teacherGrade||'6to Año')+' · Escuela La Concepción · 2026</div></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 16px;background:var(--blanco);">'
      +'<div style="background:#EEF5F1;border-radius:10px;padding:9px;text-align:center;"><div style="font-weight:900;font-size:16px;color:#2D5F4F;">'+promReal+'</div><div style="font-size:8px;color:#6a8a78;text-transform:uppercase;letter-spacing:.3px;margin-top:1px;">Promedio</div></div>'
      +'<div style="background:#EEF5F1;border-radius:10px;padding:9px;text-align:center;"><div style="font-weight:900;font-size:16px;color:#2D5F4F;">'+pctAsistReal+'</div><div style="font-size:8px;color:#6a8a78;text-transform:uppercase;letter-spacing:.3px;margin-top:1px;">Asistencia</div></div>'
      +'<div style="background:#EEF5F1;border-radius:10px;padding:9px;text-align:center;"><div style="font-weight:900;font-size:16px;color:#2D5F4F;">'+alertasReal+'</div><div style="font-size:8px;color:#6a8a78;text-transform:uppercase;letter-spacing:.3px;margin-top:1px;">Atención</div></div>'
      +'</div>'
      +'<div style="padding:4px 16px 16px;background:var(--blanco);">'
      +'<div id="perfil-texto-'+_perfilStudentId+'" style="background:var(--crema);border-radius:10px;padding:14px;font-size:12px;color:var(--negro);line-height:1.75;border:1px solid var(--gris-claro);max-height:380px;overflow-y:auto;">'+htmlTexto+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px;">'
      +'<button onclick="imprimirPerfilAcademicoDoc(\''+nombre.replace(/'/g,"\'")+'\',\''+iniciales+'\',\''+promReal+'\',\''+pctAsistReal+'\',\''+alertasReal+'\')" class="save-btn" style="font-size:12px;">⬇️ Descargar PDF</button>'
      +'<button onclick="abrirModalInforme()" class="sec-btn" style="font-size:12px;">📄 Generar informe</button>'
      +'<button onclick="verTrazabilidadPAF()" class="sec-btn" style="font-size:12px;background:#F7EDDB;color:#8a5a3a;border-color:#C8973A;">🔍 Ver trazabilidad</button>'
      +'</div></div>';
    body.appendChild(resultDiv);
    resultDiv.scrollIntoView({behavior:'smooth'});
    // Guardar en Supabase para que no se pierda al cerrar el perfil
    if(window.__sb){
      try{
        var userP=(await window.__sb.auth.getUser()).data.user;
        if(userP){
          var {error:errP}=await window.__sb.from('perfiles_generados').insert({
            teacher_id:userP.id,student_id:_perfilStudentId,tipo:'academico',contenido:htmlTexto
          });
          // Guardar también la trazabilidad: qué fuentes se usaron y qué aportó cada una
          if(!errP){
            var fechaGen=new Date().toLocaleString('es-AR');
            var trazaLineas=[
              '═══════════════════════════════════════',
              'TRAZABILIDAD DEL PERFIL ACADÉMICO FUNCIONAL',
              'Alumno: '+nombre,
              'Generado: '+fechaGen,
              '═══════════════════════════════════════',
              '',
              '1. NOTAS DEL TRIMESTRE '+gradesPeriodo+'° ─────────────',
              notasReales.length>0
                ?'✅ Con datos ('+notasReales.length+' áreas):\n'+notasTexto
                :'❌ Sin notas cargadas en el sistema.',
              '',
              '2. ASISTENCIA ─────────────────────────────',
              pctAsistNumero!==null
                ?'✅ Con datos:\n'+pctAsistTexto
                :'❌ Sin registros de asistencia cargados.',
              '',
              '3. FICHA DE CONOCIMIENTO ──────────────────',
              fichaTexto
                ?'✅ Con datos:\n'+fichaTexto
                :'❌ Sin ficha de conocimiento cargada.',
              '',
              '4. PERFIL DIFERENCIAL ─────────────────────',
              perfilDif
                ?'✅ Con datos:\n'+perfilDif
                :'❌ Sin perfil diferencial cargado.',
              '',
              '5. OBSERVACIONES DEL DOCENTE ──────────────',
              '(incluye notas sueltas, reuniones familiares,\ndocumentos adjuntos con análisis, y transcripciones de lecturas grabadas)',
              obsTexto&&obsTexto.indexOf('sin observaciones')===-1
                ?'✅ Con datos:\n'+obsTexto
                :'❌ Sin observaciones cargadas.',
              '',
              '═══════════════════════════════════════',
              'NOTA: Evidencia (fotos del menú Registrar) se analiza',
              'automáticamente al guardar y queda incluida en las',
              'observaciones de arriba si fue cargada.',
              '═══════════════════════════════════════'
            ];
            var trazaTexto=trazaLineas.join('\n');
            await window.__sb.from('perfiles_generados').insert({
              teacher_id:userP.id,student_id:_perfilStudentId,tipo:'academico_traza',contenido:trazaTexto
            });
          }
          if(errP){
            var aviso2=document.createElement('div');
            aviso2.style.cssText='background:#FDE8E8;border-radius:8px;padding:8px 12px;font-size:11px;color:#C0392B;margin-top:8px;';
            aviso2.textContent='⚠️ No se pudo guardar en la base: '+errP.message+'. Descargá el PDF para no perderlo.';
            resultDiv.appendChild(aviso2);
          }
        }
      }catch(e3){console.log('No se pudo guardar el perfil en Supabase:',e3);}
    }
  }catch(e){
    loadDiv.innerHTML='<div style="color:#C0392B;font-size:12px;">Error: '+e.message+'</div>';
  }
 }catch(eGlobal){
   // Red de seguridad: si algo falla ANTES de llegar al bloque anterior
   // (por ejemplo, al consultar la sesión de Supabase), esto evita que
   // el botón "no haga nada" en silencio.
   alert('No se pudo generar el Perfil Académico.\n\nDetalle técnico: '+eGlobal.message+'\n\nProbá recargar la página (Ctrl+F5 o Cmd+Shift+R) y volver a intentar.');
   console.log('Error global en generarPerfilAcademico:',eGlobal);
 }
}
function abrirModalInforme(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  document.getElementById('informe-nombre-label').textContent=s.full_name;
  document.getElementById('modal-informe').style.display='block';
}

function cerrarModalInforme(){
  document.getElementById('modal-informe').style.display='none';
}

// Instrucciones específicas por tipo de informe — usadas dentro de generarInforme().
// Antes de esto, la variable 'instrucciones' nunca se definía como objeto en ningún lado
// accesible, y la función rompía en silencio (ReferenceError) apenas se tocaba el botón
// "Generar informe", sin mostrar ningún mensaje de error visible al docente.
var instrucciones={
  fin_ano:'Redactá un informe de cierre de trayectoria escolar primaria, orientado a facilitar la transición al nivel secundario. Incluí: síntesis del desempeño académico del año, fortalezas a sostener, aspectos a reforzar, y cualquier adaptación o apoyo que convenga continuar en el nivel siguiente. Tono institucional, dirigido a quien recibirá al alumno en la nueva escuela o sección.',
  psicopedagoga:'Redactá un informe técnico-pedagógico orientado a un profesional de psicopedagogía externo a la escuela. Priorizá la descripción objetiva de comportamientos observables, dificultades de aprendizaje detectadas, y estrategias ya probadas por el docente (qué funcionó, qué no). Evitá diagnósticos o etiquetas clínicas — el docente no es quien diagnostica, solo describe lo observado en el aula.',
  eoe:'Redactá un informe dirigido al Equipo de Orientación Escolar, siguiendo el formato habitual de solicitud de intervención: motivo de la consulta, antecedentes pedagógicos relevantes, estrategias áulicas ya implementadas, y qué tipo de apoyo o intervención se está solicitando del equipo. Tono formal, orientado a fundamentar la necesidad de intervención.',
  familia:'Redactá un informe pensado para compartir y conversar con la familia del alumno. Usá un tono cercano y claro, evitando jerga técnica o pedagógica que la familia no entendería. Priorizá comunicar avances concretos, áreas que necesitan acompañamiento desde el hogar, y sugerencias prácticas que la familia pueda aplicar.',
  trimestral:'Redactá un informe de seguimiento del trimestre, organizado por área (notas, conducta, asistencia) y por observaciones cualitativas del período. Es un informe de uso interno/institucional, no para entregar directamente a la familia. Tono profesional y descriptivo, sin necesidad de simplificar el lenguaje técnico.',
  otro:'Redactá un informe académico general del alumno, con la información disponible. Si no se especificó un destinatario, asumí que es de uso institucional interno. Mantené un tono profesional y objetivo, basado exclusivamente en los datos reales provistos.'
};
async function generarInforme(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  var motivo=document.getElementById('informe-motivo').value;
  var destinatario=document.getElementById('informe-destinatario').value||'Equipo directivo';
  var nombre=s.full_name;
  var notas=gradesData[_perfilStudentId]||{};
  var areas=['L','M','CS','CN','I','EA','EF'];
  var areaNames={L:'Lengua',M:'Matemática',CS:'Cs.Sociales',CN:'Cs.Naturales',I:'Inglés',EA:'Ed.Artística',EF:'Ed.Física'};
  var notasTexto=areas.map(function(a){return areaNames[a]+': '+(notas[a]!=null?notas[a]:'sin nota');}).join('\n');
  var fecha=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  var motivoLabels={
    'fin_ano':'Informe de Fin de Año — Pase al Nivel Secundario',
    'psicopedagoga':'Informe para Psicopedagoga',
    'eoe':'Informe para EOE (Equipo de Orientación Escolar)',
    'familia':'Informe para Reunión Familiar',
    'trimestral':'Informe Trimestral',
    'otro':'Informe Académico'
  };
  var tipoInforme=motivoLabels[motivo]||'Informe Académico';
  var notasReales2=areas.filter(function(a){return notas[a]!=null;});
  var notasTexto2=notasReales2.length>0
    ?notasReales2.map(function(a){return areaNames[a]+': '+notas[a];}).join(', ')
    :'Sin notas cargadas en el sistema.';

  var perfilDif2='';
  try{
    if(window.__sb){
      var userDif2=(await window.__sb.auth.getUser()).data.user;
      if(userDif2){
        var {data:dataDif2}=await window.__sb.from('differential_profiles')
          .select('descripcion,necesidades,adaptaciones')
          .eq('student_id',_perfilStudentId).eq('teacher_id',userDif2.id).maybeSingle();
        if(dataDif2&&(dataDif2.descripcion||dataDif2.necesidades||dataDif2.adaptaciones)){
          var dparts2=[];
          if(dataDif2.descripcion)dparts2.push(dataDif2.descripcion+'.');
          if(dataDif2.necesidades)dparts2.push('Necesidades: '+dataDif2.necesidades+'.');
          if(dataDif2.adaptaciones)dparts2.push('Adaptaciones: '+dataDif2.adaptaciones+'.');
          perfilDif2='Perfil diferencial (datos del docente): '+dparts2.join(' ');
        }else if(s.has_differential){
          perfilDif2='Atención diferenciada indicada pero sin datos específicos cargados aún.';
        }
      }
    }
  }catch(eDif2){console.log('No se pudo cargar perfil diferencial para el informe:',eDif2);}

  var obsTexto2='Sin observaciones cargadas en el sistema.';
  try{
    if(window.__sb){
      var userObs2=(await window.__sb.auth.getUser()).data.user;
      if(userObs2){
        var {data:dataObs2,error:errObs2}=await window.__sb.from('notas_rapidas')
          .select('content,created_at')
          .eq('teacher_id',userObs2.id)
          .eq('student_id',_perfilStudentId)
          .order('created_at',{ascending:false})
          .limit(20);
        if(!errObs2&&dataObs2&&dataObs2.length>0){
          obsTexto2='';
          dataObs2.forEach(function(n){
            var fechaN=new Date(n.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'});
            obsTexto2+='['+fechaN+'] '+n.content+'. ';
          });
        }
      }
    }
  }catch(eObs2){
    console.log('No se pudieron cargar observaciones para el informe:',eObs2);
    obsTexto2='No se pudieron cargar las observaciones (error de conexión).';
  }

  var prompt='Generá un '+tipoInforme+' de '+nombre+', alumno de '+(window.__teacherGrade||'6to Año')+' de la Escuela La Concepción, Tigre, Provincia de Buenos Aires. Docente: '+(window.__teacherName||'Docente')+'. Fecha: '+fecha+'.\n\n';
  prompt+='INSTRUCCIÓN CRÍTICA: Usá ÚNICAMENTE los datos que aparecen abajo. NO inventes información, NO supongas conductas, actitudes ni situaciones que no estén registradas. Si hay campos sin datos, indicalo con "sin datos registrados". El informe debe ser honesto sobre la información disponible.\n\n';
  prompt+='DATOS REALES EN EL SISTEMA:\n';
  prompt+='- Notas 1er Trimestre: '+notasTexto2+'\n';
  if(perfilDif2)prompt+='- '+perfilDif2+'\n';
  prompt+='- Observaciones del docente: '+obsTexto2+'\n';
  prompt+='- Destinatario: '+destinatario+'\n\n';
  prompt+=(instrucciones[motivo]||instrucciones['otro'])+'\n\n';
  prompt+='Incluí encabezado institucional y firma del docente al final. Si alguna sección no tiene datos suficientes, escribí explícitamente "Sin datos registrados para esta sección."';

  cerrarModalInforme();
  var body=document.getElementById('perf-body');
  if(!body){alert('Abrí el perfil del alumno primero');return;}
  // Cargar notas si no están en memoria
  if(!gradesData[_perfilStudentId]||Object.keys(gradesData[_perfilStudentId]).length===0){
    await initGrades();
  }
  var loadDiv=document.createElement('div');
  loadDiv.style.cssText='background:#F7EDDB;border-radius:12px;padding:18px;margin-top:10px;text-align:center;';
  loadDiv.innerHTML='<div style="font-size:24px;margin-bottom:8px;">📄</div><div style="font-size:13px;font-weight:600;color:#C8973A;">Generando '+tipoInforme.toLowerCase()+'...</div>';
  body.appendChild(loadDiv);

  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2000,messages:[{role:'user',content:prompt}]})
    });
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var data=await res.json();
    var texto=(data.content&&data.content[0]&&data.content[0].text)||'';
    loadDiv.remove();
    var htmlTexto=markdownToHtml(texto);
    var resultDiv=document.createElement('div');
    resultDiv.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid var(--gris-claro);';
    resultDiv.innerHTML='<div style="font-size:11px;font-weight:700;color:#C8973A;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">'+tipoInforme+' · '+nombre+'</div>'
      +'<div id="informe-resultado-texto" style="background:#FDF8F0;border-radius:10px;padding:14px;font-size:12px;color:var(--negro);line-height:1.8;border:1px solid #F0E0C0;max-height:420px;overflow-y:auto;font-family:Georgia,serif;">'+htmlTexto+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px;">'
      +'<button onclick="imprimirInforme(\''+nombre.replace(/'/g,"\\'")+'\',\''+tipoInforme.replace(/'/g,"\\'")+'\',document.getElementById(\'informe-resultado-texto\').innerHTML)" class="save-btn" style="font-size:12px;">🖨️ Imprimir / Guardar como PDF</button>'
      +'<button onclick="abrirModalInforme()" class="sec-btn" style="font-size:12px;">📄 Nuevo informe</button>'
      +'</div>';
    body.appendChild(resultDiv);
    resultDiv.scrollIntoView({behavior:'smooth'});
  }catch(e){
    loadDiv.innerHTML='<div style="color:#C0392B;font-size:12px;">Error: '+e.message+'</div>';
  }
}

// CORTE 2 -- Sub-bloque C (index.html L3741-3992) -- imprimirPerfilAcademicoDoc, imprimirInforme, generarInformeFin, guardarPerfilDif, cargarObservacionesAlumno, obsEditar/obsCancelar/obsGuardar/obsBorrar, guardarObservacionAlumno, cargarArchivosAlumno, subirArchivoAlumno, verArchivoAlumno, borrarArchivoAlumno

function imprimirPerfilAcademicoDoc(nombre,iniciales,promedio,asistencia,atencion){
  var fecha=new Date().toLocaleDateString('es-AR');
  var contenidoTexto=document.getElementById('perfil-texto-'+_perfilStudentId).innerHTML;
  var doc='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Perfil Académico — '+nombre+'</title>'
    +'<style>@import url(\'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap\');'
    +'*{box-sizing:border-box;margin:0;padding:0;}body{font-family:\'Nunito Sans\',sans-serif;background:var(--blanco);color:#222;}'
    +'.doc-wrap{max-width:680px;margin:0 auto;}'
    +'.hero{background:linear-gradient(135deg,#2D5F4F,#3A7A65);padding:28px 30px;display:flex;align-items:center;gap:16px;}'
    +'.avatar{width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;font-weight:900;flex-shrink:0;}'
    +'.hero-nombre{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:19px;color:#fff;}'
    +'.hero-meta{font-size:11.5px;color:rgba(255,255,255,.82);margin-top:3px;}'
    +'.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 30px;}'
    +'.stat{background:#EEF5F1;border-radius:11px;padding:12px;text-align:center;}'
    +'.stat-num{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:20px;color:#2D5F4F;}'
    +'.stat-label{font-size:9px;color:#6a8a78;text-transform:uppercase;letter-spacing:.4px;margin-top:2px;}'
    +'.cuerpo{padding:6px 30px 30px;font-size:13px;line-height:1.75;}'
    +'.cuerpo p{margin-bottom:10px;}'
    +'.firma{margin-top:36px;text-align:right;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:12px;}'
    +'@media print{@page{size:A4;margin:18mm 16mm;}}</style></head><body>'
    +'<div class="doc-wrap">'
    +'<div class="hero"><div class="avatar">'+iniciales+'</div><div><div class="hero-nombre">'+nombre+'</div><div class="hero-meta">'+(window.__teacherGrade||'6to Año')+' · Escuela La Concepción · Tigre · '+fecha+'</div></div></div>'
    +'<div class="stats">'
    +'<div class="stat"><div class="stat-num">'+promedio+'</div><div class="stat-label">Promedio</div></div>'
    +'<div class="stat"><div class="stat-num">'+asistencia+'</div><div class="stat-label">Asistencia</div></div>'
    +'<div class="stat"><div class="stat-num">'+atencion+'</div><div class="stat-label">Atención</div></div>'
    +'</div>'
    +'<div class="cuerpo">'+contenidoTexto+'</div>'
    +'<div class="firma" style="margin:0 30px 30px;"><strong>'+(window.__teacherName||'Docente')+'</strong><br>Docente de '+(window.__teacherGrade||'6to Año')+' · Escuela La Concepción</div>'
    +'</div></body></html>';
  var blob=new Blob([doc],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var w=window.open(url,'_blank');
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
}

function imprimirInforme(nombre,tipo,htmlContent){
  var fecha=new Date().toLocaleDateString('es-AR');
  var doc='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+tipo+' — '+nombre+'</title>'
    +'<style>*{box-sizing:border-box;}body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 30px;font-size:13px;line-height:1.8;color:#222;}'
    +'h1,h2,h3{color:#2D5F4F;}h1{font-size:18px;border-bottom:2px solid #2D5F4F;padding-bottom:8px;}'
    +'h2{font-size:15px;margin-top:20px;}h3{font-size:13px;}p{margin:0 0 10px;}'
    +'.header{text-align:center;border-bottom:2px solid #2D5F4F;padding-bottom:14px;margin-bottom:24px;}'
    +'.escuela{font-size:10px;color:#2D5F4F;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}'
    +'.tipo{font-size:18px;font-weight:bold;color:#2D5F4F;}'
    +'.meta{font-size:11px;color:#888;margin-top:5px;}'
    +'.firma{margin-top:48px;text-align:right;font-size:11px;color:#555;border-top:1px solid #ccc;padding-top:12px;}'
    +'@media print{body{margin:15mm 20mm;}}</style></head><body>'
    +'<div class="header"><div class="escuela">Escuela La Concepción · Tigre · Provincia de Buenos Aires</div>'
    +'<div class="tipo">'+tipo+'</div>'
    +'<div class="meta">'+nombre+' · '+(window.__teacherGrade||'6to Año')+' · 2026 · '+fecha+'</div></div>'
    +htmlContent
    +'<div class="firma"><div><strong>'+(window.__teacherName||'Docente')+'</strong></div><div>Docente de '+(window.__teacherGrade||'6to Año')+'</div><div>Escuela La Concepción · Tigre</div></div>'
    +'</body></html>';
  var blob=new Blob([doc],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  var marcaTiempoInf=new Date();
  var tsInf=marcaTiempoInf.getFullYear()+''+String(marcaTiempoInf.getMonth()+1).padStart(2,'0')+String(marcaTiempoInf.getDate()).padStart(2,'0')+'-'+String(marcaTiempoInf.getHours()).padStart(2,'0')+String(marcaTiempoInf.getMinutes()).padStart(2,'0')+String(marcaTiempoInf.getSeconds()).padStart(2,'0');
  a.download=tipo.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g,'').replace(/ /g,'_')+'_'+nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g,'_')+'_'+tsInf+'.html';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

function generarInformeFin(){abrirModalInforme();}
async function guardarPerfilDif(studentId){
  if(!window.__sb)return;
  var btn=document.querySelector('#perf-dif-section button');
  var msg=document.getElementById('perf-dif-msg');
  btn.disabled=true;btn.textContent='Guardando…';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user){btn.disabled=false;btn.textContent='Guardar perfil diferencial';return;}
  var res=await window.__sb.from('differential_profiles').upsert({
    student_id:studentId,
    teacher_id:user.id,
    descripcion:document.getElementById('dif-descripcion').value,
    necesidades:document.getElementById('dif-necesidades').value,
    adaptaciones:document.getElementById('dif-adaptaciones').value,
    updated_at:new Date().toISOString()
  },{onConflict:'student_id'});
  btn.disabled=false;btn.textContent='Guardar perfil diferencial';
  msg.style.display='block';
  if(res.error){msg.style.color='#C0392B';msg.textContent='Error: '+res.error.message;}
  else{msg.style.color='var(--terracota)';msg.textContent='✅ Perfil guardado';setTimeout(function(){msg.style.display='none';},3000);}
}

// ── ARCHIVOS Y EVIDENCIAS ──
async function cargarObservacionesAlumno(){
  var lista=document.getElementById('obs-lista');
  if(!lista||!window.__sb||!_perfilStudentId)return;
  lista.innerHTML='<div style="font-size:12px;color:var(--gris);text-align:center;padding:8px;">Cargando...</div>';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {data,error}=await window.__sb.from('notas_rapidas')
    .select('id,content,created_at')
    .eq('teacher_id',user.id)
    .eq('student_id',_perfilStudentId)
    .order('created_at',{ascending:false})
    .limit(20);
  if(error){
    lista.innerHTML='<div style="font-size:12px;color:#C0392B;text-align:center;padding:8px;background:#FDE8E8;border-radius:8px;">⚠️ No se pudieron cargar las observaciones (error de conexión). Tus datos siguen guardados — recargá la página para reintentar.</div>';
    return;
  }
  if(!data||!data.length){
    lista.innerHTML='<div style="font-size:12px;color:var(--gris);text-align:center;padding:8px;">Sin observaciones registradas</div>';
    return;
  }
  lista.innerHTML=data.map(function(n){
    var fecha=new Date(n.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'});
    var txt=n.content;
    var eid=String(n.id).replace(/-/g,'');
    var html='<div id="obc'+eid+'" style="background:var(--crema);border-radius:9px;padding:9px 12px;margin-bottom:6px;border:1.5px solid var(--gris-claro);">';
    html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">';
    html+='<div style="flex:1;">';
    html+='<div style="font-size:10px;color:var(--gris);margin-bottom:3px;">'+fecha+'</div>';
    html+='<div id="obt'+eid+'" class="obs-item-text" style="font-size:12px;color:var(--negro);line-height:1.5;">'+txt+'</div>';
    html+='<div id="obe'+eid+'" style="display:none;margin-top:6px;">';
    html+='<textarea id="obta'+eid+'" rows="3" style="width:100%;padding:7px;border:1.5px solid var(--verde-claro);border-radius:7px;font-size:12px;font-family:inherit;resize:none;box-sizing:border-box;">'+txt+'</textarea>';
    html+='<div style="display:flex;gap:6px;margin-top:5px;">';
    html+='<button data-rid="'+n.id+'" data-eid="'+eid+'" onclick="obsGuardar(this.dataset.rid,this.dataset.eid)" style="flex:1;background:var(--verde);color:#fff;border:none;border-radius:7px;padding:6px;font-size:12px;font-weight:600;cursor:pointer;">✅ Guardar</button>';
    html+='<button data-rid="'+n.id+'" data-eid="'+eid+'" onclick="obsBorrar(this.dataset.rid,this.dataset.eid)" style="flex:1;background:#FDE8E8;color:#C0392B;border:none;border-radius:7px;padding:6px;font-size:12px;font-weight:600;cursor:pointer;">🗑️ Borrar</button>';
    html+='<button data-eid="'+eid+'" onclick="obsCancelar(this.dataset.eid)" style="background:var(--crema);color:var(--gris);border:1.5px solid var(--gris-claro);border-radius:7px;padding:6px 10px;font-size:12px;cursor:pointer;">✕</button>';
    html+='</div></div>';
    html+='</div>';
    html+='<button data-eid="'+eid+'" onclick="obsEditar(this.dataset.eid)" style="background:none;border:none;color:#8A7E6A;cursor:pointer;font-size:16px;flex-shrink:0;padding:2px;">✏️</button>';
    html+='</div></div>';
    return html;
  }).join('');;
}


function obsEditar(eid){
  document.getElementById('obe'+eid).style.display='block';
  document.getElementById('obt'+eid).style.display='none';
}
function obsCancelar(eid){
  document.getElementById('obe'+eid).style.display='none';
  document.getElementById('obt'+eid).style.display='block';
}
async function obsGuardar(id,eid){
  var txt=document.getElementById('obta'+eid).value.trim();
  if(!txt)return;
  if(!window.__sb)return;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {error}=await window.__sb.from('notas_rapidas').update({content:txt}).eq('id',id).eq('teacher_id',user.id);
  if(!error){document.getElementById('obt'+eid).textContent=txt;obsCancelar(eid);}
}
async function obsBorrar(id,eid){
  if(!confirm('Borrar esta observación?'))return;
  if(!window.__sb)return;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {error}=await window.__sb.from('notas_rapidas').delete().eq('id',id).eq('teacher_id',user.id);
  if(!error){
    var el=document.getElementById('obc'+eid);
    if(el)el.remove();
  }
}

async function guardarObservacionAlumno(){
  if(!window.__sb||!_perfilStudentId)return;
  var ta=document.getElementById('obs-nueva');
  var txt=ta?ta.value.trim():'';
  if(!txt){alert('Escribí una observación');return;}
  var msg=document.getElementById('obs-msg');
  msg.style.display='block';msg.style.color='var(--gris)';msg.textContent='Guardando…';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {error}=await window.__sb.from('notas_rapidas').insert({
    student_id:_perfilStudentId,
    teacher_id:user.id,
    content:txt
  });
  if(error){msg.style.color='#C0392B';msg.textContent='Error: '+error.message;}
  else{
    msg.style.color='var(--verde)';msg.textContent='✅ Observación guardada';
    ta.value='';
    setTimeout(function(){msg.style.display='none';},3000);
    cargarObservacionesAlumno();
  }
}

async function cargarArchivosAlumno(){
  var lista=document.getElementById('archivos-lista');
  if(!lista||!window.__sb||!_perfilStudentId||!_perfilUserId)return;
  lista.innerHTML='<div style="text-align:center;font-size:12px;color:var(--gris);padding:8px;">Cargando...</div>';
  var path=_perfilUserId+'/'+_perfilStudentId;
  var {data,error}=await window.__sb.storage.from('evidencias').list(path,{sortBy:{column:'created_at',order:'desc'}});
  if(error){
    lista.innerHTML='<div style="text-align:center;font-size:12px;color:#C0392B;padding:8px;background:#FDE8E8;border-radius:8px;">⚠️ No se pudieron cargar los archivos (error de conexión). Recargá la página para reintentar.</div>';
    return;
  }
  if(!data||!data.length){
    lista.innerHTML='<div style="text-align:center;font-size:12px;color:var(--gris);padding:8px;">Sin archivos subidos</div>';
    return;
  }
  lista.innerHTML=data.map(function(f){
    var ext=f.name.split('.').pop().toLowerCase();
    var icon=/^(jpg|jpeg|png|gif|webp)$/.test(ext)?'🖼️':ext==='pdf'?'📄':/^(doc|docx)$/.test(ext)?'📝':'📎';
    var fecha=f.created_at?new Date(f.created_at).toLocaleDateString('es-AR'):'';
    var fullPath=path+'/'+f.name;
    return '<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--gris-claro);">'
      +'<span style="font-size:20px;flex-shrink:0;">'+icon+'</span>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+f.name+'</div>'
      +'<div style="font-size:10px;color:var(--gris);">'+fecha+'</div>'
      +'</div>'
      +'<button onclick="verArchivoAlumno(\''+encodeURIComponent(fullPath)+'\')" style="background:var(--verde);color:#fff;border:none;border-radius:7px;padding:5px 9px;font-size:11px;cursor:pointer;white-space:nowrap;">Ver</button>'
      +'<button onclick="borrarArchivoAlumno(\''+encodeURIComponent(fullPath)+'\')" style="background:transparent;color:#C0392B;border:1.5px solid #C0392B;border-radius:7px;padding:5px 8px;font-size:11px;cursor:pointer;flex-shrink:0;">✕</button>'
      +'</div>';
  }).join('');
}

async function subirArchivoAlumno(){
  var input=document.getElementById('archivo-input');
  if(!input||!input.files||!input.files[0])return;
  var file=input.files[0];
  var msg=document.getElementById('archivo-msg');
  var prog=document.getElementById('archivo-progress');
  var bar=document.getElementById('archivo-progress-bar');
  msg.style.display='block';msg.style.color='var(--verde)';msg.textContent='Subiendo…';
  prog.style.display='block';bar.style.width='30%';
  var cleanName=file.name.replace(/[^a-zA-Z0-9._\-]/g,'_');
  var filePath=_perfilUserId+'/'+_perfilStudentId+'/'+Date.now()+'-'+cleanName;
  var {error}=await window.__sb.storage.from('evidencias').upload(filePath,file);
  bar.style.width='100%';
  if(error){
    msg.style.color='#C0392B';msg.textContent='Error: '+error.message;
    setTimeout(function(){prog.style.display='none';bar.style.width='0%';},2000);
  }else{
    msg.style.color='var(--verde)';msg.textContent='✅ Subido correctamente';
    input.value='';
    setTimeout(function(){prog.style.display='none';bar.style.width='0%';msg.style.display='none';},2000);
    cargarArchivosAlumno();
  }
}

async function verArchivoAlumno(encodedPath){
  if(!window.__sb)return;
  var path=decodeURIComponent(encodedPath);
  var {data,error}=await window.__sb.storage.from('evidencias').createSignedUrl(path,3600);
  if(!error&&data)window.open(data.signedUrl,'_blank');
}

async function borrarArchivoAlumno(encodedPath){
  if(!window.__sb)return;
  if(!confirm('¿Borrar este archivo?'))return;
  var path=decodeURIComponent(encodedPath);
  var {error}=await window.__sb.storage.from('evidencias').remove([path]);
  if(!error)cargarArchivosAlumno();
}

// CORTE 3 (index.html L4160-4303) -- abrirFicha, cerrarFicha, toggleChip, cargarFicha, guardarFicha, generarPromptFicha, copiarPromptFicha, imprimirFicha

async function abrirFicha(){
  document.getElementById('modal-ficha').style.display='block';
  document.getElementById('ficha-fecha').value = fechaHoyArgentina();
  document.getElementById('ficha-contenido').style.display='none';
  document.getElementById('ficha-alumno').value='';
  document.getElementById('ficha-prompt-container').style.display='none';
  document.getElementById('ficha-msg').textContent='';
}

async function cerrarFicha(){
  document.getElementById('modal-ficha').style.display='none';
}

function toggleChip(el){
  el.classList.toggle('activo');
}

async function cargarFicha(){
  var alumno=document.getElementById('ficha-alumno').value;
  if(!alumno){document.getElementById('ficha-contenido').style.display='none';return;}
  document.getElementById('ficha-contenido').style.display='block';
  document.getElementById('ficha-prompt-container').style.display='none';
  document.getElementById('ficha-msg').textContent='';
  document.querySelectorAll('.ficha-chip').forEach(function(c){c.classList.remove('activo');});
  document.querySelectorAll('.ficha-txt').forEach(function(t){t.value='';});
  if(!window.__sb)return;
  var s=(window.__students||[]).find(function(x){return x.full_name===alumno;});
  if(!s)return;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {data,error}=await window.__sb.from('differential_profiles')
    .select('primera_impresion,como_aprende,comprension_consignas,autonomia,matematica,lectura_escritura,emocional,funciona_no,algo_mas,updated_at')
    .eq('student_id',s.id)
    .maybeSingle();
  if(error){
    var msgEl=document.getElementById('ficha-msg');
    if(msgEl){msgEl.style.color='#C0392B';msgEl.textContent='⚠️ No se pudo cargar la ficha guardada (error de conexión). Tus datos siguen guardados — recargá para reintentar.';}
    return;
  }
  if(!data)return;
  var set=function(id,val){var el=document.getElementById(id);if(el)el.value=val||'';};
  set('f1-nota1',data.primera_impresion);
  set('f2-trabajo',data.como_aprende);
  set('f3b-consignas',data.comprension_consignas);
  set('f4b-autonomia',data.autonomia);
  set('f4-lengua',data.lectura_escritura);
  set('f7-calma',data.emocional);
  set('f6-libre',data.algo_mas);
  if(data.matematica){var mp=data.matematica.split('|||');set('f3-bien',mp[0]);set('f3-traba',mp[1]||'');set('f3-funciona',mp[2]||'');}
  if(data.funciona_no){var fp=data.funciona_no.split('|||');set('f5-funciona',fp[0]);set('f5-evitar',fp[1]||'');set('f5-apoyo',fp[2]||'');}
  document.getElementById('ficha-msg').textContent='✏️ Ficha cargada — '+new Date(data.updated_at).toLocaleDateString('es-AR');
}

async function guardarFicha(){
  var alumno=document.getElementById('ficha-alumno').value;
  if(!alumno){alert('Seleccioná un alumno');return;}
  if(!window.__sb){document.getElementById('ficha-msg').textContent='❌ Sin conexión';return;}
  var s=(window.__students||[]).find(function(x){return x.full_name===alumno;});
  if(!s){document.getElementById('ficha-msg').textContent='❌ Alumno no encontrado';return;}
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var get=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  document.getElementById('ficha-msg').textContent='💾 Guardando…';
  var {error}=await window.__sb.from('differential_profiles').upsert({
    student_id:s.id,
    teacher_id:user.id,
    primera_impresion:get('f1-nota1'),
    como_aprende:get('f2-trabajo'),
    comprension_consignas:get('f3b-consignas'),
    autonomia:get('f4b-autonomia'),
    matematica:get('f3-bien')+'|||'+get('f3-traba')+'|||'+get('f3-funciona'),
    lectura_escritura:get('f4-lengua'),
    emocional:get('f7-calma'),
    funciona_no:get('f5-funciona')+'|||'+get('f5-evitar')+'|||'+get('f5-apoyo'),
    algo_mas:get('f6-libre'),
    updated_at:new Date().toISOString()
  },{onConflict:'student_id'});
  if(error){document.getElementById('ficha-msg').textContent='❌ Error: '+error.message;}
  else{document.getElementById('ficha-msg').textContent='✅ Ficha guardada — '+new Date().toLocaleDateString('es-AR');}
}

function generarPromptFicha(){
  var alumno=document.getElementById('ficha-alumno').value;
  if(!alumno){alert('Seleccioná un alumno');return;}
  guardarFicha();
  var get=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  var chips=[];
  document.querySelectorAll('.ficha-chip.activo').forEach(function(c){chips.push(c.textContent.trim());});
  var fecha=document.getElementById('ficha-fecha').value;
  var p='Incorporá esta Ficha de Conocimiento al perfil académico de '+alumno+' en HuellaED.\n\n';
  p+='ALUMNO: '+alumno+'\n';
  p+='FECHA: '+fecha+'\n\n';
  if(chips.length>0)p+='OBSERVACIONES MARCADAS:\n'+chips.join(' · ')+'\n\n';
  var campos={
    'f1-nota1':'Primera impresión',
    'f2-trabajo':'Cómo trabaja',
    'f3b-consignas':'Comprensión de consignas',
    'f4b-autonomia':'Autonomía y organización',
    'f3-bien':'Matemática — fortalezas',
    'f3-traba':'Matemática — dificultades',
    'f3-funciona':'Matemática — qué le funciona',
    'f4-lengua':'Lengua — observaciones',
    'f7-calma':'Cuando algo le cuesta — qué lo ayuda',
    'f5-funciona':'Lo que le funciona',
    'f5-evitar':'Lo que hay que evitar',
    'f5-apoyo':'Apoyos necesarios',
    'f6-libre':'Observación libre'
  };
  Object.keys(campos).forEach(function(id){
    var v=get(id);if(v)p+=campos[id].toUpperCase()+':\n'+v+'\n\n';
  });
  p+='Actualizá el Perfil Académico del alumno en el Drive con esta información.';
  document.getElementById('ficha-prompt-text').textContent=p;
  document.getElementById('ficha-prompt-container').style.display='block';
}

function copiarPromptFicha(){
  navigator.clipboard.writeText(document.getElementById('ficha-prompt-text').textContent).then(function(){
    document.getElementById('ficha-msg').textContent='✅ Copiado — pegalo en Claude';
  });
}

function imprimirFicha(){
  var alumno = document.getElementById('ficha-alumno').value || '___________';
  var fecha = document.getElementById('ficha-fecha').value || '___/___/______';
  var chips=[];
  document.querySelectorAll('.ficha-chip.activo').forEach(c=>chips.push(c.textContent.trim()));
  var html = '<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">';
  html += '<div style="text-align:center;border-bottom:2px solid #2D5F4F;padding-bottom:8px;margin-bottom:14px;">';
  html += '<div style="font-size:10px;color:#2D5F4F;letter-spacing:2px;text-transform:uppercase;">Escuela La Concepción · '+(window.__teacherGrade||'6to Año')+' · HuellaED</div>';
  html += '<div style="font-size:16px;font-weight:bold;">FICHA DE CONOCIMIENTO DEL ALUMNO</div>';
  html += '<div style="font-size:11px;color:#888;margin-top:3px;">Alumno: '+alumno+' · Fecha: '+fecha+'</div>';
  html += '</div>';
  if(chips.length>0) html += '<p style="font-size:11px;"><strong>Observaciones:</strong> '+chips.join(' · ')+'</p>';
  var campos = {'f1-nota1':'Primera impresión','f2-trabajo':'Cómo trabaja','f3-bien':'Matemática — fortalezas','f3-traba':'Matemática — dificultades','f3-funciona':'Matemática — qué le funciona','f4-lengua':'Lengua','f5-funciona':'Lo que le funciona','f5-evitar':'Lo que hay que evitar','f5-apoyo':'Apoyos','f6-libre':'Observación libre'};
  Object.keys(campos).forEach(function(id){
    var el=document.getElementById(id);
    if(el&&el.value.trim()) html+='<p style="font-size:11px;margin-top:8px;"><strong>'+campos[id]+':</strong><br>'+el.value+'</p>';
  });
  html += '<div style="margin-top:24px;font-size:9px;color:#999;text-align:center;">HuellaED · cada alumno, su trayecto</div></div>';
  document.getElementById('print-container').innerHTML=html;
  window.print();
  setTimeout(function(){document.getElementById('print-container').innerHTML='';},1500);
}

// CORTE 4 (index.html L6312-6457) -- abrirAsistenteDEI, cerrarDEI, deiTab, generarDEI

async function abrirAsistenteDEI(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  document.getElementById('dei-alumno-label').textContent=s.full_name+' · DEI 2026';
  document.getElementById('modal-dei').style.display='block';
  document.getElementById('dei-msg').textContent='';
  deiTab(1);
  try{
    if(window.__sb){
      var userDEI=(await window.__sb.auth.getUser()).data.user;
      if(userDEI){
        var {data:dataDEI}=await window.__sb.from('differential_profiles')
          .select('descripcion,adaptaciones')
          .eq('student_id',_perfilStudentId).eq('teacher_id',userDEI.id).maybeSingle();
        if(dataDEI){
          if(dataDEI.descripcion&&!document.getElementById('dei-perfil').value)
            document.getElementById('dei-perfil').value=dataDEI.descripcion;
          if(dataDEI.adaptaciones&&!document.getElementById('dei-apoyo-doc').value)
            document.getElementById('dei-apoyo-doc').value=dataDEI.adaptaciones;
        }
      }
    }
  }catch(eDEI){console.log('No se pudo pre-cargar perfil diferencial en DEI:',eDEI);}
}

function cerrarDEI(){
  document.getElementById('modal-dei').style.display='none';
}

function deiTab(n){
  for(var i=1;i<=4;i++){
    document.getElementById('dei-step-'+i).style.display=i===n?'block':'none';
    var tab=document.getElementById('dei-tab-'+i);
    tab.style.borderBottomColor=i===n?'#C05A3A':'transparent';
    tab.style.color=i===n?'#C05A3A':'#8A7E6A';
  }
}

async function generarDEI(){
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  
  var msg=document.getElementById('dei-msg');
  msg.style.color='var(--gris)';msg.textContent='Generando DEI... puede tardar unos segundos.';

  // Recopilar datos del formulario
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  
  // Datos del alumno de Supabase
  var notas=gradesData[_perfilStudentId]||{};
  var areaNames={L:'Lengua',M:'Matemática',CS:'Cs.Sociales',CN:'Cs.Naturales',I:'Inglés',EA:'Ed.Artística',EF:'Ed.Física'};
  var notasTexto=Object.keys(notas).filter(function(a){return notas[a]!=null;}).map(function(a){return areaNames[a]+': '+notas[a];}).join(', ')||'Sin notas cargadas';

  var promptIA='Generá un DEI (Documento de Evaluación Individual / Trayectorias Educativas y Propuesta Pedagógica para la Inclusión) completo para la Provincia de Buenos Aires, en el formato oficial.\n\n';
  promptIA+='INSTRUCCIÓN: Usá EXACTAMENTE los datos proporcionados. No inventés información. Respetá el formato oficial del DEI de PBA.\n\n';
  promptIA+='DATOS DEL ESTUDIANTE:\n';
  promptIA+='Nombre: '+s.full_name+'\n';
  promptIA+='DNI: '+(g('dei-dni')||'No informado')+'\n';
  promptIA+='Fecha de nacimiento: '+(g('dei-fnac')||'No informada')+'\n';
  promptIA+='Domicilio: '+(g('dei-domicilio')||'No informado')+'\n';
  promptIA+='Escuela: Escuela La Concepción, Tigre\n';
  promptIA+='Año que cursa: '+(window.__teacherGrade||'6to Año')+'\n';
  promptIA+='Docente de referencia 2026: '+(window.__teacherName||'Docente')+'\n';
  promptIA+='Fecha de inicio DEI: '+(g('dei-inicio')||'No informada')+'\n\n';
  
  promptIA+='NOTAS REGISTRADAS EN EL SISTEMA: '+notasTexto+'\n\n';
  
  promptIA+='PERFIL PEDAGÓGICO FUNCIONAL:\n'+(g('dei-perfil')||'No completado')+'\n\n';
  promptIA+='ESTILO DE APRENDIZAJE:\n'+(g('dei-estilo')||'No completado')+'\n\n';
  promptIA+='HABILIDADES ADAPTATIVAS:\n'+(g('dei-adaptativas')||'No completado')+'\n\n';
  promptIA+='FACILITADORES:\n'+(g('dei-facilitadores')||'No completado')+'\n\n';
  promptIA+='BARRERAS PARA EL APRENDIZAJE:\n'+(g('dei-barreras')||'No completado')+'\n\n';
  
  promptIA+='MATEMÁTICA - PERFIL FUNCIONAL:\n'+(g('dei-mat-perfil')||'No completado')+'\n';
  promptIA+='MATEMÁTICA - PROPUESTA DIDÁCTICA:\n'+(g('dei-mat-prop')||'No completado')+'\n\n';
  promptIA+='PRÁCTICAS DEL LENGUAJE - PERFIL FUNCIONAL:\n'+(g('dei-len-perfil')||'No completado')+'\n';
  promptIA+='PRÁCTICAS DEL LENGUAJE - PROPUESTA DIDÁCTICA:\n'+(g('dei-len-prop')||'No completado')+'\n\n';
  promptIA+='CIENCIAS - PERFIL FUNCIONAL:\n'+(g('dei-cs-perfil')||'No completado')+'\n';
  promptIA+='CIENCIAS - PROPUESTA DIDÁCTICA:\n'+(g('dei-cs-prop')||'No completado')+'\n\n';
  
  promptIA+='FRECUENCIA Y TIPO DE APOYO DOCENTE:\n'+(g('dei-apoyo-doc')||'No completado')+'\n\n';
  promptIA+='INTERVENCIÓN EOE:\n'+(g('dei-eoe')||'No completado')+'\n\n';
  promptIA+='INTERVENCIÓN EXTERNA:\n'+(g('dei-externa')||'No completado')+'\n\n';
  promptIA+='TRABAJO INTERDISCIPLINARIO:\n'+(g('dei-interdisciplinario')||'No completado')+'\n\n';
  promptIA+='PARTICIPACIÓN FAMILIAR:\n'+(g('dei-familia')||'No completado')+'\n\n';
  if(g('dei-extra'))promptIA+='INFORMACIÓN ADICIONAL:\n'+g('dei-extra')+'\n\n';
  
  promptIA+='Generá el DEI completo con todas sus secciones en el formato oficial de PBA. Incluí encabezado institucional. Dejá espacios para las firmas al final (Docente de referencia, EOE, Dirección, Familia). Tono profesional y pedagógico. Usar terminología de la Dirección General de Cultura y Educación de la Provincia de Buenos Aires.';

  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4000,messages:[{role:'user',content:promptIA}]})
    });
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var data=await res.json();
    var texto=(data.content&&data.content[0]&&data.content[0].text)||'';
    
    // Descargar como HTML
    var fecha=new Date().toLocaleDateString('es-AR');
    var doc='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>DEI — '+s.full_name+'</title>'
      +'<style>body{font-family:Arial,sans-serif;max-width:800px;margin:30px auto;padding:0 30px;font-size:12px;line-height:1.7;color:#222;}'
      +'h1{font-size:16px;text-align:center;color:#C05A3A;border-bottom:2px solid #C05A3A;padding-bottom:8px;margin-bottom:16px;}'
      +'h2{font-size:14px;color:#C05A3A;margin-top:20px;border-left:4px solid #C05A3A;padding-left:8px;}'
      +'h3{font-size:13px;color:#2D5F4F;margin-top:14px;}'
      +'p{margin:0 0 8px;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ccc;padding:6px 8px;font-size:11px;}'
      +'th{background:#C05A3A;color:white;}'
      +'.firma{margin-top:50px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;}'
      +'.firma-item{text-align:center;border-top:1px solid #333;padding-top:8px;font-size:10px;color:#555;}'
      +'@media print{body{margin:15mm 20mm;}}</style></head><body>'
      +'<div style="text-align:center;margin-bottom:20px;">'
      +'<div style="font-size:10px;color:#C05A3A;letter-spacing:2px;text-transform:uppercase;">Escuela La Concepción · Tigre · Provincia de Buenos Aires</div>'
      +'<h1>TRAYECTORIAS EDUCATIVAS Y PROPUESTA PEDAGÓGICA PARA LA INCLUSIÓN</h1>'
      +'<div style="font-size:11px;color:#888;">'+s.full_name+' · '+(window.__teacherGrade||'6to Año')+' · 2026 · '+fecha+'</div>'
      +'</div>'
      +markdownToHtml(texto)
      +'</body></html>';
    
    var blob=new Blob([doc],{type:'text/html;charset=utf-8'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    var tsDEI=new Date();
    var marcaDEI=tsDEI.getFullYear()+''+String(tsDEI.getMonth()+1).padStart(2,'0')+String(tsDEI.getDate()).padStart(2,'0')+'-'+String(tsDEI.getHours()).padStart(2,'0')+String(tsDEI.getMinutes()).padStart(2,'0')+String(tsDEI.getSeconds()).padStart(2,'0');
    a.download='DEI_'+s.full_name.replace(/[^a-zA-Z]/g,'_')+'_'+marcaDEI+'.html';
    a.click();
    
    msg.style.color='var(--verde)';msg.textContent='✅ DEI generado y descargado';
    
    // Guardar en Supabase como observación
    if(window.__sb){
      var user=(await window.__sb.auth.getUser()).data.user;
      if(user){
        await window.__sb.from('notas_rapidas').insert({
          student_id:_perfilStudentId,
          teacher_id:user.id,
          content:'[DEI generado '+fecha+'] Documento DEI completo generado y descargado.'
        });
      }
    }
  }catch(e){
    msg.style.color='#C0392B';msg.textContent='Error: '+e.message;
  }
}

// CORTE 5 (index.html L6686-6699) -- toggleDiferenciado

async function toggleDiferenciado(){
  if(!window.__sb||!_perfilStudentId)return;
  var s=(window.__students||[]).find(function(st){return st.id===_perfilStudentId;});
  if(!s)return;
  var nuevoValor=!s.has_differential;
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var {error}=await window.__sb.from('students').update({has_differential:nuevoValor}).eq('id',_perfilStudentId).eq('teacher_id',user.id);
  if(error){alert('Error: '+error.message);return;}
  // Actualizar en memoria
  s.has_differential=nuevoValor;
  // Reabrir el perfil para reflejar el cambio
  abrirPerfilAcademico(_perfilStudentId);
}
