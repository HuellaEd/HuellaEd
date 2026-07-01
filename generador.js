// generador.js -- Material, Boletín, Adecuaciones
// Extraído de index.html -- Sesión 5 de modularización
// Depende de: core.js, registro.js
var trimBoletin = '1';
function abrirGeneradorBoletin(){
  document.getElementById('modal-gen-boletin').style.display='block';
  document.getElementById('boletin-resultado').style.display='none';
  document.getElementById('boletin-resultado-app').style.display='none';
  poblarListaAlumnosBoletin();
}
function poblarListaAlumnosBoletin(){
  var cont=document.getElementById('boletin-lista-alumnos');
  var countEl=document.getElementById('boletin-alumnos-count');
  if(!cont)return;
  var students=window.__students||[];
  if(!students.length){
    cont.innerHTML='<div style="font-size:11px;color:var(--gris);text-align:center;padding:10px;">No se encontraron alumnos cargados.</div>';
    if(countEl)countEl.textContent='';
    return;
  }
  cont.innerHTML=students.map(function(s){
    var dif=s.has_differential?' <span style="color:var(--terracota);">⚡</span>':'';
    return '<label style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:12.5px;color:var(--negro);cursor:pointer;">'
      +'<input type="checkbox" class="boletin-alumno-check" value="'+s.id+'" data-nombre="'+s.full_name+'" checked onchange="actualizarContadorAlumnosBoletin()">'
      +s.full_name+dif+'</label>';
  }).join('');
  actualizarContadorAlumnosBoletin();
}
function actualizarContadorAlumnosBoletin(){
  var checks=document.querySelectorAll('.boletin-alumno-check');
  var marcados=document.querySelectorAll('.boletin-alumno-check:checked');
  var countEl=document.getElementById('boletin-alumnos-count');
  if(countEl)countEl.textContent=marcados.length+' de '+checks.length;
  var todosEl=document.getElementById('boletin-check-todos');
  if(todosEl)todosEl.checked=(marcados.length===checks.length&&checks.length>0);
}
function toggleTodosAlumnosBoletin(el){
  document.querySelectorAll('.boletin-alumno-check').forEach(function(c){c.checked=el.checked;});
  actualizarContadorAlumnosBoletin();
}
function cerrarGeneradorBoletin(){ document.getElementById('modal-gen-boletin').style.display='none'; }

// ===== ADECUACIONES =====
var _adec={modo:'materiales',materialSelId:null,materialSelContent:'',dificultades:[],cicloDerived:null,materiales:{},lastSavedId:null};
var _adecRawText='';
var _adecHtmlRenderizado='';
async function abrirAdecuaciones(){
  document.getElementById('modal-adecuaciones').style.display='block';
  document.getElementById('adec-resultado').style.display='none';
  var aprBtn=document.getElementById('adec-btn-aprobar');
  if(aprBtn){aprBtn.textContent='✅ Aprobar';aprBtn.style.background='var(--terracota)';aprBtn.disabled=false;}
  _adec.lastSavedId=null;_adec.materialSelId=null;_adec.materialSelContent='';
  _adecRawText='';_adecHtmlRenderizado='';
  var prev=document.getElementById('adec-preview');if(prev)prev.innerHTML='';
  var edw=document.getElementById('adec-editor-wrap');if(edw)edw.style.display='none';
  var edb=document.getElementById('adec-btn-editar');if(edb)edb.textContent='📝 Editar';
  var grade=window.__teacherGrade||'';
  _adec.cicloDerived=_adecDeriveCiclo(grade);
  var infoEl=document.getElementById('adec-ciclo-info');
  if(infoEl){
    var lbls={primer_ciclo:'1er ciclo (1°, 2°, 3°)',segundo_ciclo:'2do ciclo (4°, 5°, 6°)'};
    infoEl.textContent=_adec.cicloDerived?'Mostrando dificultades de '+lbls[_adec.cicloDerived]+' + transversales.':'';
  }
  poblarAlumnosAdecuacion();
  await cargarDificultadesAdecuacion();
  cargarMaterialesAdecuacion();
}
function cerrarAdecuaciones(){document.getElementById('modal-adecuaciones').style.display='none';}
function _adecDeriveCiclo(grade){
  if(!grade)return null;
  var m=(grade.match(/\d+/)||[])[0];
  if(!m)return null;
  var n=parseInt(m);
  if(n>=1&&n<=3)return'primer_ciclo';
  if(n>=4&&n<=7)return'segundo_ciclo';
  return null;
}
function toggleModoAdecuacion(modo){
  _adec.modo=modo;
  document.getElementById('adec-tab-materiales').classList.toggle('active',modo==='materiales');
  document.getElementById('adec-tab-texto').classList.toggle('active',modo==='texto');
  document.getElementById('adec-panel-materiales').style.display=modo==='materiales'?'block':'none';
  document.getElementById('adec-panel-texto').style.display=modo==='texto'?'block':'none';
}
function poblarAlumnosAdecuacion(){
  var sel=document.getElementById('adec-alumno');
  if(!sel)return;
  var students=(window.__students||[]).filter(function(s){return s.active!==false;});
  sel.innerHTML='<option value="">— Seleccionar alumno —</option>'+students.map(function(s){return'<option value="'+s.id+'">'+s.full_name+'</option>';}).join('');
}
async function cargarDificultadesAdecuacion(){
  try{
    var{data}=await window.__sb.from('dificultades').select('id,nombre,ciclo,descripcion_indicadores,adecuaciones_base,senales_alerta_adaptacion').order('ciclo').order('nombre');
    _adec.dificultades=data||[];
    var sel=document.getElementById('adec-dificultad');
    if(!sel)return;
    var ciclo=_adec.cicloDerived;
    var lista=_adec.dificultades.filter(function(d){return!ciclo||d.ciclo===ciclo||d.ciclo==='transversal';});
    var lbls={primer_ciclo:'1er ciclo',segundo_ciclo:'2do ciclo',transversal:'Transversal'};
    sel.innerHTML='<option value="">— Seleccionar —</option>'+lista.map(function(d){return'<option value="'+d.id+'">['+( lbls[d.ciclo]||d.ciclo)+'] '+d.nombre+'</option>';}).join('');
  }catch(e){console.error('Error cargando dificultades:',e);}
}
async function cargarMaterialesAdecuacion(){
  _adec.materiales={};
  var cont=document.getElementById('adec-lista-materiales');
  if(!cont)return;
  cont.innerHTML='<div style="text-align:center;padding:12px;font-size:11px;color:var(--gris);">Cargando…</div>';
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    var{data}=await window.__sb.from('cuadernillos').select('id,title,area,tema,content').eq('teacher_id',user.id).not('content','is',null).order('created_at',{ascending:false});
    var mats=data||[];
    if(!mats.length){cont.innerHTML='<div style="text-align:center;padding:12px;font-size:11px;color:var(--gris);">No tenés materiales con texto guardados. Usá la pestaña "Pegar texto".</div>';return;}
    mats.forEach(function(m){_adec.materiales[m.id]={titulo:m.title,content:m.content||''};});
    cont.innerHTML=mats.map(function(m){
      var sub=[m.area,m.tema].filter(Boolean).join(' · ');
      return'<div class="adec-mat-item" data-id="'+m.id+'" onclick="seleccionarMaterialAdecuacion(this)" style="padding:9px 11px;border-radius:8px;cursor:pointer;margin-bottom:5px;border:1.5px solid var(--gris-claro);background:var(--crema);">'
        +'<div style="font-size:12.5px;font-weight:600;color:var(--negro);">'+m.title+'</div>'
        +(sub?'<div style="font-size:10px;color:var(--gris);margin-top:1px;">'+sub+'</div>':'')+'</div>';
    }).join('');
  }catch(e){cont.innerHTML='<div style="text-align:center;padding:12px;font-size:11px;color:var(--terracota);">Error al cargar materiales.</div>';}
}
function seleccionarMaterialAdecuacion(el){
  document.querySelectorAll('.adec-mat-item').forEach(function(x){x.style.background='var(--crema)';x.style.borderColor='var(--gris-claro)';});
  el.style.background='var(--verde-bg)';el.style.borderColor='var(--verde)';
  var id=el.getAttribute('data-id');
  _adec.materialSelId=id;
  var mat=_adec.materiales[id]||{};
  _adec.materialSelContent=mat.content||'';
}
async function generarAdecuacion(){
  var alumnoSel=document.getElementById('adec-alumno');
  var alumnoId=alumnoSel.value;
  if(!alumnoId){alert('Seleccioná un alumno');return;}
  var dificultadId=document.getElementById('adec-dificultad').value;
  if(!dificultadId){alert('Seleccioná una dificultad');return;}
  var textoActividad='';
  if(_adec.modo==='materiales'){
    if(!_adec.materialSelId){alert('Seleccioná un material de la lista, o cambiá a la pestaña "Pegar texto"');return;}
    textoActividad=_adec.materialSelContent;
    if(!textoActividad){alert('El material seleccionado no tiene contenido de texto. Usá la pestaña "Pegar texto"');return;}
  }else{
    textoActividad=document.getElementById('adec-texto-libre').value.trim();
    if(!textoActividad){alert('Pegá el texto de la actividad');return;}
  }
  var dif=_adec.dificultades.find(function(d){return d.id===dificultadId;});
  if(!dif){alert('Dificultad no encontrada');return;}
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  var btn=document.getElementById('adec-btn-generar');
  btn.disabled=true;btn.textContent='Generando…';
  document.getElementById('adec-resultado').style.display='none';
  // Cargar contexto del alumno en paralelo: perfil diferencial + PAF más reciente
  var perfilDifTexto='',pafTexto='';
  try{
    var userAdec=(await window.__sb.auth.getUser()).data.user;
    if(userAdec){
      var _adecCtxRes=await Promise.all([
        window.__sb.from('differential_profiles')
          .select('como_aprende,comprension_consignas,autonomia,matematica,lectura_escritura,descripcion,necesidades')
          .eq('student_id',alumnoId).eq('teacher_id',userAdec.id).maybeSingle(),
        window.__sb.from('perfiles_generados')
          .select('contenido,created_at')
          .eq('teacher_id',userAdec.id).eq('student_id',alumnoId).eq('tipo','academico')
          .order('created_at',{ascending:false}).limit(1)
      ]);
      var dpRes=_adecCtxRes[0],pgRes=_adecCtxRes[1];
      if(dpRes.data){
        var dp=dpRes.data,dparts=[];
        if(dp.descripcion)dparts.push('Descripción/diagnóstico: '+dp.descripcion);
        if(dp.necesidades)dparts.push('Necesidades de aprendizaje: '+dp.necesidades);
        if(dp.como_aprende)dparts.push('Cómo aprende mejor: '+dp.como_aprende);
        if(dp.comprension_consignas)dparts.push('Comprensión de consignas: '+dp.comprension_consignas);
        if(dp.autonomia)dparts.push('Autonomía y organización: '+dp.autonomia);
        if(dp.matematica)dparts.push('Desempeño en matemática: '+dp.matematica);
        if(dp.lectura_escritura)dparts.push('Lectura y escritura: '+dp.lectura_escritura);
        if(dparts.length)perfilDifTexto=dparts.join('\n');
      }
      if(pgRes.data&&pgRes.data.length){
        var htmlPaf=pgRes.data[0].contenido||'';
        var fechaPaf=new Date(pgRes.data[0].created_at).toLocaleDateString('es-AR');
        var textoPaf=htmlPaf.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
        if(textoPaf)pafTexto='(generado el '+fechaPaf+')\n'+textoPaf;
      }
    }
  }catch(eCtx){console.log('No se pudo cargar contexto del alumno:',eCtx);}
  var _adecCtxPartes=[];
  if(perfilDifTexto)_adecCtxPartes.push('PERFIL PEDAGÓGICO DEL ALUMNO (ficha y perfil diferencial):\n'+perfilDifTexto);
  if(pafTexto)_adecCtxPartes.push('PERFIL ACADÉMICO FUNCIONAL MÁS RECIENTE:\n'+pafTexto);
  var contextoBloque=_adecCtxPartes.length?'\nCONTEXTO DEL ALUMNO:\n'+_adecCtxPartes.join('\n\n')+'\n\n':'';
  var promptTxt='Eres un asistente pedagógico especializado en educación inclusiva, basado en normativa de la Provincia de Buenos Aires (Res. 1664/17 DGCyE) y principios de Diseño Universal para el Aprendizaje (DUA).\n\n'
    +'Tarea: Adaptar la siguiente ACTIVIDAD GENERAL para el alumno/a seleccionado/a, quien presenta la dificultad: '+dif.nombre+'.\n\n'
    +'DIFICULTAD — descripción e indicadores: '+(dif.descripcion_indicadores||'')+'\n'
    +'Adecuaciones de referencia ya validadas:\n'+(dif.adecuaciones_base||'')+'\n\n'
    +contextoBloque
    +'ACTIVIDAD ORIGINAL:\n'+textoActividad+'\n\n'
    +'Instrucciones:\n'
    +'1. FORMATO DE SALIDA: Usá Markdown estándar (##, ###, **negrita**, tablas con |, listas con -). Para espacios en blanco que el alumno debe completar, escribí únicamente ____ (cuatro o más guiones bajos). NUNCA uses etiquetas HTML (<span>, <div>, <br> ni ninguna otra).\n'
    +'2. Generá una versión adecuada de la actividad. Mantené el MISMO objetivo de aprendizaje — solo ajustá presentación, formato, consigna, tiempos o apoyos.\n'
    +'3. Usá como base las adecuaciones de referencia provistas; podés sumar otras coherentes con DUA si es pertinente.\n'
    +'4. Si contás con el CONTEXTO DEL ALUMNO arriba, usalo para personalizar: ajustá ejemplos, nivel de apoyo y formato a sus características reales.\n'
    +'5. Si considerás que una adecuación NO es suficiente y la situación requeriría modificar objetivos o contenidos (una Adaptación Curricular), indicalo explícitamente al final con la etiqueta [ALERTA_ADAPTACION: sí] seguida de una breve justificación. Si no es el caso, usá [ALERTA_ADAPTACION: no].\n'
    +'6. No tomes la decisión de adaptar por tu cuenta — solo señalá la alerta. La decisión de adaptar es siempre institucional y del docente.';
  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2048,messages:[{role:'user',content:promptTxt}]})});
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var resData=await res.json();
    var texto=(resData.content&&resData.content[0]&&resData.content[0].text)||'';
    var requierePPI=/\[ALERTA_ADAPTACION:\s*s[íi]\]/i.test(texto);
    var textoLimpio=texto.replace(/\[ALERTA_ADAPTACION:[^\]]*\]/gi,'').trim();
    _adecRawText=textoLimpio;
    document.getElementById('adec-texto-editar').value=textoLimpio;
    var previewEl=document.getElementById('adec-preview');
    renderAdecuacion(textoLimpio,previewEl);
    _adecHtmlRenderizado=previewEl.innerHTML;
    previewEl.style.display='block';
    document.getElementById('adec-editor-wrap').style.display='none';
    document.getElementById('adec-btn-editar').textContent='📝 Editar';
    document.getElementById('adec-alerta-ppi').style.display=requierePPI?'block':'none';
    var aprBtn=document.getElementById('adec-btn-aprobar');
    aprBtn.textContent='✅ Aprobar';aprBtn.style.background='var(--terracota)';aprBtn.disabled=false;
    document.getElementById('adec-resultado').style.display='block';
    document.getElementById('adec-resultado').scrollIntoView({behavior:'smooth'});
    await _adecGuardarBorrador(alumnoId,dificultadId,textoLimpio,requierePPI);
  }catch(e){
    alert('Error al generar: '+e.message);
  }finally{
    btn.disabled=false;btn.textContent='✨ Generar adecuación';
  }
}
async function _adecGuardarBorrador(alumnoId,dificultadId,contenido,requierePPI){
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    var reg={teacher_id:user.id,alumno_id:alumnoId,dificultad_id:dificultadId,contenido_generado:contenido,requiere_ppi:requierePPI,tipo_resultado:requierePPI?'sugerencia_adaptacion':'adecuacion',estado:'borrador'};
    if(_adec.modo==='materiales'&&_adec.materialSelId){reg.actividad_original_id=_adec.materialSelId;}
    else{reg.actividad_texto_original=document.getElementById('adec-texto-libre').value.trim();}
    var{data,error}=await window.__sb.from('adecuaciones_generadas').insert(reg).select().single();
    if(error)throw error;
    _adec.lastSavedId=data.id;
  }catch(e){console.warn('Error guardando borrador:',e);}
}
async function aprobarAdecuacion(){
  if(!_adec.lastSavedId){alert('Primero generá una adecuación');return;}
  var edw=document.getElementById('adec-editor-wrap');
  if(edw&&edw.style.display!=='none'){adecAplicarEdicion();}
  var contenidoEditado=_adecRawText;
  try{
    await window.__sb.from('adecuaciones_generadas').update({estado:'aprobada',contenido_generado:contenidoEditado}).eq('id',_adec.lastSavedId);
    var btn=document.getElementById('adec-btn-aprobar');
    btn.textContent='✅ Aprobada';btn.style.background='var(--verde)';btn.disabled=true;
  }catch(e){alert('Error al aprobar: '+e.message);}
}
async function copiarAdecuacion(){
  var texto=_adecRawText;
  try{
    await navigator.clipboard.writeText(texto);
    var msg=document.getElementById('adec-copy-msg');
    msg.textContent='✓ Copiado';setTimeout(function(){msg.textContent='';},2000);
  }catch(e){alert('Error al copiar');}
}
function adecToggleEditar(){
  var preview=document.getElementById('adec-preview');
  var editor=document.getElementById('adec-editor-wrap');
  var btn=document.getElementById('adec-btn-editar');
  var editando=editor.style.display!=='none';
  if(editando){
    editor.style.display='none';preview.style.display='block';btn.textContent='📝 Editar';
  }else{
    document.getElementById('adec-texto-editar').value=_adecRawText;
    editor.style.display='block';preview.style.display='none';btn.textContent='← Previsualizar';
  }
}
function adecAplicarEdicion(){
  var texto=document.getElementById('adec-texto-editar').value.trim();
  if(!texto)return;
  _adecRawText=texto;
  var preview=document.getElementById('adec-preview');
  renderAdecuacion(texto,preview);
  _adecHtmlRenderizado=preview.innerHTML;
  document.getElementById('adec-editor-wrap').style.display='none';
  preview.style.display='block';
  document.getElementById('adec-btn-editar').textContent='📝 Editar';
}
function adecDescargarPDF(){
  if(!_adecHtmlRenderizado){alert('Generá la adecuación primero');return;}
  var alumnoSel=document.getElementById('adec-alumno');
  var alumnoNombre=(alumnoSel.selectedIndex>0?alumnoSel.options[alumnoSel.selectedIndex].text:'alumno');
  var ahora=new Date();
  var marca=ahora.getFullYear()+String(ahora.getMonth()+1).padStart(2,'0')+String(ahora.getDate()).padStart(2,'0');
  var nombrePDF='adecuacion-'+alumnoNombre.slice(0,20).replace(/\s+/g,'-').replace(/[^a-z0-9\-]/gi,'').toLowerCase()+'-'+marca+'.pdf';
  var btnDesc=document.getElementById('adec-btn-descargar');
  var textoOrig=btnDesc?btnDesc.textContent:'';
  if(btnDesc){btnDesc.textContent='Generando…';btnDesc.disabled=true;}
  var preview=document.getElementById('adec-preview');
  var oldMax=preview.style.maxHeight;var oldOvY=preview.style.overflowY;
  preview.style.maxHeight='none';preview.style.overflowY='visible';
  var opciones={margin:0,filename:nombrePDF,image:{type:'jpeg',quality:0.92},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css']}};
  html2pdf().set(opciones).from(preview).save().then(function(){
    preview.style.maxHeight=oldMax;preview.style.overflowY=oldOvY;
    if(btnDesc){btnDesc.textContent=textoOrig;btnDesc.disabled=false;}
  }).catch(function(e){
    alert('No se pudo generar el PDF: '+e.message);
    preview.style.maxHeight=oldMax;preview.style.overflowY=oldOvY;
    if(btnDesc){btnDesc.textContent=textoOrig;btnDesc.disabled=false;}
  });
}

function selTrimBoletin(el,t){ document.querySelectorAll('#tb-1,#tb-2,#tb-3').forEach(b=>b.classList.remove('active')); el.classList.add('active'); trimBoletin=t; }

async function obtenerAlumnosSeleccionadosBoletin(){
  var checks=document.querySelectorAll('.boletin-alumno-check:checked');
  return Array.prototype.map.call(checks,function(c){return {id:c.value,full_name:c.getAttribute('data-nombre')};});
}

async function armarPromptBoletin(){
  var ctx=document.getElementById('boletin-contexto').value;
  var trims={'1':'1er Trimestre (Marzo-Mayo 2026)','2':'2do Trimestre (Junio-Agosto 2026)','3':'3er Trimestre (Septiembre-Diciembre 2026)'};
  var seleccionados=await obtenerAlumnosSeleccionadosBoletin();
  if(!seleccionados.length)return null;

  var user=(await window.__sb.auth.getUser()).data.user;
  var ids=seleccionados.map(function(s){return s.id;});

  var difIds=(window.__students||[]).filter(function(s){return s.has_differential&&ids.indexOf(s.id)>-1;}).map(function(s){return s.id;});
  var difTexto='';
  if(difIds.length){
    var difResultados=await Promise.all(difIds.map(function(id){
      return window.__sb.from('differential_profiles').select('como_aprende,comprension_consignas,matematica,lectura_escritura').eq('student_id',id).maybeSingle();
    }));
    difIds.forEach(function(id,i){
      var nombre=seleccionados.find(function(s){return s.id===id;}).full_name;
      var d=difResultados[i].data;
      if(d){
        var partes=[d.como_aprende,d.comprension_consignas,d.lectura_escritura,d.matematica].filter(Boolean);
        if(partes.length)difTexto+=nombre+': '+partes.join(' | ')+'\n';
      }
    });
  }

  var {data:notas}=await window.__sb.from('grades').select('student_id,score').eq('teacher_id',user.id).eq('period',trimBoletin).in('student_id',ids);
  var promediosTexto='';
  if(notas&&notas.length){
    seleccionados.forEach(function(s){
      var notasAlumno=notas.filter(function(n){return n.student_id===s.id&&n.score!=null;});
      if(notasAlumno.length){
        var prom=notasAlumno.reduce(function(a,n){return a+Number(n.score);},0)/notasAlumno.length;
        promediosTexto+=s.full_name+' '+prom.toFixed(1)+' - ';
      }
    });
    promediosTexto=promediosTexto.replace(/ - $/,'');
  }

  // Observaciones reales del trimestre: incluye notas manuales, análisis de fotos de
  // evidencia, transcripciones/evaluaciones de lectura oral, y resúmenes de documentos
  // adjuntos — todo lo que el docente fue registrando realmente, no solo nombre+promedio.
  var mesesTrim=MESES_POR_TRIMESTRE[trimBoletin]||MESES_POR_TRIMESTRE['1'];
  var primerMes=mesesTrim[0].m;
  var ultimoMes=mesesTrim[mesesTrim.length-1].m;
  var anioActual=new Date().getFullYear();
  var fechaInicioTrim=anioActual+'-'+String(primerMes).padStart(2,'0')+'-01';
  var ultimoDiaMes=new Date(anioActual,ultimoMes,0).getDate(); // día 0 del mes siguiente = último día del mes actual
  var fechaFinTrim=anioActual+'-'+String(ultimoMes).padStart(2,'0')+'-'+String(ultimoDiaMes).padStart(2,'0');
  var {data:notasObs}=await window.__sb.from('notas_rapidas')
    .select('student_id,content,created_at')
    .eq('teacher_id',user.id)
    .in('student_id',ids)
    .gte('created_at',fechaInicioTrim+'T00:00:00')
    .lte('created_at',fechaFinTrim+'T23:59:59')
    .order('created_at',{ascending:true});
  var obsTexto='';
  if(notasObs&&notasObs.length){
    seleccionados.forEach(function(s){
      var obsAlumno=notasObs.filter(function(n){return n.student_id===s.id;});
      if(obsAlumno.length){
        obsTexto+='--- '+s.full_name+' ('+obsAlumno.length+' registros) ---\n';
        obsAlumno.forEach(function(n){
          var fecha=n.created_at?n.created_at.slice(0,10):'';
          obsTexto+='['+fecha+'] '+n.content+'\n';
        });
        obsTexto+='\n';
      }
    });
  }

  var nombresLista=seleccionados.map(function(s){return s.full_name;}).join(', ');
  var p='Soy docente de '+(window.__teacherGrade||'6to Año')+' de la Escuela La Concepcion. Genera los informes de boletin del '+trims[trimBoletin]+' para los siguientes '+seleccionados.length+' alumnos.\n\n';
  p+='FORMATO: recuadro 11.5cm x 2.5cm. Texto narrativo de 3-4 oraciones. Mencionar Matematica, Practicas del Lenguaje, conducta y asistencia si corresponde. Tono profesional y constructivo.\n\n';
  p+='ALUMNOS ('+seleccionados.length+'):\n'+nombresLista+'\n\n';
  if(difTexto)p+='ATENCION DIFERENCIADA:\n'+difTexto+'\n';
  if(promediosTexto)p+='PROMEDIOS DEL TRIMESTRE:\n'+promediosTexto+'\n\n';
  if(obsTexto){
    p+='REGISTROS REALES DEL TRIMESTRE (observaciones del docente, evidencias fotográficas analizadas, evaluaciones de lectura oral, y resúmenes de documentos adjuntos — basate en esto para el contenido del informe, no en supuestos genéricos):\n\n'+obsTexto;
  }else{
    p+='ADVERTENCIA: no hay registros (observaciones, evidencias, lecturas o documentos) cargados para estos alumnos en este trimestre. Indicalo en el informe en vez de inventar contenido genérico.\n\n';
  }
  if(ctx)p+='CONTEXTO ADICIONAL:\n'+ctx+'\n\n';
  p+='Genera un informe por alumno en el orden de la lista, basándote en los registros reales de arriba. Si un alumno no tiene registros suficientes, indicalo explícitamente en su informe en vez de generar contenido genérico o inventado.';
  return p;
}

function generarPromptBoletin(){
  armarPromptBoletin().then(function(prompt){
    if(!prompt){alert('Seleccioná al menos un alumno antes de generar.');return;}
    document.getElementById('boletin-prompt-text').textContent=prompt;
    document.getElementById('boletin-resultado').style.display='block';
  });
}
function copiarPromptBoletin(){ navigator.clipboard.writeText(document.getElementById('boletin-prompt-text').textContent).then(()=>{ document.getElementById('boletin-copy-msg').textContent='✅ Copiado'; setTimeout(()=>{ document.getElementById('boletin-copy-msg').textContent=''; },3000); }); }

async function generarBoletinEnApp(){
  var btn=document.getElementById('btn-boletin-app');
  var statusEl=document.getElementById('boletin-app-status');
  var resBox=document.getElementById('boletin-resultado-app');
  var resTxt=document.getElementById('boletin-app-resultado');
  var prompt=await armarPromptBoletin();
  if(!prompt){alert('Seleccioná al menos un alumno antes de generar.');return;}
  btn.disabled=true;
  btn.textContent='Generando…';
  statusEl.textContent='Esto puede tardar uno o dos minutos según la cantidad de alumnos.';
  statusEl.style.color='var(--gris)';
  resBox.style.display='none';
  try{
    var resp=await window.__sb.functions.invoke('generar-perfil',{body:{prompt:prompt,max_tokens:8192}});
    if(resp.error)throw resp.error;
    var texto=(resp.data&&(resp.data.text||resp.data.result||resp.data.content))||JSON.stringify(resp.data);
    resTxt.textContent=texto;
    resBox.style.display='block';
    statusEl.textContent='';
  }catch(e){
    console.log('Error al generar boletín en la app:',e);
    statusEl.textContent='No se pudo generar. Probá con "Generar prompt para Claude" como alternativa.';
    statusEl.style.color='#c0392b';
  }finally{
    btn.disabled=false;
    btn.textContent='✨ Generar en la app (Claude)';
  }
}

function copiarBoletinApp(){
  navigator.clipboard.writeText(document.getElementById('boletin-app-resultado').textContent).then(function(){
    var m=document.getElementById('boletin-app-copy-msg');
    m.textContent='✅ Copiado';
    setTimeout(function(){ m.textContent=''; },3000);
  });
}

function descargarBoletinPDF(){
  var texto=document.getElementById('boletin-app-resultado').textContent;
  var trims={'1':'1er Trimestre','2':'2do Trimestre','3':'3er Trimestre'};
  var wrapper=document.createElement('div');
  wrapper.style.padding='28px';
  wrapper.style.fontFamily='Georgia, serif';
  wrapper.style.color='#222';

  var titulo=document.createElement('h2');
  titulo.textContent='Informes de Boletín — '+(trims[trimBoletin]||'')+' — '+(window.__teacherGrade||'6to Año')+', Escuela La Concepción';
  titulo.style.fontSize='15px';
  titulo.style.marginBottom='16px';
  titulo.style.borderBottom='2px solid #2D5F4F';
  titulo.style.paddingBottom='8px';
  wrapper.appendChild(titulo);

  var pre=document.createElement('pre');
  pre.textContent=texto;
  pre.style.whiteSpace='pre-wrap';
  pre.style.fontFamily='Georgia, serif';
  pre.style.fontSize='11.5px';
  pre.style.lineHeight='1.6';
  wrapper.appendChild(pre);

  var opt={
    margin:10,
    filename:'informes_boletin_trim'+trimBoletin+'.pdf',
    image:{type:'jpeg',quality:0.98},
    html2canvas:{scale:2},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
  };
  html2pdf().set(opt).from(wrapper).save();
}
// ── GENERADOR ──
var tipoSel='',alumnosEsp=[],soloDif=false;
var _genAdjuntoBase64=null,_genAdjuntoType=null,_genAdjuntoIsPDF=false,_genAdjuntoTexto=null;
var _genAiRawText='';
var _genHtmlRenderizado='';
function abrirGenerador(){document.getElementById('modal-generador').style.display='block';alumnosEsp=[];poblarAlumnosDif();}
function cerrarGenerador(){document.getElementById('modal-generador').style.display='none';document.getElementById('gen-resultado').style.display='none';document.getElementById('gen-ai-resultado').style.display='none';quitarAdjuntoGen();quitarMapaSeleccionado();}
var _difPerfilesCache=[];
async function poblarAlumnosDif(){
  var grid=document.getElementById('gen-alumnos-dif-grid');
  if(!grid)return;
  grid.innerHTML='<div style="font-size:11px;color:var(--gris);padding:8px;grid-column:1/-1;">Cargando...</div>';
  _difPerfilesCache=[];
  if(!window.__sb){grid.innerHTML='<div style="font-size:11px;color:var(--gris);padding:8px;grid-column:1/-1;">Sin conexión.</div>';return;}
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    if(!user){grid.innerHTML='';return;}
    var{data}=await window.__sb.from('differential_profiles').select('student_id,descripcion,necesidades').eq('teacher_id',user.id);
    var students=window.__students||[];
    var items=(data||[]).map(function(p){
      var st=students.find(function(s){return s.id===p.student_id;});
      if(!st||st.active===false)return null;
      var txt=((p.descripcion||p.necesidades||'').replace(/\n/g,' ').trim()).substring(0,200);
      return{nombre:st.full_name,tipo:'adecuacion',perfil:txt};
    }).filter(Boolean).sort(function(a,b){return a.nombre.localeCompare(b.nombre,'es');});
    if(!items.length){grid.innerHTML='<div style="font-size:11px;color:var(--gris);padding:8px;grid-column:1/-1;">Sin alumnos con perfil diferencial. Completá la ficha de conocimiento de cada alumno.</div>';return;}
    _difPerfilesCache=items;
    grid.innerHTML=items.map(function(a,i){
      return'<div class="alumno-check" data-idx="'+i+'" onclick="_toggleDifAlumno(this)"><span class="check-icon">☐</span> '+escHtml(a.nombre)+'<br><small style="color:var(--gris);font-size:10px;">Adecuación</small></div>';
    }).join('');
  }catch(e){grid.innerHTML='<div style="font-size:11px;color:var(--gris);padding:8px;grid-column:1/-1;">Error al cargar perfiles.</div>';console.error('poblarAlumnosDif:',e);}
}
function _toggleDifAlumno(el){var i=parseInt(el.getAttribute('data-idx'),10);var a=_difPerfilesCache[i];if(a)toggleAlumnoEsp(el,a.nombre,a.tipo,a.perfil);}
function selTipo(el,t){document.querySelectorAll('.tipo-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');tipoSel=t;}
var bloqueAñosSel='12';
function selBloque(el,b){document.querySelectorAll('.bloque-btn').forEach(function(btn){btn.classList.remove('active');btn.style.background='var(--crema)';btn.style.borderColor='var(--gris-claro)';btn.style.color='var(--negro)';});el.classList.add('active');el.style.background='var(--verde)';el.style.borderColor='var(--verde)';el.style.color='#fff';bloqueAñosSel=b;}
var formatoHojaSel='entera';
function selFormatoHoja(el,f){document.querySelectorAll('.formato-btn').forEach(function(b){b.classList.remove('active');b.style.background='var(--crema)';b.style.borderColor='var(--gris-claro)';b.style.color='var(--negro)';});el.classList.add('active');el.style.background='var(--verde)';el.style.borderColor='var(--verde)';el.style.color='#fff';formatoHojaSel=f;}
function toggleSoloDif(){soloDif=document.getElementById('solo-diferenciadas').checked;document.getElementById('gen-nota-general').style.display=soloDif?'none':'block';}
function toggleAlumnoEsp(el,n,t,p){var idx=alumnosEsp.findIndex(a=>a.nombre===n);if(idx>=0){alumnosEsp.splice(idx,1);el.classList.remove('selected');el.querySelector('.check-icon').textContent='☐';}else{alumnosEsp.push({nombre:n,tipo:t,perfil:p});el.classList.add('selected');el.querySelector('.check-icon').textContent='☑';}}
async function generarPrompt(){
  var area=document.getElementById('gen-area').value,tema=document.getElementById('gen-tema').value,det=document.getElementById('gen-detalles').value;
  if(!tipoSel){alert('Seleccioná el tipo');return;}
  if(!tema){alert('Escribí el tema');return;}
  var tipos={cuadernillo:'un cuadernillo imprimible',ficha:'una ficha de trabajo imprimible',evaluacion:'una evaluación'};
  var areaT=area;
  var p='Soy docente de '+(window.__teacherGrade||'6to Año')+' de la Escuela La Concepción, PBA. DC PBA. '+(window.__students&&window.__students.length||19)+' alumnos.\n\nNecesito generar '+tipos[tipoSel]+' para '+areaT;
  p+=', sobre: '+tema+'.\n\n';
  var formatosBloque={
    '12':'FORMATO PARA 1° y 2° GRADO: tipografía y consignas MUY simples, una sola consigna por bloque, oraciones cortas, mucho espacio para escribir o dibujar, vocabulario básico.',
    '34':'FORMATO PARA 3° y 4° GRADO: consignas en 2-3 pasos numerados, complejidad intermedia, espacio de escritura moderado.',
    '56':'FORMATO PARA 5° y 6° GRADO: consignas más densas, puede incluir tablas o cuadros comparativos, espacio de escritura más acotado.'
  };
  p+=(formatosBloque[bloqueAñosSel]||formatosBloque['56'])+'\n\n';
  if(!soloDif)p+='VERSIÓN GENERAL: para todo el grupo. Consignas claras para '+(window.__teacherGrade||'6to')+'.';else p+='Generá ÚNICAMENTE las versiones diferenciadas indicadas.';
  if(tipoSel==='cuadernillo'||tipoSel==='ficha')p+='\nListo para imprimir en A4.';
  if(alumnosEsp.length>0){
    p+='\n\nVERSIONES DIFERENCIADAS:\n';
    alumnosEsp.forEach(function(a){
      var tl=a.tipo==='adaptacion'?'ADAPTACIÓN (modifica objetivos — NEE con diagnóstico)':'ADECUACIÓN (mantiene objetivos, cambia forma/apoyo)';
      p+='• '+a.nombre+' — '+tl+'\n  '+a.perfil+'\n';
    });
    p+='\nIMPORTANTE: en la hoja de cada alumno NO debe aparecer ninguna palabra como "adaptado", "adaptación", "adecuación", ni ningún texto que indique que es una versión diferenciada, ni ninguna nota dirigida a la docente. La hoja debe verse igual a la del resto del grupo en su formato, solo cambia la dificultad/apoyo del contenido. Lo único que identifica a quién pertenece es el nombre del alumno en el encabezado.';
  }
  if(det)p+='\n\nDetalles: '+det;
  document.getElementById('gen-ai-resultado').style.display='none';
  if(_genAdjuntoBase64){
    await enviarAClaudeConArchivo(p);
  } else {
    document.getElementById('gen-prompt-text').textContent=p;
    document.getElementById('gen-resultado').style.display='block';
    document.getElementById('gen-resultado').scrollIntoView({behavior:'smooth'});
  }
}

async function generarConIA(){
  var p=await new Promise(function(resolve){
    var area=document.getElementById('gen-area').value,tema=document.getElementById('gen-tema').value,det=document.getElementById('gen-detalles').value;
    if(!tipoSel){alert('Seleccioná el tipo');resolve(null);return;}
    if(!tema){alert('Escribí el tema');resolve(null);return;}
    var tipos={cuadernillo:'un cuadernillo imprimible',ficha:'una ficha de trabajo imprimible',evaluacion:'una evaluación'};
    var areaT=area;
    var p2='Soy docente de '+(window.__teacherGrade||'6to Año')+' de la Escuela La Concepción, PBA. DC PBA. '+(window.__students&&window.__students.length||19)+' alumnos.\n\nNecesito generar '+tipos[tipoSel]+' para '+areaT;
    p2+=', sobre: '+tema+'.\n\n';
    if(!soloDif)p2+='VERSIÓN GENERAL: para todo el grupo. Consignas claras para '+(window.__teacherGrade||'6to')+'.';else p2+='Generá ÚNICAMENTE las versiones diferenciadas indicadas.';
    if(alumnosEsp.length>0){p2+='\n\nVERSIONES DIFERENCIADAS:\n';alumnosEsp.forEach(function(a){var tl=a.tipo==='adaptacion'?'ADAPTACIÓN (modifica objetivos)':'ADECUACIÓN (mantiene objetivos)';p2+='• '+a.nombre+' — '+tl+'\n  '+a.perfil+'\n';});p2+='\nNINGUNA nota, aclaración o sección dirigida a la docente debe aparecer en el documento final — es exclusivamente para el alumno.';}
    if(det)p2+='\n\nDetalles: '+det;
    var formatoInstr={
      entera:'',
      media:'\n\nFORMATO DE HOJA: esto va a ocupar MEDIA hoja A4 (se imprimen 2 fichas por hoja, cortadas al medio). Generá MENOS cantidad de contenido: aproximadamente la MITAD de ejercicios/ítems que en una hoja entera, consignas más breves, máximo 1 página, para que entre cómodo en el espacio reducido sin verse apretado.'
    };
    p2+=formatoInstr[formatoHojaSel]||'';
    p2+='';
    resolve(p2);
  });
  if(!p)return;
  document.getElementById('gen-resultado').style.display='none';
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  var btn=document.getElementById('gen-btn-ia');
  var contenedor=document.getElementById('gen-ai-resultado');
  btn.disabled=true;btn.textContent='Generando...';
  contenedor.style.display='block';
  document.getElementById('gen-ai-text').innerHTML='<div style="text-align:center;padding:32px;color:#2D5F4F"><div style="font-size:32px;margin-bottom:10px">📖</div><div style="font-weight:700;font-size:14px">Generando material...</div></div>';
  var LIMITES_FORMATO={
    entera:'Maximo 2 paginas, 4-6 secciones por pagina.',
    media:'Maximo 1 pagina, 2-3 secciones en total. Contenido breve, va a ocupar la mitad de una hoja A4.',
    cuarto:'Maximo 1 pagina, 1 sola seccion simple (o 2 como mucho). Contenido muy breve, va a ocupar un cuarto de hoja A4, espacio muy reducido.'
  };
  var pedirPictogramas=document.getElementById('gen-pictogramas')&&document.getElementById('gen-pictogramas').checked;
  var estructuraJSON=pedirPictogramas
    ?'{"titulo":"...","subtitulo":"...","paginas":[{"titulo":"...","secciones":[{"tipo":"grilla|tabla|escritura|caja","consigna":"...","texto":"...","items":[],"cols":3,"columnas":[],"filas":[],"alto":58,"titulo":"...","color":"verde|dorado","grupal":false,"pictogramas":["palabra1","palabra2"]}]}]}'
    :'{"titulo":"...","subtitulo":"...","paginas":[{"titulo":"...","secciones":[{"tipo":"grilla|tabla|escritura|caja","consigna":"...","texto":"...","items":[],"cols":3,"columnas":[],"filas":[],"alto":58,"titulo":"...","color":"verde|dorado","grupal":false}]}]}';
  var instrPictogramas=pedirPictogramas?' En cada seccion, agrega "pictogramas": un array de 1 a 3 palabras clave en español (sustantivos simples y concretos) de la consigna que convendria ilustrar con un pictograma de apoyo visual. Si la consigna no tiene palabras concretas para ilustrar, dejá el array vacio [].':'';
  var areaParaIconos=document.getElementById('gen-area').value;
  var esAreaMate=(areaParaIconos||'').toLowerCase().indexOf('matem')>-1;
  var instrIconosMate=esAreaMate?' Esto es de Matematica: en cada seccion donde tenga sentido, agrega "iconosMate": un array de 1 a 4 nombres de iconos a usar como apoyo visual, elegidos de esta lista exacta: circulo, cuadrado, triangulo, rectangulo, pentagono, hexagono, rombo, suma, resta, multiplicacion, division, igual, reloj, balanza, regla, monedas, o grupo_N donde N es un numero del 1 al 10 (representa esa cantidad en puntos, util para conteo). Elegi segun el tema: geometria=formas, operaciones=suma/resta/etc, cantidades chicas=grupo_N, dinero=monedas, tiempo=reloj, medidas=regla/balanza. Si no aplica, dejalo vacio [].':'';
  var areaLower=(areaParaIconos||'').toLowerCase();
  var esAreaFotos=areaLower.indexOf('natural')>-1||areaLower.indexOf('social')>-1;
  var esAreaClipart=true;
  var instrFotos=esAreaFotos?' Ademas, en 1 o 2 secciones clave (las mas importantes del tema), agrega "fotoReal": una palabra o frase corta en ingles (2-4 palabras maximo) que describa concretamente que foto real buscar para ilustrar (ej: "Andes mountains Argentina", "frog life cycle", "Eiffel Tower"). Usa ingles porque la busqueda de fotos funciona mejor asi. Si la seccion no necesita foto, no agregues el campo.':'';
  var instrClipart=esAreaClipart?' Ademas, en secciones donde la actividad sea de tipo "dibuja y escribi" o similar para primer ciclo, agrega "clipart": el nombre de UN dibujo simple a mostrar, elegido de esta lista exacta: sol, casa, arbol, perro, gato, pelota, manzana, flor, pajaro, pez, estrella, globo, nube, libro, lapiz, vaca, caballo, pollo, rana, mariposa, auto, bicicleta, avion, barco, pan, torta, leche, reloj_pared, mochila, cara_nino, familia, corazon, arcoiris. Elegi el que mejor se relacione con el tema o consigna. Si ninguno aplica bien, no agregues el campo.':'';
  // Regla de soporte sin adjunto (espejo de instrSoporteAdj en enviarAClaudeConArchivo):
  // Ciencias Sociales/Naturales sin adjunto → la IA debe generar ella misma el soporte
  // (tabla de datos, descripción informativa, etc.) antes de las consignas de trabajo.
  var esCienciasNoAdj=areaLower.indexOf('social')>-1||areaLower.indexOf('natural')>-1;
  var instrSoporteNoAdj=esCienciasNoAdj?' Como no hay archivo adjunto, generá vos mismo el soporte informativo necesario usando tu conocimiento: antes de las consignas de trabajo, incluí al menos una sección con datos relevantes del tema — por ejemplo una tabla comparativa, una descripción breve de los conceptos centrales, o la descripción de qué mostraría un mapa o imagen clave. Nunca generes consignas que dependan de un recurso externo que el alumno no pueda ver en el material.':'';
  var SISTEMA='Sos un generador de material educativo para nivel primario argentino. Respondé UNICAMENTE con un JSON valido, sin texto antes ni despues, sin backticks.\n\nEstructura: '+estructuraJSON+'\n\nTipos: grilla=celdas (items=array strings), tabla=tabla con columnas y filas, escritura=area en blanco, caja=recuadro de reflexion o consigna destacada. IMPORTANTE: NUNCA incluyas el texto completo de un cuento, fabula o relato literario en ningun campo — la docente entrega esos textos por separado, en papel. El material que generes es solo actividades (preguntas, ejercicios, espacios para responder), nunca el texto fuente. Tampoco incluyas ninguna nota, aclaracion o seccion dirigida a la docente (como "nota pedagogica" o similar) — el documento es exclusivamente para el alumno. '+(LIMITES_FORMATO[formatoHojaSel]||LIMITES_FORMATO.entera)+instrPictogramas+instrIconosMate+instrFotos+instrClipart+instrSoporteNoAdj+' Lenguaje directo al alumno.';
  var contentParts=[];
  if(_genAdjuntoBase64){if(_genAdjuntoIsPDF){contentParts.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:_genAdjuntoBase64}});}else{contentParts.push({type:'image',source:{type:'base64',media_type:_genAdjuntoType,data:_genAdjuntoBase64}});}}
  var textoConAdjunto=_genAdjuntoTexto?(p+'\n\nCONTENIDO DEL ARCHIVO ADJUNTO:\n'+_genAdjuntoTexto):p;
  contentParts.push({type:'text',text:textoConAdjunto});
  var headers={'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'};
  if(_genAdjuntoIsPDF)headers['anthropic-beta']='pdfs-2024-09-25';
  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:headers,body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4096,system:SISTEMA,messages:[{role:'user',content:contentParts}]})});
    if(!res.ok){var ed=await res.json();throw new Error((ed.error&&ed.error.message)||'Error '+res.status);}
    var data=await res.json();
    var texto=(data.content&&data.content[0]&&data.content[0].text)||'';
    _genAiRawText=texto;
    renderLibro(texto,document.getElementById('gen-ai-text'));
    contenedor.style.display='block';
    contenedor.scrollIntoView({behavior:'smooth'});
  }catch(e){
    document.getElementById('gen-ai-text').innerHTML='<div style="padding:16px;color:#C05A3A;font-size:13px;background:#F5E0D8;border-radius:10px">Error: '+e.message+'</div>';
    contenedor.style.display='block';
  }finally{btn.disabled=false;btn.textContent='📖 Generar cuadernillo';}
}
function generarCaratulaLibro(area,bloque,tipoMaterial,listaContenidos,fuente){
  var MAP_COLOR={'Matemática':'#3B6E9E','Prácticas del Lenguaje':'#C8845A','Ciencias Sociales':'#5B7FA6','Ciencias Naturales':'#5A9B6F'};
  var MAP_PASTEL={'Matemática':'#D6E5F3','Prácticas del Lenguaje':'#FBEADA','Ciencias Sociales':'#D8E5F0','Ciencias Naturales':'#D4EAE0'};
  var MAP_EMOJI={'Matemática':'🔢','Prácticas del Lenguaje':'📖','Ciencias Sociales':'🗺️','Ciencias Naturales':'🌿'};
  var MAP_GRADO={'12':'1° y 2° grado','34':'3° y 4° grado','56':'5° y 6° grado'};
  var MAP_TIPO={'cuadernillo':'Cuadernillo','ficha':'Ficha de trabajo','evaluacion':'Evaluación'};
  var color=MAP_COLOR[area]||'#2D5F4F';
  var pastel=MAP_PASTEL[area]||'#D4EAE4';
  var emoji=MAP_EMOJI[area]||'📚';
  var grado=MAP_GRADO[bloque]||bloque;
  var tipo=(MAP_TIPO[tipoMaterial]||tipoMaterial||'Cuadernillo').toUpperCase();
  var itemsHtml=(listaContenidos||[]).map(function(t,i){
    return '<div class="lb-car-item"><span class="lb-car-num" style="background:'+color+'">'+(i+1)+'</span><span class="lb-car-titulo-item">'+t+'</span></div>';
  }).join('');
  var fuenteHtml=fuente?' — basado en '+fuente:'';
  return '<div class="lb-pagina lb-caratula">'
    +'<div class="lb-car-franja" style="background:'+color+'"></div>'
    +'<div class="lb-caratula-body">'
    +'<div class="lb-car-logo">Huella<span>ED</span></div>'
    +'<div class="lb-car-tagline">CADA ALUMNO, SU TRAYECTO</div>'
    +'<div class="lb-car-icono" style="background:'+pastel+'">'+emoji+'</div>'
    +'<div class="lb-car-area">'+area+'</div>'
    +'<div class="lb-car-grado" style="color:'+color+'">'+grado+'</div>'
    +'<div class="lb-car-linea"></div>'
    +(itemsHtml?'<div class="lb-car-recuadro"><div class="lb-car-tipo">'+tipo+'</div>'+itemsHtml+'</div>':'')
    +'</div>'
    +'<div class="lb-car-footer">Material elaborado por HuellaED'+fuenteHtml+'</div>'
    +'<div class="lb-car-franja" style="background:#C8973A"></div>'
    +'</div>';
}
function renderLibro(respuestaIA,contenedor){
  var _picsParaBuscar=[];
  var _fotosParaBuscar=[];
  function sec(s,idx){
    var tipo=(s.tipo||'').toLowerCase(),h='<div class="lb-bloque">';
    if(s.grupal)h+='<div class="lb-badge">👥 De a dos</div>';
    var txt=s.consigna||s.texto||s.enunciado;
    if(txt)h+='<div class="lb-consigna"><div class="lb-num lb-n0">'+(idx+1)+'</div><div class="lb-texto">'+txt+'</div></div>';
    if(s.fotoReal){
      var fotoId='foto-box-'+_fotosParaBuscar.length;
      _fotosParaBuscar.push({id:fotoId,query:s.fotoReal});
      h+='<div id="'+fotoId+'" class="lb-foto-real-wrapper"></div>';
    }
    if(s.pictogramas&&s.pictogramas.length){
      var picId='pic-box-'+_picsParaBuscar.length;
      _picsParaBuscar.push({id:picId,palabras:s.pictogramas});
      h+='<div id="'+picId+'" class="lb-pictogramas-box"></div>';
    }
    if(s.iconosMate&&s.iconosMate.length){
      var iconosHtml=s.iconosMate.map(function(nombreIcono,ii){return renderIconoMate(nombreIcono,'#3B6E9E');}).filter(Boolean).join('');
      if(iconosHtml)h+='<div class="lb-iconos-mate-fila">'+iconosHtml+'</div>';
    }
    if(s.clipart){
      var clipartHtml=renderClipart(s.clipart);
      if(clipartHtml)h+='<div class="lb-clipart-wrapper">'+clipartHtml+'</div>';
    }
    var esCajaOTabla=(tipo==='caja'||tipo==='reflexion'||tipo==='conclusion'||tipo==='cierre'||tipo==='tabla'||s.columnas);
    if(!esCajaOTabla&&(tipo==='grilla'||tipo==='celdas'||s.items)){var items=s.items||[];var cols=s.cols||(items.length<=4?items.length:items.length<=6?3:4);var gc=cols<=2?'lb-g2':cols===3?'lb-g3':'lb-g4';h+='<div class="lb-grilla '+gc+'">'+items.map(function(it,i){return '<div class="lb-celda">'+(typeof it==='string'?it:it.texto||it)+'</div>';}).join('')+'</div>';}
    else if(tipo==='tabla'||s.columnas){var c2=s.columnas||[];var f=s.filas||[];h+='<div class="lb-tabla-wrap"><table><thead><tr>'+c2.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr></thead><tbody>'+f.map(function(r){var cs=Array.isArray(r)?r:Object.values(r);return '<tr>'+cs.map(function(c){return '<td>'+(c!=null?c:'')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';}
    else if(tipo==='caja'||tipo==='reflexion'||tipo==='conclusion'||tipo==='cierre'){var cl=s.color==='dorado'?'lb-caja-dorada':'lb-caja-verde';var ti2=s.titulo||'Para reflexionar';var ic=s.color==='dorado'?'👥':'✍️';var pi=s.items||s.puntos||[];h+='<div class="lb-caja '+cl+'"><div class="lb-caja-titulo">'+ic+' '+ti2+'</div>'+(s.texto?'<p style="font-size:11.5px">'+s.texto+'</p>':'')+(pi.length?'<ul>'+pi.map(function(i){return '<li>'+i+'</li>';}).join('')+'</ul>':'')+'</div>';}
    else{h+='<div class="lb-area" style="min-height:'+(s.alto||52)+'px"></div>';}
    return h+'</div>';
  }
  var data;
  try{var t=respuestaIA.trim();var m=t.match(/```(?:json)?\s*([\s\S]*?)```/)||t.match(/(\{[\s\S]*\})/);data=JSON.parse(m?m[1]:t);}
  catch(e){contenedor.innerHTML='<div id="libro-preview"><div class="lb-topbar"><div class="lb-logo">Huella<span>ED</span><small>cada alumno, su trayecto</small></div><button class="lb-btn-print" onclick="window.print()">PDF</button></div><div class="lb-pagina"><div style="font-size:13px;line-height:1.7">'+markdownToHtml(respuestaIA)+'</div></div></div>';return;}
  _mapasParaInicializar=[];
  _fotosParaBuscar=[];
  var MAP_AREA_GENERADOR={'Matemática':'M','Prácticas del Lenguaje':'L','Ciencias Sociales':'CS','Ciencias Naturales':'CN'};
  var MAP_AREA_EMOJI={'M':'🔢','L':'📖','CS':'🗺️','CN':'🌿'};
  var MAP_AREA_COLOR={'M':'#3B6E9E','L':'#C8845A','CS':'#5B7FA6','CN':'#5A9B6F'};
  var areaActual=document.getElementById('gen-area').value;
  var areaClaseLB=MAP_AREA_GENERADOR[areaActual]||'';
  var iconoSeccion=MAP_AREA_EMOJI[areaClaseLB]||'📚';
  var colorSeccion=MAP_AREA_COLOR[areaClaseLB]||'#2D5F4F';
  var pags=data.paginas||[{titulo:data.titulo,secciones:data.secciones||[]}];
  var ph=pags.map(function(pag,pi2){var cp='';var ti3=pag.titulo||(pi2===0?data.titulo:'');var sub=pag.subtitulo||(pi2===0?data.subtitulo:'');if(ti3)cp+='<div class="lb-seccion"><div class="lb-sec-icono" style="background:'+colorSeccion+'">'+iconoSeccion+'</div><h2 class="lb-sec-titulo">'+ti3+(sub?' <em>'+sub+'</em>':'')+'</h2></div>';if(pi2===0&&_mapaSeleccionActual)cp+=construirHtmlMapaParaMaterial();(pag.secciones||pag.bloques||[]).forEach(function(s,si){cp+=sec(s,si);});return '<div class="lb-pagina">'+cp+'</div>';}).join('');
  var clasesExtra=(areaClaseLB?' lb-area-'+areaClaseLB:'')+' lb-bloque-'+bloqueAñosSel;
  var formatoClaseLB=formatoHojaSel!=='entera'?(' lb-formato-'+formatoHojaSel):'';
  function copiaConIdsUnicos(html,copiaNum){
    // Evita IDs duplicados (mapas, fotos, pictogramas) cuando se repite la ficha en formato media/cuarto
    return html.replace(/id="([\w-]+)"/g,function(m,id){return 'id="'+id+'-c'+copiaNum+'"';});
  }
  if(formatoHojaSel==='media'){
    var mapasOriginales=_mapasParaInicializar.slice();
    var phCopia2=copiaConIdsUnicos(ph,2);
    if(mapasOriginales.length)mapasOriginales.forEach(function(m){_mapasParaInicializar.push({id:m.id+'-c2',lat:m.lat,lon:m.lon});});
    ph='<div class="lb-hoja-recortable lb-hoja-x2">'+ph+'<div class="lb-tijera">✂️</div>'+phCopia2+'</div>';
  }
  var _listaContenidos=pags.map(function(p){return p.titulo||'';}).filter(Boolean);
  var _caratulaHtml=generarCaratulaLibro(areaActual,bloqueAñosSel,tipoSel,_listaContenidos,data.fuente||'');
  _genHtmlRenderizado='<div id="libro-preview" class="'+clasesExtra.trim()+formatoClaseLB+'"><div class="lb-topbar"><div class="lb-logo">Huella<span>ED</span><small>cada alumno, su trayecto</small></div><button class="lb-btn-print" onclick="window.print()">Exportar PDF</button></div>'+_caratulaHtml+ph+'</div>';
  contenedor.innerHTML=_genHtmlRenderizado;
  if(_picsParaBuscar.length)cargarPictogramasGenerados(_picsParaBuscar);
  if(_fotosParaBuscar.length)cargarFotosGeneradas(_fotosParaBuscar);
}
function renderAdecuacion(texto,contenedor){
  // Pre-process: convert 3+ underscores into a visual fill-in line
  var proc=texto.replace(/_{3,}/g,'<span class="adec-linea-relleno">        </span>');
  // Parse markdown with marked.js (GFM = tables + strikethrough)
  var md=window.marked;
  var body;
  if(md&&md.parse){
    try{body=md.parse(proc,{gfm:true,breaks:true});}
    catch(e){body=markdownToHtml(proc);}
  } else {
    body=markdownToHtml(proc); // fallback if CDN fails
  }
  // Wrap markdown tables in lb-tabla-wrap for styled borders
  body=body
    .replace(/<table>/g,'<div class="lb-tabla-wrap"><table>')
    .replace(/<\/table>/g,'</table></div>');
  // Build cuadernillo frame (lb-topbar + lb-pagina)
  var html='<div id="libro-preview">'
    +'<div class="lb-topbar">'
    +'<div class="lb-logo">Huella<span>ED</span><small>cada alumno, su trayecto</small></div>'
    +'</div>'
    +'<div class="lb-pagina adec-contenido"><div class="lb-banda"></div>'+body+'</div>'
    +'</div>';
  contenedor.innerHTML=html;
}
function copiarPromptGen(){navigator.clipboard.writeText(document.getElementById('gen-prompt-text').textContent).then(function(){document.getElementById('gen-copy-msg').textContent='✅ Copiado';setTimeout(function(){document.getElementById('gen-copy-msg').textContent='';},3000);});}

async function seleccionarAdjuntoGen(){
  var input=document.getElementById('gen-adjunto');
  if(!input.files||!input.files[0]){quitarAdjuntoGen();return;}
  var file=input.files[0];
  var ext=file.name.split('.').pop().toLowerCase();
  var lbl=document.getElementById('gen-adjunto-label');
  _genAdjuntoTexto=null;
  if(ext==='doc'||ext==='docx'){
    lbl.textContent='Leyendo Word...';
    try{
      var arrayBuffer=await file.arrayBuffer();
      var result=await mammoth.extractRawText({arrayBuffer:arrayBuffer});
      _genAdjuntoTexto=result.value||'';
      if(!_genAdjuntoTexto.trim()){alert('No se pudo extraer texto de este Word. Probá guardándolo como PDF.');quitarAdjuntoGen();return;}
      _genAdjuntoBase64=null;_genAdjuntoType=null;_genAdjuntoIsPDF=false;
      lbl.textContent='📎 '+file.name;
    }catch(e){alert('No se pudo leer el Word: '+e.message);quitarAdjuntoGen();}
  }else if(ext==='xls'||ext==='xlsx'){
    lbl.textContent='Leyendo Excel...';
    try{
      if(typeof XLSX==='undefined')throw new Error('Lector de Excel no disponible');
      var arrayBufferXl=await file.arrayBuffer();
      var workbook=XLSX.read(arrayBufferXl,{type:'array'});
      var textoExcel='';
      workbook.SheetNames.forEach(function(nombreHoja){
        var hoja=workbook.Sheets[nombreHoja];
        var filas=XLSX.utils.sheet_to_json(hoja,{header:1,blankrows:false,defval:''});
        if(!filas.length)return;
        textoExcel+='\n--- Hoja: '+nombreHoja+' ---\n';
        filas.forEach(function(fila){textoExcel+=fila.map(function(c){return String(c).trim();}).filter(Boolean).join(' | ')+'\n';});
      });
      if(!textoExcel.trim()){alert('El Excel parece estar vacío.');quitarAdjuntoGen();return;}
      _genAdjuntoTexto=textoExcel;
      _genAdjuntoBase64=null;_genAdjuntoType=null;_genAdjuntoIsPDF=false;
      lbl.textContent='📎 '+file.name;
    }catch(e){alert('No se pudo leer el Excel: '+e.message);quitarAdjuntoGen();}
  }else{
    _genAdjuntoIsPDF=file.type==='application/pdf';
    _genAdjuntoType=file.type||'image/jpeg';
    lbl.textContent='📎 '+file.name;
    var reader=new FileReader();
    reader.onload=function(e){_genAdjuntoBase64=e.target.result.split(',')[1];};
    reader.readAsDataURL(file);
  }
}

function quitarAdjuntoGen(){
  _genAdjuntoBase64=null;_genAdjuntoType=null;_genAdjuntoIsPDF=false;_genAdjuntoTexto=null;
  var input=document.getElementById('gen-adjunto');
  if(input)input.value='';
  var lbl=document.getElementById('gen-adjunto-label');
  if(lbl)lbl.textContent='Adjuntar PDF, Word, Excel o imagen';
}

async function enviarAClaudeConArchivo(promptText){
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){configurarApiKey('anthropic');return;}
  var btn=document.getElementById('gen-btn');
  btn.disabled=true;btn.textContent='⏳ Consultando a Claude…';
  var contentParts=[];
  // Si hay un mapa del IGN seleccionado (Ciencias Sociales), incluirlo como imagen real —
  // antes se ignoraba en este flujo, y las consignas que pedían comparar/leer mapas quedaban
  // sin soporte en el material generado (ver Regla 13, protocolo HuellaED 22/6).
  var mapaIncluido=false;
  if(_mapaSeleccionActual&&_mapaSeleccionActual.archivo){
    try{
      var respMapa=await fetch(_mapaSeleccionActual.archivo);
      if(respMapa.ok){
        var blobMapa=await respMapa.blob();
        var base64Mapa=await new Promise(function(resolve,reject){
          var readerMapa=new FileReader();
          readerMapa.onload=function(){resolve(readerMapa.result.split(',')[1]);};
          readerMapa.onerror=reject;
          readerMapa.readAsDataURL(blobMapa);
        });
        contentParts.push({type:'image',source:{type:'base64',media_type:blobMapa.type||'image/jpeg',data:base64Mapa}});
        mapaIncluido=true;
      }
    }catch(eMapa){
      console.log('No se pudo incluir el mapa seleccionado en el adjunto:',eMapa);
    }
  }
  if(_genAdjuntoBase64){
    if(_genAdjuntoIsPDF){
      contentParts.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:_genAdjuntoBase64}});
    } else {
      contentParts.push({type:'image',source:{type:'base64',media_type:_genAdjuntoType,data:_genAdjuntoBase64}});
    }
  }
  var promptTextConAdjunto=_genAdjuntoTexto?(promptText+'\n\nCONTENIDO DEL ARCHIVO ADJUNTO:\n'+_genAdjuntoTexto):promptText;
  if(mapaIncluido)promptTextConAdjunto+='\n\nNOTA: te adjunté también el mapa "'+_mapaSeleccionActual.nombre+'" como imagen. Si alguna consigna requiere mirar, leer o comparar ese mapa, mencionalo y aprovechalo en la consigna — el mapa va a estar incluido en el cuadernillo final, así que es seguro pedirle al alumno que lo use.';
  contentParts.push({type:'text',text:promptTextConAdjunto});
  var LIMITES_FORMATO_ADJ={
    entera:'Maximo 2 paginas, 4-6 secciones por pagina.',
    media:'Maximo 1 pagina, 2-3 secciones en total. Contenido breve, va a ocupar la mitad de una hoja A4.'
  };
  var areaParaIconosAdj=document.getElementById('gen-area').value;
  var esAreaMateAdj=(areaParaIconosAdj||'').toLowerCase().indexOf('matem')>-1;
  var instrIconosMateAdj=esAreaMateAdj?' Esto es de Matematica: en cada seccion donde tenga sentido, agrega "iconosMate": un array de 1 a 4 nombres de iconos a usar como apoyo visual, elegidos de esta lista exacta: circulo, cuadrado, triangulo, rectangulo, pentagono, hexagono, rombo, suma, resta, multiplicacion, division, igual, reloj, balanza, regla, monedas, o grupo_N donde N es un numero del 1 al 10. Si no aplica, dejalo vacio [].':'';
  // Regla de inclusión de soporte por defecto, invertida según el área (confirmada 22/6):
  // - Prácticas del Lenguaje: el texto/cuento NO se reproduce — el alumno lo recibe aparte, en papel.
  // - Ciencias Sociales y Ciencias Naturales: el soporte SÍ se incluye — mapas, textos informativos,
  //   tablas, etc. Si no se incluye, las consignas que dependen de ese soporte quedan irresolubles
  //   (esto pasó realmente el 21/6: un cuadernillo de Sociales pidió comparar dos mapas que nunca
  //   se incluyeron en el material, dejando al alumno sin forma de responder).
  var areaLowerAdj=(areaParaIconosAdj||'').toLowerCase();
  var esLenguaAdj=areaLowerAdj.indexOf('lenguaje')>-1||areaLowerAdj.indexOf('lengua')>-1;
  var esCienciasAdj=areaLowerAdj.indexOf('social')>-1||areaLowerAdj.indexOf('natural')>-1;
  var instrSoporteAdj;
  if(esLenguaAdj){
    instrSoporteAdj=' Si el usuario adjuntó un cuento, fábula o relato literario, usalo solo como REFERENCIA para entender el tema y generar actividades coherentes con su contenido — pero NUNCA reproduzcas el texto completo del cuento/relato en el material generado. El alumno ya tiene ese texto aparte, en papel. Generá únicamente actividades (preguntas, ejercicios, tablas, espacios para responder) sobre el contenido, no el contenido en sí.';
  }else if(esCienciasAdj){
    instrSoporteAdj=' Si el usuario adjuntó un documento con mapas, textos informativos, tablas de datos o imágenes (por ejemplo una secuencia didáctica), y alguna consigna que generes requiere ese soporte para poder resolverse (comparar mapas, leer un texto, interpretar una tabla), INCLUÍ ese soporte directamente en el cuadernillo generado — no asumas que el alumno ya lo tiene por separado. Si el soporte es un mapa o imagen, describilo en un campo "imagenReferencia" con una descripción clara de qué imagen mostrar; si es texto informativo breve, incluilo en un campo "textoApoyo" dentro de la sección correspondiente. Nunca generes una consigna que dependa de un soporte que no esté presente en el material.';
  }else{
    instrSoporteAdj=' Si el usuario adjuntó un archivo, usalo como referencia para entender el tema. Si alguna consigna requiere que el alumno vea o lea algo del adjunto para poder resolverla, incluí ese contenido necesario en el material — no generes consignas irresolubles por falta de soporte.';
  }
  var SISTEMA_ADJ='Sos un generador de material educativo para nivel primario argentino. Respondé UNICAMENTE con un JSON valido, sin texto antes ni despues, sin backticks.\n\nEstructura: {"titulo":"...","subtitulo":"...","paginas":[{"titulo":"...","secciones":[{"tipo":"grilla|tabla|escritura|caja","consigna":"...","items":[],"cols":3,"columnas":[],"filas":[],"alto":58,"titulo":"...","color":"verde|dorado","grupal":false}]}]}\n\nTipos: grilla=celdas (items=array strings), tabla=tabla con columnas y filas, escritura=area en blanco, caja=recuadro de reflexion o consigna destacada.'+instrSoporteAdj+' Tampoco incluyas ninguna nota dirigida a la docente — el documento es exclusivamente para el alumno. '+(LIMITES_FORMATO_ADJ[formatoHojaSel]||LIMITES_FORMATO_ADJ.entera)+instrIconosMateAdj+' Lenguaje directo al alumno.';
  var headers={
    'x-api-key':apiKey,
    'anthropic-version':'2023-06-01',
    'content-type':'application/json',
    'anthropic-dangerous-direct-browser-access':'true'
  };
  if(_genAdjuntoIsPDF)headers['anthropic-beta']='pdfs-2024-09-25';
  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:headers,
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:4096,
        system:SISTEMA_ADJ,
        messages:[{role:'user',content:contentParts}]
      })
    });
    if(!res.ok){
      var errData=await res.json();
      throw new Error((errData.error&&errData.error.message)||'Error '+res.status);
    }
    var data=await res.json();
    var text=(data.content&&data.content[0]&&data.content[0].text)||'';
    _genAiRawText=text;
    renderLibro(text,document.getElementById('gen-ai-text'));
    document.getElementById('gen-ai-resultado').style.display='block';
    document.getElementById('gen-resultado').style.display='none';
    document.getElementById('gen-ai-resultado').scrollIntoView({behavior:'smooth'});
  } catch(e){
    alert('Error al llamar a Claude: '+e.message);
  } finally {
    btn.disabled=false;btn.textContent='✨ Armar prompt';
  }
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function inlineMd(s){
  return escHtml(s)
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:11px;">$1</code>');
}
function markdownToHtml(md){
  var lines=md.split('\n'),html='',inList=false,listType='';
  lines.forEach(function(line){
    var h1=/^# (.+)/.exec(line),h2=/^## (.+)/.exec(line),h3=/^### (.+)/.exec(line);
    var ul=/^[\*\-] (.+)/.exec(line),ol=/^\d+\. (.+)/.exec(line);
    var hr=/^-{3,}$/.test(line.trim());
    function closeList(){if(inList){html+='</'+listType+'>';inList=false;listType='';}}
    if(h3){closeList();html+='<h3 style="font-size:13px;font-weight:700;margin:14px 0 5px;color:var(--negro);">'+inlineMd(h3[1])+'</h3>';}
    else if(h2){closeList();html+='<h2 style="font-size:15px;font-weight:700;margin:18px 0 7px;color:var(--verde);">'+inlineMd(h2[1])+'</h2>';}
    else if(h1){closeList();html+='<h1 style="font-size:17px;font-weight:700;margin:20px 0 9px;color:var(--verde);border-bottom:1.5px solid var(--gris-claro);padding-bottom:5px;">'+inlineMd(h1[1])+'</h1>';}
    else if(ul){if(!inList||listType!=='ul'){closeList();html+='<ul style="margin:5px 0 10px 18px;padding:0;">';inList=true;listType='ul';}html+='<li style="margin-bottom:3px;">'+inlineMd(ul[1])+'</li>';}
    else if(ol){if(!inList||listType!=='ol'){closeList();html+='<ol style="margin:5px 0 10px 18px;padding:0;">';inList=true;listType='ol';}html+='<li style="margin-bottom:3px;">'+inlineMd(ol[1])+'</li>';}
    else if(hr){closeList();html+='<hr style="border:none;border-top:1px solid var(--gris-claro);margin:14px 0;">';}
    else if(line.trim()===''){closeList();html+='<div style="height:6px;"></div>';}
    else{closeList();html+='<p style="margin:0 0 8px;">'+inlineMd(line)+'</p>';}
  });
  if(inList)html+='</'+listType+'>';
  return html;
}

function copiarRespuestaGen(){
  navigator.clipboard.writeText(_genAiRawText).then(function(){
    var msg=document.getElementById('gen-ai-copy-msg');
    msg.style.color='var(--verde)';msg.textContent='✅ Copiado';
    setTimeout(function(){msg.textContent='';},3000);
  });
}

async function guardarCuadernilloSupabase(){
  if(!_genAiRawText){return;}
  if(!window.__sb){alert('Sin conexión a Supabase');return;}
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var area=document.getElementById('gen-area').value;
  var tema=document.getElementById('gen-tema').value;
  var tipos={cuadernillo:'Cuadernillo',ficha:'Ficha',evaluacion:'Evaluación'};
  var title=(tipos[tipoSel]||tipoSel)+(area?' · '+area:'')+(tema?' · '+tema:'');
  var msg=document.getElementById('gen-ai-copy-msg');
  msg.style.color='var(--gris)';msg.textContent='Guardando…';
  var {error}=await window.__sb.from('cuadernillos').insert({
    teacher_id:user.id,
    title:title,
    content:_genAiRawText
  });
  if(error){msg.style.color='#C0392B';msg.textContent='❌ '+error.message;}
  else{msg.style.color='var(--verde)';msg.textContent='✅ Guardado';setTimeout(function(){msg.textContent='';},3000);window.registrarActividad&&window.registrarActividad('generar_material',{titulo:title,tipo:tipoSel});}
}

function descargarCuadernillo(){
  if(!_genHtmlRenderizado){alert('Generá el material primero');return;}
  var area=document.getElementById('gen-area').value;
  var tema=document.getElementById('gen-tema').value||'material';
  var tipos={cuadernillo:'Cuadernillo',ficha:'Ficha',evaluacion:'Evaluacion'};
  var tituloLabel=(tipos[tipoSel]||'Material')+(area?' · '+area:'')+(tema?' · '+tema:'');
  var ahora=new Date();
  var marcaTiempo=ahora.getFullYear()+''+String(ahora.getMonth()+1).padStart(2,'0')+String(ahora.getDate()).padStart(2,'0')+'-'+String(ahora.getHours()).padStart(2,'0')+String(ahora.getMinutes()).padStart(2,'0')+String(ahora.getSeconds()).padStart(2,'0');
  var nombreArchivo=(tipos[tipoSel]||'material').toLowerCase()+'-'+tema.slice(0,30).replace(/\s+/g,'-').replace(/[^a-z0-9\-]/gi,'').toLowerCase()+'-'+marcaTiempo+'.html';
  var cssLibro='#libro-preview{font-family:\'Nunito Sans\',sans-serif;background:#DCE6E2;padding:16px;border-radius:12px;margin-top:8px;}     .lb-topbar{background:#2D5F4F;color:white;padding:10px 16px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}     .lb-logo{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:15px;}.lb-logo span{color:#C8973A;}.lb-logo small{display:block;font-size:7px;font-weight:600;color:rgba(255,255,255,.45);letter-spacing:1.5px;text-transform:uppercase;}     .lb-btn-print{background:#C8973A;color:white;border:none;border-radius:6px;padding:6px 14px;font-weight:700;font-size:11px;cursor:pointer;}     .lb-pagina{width:100%;background:#fff;border-radius:6px;border:1px solid #E2E6E4;position:relative;padding:24px 28px;min-height:400px;margin-bottom:16px;}          .lb-banda{position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,#2D5F4F 0%,#3D7A65 60%,#C8973A 100%);}     .lb-seccion{display:flex;align-items:center;gap:11px;margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid #D4EAE4;position:relative;z-index:1;}     .lb-sec-icono{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}     .lb-sec-titulo{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:17px;color:#2D5F4F;}.lb-sec-titulo em{font-style:normal;color:#C8973A;display:block;font-size:0.68em;font-weight:600;margin-top:2px;text-transform:none;letter-spacing:0;}     .lb-bloque{margin-bottom:12px;position:relative;z-index:1;}     .lb-consigna{display:flex;align-items:flex-start;gap:9px;margin-bottom:7px;}     .lb-num{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:\'Nunito\',sans-serif;font-weight:900;font-size:11px;color:white;flex-shrink:0;margin-top:1px;}     .lb-n0{background:#2D5F4F}.lb-n1{background:#C8973A}.lb-n2{background:#3B6E9E}.lb-n3{background:#C05A3A}.lb-n4{background:#7B6FAF}     .lb-texto{font-size:12.5px;font-weight:600;color:#2a3830;line-height:1.55;flex:1;}     .lb-grilla{display:grid;gap:5px;margin-bottom:4px;}.lb-g2{grid-template-columns:repeat(2,1fr)}.lb-g3{grid-template-columns:repeat(3,1fr)}.lb-g4{grid-template-columns:repeat(4,1fr)}     .lb-celda{border-radius:7px;border:1px solid #D6DBD8;padding:8px 11px;min-height:36px;font-size:12px;font-weight:700;display:flex;align-items:center;color:#3a4a42;background:#fff;}     .lb-c0,.lb-c1,.lb-c2,.lb-c3,.lb-c4,.lb-c5{background:#fff}     .lb-area{border-radius:7px;border:1.5px dashed rgba(45,95,79,.18);min-height:50px;background-image:repeating-linear-gradient(transparent,transparent 26px,rgba(45,95,79,.07) 26px,rgba(45,95,79,.07) 27px);background-position:0 27px;margin-bottom:5px;}     .lb-tabla-wrap{border-radius:8px;overflow:hidden;border:2px solid #2D5F4F;margin-bottom:7px;}.lb-tabla-wrap table{width:100%;border-collapse:collapse;}     .lb-tabla-wrap th{background:#2D5F4F;color:white;font-weight:800;font-size:11px;padding:7px 8px;text-align:center;}     .lb-tabla-wrap td{border:1px solid rgba(45,95,79,.1);padding:7px 8px;font-size:11.5px;text-align:center;background:white;min-width:36px;}          .lb-caja{border-radius:8px;padding:11px 14px;border-left:4px solid;margin-bottom:7px;}     .lb-caja-titulo{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:4px;}     .lb-caja-verde{background:#D4EAE4;border-color:#2D5F4F}.lb-caja-verde .lb-caja-titulo{color:#2D5F4F}     .lb-caja-dorada{background:#F7EDDB;border-color:#C8973A}.lb-caja-dorada .lb-caja-titulo{color:#C8973A}     .lb-caja li{font-size:11.5px;margin-bottom:4px;line-height:1.5;margin-left:12px;}     .lb-badge{display:inline-flex;align-items:center;gap:3px;font-family:\'Nunito\',sans-serif;font-weight:800;font-size:8px;text-transform:uppercase;border-radius:5px;padding:2px 7px;margin-bottom:3px;background:#3B6E9E;color:white;}      /* ══ PALETAS POR ÁREA ══ */     .lb-area-M .lb-sec-titulo,.lb-area-M .lb-caja-titulo{color:#3B6E9E;}     .lb-area-M .lb-banda{background:linear-gradient(180deg,#3B6E9E,#4A8AC0,#C8973A);}     .lb-area-M .lb-pagina::before{background-image:linear-gradient(rgba(59,110,158,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(59,110,158,.09) 1px,transparent 1px);}     .lb-area-M .lb-num{background:#3B6E9E!important;}     .lb-area-M .lb-tabla-wrap{border-color:#3B6E9E;}.lb-area-M .lb-tabla-wrap th{background:#3B6E9E;}      .lb-area-L .lb-sec-titulo,.lb-area-L .lb-caja-titulo{color:#C8845A;}     .lb-area-L .lb-banda{background:linear-gradient(180deg,#C8845A,#D4A06E,#8a5a3a);}     .lb-area-L .lb-pagina::before{display:none;background-image:repeating-linear-gradient(transparent,transparent 22px,rgba(200,132,90,.12) 22px,rgba(200,132,90,.12) 23px);}     .lb-area-L .lb-num{background:#C8845A!important;}     .lb-area-L .lb-texto{font-family:\'Nunito Sans\',sans-serif;}     .lb-area-L .lb-tabla-wrap{border-color:#C8845A;}.lb-area-L .lb-tabla-wrap th{background:#C8845A;}     .lb-area-L .lb-celda{font-family:Georgia,serif;}      .lb-area-CS .lb-sec-titulo,.lb-area-CS .lb-caja-titulo{color:#5B7FA6;}     .lb-area-CS .lb-banda{background:linear-gradient(180deg,#5B7FA6,#7BA0C4,#3B6E9E);}     .lb-area-CS .lb-pagina::before{background-image:none;}     .lb-area-CS .lb-num{background:#5B7FA6!important;}     .lb-area-CS .lb-tabla-wrap{border-color:#5B7FA6;}.lb-area-CS .lb-tabla-wrap th{background:#5B7FA6;}      .lb-area-CN .lb-sec-titulo,.lb-area-CN .lb-caja-titulo{color:#5A9B6F;}     .lb-area-CN .lb-banda{background:linear-gradient(180deg,#5A9B6F,#7BC090,#2D5F4F);}     .lb-area-CN .lb-pagina::before{background-image:none;}     .lb-area-CN .lb-num{background:#5A9B6F!important;border-radius:50%!important;}     .lb-area-CN .lb-sec-icono{border-radius:50%!important;}     .lb-area-CN .lb-tabla-wrap{border-color:#5A9B6F;}.lb-area-CN .lb-tabla-wrap th{background:#5A9B6F;} /* PLANTILLAS POR BLOQUE */ .lb-bloque-12 .lb-sec-titulo{font-size:18px;text-transform:uppercase;} .lb-bloque-12 .lb-texto{font-size:14.5px;text-transform:uppercase;} .lb-bloque-12 .lb-num{width:26px;height:26px;font-size:13px;border-radius:50%;text-transform:uppercase;} .lb-bloque-12 .lb-sec-icono{border-radius:50%;width:32px;height:32px;} .lb-bloque-12 .lb-celda{min-height:54px;font-size:15px;padding:12px 14px;border-radius:14px;text-transform:uppercase;} .lb-bloque-12 .lb-area{min-height:120px;border-radius:14px;} .lb-bloque-12 .lb-bloque{margin-bottom:20px;} .lb-bloque-12 .lb-tabla-wrap{border-radius:12px;} .lb-bloque-12 .lb-tabla-wrap th,.lb-bloque-12 .lb-tabla-wrap td{font-size:13px;padding:9px 10px;text-transform:uppercase;} .lb-bloque-12 .lb-sec-titulo em{text-transform:uppercase;} .lb-bloque-12 .lb-caja p,.lb-bloque-12 .lb-caja li{text-transform:uppercase;} .lb-bloque-34 .lb-sec-titulo{font-size:16px;} .lb-bloque-34 .lb-texto{font-size:12.5px;} .lb-bloque-34 .lb-num{width:20px;height:20px;font-size:11px;border-radius:6px;} .lb-bloque-34 .lb-celda{min-height:38px;font-size:12.5px;border-radius:8px;} .lb-bloque-34 .lb-area{min-height:80px;border-radius:8px;} .lb-bloque-34 .lb-bloque{margin-bottom:14px;} .lb-bloque-56 .lb-sec-titulo{font-size:15px;} .lb-bloque-56 .lb-texto{font-size:11.5px;} .lb-bloque-56 .lb-num{width:18px;height:18px;font-size:10px;border-radius:4px;} .lb-bloque-56 .lb-celda{min-height:30px;font-size:11px;padding:6px 9px;border-radius:4px;} .lb-bloque-56 .lb-area{min-height:56px;border-radius:4px;} .lb-bloque-56 .lb-bloque{margin-bottom:10px;} .lb-bloque-56 .lb-tabla-wrap{border-radius:4px;} .lb-bloque-56 .lb-tabla-wrap th,.lb-bloque-56 .lb-tabla-wrap td{font-size:10.5px;padding:5px 7px;}      /* ══ TONOS ══ */     .lb-tono-ludico .lb-pagina{background:linear-gradient(135deg,#FFF9F0,#FFF4E8);}     .lb-tono-ludico .lb-texto{font-size:13.5px!important;}     .lb-tono-ludico .lb-celda{border-radius:14px!important;}     .lb-tono-ludico .lb-sec-icono{border-radius:50%!important;}      .lb-tono-evaluacion .lb-pagina{background:white!important;}     .lb-tono-evaluacion .lb-pagina::before{display:none!important;}     .lb-tono-evaluacion .lb-celda{background:white!important;border:1px solid #ccc!important;}     .lb-tono-evaluacion .lb-tabla-wrap th{background:#444!important;}     .lb-tono-evaluacion .lb-num{background:#444!important;}     .lb-tono-evaluacion .lb-banda{background:#444!important;}      /* ══ PICTOGRAMAS ARASAAC ══ */     .lb-pictogramas-box{position:relative;z-index:1;margin:6px 0 10px 30px;}     .lb-pictogramas-fila{display:flex;flex-wrap:wrap;gap:8px;}     .lb-pic-item{position:relative;background:var(--blanco);border:1.5px solid var(--gris-claro,#ddd);border-radius:10px;padding:6px 7px 5px;text-align:center;width:72px;}     .lb-pic-item img{width:54px;height:54px;object-fit:contain;display:block;margin:0 auto 3px;}     .lb-pic-label{font-size:8.5px;color:#555;font-weight:600;text-transform:lowercase;}     .lb-pic-cambiar,.lb-pic-quitar{position:absolute;top:-7px;width:18px;height:18px;border-radius:50%;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}     .lb-pic-cambiar{right:16px;background:#5B7FA6;}     .lb-pic-quitar{right:-4px;background:#C0392B;}     .lb-tono-evaluacion .lb-pictogramas-box{display:none;}      /* ══ ÍCONOS SVG MATEMÁTICA ══ */     .lb-iconos-mate-fila{display:flex;gap:10px;align-items:center;margin:6px 0 10px 30px;flex-wrap:wrap;position:relative;z-index:1;}     .lb-icono-mate{display:inline-flex;width:30px;height:30px;}     .lb-icono-mate svg{width:100%;height:100%;}     .lb-tono-evaluacion .lb-iconos-mate-fila{filter:grayscale(1);opacity:.75;}      /* ══ MAPAS OPENSTREETMAP (Ciencias Sociales) ══ */     .lb-mapa-box{position:relative;z-index:1;margin-bottom:12px;}     .lb-mapa-titulo{font-size:11px;font-weight:700;color:#5B7FA6;margin-bottom:5px;}     .lb-mapa-img{width:100%;max-height:280px;object-fit:contain;border-radius:9px;border:1.5px solid var(--gris-claro,#ddd);background:#EEF2F6;display:block;}     .lb-mapa-atribucion{font-size:7.5px;color:#999;margin-top:2px;text-align:right;}         /* ══ FOTOS REALES WIKIMEDIA COMMONS ══ */     .lb-foto-real-wrapper{position:relative;z-index:1;margin:8px 0 12px 30px;max-width:320px;}     .lb-foto-real-box{background:var(--blanco);border:1.5px solid var(--gris-claro,#ddd);border-radius:10px;padding:8px;}     .lb-foto-real-box img{width:100%;max-height:200px;object-fit:cover;border-radius:7px;display:block;}     .lb-foto-controles{display:flex;gap:6px;margin-top:5px;}     .lb-foto-cambiar,.lb-foto-quitar{font-size:9.5px;font-weight:600;border:none;border-radius:14px;padding:3px 9px;cursor:pointer;}     .lb-foto-cambiar{background:#EAF2F8;color:#3B6E9E;}     .lb-foto-quitar{background:#FDE8E8;color:#C0392B;}     .lb-foto-atribucion{font-size:7.5px;color:#999;margin-top:4px;line-height:1.3;}      /* ══ CLIP-ART PROPIO (1ro/2do) ══ */     .lb-clipart-wrapper{position:relative;z-index:1;margin:8px 0 12px 30px;}     .lb-clipart-item{display:inline-flex;width:90px;height:90px;}     .lb-clipart-item svg{width:100%;height:100%;}     .lb-tono-evaluacion .lb-clipart-wrapper{filter:grayscale(1);opacity:.7;}      /* ══ FORMATOS DE HOJA RECORTABLE ══ */     .lb-hoja-recortable{position:relative;}     .lb-hoja-x2{display:grid;grid-template-columns:1fr 1fr;gap:0;position:relative;}     .lb-hoja-x2 .lb-pagina{min-height:140mm;font-size:0.78em;}     .lb-hoja-x2 .lb-tijera{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#C8973A;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;z-index:10;box-shadow:0 2px 6px rgba(0,0,0,.25);}     .lb-hoja-x2 .lb-pagina:first-child{border-right:2px dashed #C8973A;}     .lb-hoja-x4{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:0;}     .lb-hoja-x4 .lb-pagina{min-height:90mm;font-size:0.62em;}     .lb-hoja-x4 .lb-pagina:nth-child(odd){border-right:2px dashed #C8973A;}     .lb-hoja-x4 .lb-pagina:nth-child(-n+2){border-bottom:2px dashed #C8973A;}      ';
  // cssImpresion: las reglas de layout van FUERA de @media print para que html2canvas las vea
  // (html2canvas renderiza pantalla, no impresión — @media print era ignorado → páginas en blanco)
  var cssImpresion='html,body{margin:0;padding:0;background:white;}#libro-preview{padding:0!important;background:white!important;border-radius:0!important;margin-top:0!important;}.lb-topbar,.lb-btn-print{display:none!important;}.lb-pagina{width:210mm!important;min-height:297mm!important;box-shadow:none!important;border-radius:0!important;margin:0!important;padding:16mm 14mm 10mm 18mm!important;box-sizing:border-box!important;overflow:visible!important;border:none!important;}.lb-pic-cambiar,.lb-pic-quitar,.lb-foto-controles{display:none!important;}.lb-hoja-recortable{width:210mm;height:297mm;}.lb-hoja-x2{display:grid;grid-template-columns:1fr 1fr;}.lb-hoja-x2 .lb-pagina{width:105mm!important;height:297mm!important;min-height:297mm!important;padding:10mm 8mm 8mm 10mm!important;}.lb-hoja-x4{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;}.lb-hoja-x4 .lb-pagina{width:105mm!important;height:148.5mm!important;min-height:148.5mm!important;padding:8mm 6mm 6mm 8mm!important;}@page{size:A4;margin:0;}@media print{html,body{width:210mm;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.lb-pagina{page-break-after:always;}.lb-pagina:last-child{page-break-after:auto;}.lb-hoja-recortable{page-break-after:always;}.lb-hoja-x2 .lb-pagina,.lb-hoja-x4 .lb-pagina{page-break-after:auto!important;}}';
  var cssCaratula='.lb-caratula{padding:0!important;display:flex;flex-direction:column;min-height:297mm;}.lb-caratula-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 32px;text-align:center;}.lb-car-logo{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:30px;color:#2D3A35;margin-bottom:5px;}.lb-car-logo span{color:#C8973A;}.lb-car-tagline{font-size:8px;font-weight:700;color:#9B9486;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:44px;}.lb-car-icono{width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:38px;margin:0 auto 18px;}.lb-car-area{font-family:\'Nunito\',sans-serif;font-weight:900;font-size:22px;color:#2D3A35;margin-bottom:6px;}.lb-car-grado{font-size:13px;font-weight:700;margin-bottom:22px;}.lb-car-linea{width:54px;height:2.5px;background:#C8973A;border-radius:2px;margin:0 auto 26px;}.lb-car-recuadro{background:#F5F2EE;border-radius:12px;padding:20px 24px;width:100%;max-width:360px;margin:0 auto;}.lb-car-tipo{font-size:8px;font-weight:700;color:#8A7E6A;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;}.lb-car-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:9px;text-align:left;}.lb-car-item:last-child{margin-bottom:0;}.lb-car-num{width:20px;height:20px;border-radius:50%;color:white;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}.lb-car-titulo-item{font-size:12px;font-weight:600;color:#2D3A35;line-height:1.4;}.lb-car-footer{padding:10px 16px;font-size:9px;color:#9B9486;text-align:center;}.lb-car-franja{height:8px;width:100%;flex-shrink:0;}@media print{.lb-caratula{padding:0!important;min-height:297mm!important;}}';
  var nombreArchivoPdf=nombreArchivo.replace(/\.html$/,'.pdf');
  var doc='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+escHtml(tituloLabel)+'</title>'
    +'<style>'+cssLibro+'</style>'
    +'<style>'+cssImpresion+'</style>'
    +'<style>'+cssCaratula+'</style>'
    +'</head><body>'
    +_genHtmlRenderizado
    +'</body></html>';

  // Generar PDF real (en vez de descargar el HTML crudo) usando un iframe oculto
  // como lienzo de renderizado, y html2pdf.js para convertir ese contenido ya
  // pintado por el navegador en un PDF listo para imprimir.
  var btnDescargar=document.querySelector('[onclick="descargarCuadernillo()"]');
  var textoOriginalBtn=btnDescargar?btnDescargar.textContent:'';
  if(btnDescargar){btnDescargar.textContent='Generando PDF...';btnDescargar.disabled=true;}

  var iframeTmp=document.createElement('iframe');
  iframeTmp.style.cssText='position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
  document.body.appendChild(iframeTmp);
  iframeTmp.srcdoc=doc;

  iframeTmp.onload=function(){
    // Esperar un instante extra para que terminen de pintarse mapas/imágenes dentro del iframe
    setTimeout(function(){
      var contenidoIframe=iframeTmp.contentDocument.body;
      var opciones={
        margin:0,
        filename:nombreArchivoPdf,
        image:{type:'jpeg',quality:0.92},
        html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy'],before:'.lb-pagina'}
      };
      html2pdf().set(opciones).from(contenidoIframe).save().then(function(){
        document.body.removeChild(iframeTmp);
        if(btnDescargar){btnDescargar.textContent=textoOriginalBtn;btnDescargar.disabled=false;}
      }).catch(function(e){
        console.log('Error al generar el PDF:',e);
        alert('No se pudo generar el PDF. Probá de nuevo. Detalle: '+e.message);
        document.body.removeChild(iframeTmp);
        if(btnDescargar){btnDescargar.textContent=textoOriginalBtn;btnDescargar.disabled=false;}
      });
    },600);
  };
}
// ── GENERAR MATERIAL DESDE PLANIFICACIÓN ──
var MAP_AREA_GENERADOR={L:'Prácticas del Lenguaje',M:'Matemática',CS:'Ciencias Sociales',CN:'Ciencias Naturales',I:'Inglés',EA:'Ed. Artística',EF:'Ed. Física'};

function generarMaterialDesdePlanif(planifId){
  var p=_planifData.find(function(x){return x.id===planifId;});
  if(!p)return;
  var ac=SUBJECT_CODES[p.subject_id]||AREAS[0];
  var anSelect=MAP_AREA_GENERADOR[ac]||'';
  cerrarPlanificaciones();
  abrirGenerador();
  // Seleccionar tipo "ficha" por defecto
  var fichaBtn=document.querySelector('.tipo-btn[onclick*="ficha"]');
  if(fichaBtn)selTipo(fichaBtn,'ficha');
  // Completar área y tema con los datos de la planificación
  setTimeout(function(){
    var areaInput=document.getElementById('gen-area');
    var temaInput=document.getElementById('gen-tema');
    var detallesInput=document.getElementById('gen-detalles');
    if(areaInput)areaInput.value=anSelect;
    if(temaInput)temaInput.value=p.title||'';
    if(detallesInput&&p.content)detallesInput.value=p.content;
  },50);
}
// ── DICTADO POR VOZ (Web Speech API nativa) ──
var _recognitionDetalles=null;
var _dictandoDetalles=false;

function toggleDictadoDetalles(){
  var SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    alert('El dictado por voz no está disponible en este navegador. Probá con Chrome.');
    return;
  }
  var btn=document.getElementById('btn-voz-detalles');
  if(_dictandoDetalles){
    if(_recognitionDetalles)_recognitionDetalles.stop();
    return;
  }
  _recognitionDetalles=new SpeechRecognition();
  _recognitionDetalles.lang='es-AR';
  _recognitionDetalles.continuous=true;
  _recognitionDetalles.interimResults=false;

  var textarea=document.getElementById('gen-detalles');
  var textoBase=textarea.value;
  if(textoBase&&!textoBase.endsWith(' ')&&!textoBase.endsWith('\n'))textoBase+=' ';

  _recognitionDetalles.onstart=function(){
    _dictandoDetalles=true;
    btn.innerHTML='🔴 Escuchando...';
    btn.style.background='#FDE8E8';
    btn.style.borderColor='#C0392B';
    btn.style.color='#C0392B';
  };

  _recognitionDetalles.onresult=function(event){
    var transcript='';
    for(var i=0;i<event.results.length;i++){
      transcript+=event.results[i][0].transcript+' ';
    }
    textarea.value=textoBase+transcript.trim();
  };

  _recognitionDetalles.onerror=function(event){
    if(event.error==='not-allowed'){
      alert('No se pudo acceder al micrófono. Revisá los permisos del navegador.');
    }
    _dictandoDetalles=false;
    btn.innerHTML='🎤 Dictar';
    btn.style.background='var(--crema)';
    btn.style.borderColor='var(--gris-claro)';
    btn.style.color='var(--negro)';
  };

  _recognitionDetalles.onend=function(){
    _dictandoDetalles=false;
    btn.innerHTML='🎤 Dictar';
    btn.style.background='var(--crema)';
    btn.style.borderColor='var(--gris-claro)';
    btn.style.color='var(--negro)';
  };

  _recognitionDetalles.start();
}
// ── FOTOS REALES WIKIMEDIA COMMONS (Naturales/Sociales) ──
// API gratuita, sin clave. Requests anónimos vía CORS con origin=*.
var _fotosCache={};

async function buscarFotoCommons(query){
  if(_fotosCache[query]!==undefined)return _fotosCache[query];
  try{
    var url='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=4&gsrsearch='+encodeURIComponent(query+' filetype:bitmap')+'&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*';
    var res=await fetch(url);
    if(!res.ok){_fotosCache[query]=[];return [];}
    var data=await res.json();
    var pages=(data.query&&data.query.pages)||{};
    var resultados=Object.values(pages).map(function(p){
      var info=p.imageinfo&&p.imageinfo[0];
      if(!info)return null;
      var meta=info.extmetadata||{};
      var autor=(meta.Artist&&meta.Artist.value)?meta.Artist.value.replace(/<[^>]+>/g,''):'Wikimedia Commons';
      var licencia=(meta.LicenseShortName&&meta.LicenseShortName.value)||'CC';
      return {url:info.thumburl||info.url,urlOriginal:info.url,autor:autor,licencia:licencia,paginaUrl:info.descriptionurl||''};
    }).filter(Boolean);
    _fotosCache[query]=resultados;
    return resultados;
  }catch(e){
    _fotosCache[query]=[];
    return [];
  }
}

async function cargarFotosGeneradas(lista){
  for(var i=0;i<lista.length;i++){
    var item=lista[i];
    var box=document.getElementById(item.id);
    if(!box)continue;
    box.innerHTML='<div style="font-size:9px;color:var(--gris);">Buscando foto...</div>';
    var resultados=await buscarFotoCommons(item.query);
    renderFotoBox(item.id,resultados,0);
  }
}

function renderFotoBox(boxId,resultados,indiceActual){
  var box=document.getElementById(boxId);
  if(!box)return;
  if(!resultados.length){box.innerHTML='';return;}
  window['_fotoOpts_'+boxId]={resultados:resultados,actual:indiceActual};
  var foto=resultados[indiceActual];
  box.innerHTML='<div class="lb-foto-real-box">'
    +'<img src="'+foto.url+'" alt="Foto ilustrativa" loading="lazy" onerror="this.parentElement.style.display=\'none\'">'
    +'<div class="lb-foto-controles">'
    +(resultados.length>1?'<button type="button" class="lb-foto-cambiar" onclick="rotarFoto(\''+boxId+'\')" title="Probar otra foto">↺ otra</button>':'')
    +'<button type="button" class="lb-foto-quitar" onclick="quitarFoto(\''+boxId+'\')" title="Quitar esta foto">✕ quitar</button>'
    +'</div>'
    +'<div class="lb-foto-atribucion">'+escHtml(foto.autor)+' · '+escHtml(foto.licencia)+' · Wikimedia Commons</div>'
    +'</div>';
}

function rotarFoto(boxId){
  var st=window['_fotoOpts_'+boxId];
  if(!st)return;
  st.actual=(st.actual+1)%st.resultados.length;
  renderFotoBox(boxId,st.resultados,st.actual);
}

function quitarFoto(boxId){
  var box=document.getElementById(boxId);
  if(box)box.innerHTML='';
}


// ── CLIP-ART PROPIO SIMPLE (1ro/2do, "dibujá y escribí") ──
// Dibujos de línea simple en SVG, propios de HuellaED. Sin depender de internet.
var CLIPART_SVG={
  sol:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" fill="#FFE9A8" stroke="#C8973A" stroke-width="3"/><g stroke="#C8973A" stroke-width="3" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/><line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="29" y2="29"/><line x1="71" y1="71" x2="78" y2="78"/><line x1="22" y1="78" x2="29" y2="71"/><line x1="71" y1="29" x2="78" y2="22"/></g></svg>',
  casa:'<svg viewBox="0 0 100 100"><polygon points="50,15 90,48 80,48 80,85 20,85 20,48 10,48" fill="#FBE3DA" stroke="#C05A3A" stroke-width="3"/><rect x="42" y="58" width="16" height="27" fill="#fff" stroke="#C05A3A" stroke-width="3"/><rect x="27" y="58" width="14" height="14" fill="#fff" stroke="#C05A3A" stroke-width="3"/></svg>',
  arbol:'<svg viewBox="0 0 100 100"><rect x="44" y="60" width="12" height="30" fill="#D9B98C" stroke="#8a5a3a" stroke-width="3"/><circle cx="50" cy="40" r="30" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="3"/></svg>',
  perro:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="28" ry="22" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="3"/><circle cx="38" cy="48" r="5" fill="#3a342c"/><circle cx="62" cy="48" r="5" fill="#3a342c"/><ellipse cx="50" cy="65" rx="8" ry="5" fill="#3a342c"/><path d="M25,40 Q15,25 25,30 Q30,40 35,42" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="3"/><path d="M75,40 Q85,25 75,30 Q70,40 65,42" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="3"/></svg>',
  gato:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="26" ry="22" fill="#E8E4DC" stroke="#666" stroke-width="3"/><circle cx="40" cy="50" r="4" fill="#3a342c"/><circle cx="60" cy="50" r="4" fill="#3a342c"/><polygon points="30,35 40,42 25,45" fill="#E8E4DC" stroke="#666" stroke-width="3"/><polygon points="70,35 60,42 75,45" fill="#E8E4DC" stroke="#666" stroke-width="3"/><path d="M44,62 Q50,68 56,62" fill="none" stroke="#3a342c" stroke-width="2.5"/></svg>',
  pelota:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><path d="M50,15 Q35,50 50,85 M50,15 Q65,50 50,85 M16,50 L84,50" fill="none" stroke="#3B6E9E" stroke-width="2.5"/></svg>',
  manzana:'<svg viewBox="0 0 100 100"><path d="M50,30 Q25,30 25,55 Q25,80 50,85 Q75,80 75,55 Q75,30 50,30 Z" fill="#FBD5D0" stroke="#C0392B" stroke-width="3"/><path d="M50,30 Q48,20 55,15" fill="none" stroke="#5A9B6F" stroke-width="3" stroke-linecap="round"/><ellipse cx="58" cy="20" rx="8" ry="4" fill="#D4EAE4" stroke="#5A9B6F" stroke-width="2" transform="rotate(-20 58 20)"/></svg>',
  flor:'<svg viewBox="0 0 100 100"><g fill="#F5D6E8" stroke="#C05A3A" stroke-width="2.5"><circle cx="50" cy="30" r="14"/><circle cx="50" cy="70" r="14"/><circle cx="30" cy="50" r="14"/><circle cx="70" cy="50" r="14"/></g><circle cx="50" cy="50" r="13" fill="#FFE9A8" stroke="#C8973A" stroke-width="2.5"/><rect x="47" y="62" width="6" height="25" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="2"/></svg>',
  pajaro:'<svg viewBox="0 0 100 100"><ellipse cx="48" cy="55" rx="22" ry="16" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><circle cx="68" cy="45" r="10" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><circle cx="71" cy="43" r="2" fill="#3a342c"/><polygon points="78,45 88,42 78,49" fill="#C8973A"/><path d="M30,55 Q15,50 25,40" fill="none" stroke="#3B6E9E" stroke-width="3"/></svg>',
  pez:'<svg viewBox="0 0 100 100"><ellipse cx="45" cy="50" rx="30" ry="18" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><polygon points="75,50 95,35 95,65" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><circle cx="30" cy="45" r="3" fill="#3a342c"/></svg>',
  estrella:'<svg viewBox="0 0 100 100"><polygon points="50,10 61,38 92,38 67,57 76,88 50,70 24,88 33,57 8,38 39,38" fill="#FFE9A8" stroke="#C8973A" stroke-width="3"/></svg>',
  globo:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="40" rx="24" ry="28" fill="#F5D6E8" stroke="#C05A3A" stroke-width="3"/><polygon points="44,65 56,65 50,75" fill="#C05A3A"/><line x1="50" y1="75" x2="50" y2="92" stroke="#8a5a3a" stroke-width="2"/></svg>',
  nube:'<svg viewBox="0 0 100 100"><path d="M25,60 Q15,60 15,48 Q15,38 27,38 Q30,25 45,25 Q60,25 63,38 Q78,38 78,52 Q78,60 68,60 Z" fill="#fff" stroke="#5B7FA6" stroke-width="3"/></svg>',
  libro:'<svg viewBox="0 0 100 100"><path d="M50,25 Q30,15 12,22 L12,75 Q30,68 50,78 Z" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="3"/><path d="M50,25 Q70,15 88,22 L88,75 Q70,68 50,78 Z" fill="#F7EDDB" stroke="#C8973A" stroke-width="3"/></svg>',
  lapiz:'<svg viewBox="0 0 100 100"><polygon points="20,80 15,95 30,90" fill="#3a342c"/><polygon points="20,80 30,90 75,45 65,35" fill="#FFE9A8" stroke="#C8973A" stroke-width="2.5"/><polygon points="65,35 75,45 88,32 78,22" fill="#C0392B"/></svg>',
  vaca:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="58" rx="30" ry="22" fill="#fff" stroke="#3a342c" stroke-width="3"/><circle cx="35" cy="50" r="6" fill="#3a342c"/><circle cx="65" cy="65" r="7" fill="#3a342c"/><circle cx="40" cy="42" r="4" fill="#3a342c"/><circle cx="60" cy="42" r="4" fill="#3a342c"/><polygon points="32,38 38,28 44,40" fill="#fff" stroke="#3a342c" stroke-width="2.5"/><polygon points="56,40 62,28 68,38" fill="#fff" stroke="#3a342c" stroke-width="2.5"/></svg>',
  caballo:'<svg viewBox="0 0 100 100"><ellipse cx="48" cy="62" rx="28" ry="18" fill="#D9B98C" stroke="#8a5a3a" stroke-width="3"/><path d="M68,55 Q85,40 75,25 Q90,30 88,48 Q85,60 70,62" fill="#D9B98C" stroke="#8a5a3a" stroke-width="3"/><circle cx="80" cy="35" r="3" fill="#3a342c"/><path d="M70,30 Q78,20 85,28" fill="none" stroke="#8a5a3a" stroke-width="3"/></svg>',
  pollo:'<svg viewBox="0 0 100 100"><ellipse cx="48" cy="62" rx="26" ry="22" fill="#FFE9A8" stroke="#C8973A" stroke-width="3"/><circle cx="68" cy="42" r="14" fill="#FFE9A8" stroke="#C8973A" stroke-width="3"/><circle cx="73" cy="38" r="2.5" fill="#3a342c"/><polygon points="80,42 90,40 80,46" fill="#C05A3A"/><polygon points="60,28 64,18 68,28" fill="#C05A3A"/></svg>',
  rana:'<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="28" ry="20" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="3"/><circle cx="35" cy="38" r="10" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="3"/><circle cx="65" cy="38" r="10" fill="#D4EAE4" stroke="#2D5F4F" stroke-width="3"/><circle cx="35" cy="36" r="3" fill="#3a342c"/><circle cx="65" cy="36" r="3" fill="#3a342c"/><path d="M38,65 Q50,72 62,65" fill="none" stroke="#2D5F4F" stroke-width="2.5"/></svg>',
  mariposa:'<svg viewBox="0 0 100 100"><line x1="50" y1="20" x2="50" y2="80" stroke="#3a342c" stroke-width="3"/><path d="M50,30 Q20,15 18,40 Q20,55 50,45" fill="#F5D6E8" stroke="#C05A3A" stroke-width="2.5"/><path d="M50,30 Q80,15 82,40 Q80,55 50,45" fill="#F5D6E8" stroke="#C05A3A" stroke-width="2.5"/><path d="M50,50 Q25,45 25,65 Q30,75 50,65" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="2.5"/><path d="M50,50 Q75,45 75,65 Q70,75 50,65" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="2.5"/></svg>',
  auto:'<svg viewBox="0 0 100 100"><rect x="15" y="50" width="70" height="22" rx="5" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><path d="M28,50 L38,33 L62,33 L72,50 Z" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><circle cx="32" cy="74" r="9" fill="#3a342c"/><circle cx="68" cy="74" r="9" fill="#3a342c"/></svg>',
  bicicleta:'<svg viewBox="0 0 100 100"><circle cx="25" cy="65" r="18" fill="none" stroke="#3a342c" stroke-width="3"/><circle cx="75" cy="65" r="18" fill="none" stroke="#3a342c" stroke-width="3"/><polyline points="25,65 45,40 75,65" fill="none" stroke="#3B6E9E" stroke-width="3"/><polyline points="45,40 58,40" fill="none" stroke="#3B6E9E" stroke-width="3"/><line x1="45" y1="40" x2="35" y2="65" stroke="#3B6E9E" stroke-width="3"/></svg>',
  avion:'<svg viewBox="0 0 100 100"><polygon points="15,55 90,50 90,58 15,60" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><polygon points="55,40 70,50 55,52" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="2.5"/><polygon points="55,58 70,50 55,68" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="2.5"/><polygon points="15,55 8,48 15,60" fill="#3B6E9E"/></svg>',
  barco:'<svg viewBox="0 0 100 100"><polygon points="15,65 85,65 75,80 25,80" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="65" stroke="#8a5a3a" stroke-width="3"/><polygon points="50,22 50,50 78,50" fill="#fff" stroke="#3B6E9E" stroke-width="2.5"/></svg>',
  pan:'<svg viewBox="0 0 100 100"><path d="M20,60 Q15,35 50,32 Q85,35 80,60 Q80,72 50,72 Q20,72 20,60 Z" fill="#F0DCA8" stroke="#C8973A" stroke-width="3"/><path d="M35,45 Q40,55 35,60 M50,42 Q55,52 50,58 M65,45 Q70,55 65,60" fill="none" stroke="#C8973A" stroke-width="2"/></svg>',
  torta:'<svg viewBox="0 0 100 100"><rect x="20" y="55" width="60" height="28" fill="#FBE3DA" stroke="#C05A3A" stroke-width="3"/><path d="M20,55 Q30,45 40,55 Q50,45 60,55 Q70,45 80,55" fill="#fff" stroke="#C05A3A" stroke-width="3"/><line x1="50" y1="40" x2="50" y2="28" stroke="#C8973A" stroke-width="3"/><circle cx="50" cy="24" r="4" fill="#C0392B"/></svg>',
  leche:'<svg viewBox="0 0 100 100"><polygon points="35,15 65,15 70,30 70,85 30,85 30,30" fill="#fff" stroke="#3B6E9E" stroke-width="3"/><polygon points="35,15 50,5 65,15" fill="#fff" stroke="#3B6E9E" stroke-width="3"/></svg>',
  reloj_pared:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#fff" stroke="#C05A3A" stroke-width="4"/><circle cx="50" cy="50" r="3" fill="#3a342c"/><line x1="50" y1="50" x2="50" y2="25" stroke="#3a342c" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="50" x2="68" y2="55" stroke="#3a342c" stroke-width="3" stroke-linecap="round"/></svg>',
  mochila:'<svg viewBox="0 0 100 100"><rect x="25" y="35" width="50" height="55" rx="12" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="3"/><rect x="35" y="20" width="30" height="20" rx="8" fill="none" stroke="#3B6E9E" stroke-width="3"/><rect x="38" y="55" width="24" height="18" rx="4" fill="#fff" stroke="#3B6E9E" stroke-width="2.5"/></svg>',
  cara_nino:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="3"/><circle cx="38" cy="42" r="4" fill="#3a342c"/><circle cx="62" cy="42" r="4" fill="#3a342c"/><path d="M38,62 Q50,72 62,62" fill="none" stroke="#3a342c" stroke-width="3"/><path d="M20,35 Q30,15 50,18 Q70,15 80,35" fill="#8a5a3a"/></svg>',
  familia:'<svg viewBox="0 0 100 100"><circle cx="28" cy="35" r="13" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="2.5"/><rect x="16" y="50" width="24" height="35" rx="6" fill="#D6E5F3" stroke="#3B6E9E" stroke-width="2.5"/><circle cx="62" cy="32" r="14" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="2.5"/><rect x="49" y="48" width="26" height="38" rx="6" fill="#FBE3DA" stroke="#C05A3A" stroke-width="2.5"/><circle cx="85" cy="48" r="9" fill="#F0DCC0" stroke="#8a5a3a" stroke-width="2.5"/><rect x="77" y="58" width="16" height="25" rx="5" fill="#F7EDDB" stroke="#C8973A" stroke-width="2.5"/></svg>',
  corazon:'<svg viewBox="0 0 100 100"><path d="M50,85 C20,60 10,40 25,25 C35,15 48,20 50,32 C52,20 65,15 75,25 C90,40 80,60 50,85 Z" fill="#FBD5D0" stroke="#C0392B" stroke-width="3"/></svg>',
  arcoiris:'<svg viewBox="0 0 100 100"><path d="M10,80 A40,40 0 0,1 90,80" fill="none" stroke="#C0392B" stroke-width="6"/><path d="M18,80 A32,32 0 0,1 82,80" fill="none" stroke="#C8973A" stroke-width="6"/><path d="M26,80 A24,24 0 0,1 74,80" fill="none" stroke="#5A9B6F" stroke-width="6"/><path d="M34,80 A16,16 0 0,1 66,80" fill="none" stroke="#3B6E9E" stroke-width="6"/></svg>'
};

function renderClipart(nombre,colorClase){
  var svg=CLIPART_SVG[(nombre||'').toLowerCase().trim()];
  if(!svg)return '';
  return '<span class="lb-clipart-item '+(colorClase||'')+'">'+svg+'</span>';
}

// ── ÍCONOS SVG PROPIOS PARA MATEMÁTICA (sin depender de imágenes externas) ──
var ICONOS_MATE_SVG={
  circulo:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  cuadrado:'<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  triangulo:'<svg viewBox="0 0 40 40"><polygon points="20,6 34,34 6,34" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  rectangulo:'<svg viewBox="0 0 40 40"><rect x="3" y="11" width="34" height="18" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  pentagono:'<svg viewBox="0 0 40 40"><polygon points="20,4 35,16 29,35 11,35 5,16" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  hexagono:'<svg viewBox="0 0 40 40"><polygon points="20,4 33,11 33,29 20,36 7,29 7,11" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  rombo:'<svg viewBox="0 0 40 40"><polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  suma:'<svg viewBox="0 0 40 40"><line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  resta:'<svg viewBox="0 0 40 40"><line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  multiplicacion:'<svg viewBox="0 0 40 40"><line x1="11" y1="11" x2="29" y2="29" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="29" y1="11" x2="11" y2="29" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  division:'<svg viewBox="0 0 40 40"><circle cx="20" cy="11" r="2.5" fill="currentColor"/><line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="29" r="2.5" fill="currentColor"/></svg>',
  igual:'<svg viewBox="0 0 40 40"><line x1="8" y1="15" x2="32" y2="15" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="8" y1="25" x2="32" y2="25" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  reloj:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="3"/><line x1="20" y1="20" x2="20" y2="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="20" x2="27" y2="22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  balanza:'<svg viewBox="0 0 40 40"><line x1="20" y1="6" x2="20" y2="30" stroke="currentColor" stroke-width="3"/><line x1="8" y1="14" x2="32" y2="14" stroke="currentColor" stroke-width="3"/><circle cx="8" cy="22" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="32" cy="22" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="20" y1="30" x2="14" y2="34" stroke="currentColor" stroke-width="3"/><line x1="20" y1="30" x2="26" y2="34" stroke="currentColor" stroke-width="3"/></svg>',
  regla:'<svg viewBox="0 0 40 40"><rect x="4" y="14" width="32" height="12" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="10" y1="14" x2="10" y2="19" stroke="currentColor" stroke-width="2"/><line x1="16" y1="14" x2="16" y2="22" stroke="currentColor" stroke-width="2"/><line x1="22" y1="14" x2="22" y2="19" stroke="currentColor" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="22" stroke="currentColor" stroke-width="2"/></svg>',
  monedas:'<svg viewBox="0 0 40 40"><circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="25" cy="25" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="15" y="19" font-size="11" text-anchor="middle" fill="currentColor">$</text></svg>'
};
var ICONOS_MATE_GRUPOS_MAX=10;

function generarIconoGrupo(cantidad){
  // Representa una cantidad pequeña (1-10) como puntos agrupados, para apoyo de conteo
  cantidad=Math.max(1,Math.min(ICONOS_MATE_GRUPOS_MAX,cantidad));
  var puntos=[];
  var cols=cantidad<=5?cantidad:Math.ceil(cantidad/2);
  for(var i=0;i<cantidad;i++){
    var col=i%cols,fila=Math.floor(i/cols);
    var cx=8+col*9,cy=8+fila*14;
    puntos.push('<circle cx="'+cx+'" cy="'+cy+'" r="3.5" fill="currentColor"/>');
  }
  var vbW=8+cols*9,vbH=cantidad<=cols?20:34;
  return '<svg viewBox="0 0 '+vbW+' '+vbH+'">'+puntos.join('')+'</svg>';
}

function renderIconoMate(nombre,colorClase){
  var svg='';
  var matchGrupo=nombre.match(/^grupo[_-]?(\d+)$/i);
  if(matchGrupo){
    svg=generarIconoGrupo(parseInt(matchGrupo[1]));
  }else if(ICONOS_MATE_SVG[nombre.toLowerCase()]){
    svg=ICONOS_MATE_SVG[nombre.toLowerCase()];
  }else{
    return '';
  }
  return '<span class="lb-icono-mate '+(colorClase||'')+'">'+svg+'</span>';
}


// ── CATÁLOGO FIJO DE MAPAS (Ciencias Sociales) ──
// Mapas mudos oficiales IGN, guardados como imágenes fijas en el repo (sin servicios externos ni mapas interactivos).
var CATALOGO_MAPAS=[
  {id:'argentina',nombre:'Argentina (mapa mudo)',emoji:'🇦🇷',archivo:'mapas/mapa_argentina.jpg'},
  {id:'america',nombre:'Continente americano (mapa mudo)',emoji:'🌎',archivo:'mapas/mapa_america.jpg'},
  {id:'planisferio',nombre:'Planisferio (mapa mudo)',emoji:'🌍',archivo:'mapas/mapa_planisferio.jpg'}
];

var _mapaSeleccionActual=null; // {id,nombre,archivo}

function toggleBloqueMapas(){
  var area=document.getElementById('gen-area').value;
  var bloque=document.getElementById('gen-mapas-row');
  if(!bloque)return;
  bloque.style.display=(area==='Ciencias Sociales')?'block':'none';
  if(bloque.style.display==='block'&&!document.getElementById('gen-mapa-galeria').dataset.armada){
    armarGaleriaMapas();
  }
}

function armarGaleriaMapas(){
  var galeria=document.getElementById('gen-mapa-galeria');
  galeria.dataset.armada='1';
  galeria.innerHTML='<div id="gen-mapa-grid"></div>';
  renderGridMapas();
}

function renderGridMapas(){
  var grid=document.getElementById('gen-mapa-grid');
  if(!grid)return;
  grid.innerHTML=CATALOGO_MAPAS.map(function(m){
    return '<div class="lb-mapa-card lb-mapa-card-fija" onclick="elegirMapaCatalogo(\''+m.id+'\')">'+m.emoji+'<div>'+escHtml(m.nombre.replace(' (mapa mudo)',''))+'</div></div>';
  }).join('');
}

function elegirMapaCatalogo(id){
  var mapa=CATALOGO_MAPAS.find(function(m){return m.id===id;});
  if(!mapa)return;
  _mapaSeleccionActual=mapa;
  mostrarPreviewMapaCatalogo();
}

function mostrarPreviewMapaCatalogo(){
  if(!_mapaSeleccionActual)return;
  var resultadoDiv=document.getElementById('gen-mapa-resultado');
  resultadoDiv.innerHTML=''
    +'<div style="font-size:11px;font-weight:700;color:var(--verde);margin-bottom:6px;">📍 '+escHtml(_mapaSeleccionActual.nombre)+'</div>'
    +'<img src="'+_mapaSeleccionActual.archivo+'" style="width:100%;max-height:220px;object-fit:contain;border-radius:9px;border:1.5px solid var(--gris-claro);background:#EEF2F6;display:block;">'
    +'<div style="font-size:8.5px;color:#999;margin-top:3px;">Mapa mudo oficial — Instituto Geográfico Nacional</div>'
    +'<button type="button" onclick="quitarMapaSeleccionado()" style="margin-top:6px;background:none;border:none;color:#C0392B;font-size:11px;cursor:pointer;text-decoration:underline;">Quitar mapa elegido</button>';
}

function quitarMapaSeleccionado(){
  _mapaSeleccionActual=null;
  document.getElementById('gen-mapa-resultado').innerHTML='';
}

function construirHtmlMapaParaMaterial(){
  if(!_mapaSeleccionActual)return '';
  return '<div class="lb-mapa-box">'
    +'<div class="lb-mapa-titulo">🗺️ '+escHtml(_mapaSeleccionActual.nombre)+'</div>'
    +'<img src="'+_mapaSeleccionActual.archivo+'" class="lb-mapa-img" alt="'+escHtml(_mapaSeleccionActual.nombre)+'">'
    +'<div class="lb-mapa-atribucion">Mapa mudo oficial — Instituto Geográfico Nacional</div>'
    +'</div>';
}


// ── PICTOGRAMAS ARASAAC ──
// API gratuita, sin clave. Cada búsqueda es una acción puntual disparada por la docente al generar material.
var _picCache={};

async function buscarPictogramaArasaac(palabra){
  if(_picCache[palabra]!==undefined)return _picCache[palabra];
  try{
    var res=await fetch('https://api.arasaac.org/api/pictograms/es/search/'+encodeURIComponent(palabra));
    if(!res.ok){_picCache[palabra]=[];return [];}
    var data=await res.json();
    var resultados=(data||[]).slice(0,4).map(function(p){return p._id;});
    _picCache[palabra]=resultados;
    return resultados;
  }catch(e){
    _picCache[palabra]=[];
    return [];
  }
}

async function cargarPictogramasGenerados(lista){
  for(var i=0;i<lista.length;i++){
    var item=lista[i];
    var box=document.getElementById(item.id);
    if(!box)continue;
    box.innerHTML='<div style="font-size:9px;color:var(--gris);">Buscando pictogramas...</div>';
    var todasLasOpciones=[];
    for(var j=0;j<item.palabras.length;j++){
      var ids=await buscarPictogramaArasaac(item.palabras[j]);
      if(ids.length)todasLasOpciones.push({palabra:item.palabras[j],ids:ids,actual:0});
    }
    renderPictogramasBox(item.id,todasLasOpciones);
  }
}

function renderPictogramasBox(boxId,opciones){
  var box=document.getElementById(boxId);
  if(!box)return;
  if(!opciones.length){box.innerHTML='';return;}
  window['_picOpts_'+boxId]=opciones;
  var html='<div class="lb-pictogramas-fila">';
  opciones.forEach(function(op,oi){
    var picId=op.ids[op.actual];
    html+='<div class="lb-pic-item">'
      +'<img src="https://static.arasaac.org/pictograms/'+picId+'/'+picId+'_300.png" alt="'+op.palabra+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'">'
      +'<div class="lb-pic-label">'+op.palabra+'</div>'
      +(op.ids.length>1?'<button type="button" class="lb-pic-cambiar" onclick="rotarPictograma(\''+boxId+'\','+oi+')" title="Probar otro pictograma">↺</button>':'')
      +'<button type="button" class="lb-pic-quitar" onclick="quitarPictograma(\''+boxId+'\','+oi+')" title="Quitar este pictograma">✕</button>'
      +'</div>';
  });
  html+='</div>';
  box.innerHTML=html;
}

function rotarPictograma(boxId,oi){
  var opciones=window['_picOpts_'+boxId];
  if(!opciones||!opciones[oi])return;
  opciones[oi].actual=(opciones[oi].actual+1)%opciones[oi].ids.length;
  renderPictogramasBox(boxId,opciones);
}

function quitarPictograma(boxId,oi){
  var opciones=window['_picOpts_'+boxId];
  if(!opciones)return;
  opciones.splice(oi,1);
  renderPictogramasBox(boxId,opciones);
}

// Rellenar todos los íconos propios (Registrar y Generar) al cargar la página
