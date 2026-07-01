// evidencia.js -- Uploads de fotos/audio/documentos + análisis IA
// Extraído de index.html -- Sesión 6 de modularización
// Depende de: core.js, registro.js, perfil-alumno.js
// Depende también de utilidades compartidas que quedan en index.html:
// getApiKey(), blobToBase64(), _sget()/_sset()/_sdel()
const CARPETAS_ALUMNOS = {
  'Aguirre_Ziomara': '1UJIdfDIGQ89oHMKuYteEQwAErz_HhoGe',
  'Barrera_Felipe': '1vszUiGUKLuDdrpEcZMWSEw0NwcrHMioH',
  'Barrera_Joaquin': '1zdTw8ARpYXCc-TdGBtrRJrYoVNYsfgl7',
  'Bravo_Alvaro': '1Ixg69VqCM95EjbsuGdoHpeDvXGJtRBb-',
  'Carbonel_Tiziano': '1lIN6H4FyZKSmzoW8DGnaHQe5OeeBY5Fm',
  'Cuello_Thomas': '1esR1SeoLuGmRtYgPZRWn7xfGcXBn4m3k',
  'Diaz_Monserrat': '1SEH4241vv0vuHiHFwJAsFA3Z_Dp42JoC',
  'Espindola_Sofia': '1BOYgi0FsCXoW2E8c3_x5spguJQ_O-FSm',
  'Gamon_Ciro': '1ociwAjrdclVQHaEsfmiIB6yilIgB-K9p',
  'Garcia_Milton': '1T8bC7hXP6GsN4bPHrYRQ0YTU_gpr53Uw',
  'Godoy_Katia': '1Iiz0-Zy61hZDGdbmFqPV7ZbK1D-ta0Le',
  'Monteros_Maximo': '1pAR6bkAa8s6Qcr47rGbw4kyW8ldUXkv4',
  'Nievas_Nicolas': '1l3tpF-fEfJT83wI2lFxQlItt7bj8-A3g',
  'Santa_Cruz_Alma': '1Hgcr2ThNawSFJ4zp5FSyVnMtsfzkgRRt',
  'Sosa_Munoz_Benjamin': '1Z4zBZdDi1k0DPHX8zWDkqZp480POTPLh',
  'Tabares_Andres': '1dVSKBOTyGuAvn3hMb1N5WVgEd8-GT8Ru',
  'Tablada_Santino': '1EqgWdD3WeT9H8YCLOmaKEPbyOudB5rtI',
  'Tagliabue_Delfina': '1E7wuiDYInB0_R8UXswVRnyVWPnGuYaOJ',
  'Villalba_Benjamin': '1FvEFURvb15x1QN1weDUmZHiF10n3rbsO'
};
async function analizarConGemini() {
  var apiKey = getApiKey();
  if (!apiKey) {
    document.getElementById('modal-gemini-config').style.display = 'block';
    return;
  }
  if (!ab) { alert('No hay audio grabado'); return; }

  var alumno = document.getElementById('grab-alumno').value || 'Alumno';
  var alumnoNombre = alumno.replace(/_/g, ' ');
  var fecha = new Date().toLocaleDateString('es-AR');
  var tituloTexto = document.getElementById('grab-titulo-texto') ? document.getElementById('grab-titulo-texto').value : '';

  document.getElementById('gemini-loading').style.display = 'block';
  document.getElementById('gemini-loading').textContent = '⏳ Analizando audio con Gemini...';
  document.getElementById('gemini-resultado').style.display = 'none';
  document.getElementById('gemini-alumno-label').textContent = alumnoNombre;

  try {
    const base64Audio = await blobToBase64(ab);
    const base64Data = base64Audio.split(',')[1];

    const promptPedagogico = `Sos un especialista en evaluación de lectura oral para nivel primario.
Analizá este audio de lectura de un alumno de ${window.__teacherGrade||'6to año'} de primaria.${tituloTexto ? ' El texto leído es: "' + tituloTexto + '".' : ''}

Respondé en este formato exacto:

FLUIDEZ: [Fluida / Con pausas leves / Con pausas frecuentes / Lenta / Muy lenta]

ERRORES:
- Omisiones: [palabras omitidas o "ninguna"]
- Sustituciones: [palabras cambiadas o "ninguna"]
- Repeticiones: [palabras repetidas o "ninguna"]
- Autocorrecciones: [sí / no]

ENTONACIÓN: [Adecuada / Monótona / Inadecuada]
RITMO: [Adecuado / Apresurado / Lento]
NIVEL LECTOR: [Avanzado / Esperado / En proceso / Con dificultades]

OBSERVACIÓN PEDAGÓGICA: [2-3 oraciones concretas para el docente]

Si el audio es muy corto o hay ruido ambiental, indicalo brevemente.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: promptPedagogico },
            { inline_data: { mime_type: 'audio/webm', data: base64Data } }
          ]}]
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const analisis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

    // Mostrar en pantalla
    document.getElementById('gemini-loading').style.display = 'none';
    document.getElementById('gemini-analisis-texto').innerHTML = 
      analisis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    document.getElementById('gemini-resultado').style.display = 'block';

    // Guardar en Supabase directo al perfil del alumno
    document.getElementById('gemini-loading').style.display = 'block';
    document.getElementById('gemini-loading').textContent = '💾 Guardando en el perfil del alumno...';
    if (window.__sb) {
      try {
        const user = (await window.__sb.auth.getUser()).data.user;
        if (user && window.__students) {
          const st = window.__students.find(function(s) {
            var key = s.full_name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,\s*/g,'_').replace(/\s+/g,'_').replace(/[^a-zA-Z_]/g,'');
            return key === alumno;
          });
          if (st) {
            var textoObs = '[📖 Lectura' + (tituloTexto ? ': ' + tituloTexto : '') + ' · ' + fecha + ']\n' + analisis;
            await window.__sb.from('notas_rapidas').insert({student_id: st.id, teacher_id: user.id, content: textoObs});
            document.getElementById('gemini-loading').textContent = '✅ Análisis guardado en el perfil de ' + alumnoNombre;
          }
        }
      } catch(e) { console.error('Error guardando en Supabase:', e); }
    }
    var resultadoDrive = await guardarAnalisisEnDrive(alumno, alumnoNombre, fecha, tituloTexto, analisis);
    document.getElementById('gemini-loading').style.display = 'block';
    if (resultadoDrive && resultadoDrive.ok) {
      document.getElementById('gemini-loading').textContent = '✅ Guardado en el perfil y en el Drive de ' + alumnoNombre;
    } else {
      document.getElementById('gemini-loading').textContent = '✅ Guardado en el perfil de ' + alumnoNombre;
    }
    setTimeout(() => { document.getElementById('gemini-loading').style.display = 'none'; }, 4000);

  } catch (error) {
    document.getElementById('gemini-loading').style.display = 'none';
    var msg = error.message || 'Error desconocido';
    if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
      _sdel('huellaed_gemini_key');
      alert('API Key inválida. Volvé a ingresarla.');
      document.getElementById('modal-gemini-config').style.display = 'block';
    } else {
      document.getElementById('gemini-analisis-texto').textContent = 'Error: ' + msg;
      document.getElementById('gemini-resultado').style.display = 'block';
    }
  }
}
async function guardarAnalisisEnDrive(alumnoKey, alumnoNombre, fecha, tituloTexto, analisis) {
  // URL del Google Apps Script — reemplazar con la URL real después de crear el script
  // Guía en Drive: "HuellaED — Google Apps Script · Guía de configuración"
  var APPS_SCRIPT_URL = _sget('huellaed_script_url') || 'https://script.google.com/macros/s/AKfycbyjX6jf5hz3fjQp8xjAATnpe_rC-JWctyPZdhH5hJWolQQFUTBWudb_CEvV74PvUZx8bw/exec';
  if (!APPS_SCRIPT_URL) {
    // Si no hay URL configurada, guardar local como pendiente
    var pendientes = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
    pendientes.unshift({
      alumno: alumnoNombre, alumnoKey: alumnoKey,
      fecha: fecha, titulo: tituloTexto || 'Sin título',
      analisis: analisis, guardado: false, timestamp: Date.now()
    });
    _sset('huellaed_analisis_pendientes', JSON.stringify(pendientes));
    return { ok: false, error: 'Sin URL de script configurada' };
  }
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        tipo: 'lectura',
        alumnoKey: alumnoKey,
        alumnoNombre: alumnoNombre,
        fecha: fecha,
        tituloTexto: tituloTexto || 'Sin título',
        analisis: analisis
      })
    });
    const data = await response.json();
    return data;
  } catch(err) {
    // Si falla, guardar local
    var pendientes = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
    pendientes.unshift({
      alumno: alumnoNombre, alumnoKey: alumnoKey,
      fecha: fecha, titulo: tituloTexto || 'Sin título',
      analisis: analisis, guardado: false, timestamp: Date.now()
    });
    _sset('huellaed_analisis_pendientes', JSON.stringify(pendientes));
    return { ok: false, error: err.toString() };
  }
}
function checkAnalisisPendientes() {
  var pend = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
  var noGuardados = pend.filter(a => !a.guardado);
  var btn = document.getElementById('btn-sync-analisis');
  if (btn) btn.style.display = noGuardados.length > 0 ? 'flex' : 'none';
  if (btn && noGuardados.length > 0) btn.textContent = '🤖 ' + noGuardados.length + ' análisis pendiente' + (noGuardados.length > 1 ? 's' : '');
}

function abrirSyncAnalisis() {
  var pend = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
  var lista = document.getElementById('sync-analisis-lista');
  if (pend.length === 0) {
    lista.innerHTML = '<div style="text-align:center;color:var(--gris);padding:20px;">No hay análisis pendientes.</div>';
  } else {
    lista.innerHTML = pend.map((a,i) => `
      <div style="background:${a.guardado?'var(--verde-bg)':'#EEF4FF'};border-radius:9px;padding:10px 12px;margin-bottom:7px;font-size:12px;">
        <div style="font-weight:600;color:var(--negro);">${a.alumno} · ${a.fecha}</div>
        <div style="color:var(--gris);margin:2px 0;">📖 ${a.titulo}</div>
        <div style="color:${a.guardado?'var(--verde)':'#1a73e8'};font-size:11px;">${a.guardado?'✅ Guardado en Drive':'⏳ Pendiente de guardar'}</div>
      </div>`).join('');
  }
  document.getElementById('modal-sync-analisis').style.display = 'block';
}

function enviarAnalisisAClaude() {
  var pend = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
  var noGuardados = pend.filter(a => !a.guardado);
  if (noGuardados.length === 0) { alert('No hay análisis pendientes.'); return; }
  
  var texto = 'Tengo los siguientes análisis de lectura de Gemini para guardar en los perfiles del Drive:\n\n';
  noGuardados.forEach((a, i) => {
    texto += `--- ANÁLISIS ${i+1} ---\nAlumno: ${a.alumno}\nFecha: ${a.fecha}\nTexto: ${a.titulo}\n\n${a.analisis}\n\n`;
  });
  texto += 'Por favor guardá cada uno en la carpeta del alumno correspondiente en el Drive como documento de Google.';
  
  navigator.clipboard.writeText(texto).then(() => {
    alert('✅ Texto copiado. Pegalo en el chat de Claude para que lo guarde en el Drive.');
    // Marcar como guardados
    var todos = JSON.parse(_sget('huellaed_analisis_pendientes') || '[]');
    todos = todos.map(a => ({...a, guardado: true}));
    _sset('huellaed_analisis_pendientes', JSON.stringify(todos));
    checkAnalisisPendientes();
    document.getElementById('modal-sync-analisis').style.display = 'none';
  });
}
function cargarFotoTexto(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  grabFotoTextoURL=URL.createObjectURL(file);
  document.getElementById('grab-foto-img').src=grabFotoTextoURL;
  document.getElementById('grab-foto-preview').style.display='block';
  // Limpiar texto manual si había
  document.getElementById('grab-texto').value='';
}

function toggleTextoManual(){
  var c=document.getElementById('grab-texto-manual-container');
  var btn=document.getElementById('btn-texto-manual');
  var visible=c.style.display!=='none';
  c.style.display=visible?'none':'block';
  btn.style.background=visible?'#fff':'var(--verde-bg)';
  btn.style.borderColor=visible?'var(--gris-claro)':'var(--verde)';
}

var grabSesionActivo=false;
function toggleSesionLectura(){
  grabSesionActivo=!grabSesionActivo;
  document.getElementById('grab-sesion-modo').checked=grabSesionActivo;
  // El texto/foto a leer ya NO depende de este toggle: siempre queda visible, en ambos modos.
  document.getElementById('grab-sesion-panel').style.display=grabSesionActivo?'block':'none';
  document.getElementById('grab-campo-alumno').style.display=grabSesionActivo?'none':'block';
  document.getElementById('grab-siguiente-btn').style.display=grabSesionActivo?'block':'none';
  document.getElementById('grab-resultado').style.display='none';
  document.getElementById('grab-timer').style.display='none';
  document.getElementById('grab-btn').style.background='var(--terracota)';
  document.getElementById('grab-btn').textContent='🎙️';
  document.getElementById('grab-status').textContent='Seleccioná el alumno y tocá Grabar';
  grabAlumnosCompletados=[];
  if(grabSesionActivo) renderSesionLectura();
}

function renderSesionLectura(){
  var titulo=document.getElementById('grab-titulo-texto').value;
  var texto=document.getElementById('grab-texto').value;
  var panel=document.getElementById('grab-sesion-alumnos');
  panel.innerHTML=GRAB_ALUMNOS.map(a=>{
    var nombre=a.replace(/_/g,' ');
    var ini=nombre.split(' ').slice(0,2).map(p=>p[0]).join('');
    var completado=grabAlumnosCompletados.includes(a);
    return `<button onclick="sesionElegirAlumnoLectura('${a}')" 
      style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1.5px solid ${completado?'var(--verde)':'var(--gris-claro)'};border-radius:9px;background:${completado?'var(--verde-bg)':'#fff'};cursor:pointer;font-size:11px;text-align:left;transition:all 0.12s;" 
      id="grab-btn-${a}">
      <span style="width:24px;height:24px;border-radius:50%;background:${completado?'var(--verde)':'var(--verde-bg)'};color:${completado?'#fff':'var(--verde)'};font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${completado?'✓':ini}</span>
      <span style="line-height:1.2;">${nombre}</span>
    </button>`;
  }).join('');
}

function sesionElegirAlumnoLectura(alumno){
  grabSesionAlumnoActual=alumno;
  document.getElementById('grab-alumno').value=alumno;
  // Mostrar foto o texto
  var titulo=document.getElementById('grab-titulo-texto').value;
  var texto=document.getElementById('grab-texto').value;
  var hayContenido=grabFotoTextoURL||texto;
  if(hayContenido){
    document.getElementById('grab-titulo-visible').textContent=titulo||'Texto de lectura';
    if(grabFotoTextoURL){
      document.getElementById('grab-foto-durante-img').src=grabFotoTextoURL;
      document.getElementById('grab-foto-durante').style.display='block';
      document.getElementById('grab-texto-display').textContent='';
    } else {
      document.getElementById('grab-foto-durante').style.display='none';
      document.getElementById('grab-texto-display').textContent=texto;
    }
    document.getElementById('grab-texto-visible').style.display='block';
  }
  document.getElementById('grab-status').textContent='📖 '+alumno.replace(/_/g,' ')+' — listo para grabar';
  document.getElementById('grab-resultado').style.display='none';
  document.getElementById('grab-timer').style.display='none';
  document.getElementById('grab-btn').style.background='var(--terracota)';
  document.getElementById('grab-btn').textContent='🎙️';
  document.getElementById('grab-hint').textContent='Tocá para grabar';
  // Scroll al grabador
  document.getElementById('grab-btn').scrollIntoView({behavior:'smooth',block:'center'});
}

function siguienteAlumnoLectura(){
  document.getElementById('grab-resultado').style.display='none';
  document.getElementById('grab-texto-visible').style.display='none';
  document.getElementById('grab-status').textContent='Seleccioná el siguiente alumno';
  renderSesionLectura();
  document.getElementById('grab-sesion-panel').scrollIntoView({behavior:'smooth'});
}

var mr=null,ac=[],grab=false,ti=null,seg=0,ab=null;
var grabPendientesAnalisis=[]; // {alumno,titulo,nombreArchivo,blob} — en modo sesión, se acumulan
                                // y se analizan todas juntas con el botón "Analizar todas",
                                // en vez de transcribirse una por una apenas se grava cada una.
function abrirGrabador(){document.getElementById('modal-grabador').style.display='block';document.getElementById('grab-resultado').style.display='none';document.getElementById('grab-timer').style.display='none';document.getElementById('grab-btn').style.background='var(--terracota)';document.getElementById('grab-btn').textContent='🎙️';document.getElementById('grab-status').textContent='Seleccioná el alumno y tocá Grabar';seg=0;}
function cerrarGrabador(){
  if(grab)toggleGrabacion();
  if(grabPendientesAnalisis.length>0){
    var continuar=confirm('Quedan '+grabPendientesAnalisis.length+' lectura(s) grabada(s) sin analizar todavía. Los audios ya están guardados, pero si cerrás ahora vas a tener que analizarlos manualmente más tarde (no se pierden, pero no se procesan solos). ¿Cerrar igual?');
    if(!continuar)return;
  }
  document.getElementById('modal-grabador').style.display='none';
  // Resetear el modo sesión al cerrar, para que no quede desincronizado la próxima vez que se abra
  grabSesionActivo=false;
  document.getElementById('grab-sesion-modo').checked=false;
  document.getElementById('grab-sesion-panel').style.display='none';
}
function toggleGrabacion(){var al=document.getElementById('grab-alumno').value;if(!al&&!grab){document.getElementById('grab-status').textContent='⚠️ Seleccioná un alumno';return;}if(!grab){navigator.mediaDevices.getUserMedia({audio:true}).then(st=>{ac=[];var mimeTypeG=MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':'';mr=new MediaRecorder(st,mimeTypeG?{mimeType:mimeTypeG}:{});mr.ondataavailable=e=>ac.push(e.data);mr.onstop=()=>{ab=new Blob(ac,{type:'audio/webm'});document.getElementById('grab-audio').src=URL.createObjectURL(ab);document.getElementById('grab-resultado').style.display='block';document.getElementById('grab-filename').textContent='Lectura_'+al+'_'+fechaHoyArgentina()+'.webm';};mr.start();grab=true;seg=0;document.getElementById('grab-btn').style.background='#C0392B';document.getElementById('grab-btn').textContent='⏹️';document.getElementById('grab-hint').textContent='Tocá para detener';document.getElementById('grab-status').textContent='Grabando...';document.getElementById('grab-timer').style.display='block';document.getElementById('grab-resultado').style.display='none';ti=setInterval(()=>{seg++;document.getElementById('grab-timer').textContent=String(Math.floor(seg/60)).padStart(2,'0')+':'+String(seg%60).padStart(2,'0');},1000);}).catch(()=>{document.getElementById('grab-status').textContent='⚠️ No se pudo acceder al micrófono.';});}else{mr.stop();mr.stream.getTracks().forEach(t=>t.stop());grab=false;clearInterval(ti);document.getElementById('grab-btn').style.background='var(--terracota)';document.getElementById('grab-btn').textContent='🎙️';document.getElementById('grab-hint').textContent='Tocá para grabar de nuevo';document.getElementById('grab-status').textContent='Listo';}}
async function descargarAudio(){
  var al=document.getElementById('grab-alumno').value;
  var titulo=document.getElementById('grab-titulo-texto').value;
  var tituloSlug=titulo?'_'+titulo.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g,'').trim().replace(/ /g,'_').substring(0,20):'';
  var nombre='Lectura_'+al+tituloSlug+'_'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  var a=document.createElement('a');
  a.href=URL.createObjectURL(ab);
  a.download=nombre+'.webm';
  a.click();
  document.getElementById('grab-filename').textContent=nombre+'.webm';
  // Marcar completado en sesión
  if(grabSesionActivo&&al){
    if(!grabAlumnosCompletados.includes(al)) grabAlumnosCompletados.push(al);
    document.getElementById('grab-siguiente-btn').style.display='block';
    renderSesionLectura();
  }
  if(grabSesionActivo){
    // Modo sesión: subir el audio ahora (para no perderlo), pero POSPONER la transcripción —
    // se analizan todas juntas, en secuencia, con el botón "Analizar todas" al final de la sesión.
    await subirAudioLecturaSinTranscribir(al,titulo,nombre,ab);
    actualizarBotonAnalizarTodas();
  }else{
    // Modo individual (sin sesión): comportamiento de siempre, transcribe apenas se sube.
    subirYTranscribirAudioLectura(al,titulo,nombre);
  }
}

async function subirAudioLecturaSinTranscribir(nombreAlumno,titulo,nombreArchivoBase,blob){
  if(!window.__sb||!nombreAlumno)return;
  var st=(window.__students||[]).find(function(s){return s.full_name===nombreAlumno;});
  if(!st)return;
  var statusEl=document.getElementById('grab-status');
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    if(!user)return;
    var path=user.id+'/'+st.id+'/lecturas/'+nombreArchivoBase+'.webm';
    var {error:errUpload}=await window.__sb.storage.from('evidencias').upload(path,blob);
    if(errUpload){
      console.log('No se pudo guardar el audio en la base:',errUpload.message);
      if(statusEl)statusEl.textContent='Audio descargado (no se pudo guardar en la base: '+errUpload.message+')';
      return;
    }
    grabPendientesAnalisis.push({alumno:nombreAlumno,studentId:st.id,titulo:titulo,nombreArchivo:nombreArchivoBase,blob:blob,teacherId:user.id});
    if(statusEl)statusEl.textContent='Audio guardado. Pendiente de análisis (se analiza junto con el resto al final).';
  }catch(eUpload){
    console.log('Error al guardar el audio de lectura:',eUpload);
    if(statusEl)statusEl.textContent='Audio descargado (no se pudo guardar en la base: '+eUpload.message+')';
  }
}

function actualizarBotonAnalizarTodas(){
  var btn=document.getElementById('grab-analizar-todas-btn');
  if(!btn)return;
  if(grabPendientesAnalisis.length>0){
    btn.style.display='block';
    btn.textContent='🔍 Analizar todas ('+grabPendientesAnalisis.length+')';
    btn.disabled=false;
  }else{
    btn.style.display='none';
  }
}

async function analizarTodasLasLecturasPendientes(){
  if(!grabPendientesAnalisis.length)return;
  var btn=document.getElementById('grab-analizar-todas-btn');
  var statusEl=document.getElementById('grab-status');
  var pendientes=grabPendientesAnalisis.slice(); // copia, para no mutar mientras se procesa
  grabPendientesAnalisis=[];
  if(btn){btn.disabled=true;}
  var total=pendientes.length;
  for(var i=0;i<pendientes.length;i++){
    var item=pendientes[i];
    if(statusEl)statusEl.textContent='Analizando '+(i+1)+' de '+total+': '+item.alumno+'…';
    if(btn)btn.textContent='Analizando '+(i+1)+'/'+total+'…';
    try{
      await transcribirYGuardarLecturaPendiente(item);
    }catch(eItem){
      console.log('Error al analizar la lectura de '+item.alumno+':',eItem);
      // Si falla una, se sigue con las demás — no se pierde toda la sesión por un error puntual.
      grabPendientesAnalisis.push(item); // la devolvemos a la cola para reintentar después
    }
  }
  actualizarBotonAnalizarTodas();
  if(statusEl)statusEl.textContent=grabPendientesAnalisis.length
    ?'✅ Análisis terminado. '+grabPendientesAnalisis.length+' quedaron pendientes por error — podés reintentar.'
    :'✅ Análisis completo: '+total+' lectura(s) transcripta(s) y guardada(s) en cada perfil.';
}

async function transcribirYGuardarLecturaPendiente(item){
  // Usa el MISMO análisis pedagógico rico que analizarConGemini() (fluidez, errores,
  // entonación, nivel lector, observación pedagógica) — no una simple transcripción —
  // para que el resultado del lote sea igual de útil que el análisis individual.
  var apiKey=getApiKey();
  if(!apiKey){
    document.getElementById('modal-gemini-config').style.display='block';
    throw new Error('Sin clave de Gemini configurada');
  }
  var base64Audio=await blobToBase64(item.blob);
  var base64Data=base64Audio.split(',')[1];
  var promptPedagogico='Sos un especialista en evaluación de lectura oral para nivel primario.\nAnalizá este audio de lectura de un alumno de '+(window.__teacherGrade||'6to año')+' de primaria.'+(item.titulo?' El texto leído es: "'+item.titulo+'".':'')+'\n\nRespondé en este formato exacto:\n\nFLUIDEZ: [Fluida / Con pausas leves / Con pausas frecuentes / Lenta / Muy lenta]\n\nERRORES:\n- Omisiones: [palabras omitidas o "ninguna"]\n- Sustituciones: [palabras cambiadas o "ninguna"]\n- Repeticiones: [palabras repetidas o "ninguna"]\n- Autocorrecciones: [sí / no]\n\nENTONACIÓN: [Adecuada / Monótona / Inadecuada]\nRITMO: [Adecuado / Apresurado / Lento]\nNIVEL LECTOR: [Avanzado / Esperado / En proceso / Con dificultades]\n\nOBSERVACIÓN PEDAGÓGICA: [2-3 oraciones concretas para el docente]\n\nSi el audio es muy corto o hay ruido ambiental, indicalo brevemente.';
  var response=await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+apiKey,
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      contents:[{parts:[{text:promptPedagogico},{inline_data:{mime_type:item.blob.type||'audio/webm',data:base64Data}}]}]
    })}
  );
  var data=await response.json();
  if(data.error)throw new Error(data.error.message);
  var analisis=(data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0]&&data.candidates[0].content.parts[0].text)||'';
  if(!analisis)throw new Error('No se obtuvo análisis del audio');
  var fecha=new Date().toLocaleDateString('es-AR');
  var textoObs='[📖 Lectura'+(item.titulo?': '+item.titulo:'')+' · '+fecha+']\n'+analisis;
  var {error:errObs}=await window.__sb.from('notas_rapidas').insert({student_id:item.studentId,teacher_id:item.teacherId,content:textoObs});
  if(errObs)throw new Error('Se analizó pero no se pudo guardar: '+errObs.message);
  // Igual que el análisis individual, intentar guardar también en Drive (sin bloquear si falla)
  try{
    var alumnoKey=item.alumno.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,\s*/g,'_').replace(/\s+/g,'_').replace(/[^a-zA-Z_]/g,'');
    await guardarAnalisisEnDrive(alumnoKey,item.alumno,fecha,item.titulo,analisis);
  }catch(eDrive){
    console.log('No se pudo guardar en Drive (no bloqueante):',eDrive);
  }
}

async function subirYTranscribirAudioLectura(nombreAlumno,titulo,nombreArchivoBase){
  if(!window.__sb||!nombreAlumno)return;
  var st=(window.__students||[]).find(function(s){return s.full_name===nombreAlumno;});
  if(!st)return;
  var statusEl=document.getElementById('grab-status');
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    if(!user)return;
    var path=user.id+'/'+st.id+'/lecturas/'+nombreArchivoBase+'.webm';
    var {error:errUpload}=await window.__sb.storage.from('evidencias').upload(path,ab);
    if(errUpload){
      console.log('No se pudo guardar el audio en la base:',errUpload.message);
      if(statusEl)statusEl.textContent='Audio descargado (no se pudo guardar en la base: '+errUpload.message+')';
      return;
    }
    if(statusEl)statusEl.textContent='Audio guardado. Transcribiendo...';

    // Transcripción con la API de Gemini (Google) — Claude no soporta audio en bloques document,
    // confirmado con la API real (error 400: el media_type de un bloque document debe ser
    // application/pdf, sin excepción). Este fix ya se había aplicado una vez (commit 28c7172)
    // pero se perdió en una subida posterior que partió de una copia vieja del archivo — ver
    // protocolo HuellaED, Regla 1 (GitHub como única fuente de verdad) y la regla de entrega
    // del index.html final, ambas pensadas para evitar exactamente este tipo de pérdida.
    var apiKey=getApiKey();
    if(!apiKey){
      if(statusEl)statusEl.textContent='Audio guardado (configurá la clave de Gemini para transcribir)';
      document.getElementById('modal-gemini-config').style.display='block';
      return;
    }
    var audioBase64=await new Promise(function(resolve,reject){
      var reader=new FileReader();
      reader.onload=function(){resolve(reader.result.split(',')[1]);};
      reader.onerror=reject;
      reader.readAsDataURL(ab);
    });
    var mediaType=ab.type||'audio/webm';
    var res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+apiKey,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        contents:[{parts:[
          {text:'Transcribí textualmente lo que lee en voz alta el alumno en este audio de una clase de lectura. Solo la transcripción literal de lo leído, sin agregar comentarios, valoraciones ni análisis. Si hay errores de lectura, pausas largas o repeticiones notorias, podés indicarlo entre corchetes en el lugar donde ocurren (ej: [se traba en "construcción"], [pausa larga]). Si no se entiende algo, escribí [inaudible].'},
          {inline_data:{mime_type:mediaType,data:audioBase64}}
        ]}]
      })
    });
    if(!res.ok){
      var ed=await res.json().catch(function(){return {};});
      throw new Error((ed.error&&ed.error.message)||'Error '+res.status);
    }
    var data=await res.json();
    var transcripcion=(data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0]&&data.candidates[0].content.parts[0].text)||'';
    if(transcripcion){
      var textoObs='[Grabación de lectura'+(titulo?' · '+titulo:'')+' · '+new Date().toLocaleDateString('es-AR')+']\nTranscripción: '+transcripcion;
      var {error:errObs}=await window.__sb.from('notas_rapidas').insert({student_id:st.id,teacher_id:user.id,content:textoObs});
      if(errObs){
        console.log('No se pudo guardar la transcripción como observación:',errObs.message);
        if(statusEl)statusEl.textContent='Audio guardado y transcrito, pero no se pudo guardar la transcripción: '+errObs.message;
      }else{
        if(statusEl)statusEl.textContent='✅ Audio guardado y transcripto en el perfil';
      }
    }else{
      if(statusEl)statusEl.textContent='Audio guardado (no se obtuvo transcripción)';
    }
  }catch(eTrans){
    console.log('Error al transcribir el audio de lectura:',eTrans);
    if(statusEl)statusEl.textContent='Audio guardado (no se pudo transcribir: '+eTrans.message+')';
  }
}
// ── EVIDENCIA ──
var evFile=null,evReg=[];
function abrirEvidencia(){
  document.getElementById('modal-evidencia').style.display='block';
  document.getElementById('ev-preview-container').style.display='none';
  document.getElementById('ev-descargar-btn').style.display='none';
  document.getElementById('ev-nombre-preview').style.display='none';
  var apEl=document.getElementById('ev-analisis-preview');if(apEl){apEl.style.display='none';apEl.innerHTML='';}
  evFile=null;
  renderEvidencias();
  // Llenar alumnos si no están cargados
  var sel=document.getElementById('ev-alumno');
  if(sel&&sel.options.length<=1&&window.__students){
    sel.innerHTML='<option value="">— Seleccionar —</option>'+window.__students.map(function(s){return '<option>'+s.full_name+'</option>';}).join('');
  }
}
function cerrarEvidencia(){document.getElementById('modal-evidencia').style.display='none';}
function actualizarNombreEv(){var al=document.getElementById('ev-alumno').value,ar=document.getElementById('ev-area').value,tm=document.getElementById('ev-tema').value;if(!al&&!tm){document.getElementById('ev-nombre-preview').style.display='none';return;}var fecha=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');var alS=al.replace(/[^a-zA-Z ]/g,'').replace(/ /g,'_');var arS=ar?'_'+ar.replace(/ /g,'_'):'';var tmS=tm.trim().replace(/ /g,'_').substring(0,25);var nombre='Evidencia_'+alS+arS+(tmS?'_'+tmS:'')+'_'+fecha;document.getElementById('ev-nombre-txt').textContent=nombre+'.jpg';document.getElementById('ev-nombre-preview').style.display='block';return nombre;}
function procesarFotoMultiple(input){
  if(!input.files||!input.files.length)return;
  if(input.files.length===1){procesarFoto(input);return;}
  var alumno=document.getElementById('ev-alumno').value;
  var area=document.getElementById('ev-area').value;
  var tema=document.getElementById('ev-tema').value;
  if(!alumno&&!evSesionActivo){alert('Seleccioná un alumno');return;}
  if(!area||!tema){alert('Completá área y tema');return;}
  // Mostrar preview de todas las fotos con botón guardar
  var files=Array.from(input.files);
  var alumnoNombre=alumno||evSesionAlumnoActual;
  var container=document.getElementById('ev-multi-preview');
  if(!container){
    container=document.createElement('div');
    container.id='ev-multi-preview';
    container.style.cssText='margin-top:10px;';
    document.getElementById('ev-descargar-btn').parentNode.insertBefore(container,document.getElementById('ev-descargar-btn'));
  }
  var fecha=new Date().toLocaleDateString('es-AR');
  var fechaSlug=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  var alS=alumnoNombre.replace(/[^a-zA-Z ]/g,'').replace(/ /g,'_');
  var previews=files.map(function(file,i){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;background:var(--crema);border-radius:9px;padding:8px 10px;">'
      +'<img src="'+URL.createObjectURL(file)+'" style="width:48px;height:48px;object-fit:cover;border-radius:7px;flex-shrink:0;">'
      +'<div style="flex:1;font-size:11px;color:var(--gris);">Foto '+(i+1)+' — '+file.name.substring(0,30)+'</div>'
      +'</div>';
  }).join('');
  container.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--verde);margin-bottom:8px;">'+files.length+' fotos seleccionadas — '+alumnoNombre+'</div>'
    +previews
    +'<label style="display:flex;align-items:center;gap:8px;margin:8px 0 4px;cursor:pointer;">'
    +'<input type="checkbox" id="ev-multi-analizar" style="width:15px;height:15px;accent-color:var(--verde);flex-shrink:0;">'
    +'<span style="font-size:12px;color:var(--negro);">Analizar con IA — guarda descripción pedagógica en el perfil de '+alumnoNombre+'</span>'
    +'</label>'
    +'<button onclick="guardarFotosMultiples()" class="save-btn" style="margin-top:6px;">💾 Guardar '+files.length+' fotos como evidencia</button>'
    +'<div id="ev-multi-msg" style="font-size:11px;text-align:center;margin-top:5px;"></div>';
  container.style.display='block';
  // Guardar referencia a los archivos
  window._evMultiFiles=files;
  window._evMultiAlumno=alumnoNombre;
  window._evMultiArea=area;
  window._evMultiTema=tema;
  window._evMultiFecha=fecha;
  window._evMultiFechaSlug=fechaSlug;
  window._evMultiAlS=alS;
}

async function guardarFotosMultiples(){
  var files=window._evMultiFiles;
  if(!files||!files.length)return;
  var btn=document.querySelector('#ev-multi-preview .save-btn');
  var msg=document.getElementById('ev-multi-msg');
  var chkEl=document.getElementById('ev-multi-analizar');
  var analizarIA=chkEl&&chkEl.checked;
  btn.disabled=true;btn.textContent='Guardando...';
  var count=0;var errors=0;
  var alumnoNombre=window._evMultiAlumno;
  var area=window._evMultiArea;
  var tema=window._evMultiTema;
  var fechaSlug=window._evMultiFechaSlug;
  var alS=window._evMultiAlS;
  // Obtener usuario y alumno una vez (fuera del loop)
  var user2=null;var st=null;
  if(window.__sb){
    try{user2=(await window.__sb.auth.getUser()).data.user;}catch(_){}
    st=window.__students?window.__students.find(function(s){return s.full_name===alumnoNombre;}):null;
  }
  for(var i=0;i<files.length;i++){
    var file=files[i];
    var ext=file.type.includes('png')?'.png':'.jpg';
    var nombre='Evidencia_'+alS+'_'+area.replace(/ /g,'_')+'_'+tema.trim().replace(/ /g,'_').substring(0,20)+'_foto'+(i+1)+'_'+fechaSlug+ext;
    if(user2&&st&&window.__sb){
      try{
        var path=user2.id+'/'+st.id+'/'+nombre;
        var res=await window.__sb.storage.from('evidencias').upload(path,file);
        if(!res.error){
          count++;
          if(analizarIA){
            msg.style.color='var(--gris)';
            msg.textContent='✅ '+count+'/'+files.length+' guardadas — analizando foto '+(i+1)+' con IA…';
            await _analizarFotoEvidencia(file,st.id,user2.id,area,tema,'');
          }
        }else{errors++;}
      }catch(e2){
        var af=document.createElement('a');af.href=URL.createObjectURL(file);af.download=nombre;af.click();count++;
      }
    }else{
      var af=document.createElement('a');af.href=URL.createObjectURL(file);af.download=nombre;af.click();count++;
    }
  }
  evReg.unshift({id:Date.now(),alumno:alumnoNombre,area:area,tema:tema,obs:'',fecha:window._evMultiFecha,archivo:count+' fotos guardadas'});
  renderEvidencias();
  btn.disabled=false;
  msg.style.color='var(--verde)';
  if(analizarIA&&count>0){
    msg.textContent='✅ '+count+' fotos guardadas — análisis guardado en el perfil de '+alumnoNombre.split(',')[0]+(errors>0?' ('+errors+' errores)':'');
  }else{
    msg.textContent='✅ '+count+' fotos guardadas'+(errors>0?' ('+errors+' errores)':'');
  }
  setTimeout(function(){
    document.getElementById('ev-multi-preview').style.display='none';
    window._evMultiFiles=null;
  },3000);
}

function procesarFoto(input){
  if(!input.files||!input.files[0])return;
  evFile=input.files[0];
  var r=new FileReader();
  r.onload=function(e){
    document.getElementById('ev-preview-img').src=e.target.result;
    document.getElementById('ev-preview-container').style.display='block';
    document.getElementById('ev-descargar-btn').style.display='block';
    if(evSesionActivo){
      setTimeout(()=>descargarEvidenciaSesion(),300);
    }else{
      setTimeout(()=>_autoGuardarEvidencia(),300);
    }
  };
  r.readAsDataURL(evFile);
}

async function _autoGuardarEvidencia(){
  if(!evFile)return;
  var alumno=document.getElementById('ev-alumno').value;
  var area=document.getElementById('ev-area').value;
  var tema=document.getElementById('ev-tema').value;
  var obs=document.getElementById('ev-obs').value;
  var nombre=actualizarNombreEv();
  var prevEl=document.getElementById('ev-analisis-preview');
  if(!nombre){
    if(prevEl){prevEl.style.display='block';prevEl.innerHTML='<div style="color:var(--gris);font-size:11px;">Completá el alumno y el tema para que la foto se guarde automáticamente.</div>';}
    return;
  }
  var ext=evFile.type.includes('png')?'.png':'.jpg';
  evReg.unshift({id:Date.now(),alumno:alumno,area:area,tema:tema,obs:obs,fecha:new Date().toLocaleDateString('es-AR'),archivo:nombre+ext});
  if(prevEl){prevEl.style.display='block';prevEl.innerHTML='<div style="display:flex;align-items:center;gap:8px;color:var(--verde);"><span>⏳</span> Guardando y analizando la foto con IA…</div>';}
  var descripcion=await subirYAnalizarEvidencia(evFile,alumno,area,tema,obs,nombre+ext);
  if(prevEl){
    if(descripcion){
      prevEl.innerHTML='<div style="font-weight:700;color:var(--verde);margin-bottom:5px;">🤖 Análisis de la foto (guardado en el perfil del alumno):</div><div style="white-space:pre-wrap;color:var(--negro);">'+descripcion+'</div>';
    }else{
      prevEl.innerHTML='<div style="color:var(--terracota);">⚠️ La foto se guardó en el perfil. No se pudo generar el análisis automático (sin clave de API o error de conexión).</div>';
    }
  }
  renderEvidencias();
}

async function descargarEvidenciaSesion(){
  if(!evFile)return;
  var nombre=actualizarNombreEv();
  if(!nombre)return;
  var alActual=document.getElementById('ev-alumno').value;
  var area=document.getElementById('ev-area').value;
  var tema=document.getElementById('ev-tema').value;
  evReg.unshift({id:Date.now(),alumno:alActual,area:area,tema:tema,obs:'',fecha:new Date().toLocaleDateString('es-AR'),archivo:nombre+'.jpg'});
  if(!evSesionCompletados.includes(alActual)) evSesionCompletados.push(alActual);
  var ext=evFile.type.includes('png')?'.png':'.jpg';
  var archivoParaAnalizar=evFile;
  var a=document.createElement('a');a.href=URL.createObjectURL(evFile);a.download=nombre+ext;a.click();
  var alumnoNombre=alActual.split(',')[0];
  var statusEl=document.getElementById('ev-sesion-status');
  if(statusEl)statusEl.textContent='✅ '+alumnoNombre+' guardado — analizando foto…';
  var btnId='ev-btn-'+alActual.replace(/[^a-zA-Z]/g,'_');
  var btnSesion=document.getElementById(btnId);
  if(btnSesion){btnSesion.style.background='var(--verde-bg)';btnSesion.style.borderColor='var(--verde)';}
  document.getElementById('ev-preview-container').style.display='none';
  document.getElementById('ev-descargar-btn').style.display='none';
  evFile=null;
  renderEvidencias();
  var desc=await subirYAnalizarEvidencia(archivoParaAnalizar,alActual,area,tema,'',nombre+ext);
  if(statusEl){
    statusEl.textContent=desc
      ?'✅ '+alumnoNombre+' — análisis guardado en su perfil'
      :'✅ '+alumnoNombre+' guardado — elegí el siguiente';
  }
}
function descargarEvidencia(){
  if(!evFile)return;
  var nombre=actualizarNombreEv();
  if(!nombre){alert('Completá el alumno y el tema');return;}
  var ext=evFile.type.includes('png')?'.png':'.jpg';
  var a=document.createElement('a');a.href=URL.createObjectURL(evFile);a.download=nombre+ext;a.click();
}
var evSesionActivo=false;
var evSesionAlumnoActual='';
var EV_ALUMNOS=[];

async function subirYAnalizarEvidencia(archivo,nombreAlumno,area,tema,obs,nombreArchivo){
  if(!window.__sb||!nombreAlumno)return null;
  var st=(window.__students||[]).find(function(s){return s.full_name===nombreAlumno;});
  if(!st)return null;
  try{
    var user=(await window.__sb.auth.getUser()).data.user;
    if(!user)return null;
    var path=user.id+'/'+st.id+'/evidencias/'+nombreArchivo;
    var {error:errUpload}=await window.__sb.storage.from('evidencias').upload(path,archivo);
    if(errUpload){console.log('No se pudo guardar la evidencia en la base:',errUpload.message);return null;}
    var apiKey=_sget('huellaed_anthropic_key');
    if(!apiKey){
      var textoObsSimple='[Evidencia'+(area?' · '+area:'')+(tema?' · '+tema:'')+' · '+new Date().toLocaleDateString('es-AR')+'] Foto archivada en el perfil del alumno.'+(obs?' Obs: '+obs:'');
      await window.__sb.from('notas_rapidas').insert({student_id:st.id,teacher_id:user.id,content:textoObsSimple});
      return null;
    }
    return await _analizarFotoEvidencia(archivo,st.id,user.id,area,tema,obs);
  }catch(eEv){
    console.log('No se pudo subir/analizar la evidencia:',eEv);
    return null;
  }
}

async function _analizarFotoEvidencia(archivo,studentId,teacherId,area,tema,obs){
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey)return null;
  try{
    var mimeType=archivo.type||'image/jpeg';
    var base64=await new Promise(function(resolve,reject){
      var reader=new FileReader();
      reader.onload=function(){resolve(reader.result.split(',')[1]);};
      reader.onerror=reject;
      reader.readAsDataURL(archivo);
    });
    var contexto='Esta es una foto de evidencia de trabajo escolar'
      +(area?' del área de '+area:'')
      +(tema?' sobre el tema "'+tema+'"':'')
      +(obs?' (observación del docente: "'+obs+'")':'')
      +' de un alumno de '+(window.__teacherGrade||'6to grado')+' de escuela primaria en Argentina.';
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',max_tokens:500,
        messages:[{role:'user',content:[
          {type:'image',source:{type:'base64',media_type:mimeType,data:base64}},
          {type:'text',text:contexto+' Describí brevemente (máximo 4 líneas) qué muestra esta foto en términos pedagógicos: qué realizó el alumno, qué nivel de producción se observa, qué aspectos del aprendizaje evidencia. Si la imagen no es legible o no es claramente un trabajo escolar, indicalo. No inventes información que no se vea.'}
        ]}]
      })
    });
    if(!res.ok){throw new Error('Error '+res.status);}
    var data=await res.json();
    var descripcion=(data.content&&data.content[0]&&data.content[0].text)||'';
    if(descripcion&&window.__sb){
      var textoObs='[Evidencia'+(area?' · '+area:'')+(tema?' · '+tema:'')+' · '+new Date().toLocaleDateString('es-AR')+']\n'+descripcion+(obs?'\nObservación docente: '+obs:'');
      await window.__sb.from('notas_rapidas').insert({student_id:studentId,teacher_id:teacherId,content:textoObs});
    }
    return descripcion||null;
  }catch(eAn){
    console.log('No se pudo analizar la foto con IA:',eAn);
    return null;
  }
}

function toggleSesion(){
  evSesionActivo=!evSesionActivo;
  document.getElementById('ev-sesion-modo').checked=evSesionActivo;
  document.getElementById('ev-sesion-panel').style.display=evSesionActivo?'block':'none';
  document.getElementById('ev-campo-alumno').style.display=evSesionActivo?'none':'block';
  document.getElementById('ev-campo-obs').style.display=evSesionActivo?'none':'block';
  document.getElementById('ev-preview-container').style.display='none';
  document.getElementById('ev-descargar-btn').style.display='none';
  evSesionCompletados=[];
  if(evSesionActivo) renderSesionAlumnos();
}

var evSesionCompletados=[];
function renderSesionAlumnos(){
  var tema=document.getElementById('ev-tema').value;
  var area=document.getElementById('ev-area').value;
  if(!tema||!area){
    document.getElementById('ev-sesion-alumnos').innerHTML='<div style="grid-column:span 2;text-align:center;font-size:12px;color:var(--gris);">Completá el área y el tema primero</div>';
    return;
  }
  document.getElementById('ev-sesion-alumnos').innerHTML=EV_ALUMNOS.map(a=>{
    var ini=a.split(',').map(p=>p.trim()).map(p=>p[0]).join('');
    var hecho=evSesionCompletados.includes(a);
    return `<button onclick="sesionElegirAlumno('${a}')" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1.5px solid ${hecho?'var(--verde)':'var(--gris-claro)'};border-radius:9px;background:${hecho?'var(--verde-bg)':'#fff'};cursor:pointer;font-size:12px;text-align:left;" id="ev-btn-${a.replace(/[^a-zA-Z]/g,'_')}">
      <span style="width:26px;height:26px;border-radius:50%;background:${hecho?'var(--verde)':'var(--verde-bg)'};color:${hecho?'#fff':'var(--verde)'};font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${hecho?'✓':ini}</span>
      <span style="line-height:1.2;">${a}</span>
    </button>`;
  }).join('');
}

function sesionElegirAlumno(nombre){
  evSesionAlumnoActual=nombre;
  document.getElementById('ev-alumno').value=nombre;
  actualizarNombreEv();
  document.getElementById('ev-sesion-status').textContent='📷 Sacando foto de '+nombre.split(',')[0]+'...';
  // Resetear previa
  document.getElementById('ev-preview-container').style.display='none';
  document.getElementById('ev-descargar-btn').style.display='none';
  evFile=null;
  // Abrir cámara automáticamente
  document.getElementById('ev-camara').value='';
  document.getElementById('ev-camara').click();
}

function renderEvidencias(){var l=document.getElementById('ev-registros-lista'),c=document.getElementById('ev-registros-container');if(evReg.length===0){c.style.display='none';return;}c.style.display='block';l.innerHTML=evReg.slice(0,6).map(r=>'<div style="background:var(--crema);border-radius:9px;padding:8px 11px;margin-bottom:5px;font-size:11px;"><div style="font-weight:600;">'+r.alumno+' · '+r.fecha+'</div><div style="color:var(--gris);">'+r.archivo+'</div></div>').join('');}

// ── REUNION ──
var tipoR='individual',motivoR='',seguimR='';
function abrirReunion(){document.getElementById('modal-reunion').style.display='block';document.getElementById('reunion-fecha').value=fechaHoyArgentina();document.getElementById('reunion-resultado').style.display='none';var sm=document.getElementById('reunion-save-msg');if(sm)sm.style.display='none';cargarHistorialReuniones();}
function cerrarReunion(){document.getElementById('modal-reunion').style.display='none';}
function selTipoReunion(el,t){document.querySelectorAll('#tr-ind,#tr-grp').forEach(b=>b.classList.remove('active'));el.classList.add('active');tipoR=t;document.getElementById('reunion-alumno-row').style.display=t==='individual'?'block':'none';}
function selMotivo(el,m){el.classList.toggle('active');motivoR=m;}
function selSeguimiento(el,s){el.classList.toggle('active');seguimR=s;}
function generarPromptReunion(){var al=document.getElementById('reunion-alumno').value,fecha=document.getElementById('reunion-fecha').value,res=document.getElementById('reunion-resumen').value,comp=document.getElementById('reunion-compromisos').value,asist=document.getElementById('reunion-asistentes').value;if(!res){alert('Escribí el resumen');return;}var p='Registrá esta reunión familiar en HuellaED.\n\nTIPO: '+(tipoR==='individual'?'Individual — '+al:'Grupal')+'\nFECHA: '+fecha+'\nMOTIVO: '+motivoR+(asist?'\nASISTENTES: '+asist:'')+'\n\nRESUMEN: '+res+(comp?'\n\nCOMPROMISOS: '+comp:'')+'\nSEGUIMIENTO: '+seguimR;document.getElementById('reunion-prompt-text').textContent=p;document.getElementById('reunion-resultado').style.display='block';}
function copiarPromptReunion(){navigator.clipboard.writeText(document.getElementById('reunion-prompt-text').textContent);}
async function guardarReunionSupabase(){
  if(!window.__sb)return;
  var al=document.getElementById('reunion-alumno').value;
  var fecha=document.getElementById('reunion-fecha').value;
  var res=document.getElementById('reunion-resumen').value.trim();
  var comp=document.getElementById('reunion-compromisos').value.trim();
  var asist=document.getElementById('reunion-asistentes').value.trim();
  if(!res){alert('Completá el resumen');return;}
  var msg=document.getElementById('reunion-save-msg');
  msg.style.display='block';msg.style.color='var(--gris)';msg.textContent='Guardando…';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user){msg.style.color='#C0392B';msg.textContent='Sin sesión activa';return;}
  var studentId=null;
  if(tipoR==='individual'&&al&&window.__students){var s=window.__students.find(function(x){return x.full_name===al;});if(s)studentId=s.id;}
  var {error}=await window.__sb.from('family_meetings').insert({teacher_id:user.id,student_id:studentId,tipo:tipoR,fecha:fecha||null,motivo:motivoR,asistentes:asist,resumen:res,compromisos:comp,seguimiento:seguimR});
  if(error){msg.style.color='#C0392B';msg.textContent='Error: '+error.message;}
  else{
    msg.style.color='var(--verde)';msg.textContent='✅ Reunión guardada';
    // Guardar como observación en el perfil del alumno
    if(studentId){
      var textoObs='[Reunión familiar · '+new Date(fecha+'T12:00').toLocaleDateString('es-AR')+']\n'
        +'Motivo: '+motivoR+'\nAsistentes: '+(asist||'—')+'\nResumen: '+res
        +(comp?'\nCompromisos: '+comp:'')+(seguimR?'\nSeguimiento: '+seguimR:'');
      await window.__sb.from('notas_rapidas').insert({student_id:studentId,teacher_id:user.id,content:textoObs});
    }
    // Subir foto del acta si existe
    if(window._reunionActaFile&&studentId){
      try{
        var ext=window._reunionActaFile.type.includes('png')?'.png':'.jpg';
        var path=user.id+'/'+studentId+'/Acta_Reunion_'+(fecha||fechaHoyArgentina())+ext;
        await window.__sb.storage.from('evidencias').upload(path,window._reunionActaFile);
        window._reunionActaFile=null;
        document.getElementById('reunion-acta-foto').value='';
        document.getElementById('reunion-acta-preview').style.display='none';
        document.getElementById('reunion-acta-label').textContent='Fotografiar acta firmada';
      }catch(e2){console.error('Error subiendo acta:',e2);}
    }
    setTimeout(function(){msg.style.display='none';},3000);
    cargarHistorialReuniones();
  }
}
async function cargarHistorialReuniones(){
  var hist=document.getElementById('reunion-historial');
  if(!hist||!window.__sb)return;
  hist.innerHTML='<div style="font-size:12px;color:var(--gris);text-align:center;padding:8px 0;">Cargando...</div>';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user){hist.innerHTML='<div style="font-size:12px;color:var(--gris);text-align:center;padding:8px 0;">Sin sesión</div>';return;}
  var {data,error}=await window.__sb.from('family_meetings').select('*').eq('teacher_id',user.id).order('created_at',{ascending:false}).limit(10);
  if(error){hist.innerHTML='<div style="font-size:12px;color:#C0392B;text-align:center;padding:8px;background:#FDE8E8;border-radius:8px;">⚠️ No se pudo cargar el historial (error de conexión). Tus datos siguen guardados — recargá para reintentar.</div>';return;}
  if(!data||!data.length){hist.innerHTML='<div style="font-size:12px;color:var(--gris);text-align:center;padding:8px 0;">Sin reuniones registradas</div>';return;}
  hist.innerHTML=data.map(function(r){
    var nombre=r.tipo==='grupal'?'Reunión grupal':(r.student_id?((window.__students||[]).find(function(s){return s.id===r.student_id;})||{full_name:'Alumno'}).full_name:'Sin alumno');
    var fecha=r.fecha?new Date(r.fecha+'T12:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}):'';
    var seguBg=r.seguimiento==='cumplido'?'var(--verde-bg)':r.seguimiento==='incumplido'?'#FDE8E8':'#FDF8EE';
    var seguCol=r.seguimiento==='cumplido'?'var(--verde)':r.seguimiento==='incumplido'?'#C0392B':'var(--terracota)';
    var seguIcon=r.seguimiento==='cumplido'?'✅':r.seguimiento==='incumplido'?'❌':'⏳';
    return '<div style="background:var(--crema);border-radius:10px;padding:9px 12px;margin-bottom:6px;border:1.5px solid var(--gris-claro);">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;">'
      +'<div style="font-size:12px;font-weight:700;">'+nombre+'</div>'
      +'<span style="font-size:10px;color:var(--gris);">'+fecha+'</span>'
      +'</div>'
      +(r.motivo?'<div style="font-size:10px;color:var(--gris);margin-top:2px;">'+r.motivo+'</div>':'')
      +(r.resumen?'<div style="font-size:11px;color:var(--negro);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(r.resumen.length>65?r.resumen.substring(0,65)+'…':r.resumen)+'</div>':'')
      +(r.seguimiento?'<span style="font-size:10px;background:'+seguBg+';color:'+seguCol+';border-radius:5px;padding:2px 7px;margin-top:5px;display:inline-block;">'+seguIcon+' '+r.seguimiento+'</span>':'')
      +'</div>';
  }).join('');
}
function generarActa(){var al=document.getElementById('reunion-alumno').value,fecha=document.getElementById('reunion-fecha').value,asist=document.getElementById('reunion-asistentes').value,res=document.getElementById('reunion-resumen').value,comp=document.getElementById('reunion-compromisos').value;if(!res){alert('Completá el resumen');return;}var fechaF=fecha?new Date(fecha+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}):'___/___/______';var html='<div style="text-align:center;border-bottom:2px solid #2D5F4F;padding-bottom:10px;margin-bottom:14px;"><div style="font-size:10px;color:#2D5F4F;text-transform:uppercase;letter-spacing:2px;">Escuela La Concepción</div><div style="font-size:17px;font-weight:bold;">ACTA DE REUNIÓN FAMILIAR</div><div style="font-size:10px;color:#888;margin-top:3px;">'+(window.__teacherGrade||'6to Año')+' · 2026</div></div><table style="width:100%;font-size:12px;margin-bottom:14px;"><tr><td style="color:#888;width:35%;padding:3px 0;">Fecha:</td><td style="font-weight:bold;">'+fechaF+'</td></tr><tr><td style="color:#888;padding:3px 0;">Alumno/a:</td><td style="font-weight:bold;">'+(al||'(Reunión grupal)')+'</td></tr><tr><td style="color:#888;padding:3px 0;">Motivo:</td><td>'+motivoR+'</td></tr><tr><td style="color:#888;padding:3px 0;">Asistentes:</td><td>'+(asist||'—')+'</td></tr></table><div style="margin-bottom:12px;"><div style="font-size:10px;font-weight:bold;color:#2D5F4F;text-transform:uppercase;border-bottom:1px solid #EEE;padding-bottom:3px;margin-bottom:5px;">Resumen</div><div style="min-height:55px;">'+res+'</div></div><div style="margin-bottom:20px;"><div style="font-size:10px;font-weight:bold;color:#2D5F4F;text-transform:uppercase;border-bottom:1px solid #EEE;padding-bottom:3px;margin-bottom:5px;">Compromisos</div><div style="min-height:45px;">'+(comp||'Sin compromisos formales.')+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;"><div style="text-align:center;"><div style="border-top:1px solid #333;padding-top:6px;margin-top:36px;font-size:11px;color:#888;">Firma Docente<br>'+(window.__teacherName||'Docente')+'</div></div><div style="text-align:center;"><div style="border-top:1px solid #333;padding-top:6px;margin-top:36px;font-size:11px;color:#888;">Firma Familia</div></div></div><div style="text-align:center;margin-top:18px;font-size:9px;color:#AAA;">HuellaED · Escuela La Concepción · '+(window.__teacherGrade||'6to Año')+' 2026</div>';document.getElementById('acta-preview').innerHTML=html;document.getElementById('modal-acta').style.display='block';}
function imprimirActa(){var c=document.getElementById('acta-preview').innerHTML;document.getElementById('print-container').innerHTML='<div style="font-family:Georgia,serif;font-size:13px;line-height:1.8;padding:20px;">'+c+'</div>';window.print();setTimeout(()=>{document.getElementById('print-container').innerHTML='';},1000);}
function cerrarActa(){document.getElementById('modal-acta').style.display='none';}

function seleccionarFotoActa(input){
  if(!input.files||!input.files[0])return;
  window._reunionActaFile=input.files[0];
  var reader=new FileReader();
  reader.onload=function(e){
    document.getElementById('reunion-acta-img').src=e.target.result;
    document.getElementById('reunion-acta-preview').style.display='block';
    document.getElementById('reunion-acta-label').textContent='📄 Acta fotografiada — '+input.files[0].name.substring(0,25);
  };
  reader.readAsDataURL(input.files[0]);
}

// ── ADJUNTAR DOCUMENTOS ──
function abrirAdjuntarDocumento(){
  document.getElementById('modal-adjuntar-doc').style.display='block';
  document.getElementById('adj-msg').textContent='';
  document.getElementById('adj-desc').value='';
  document.getElementById('adj-archivo-label').textContent='Seleccionar archivo';
  window._adjFile=null;
  var sel=document.getElementById('adj-alumno-sel');
  if(sel&&sel.options.length<=1&&window.__students){
    sel.innerHTML='<option value="">— Seleccionar —</option>'+window.__students.map(function(s){return '<option value="'+s.id+'">'+s.full_name+'</option>';}).join('');
  }
}

function cerrarAdjuntarDocumento(){
  document.getElementById('modal-adjuntar-doc').style.display='none';
}

function seleccionarArchivoAdj(input){
  if(!input.files||!input.files[0])return;
  window._adjFile=input.files[0];
  document.getElementById('adj-archivo-label').textContent='📎 '+input.files[0].name.substring(0,35);
}

async function subirDocumentoAlumno(){
  var studentId=document.getElementById('adj-alumno-sel').value;
  var tipo=document.getElementById('adj-tipo').value;
  var desc=document.getElementById('adj-desc').value.trim();
  var msg=document.getElementById('adj-msg');
  var preview=document.getElementById('adj-analisis-preview');
  var btnGuardar=document.getElementById('adj-guardar-btn');
  preview.style.display='none';preview.innerHTML='';
  if(!studentId){msg.style.color='#C0392B';msg.textContent='Seleccioná un alumno';return;}
  if(!window._adjFile){msg.style.color='#C0392B';msg.textContent='Seleccioná un archivo';return;}
  if(!window.__sb){msg.style.color='#C0392B';msg.textContent='Sin conexión';return;}
  if(btnGuardar){btnGuardar.disabled=true;btnGuardar.textContent='Subiendo...';}
  msg.style.color='var(--gris)';msg.textContent='Subiendo...';
  var user=(await window.__sb.auth.getUser()).data.user;
  if(!user)return;
  var archivoAdj=window._adjFile;
  var ext=archivoAdj.name.split('.').pop();
  var nombre=(desc||tipo).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g,'').replace(/ /g,'_').substring(0,40)+'_'+fechaHoyArgentina()+'.'+ext;
  var path=user.id+'/'+studentId+'/docs/'+nombre;
  var {error}=await window.__sb.storage.from('evidencias').upload(path,archivoAdj);
  if(error){msg.style.color='#C0392B';msg.textContent='Error: '+error.message;if(btnGuardar){btnGuardar.disabled=false;btnGuardar.textContent='💾 Guardar en perfil del alumno';}return;}
  // Registrar como observación en el perfil (aviso genérico inmediato; el análisis del
  // CONTENIDO del documento, si es posible, se agrega después como una segunda observación)
  var textoObs='[Documento: '+tipo+(desc?' · '+desc:'')+' · '+new Date().toLocaleDateString('es-AR')+'] Archivado en el perfil del alumno.';
  await window.__sb.from('notas_rapidas').insert({student_id:studentId,teacher_id:user.id,content:textoObs});
  msg.style.color='var(--verde)';msg.textContent='✅ Documento guardado en el perfil';
  var archivoParaAnalizar=archivoAdj;
  window._adjFile=null;
  document.getElementById('adj-archivo').value='';
  document.getElementById('adj-archivo-label').textContent='Seleccionar archivo';
  document.getElementById('adj-desc').value='';

  // Analizar el contenido del documento y mostrar el resultado ANTES de cerrar el modal,
  // para que el docente vea qué se extrajo realmente (trazabilidad inmediata).
  var mimeType=archivoParaAnalizar.type||'';
  var extArchivo=(archivoParaAnalizar.name||'').split('.').pop().toLowerCase();
  var esAnalizable=mimeType==='application/pdf'||mimeType.indexOf('image/')===0||extArchivo==='doc'||extArchivo==='docx';
  if(esAnalizable&&_sget('huellaed_anthropic_key')){
    preview.style.display='block';
    preview.innerHTML='<div style="display:flex;align-items:center;gap:8px;color:var(--verde);"><span>⏳</span> Analizando el contenido del documento…</div>';
    if(btnGuardar)btnGuardar.textContent='Analizando…';
    var resumen=await analizarDocumentoAdjunto(archivoParaAnalizar,studentId,user.id,tipo,desc);
    if(resumen){
      preview.innerHTML='<div style="font-weight:700;color:var(--verde);margin-bottom:5px;">📋 Esto se extrajo del documento (ya guardado en el perfil del alumno):</div>'
        +'<div style="white-space:pre-wrap;">'+resumen+'</div>';
    }else{
      preview.innerHTML='<div style="color:var(--terracota);">⚠️ No se pudo extraer un resumen del documento (puede no ser legible, o hubo un error de conexión). El archivo de todas formas quedó guardado en el perfil.</div>';
    }
  }else if(!esAnalizable){
    preview.style.display='block';
    preview.innerHTML='<div style="color:var(--gris);">ℹ️ Este tipo de archivo (Word u otro) todavía no se puede analizar automáticamente — quedó archivado en el perfil, pero sin resumen de contenido.</div>';
  }
  if(btnGuardar){btnGuardar.disabled=false;btnGuardar.textContent='💾 Guardar en perfil del alumno';}
}

async function analizarDocumentoAdjunto(archivo,studentId,teacherId,tipo,desc){
  var apiKey=_sget('huellaed_anthropic_key');
  if(!apiKey){console.log('Sin clave de API: no se analizó el contenido del documento adjunto.');return null;}
  var mimeType=archivo.type||'';
  var ext=(archivo.name||'').split('.').pop().toLowerCase();
  var esPdf=mimeType==='application/pdf';
  var esImagen=mimeType.indexOf('image/')===0;
  var esWord=ext==='doc'||ext==='docx';
  if(!esPdf&&!esImagen&&!esWord){
    // Excel y otros formatos todavía no tienen soporte de lectura automática.
    console.log('Tipo de archivo no analizable automáticamente todavía:',mimeType);
    return null;
  }
  try{
    var contenidoMsg;
    if(esWord){
      // La API de Anthropic no acepta .docx como documento binario — hay que extraer el
      // texto plano en el navegador (mammoth.js, ya cargado en este proyecto) y mandarlo
      // como texto, en vez del archivo. Ver: docs de Anthropic, Files API, manejo de .docx.
      var arrayBuffer=await archivo.arrayBuffer();
      var resultadoMammoth=await mammoth.extractRawText({arrayBuffer:arrayBuffer});
      var textoWord=(resultadoMammoth.value||'').trim();
      if(!textoWord){
        console.log('No se pudo extraer texto del Word (puede estar vacío o ser un formato no soportado).');
        return null;
      }
      contenidoMsg={type:'text',text:'Contenido del documento Word:\n\n'+textoWord};
    }else if(esPdf){
      var base64=await new Promise(function(resolve,reject){
        var reader=new FileReader();
        reader.onload=function(){resolve(reader.result.split(',')[1]);};
        reader.onerror=reject;
        reader.readAsDataURL(archivo);
      });
      contenidoMsg={type:'document',source:{type:'base64',media_type:'application/pdf',data:base64}};
    }else{
      var base64Img=await new Promise(function(resolve,reject){
        var reader=new FileReader();
        reader.onload=function(){resolve(reader.result.split(',')[1]);};
        reader.onerror=reject;
        reader.readAsDataURL(archivo);
      });
      contenidoMsg={type:'image',source:{type:'base64',media_type:mimeType,data:base64Img}};
    }
    var instruccion='Este es un documento de tipo "'+tipo+'"'+(desc?' ("'+desc+'")':'')+' adjuntado al perfil de un alumno de escuela primaria en Argentina. Resumí en un párrafo breve (máximo 5 líneas) qué información relevante contiene para el seguimiento pedagógico del alumno (diagnósticos, recomendaciones, observaciones de especialistas, etc.). Si el documento no es legible o no tiene contenido relevante para seguimiento escolar, decilo explícitamente. No inventes información que no esté en el documento.';
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',max_tokens:600,
        messages:[{role:'user',content:[contenidoMsg,{type:'text',text:instruccion}]}]
      })
    });
    if(!res.ok){
      var ed=await res.json().catch(function(){return {};});
      throw new Error((ed.error&&ed.error.message)||'Error '+res.status);
    }
    var data=await res.json();
    var resumen=(data.content&&data.content[0]&&data.content[0].text)||'';
    if(resumen&&window.__sb){
      var textoObsAnalisis='[Análisis de documento: '+tipo+(desc?' · '+desc:'')+' · '+new Date().toLocaleDateString('es-AR')+']\n'+resumen;
      await window.__sb.from('notas_rapidas').insert({student_id:studentId,teacher_id:teacherId,content:textoObsAnalisis});
    }
    return resumen||null;
  }catch(eAnalisis){
    console.log('No se pudo analizar el contenido del documento adjunto:',eAnalisis);
    return null;
  }
}


