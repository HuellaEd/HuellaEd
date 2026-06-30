# MAPEO DE DEPENDENCIAS DEL PERFIL ACADÉMICO FUNCIONAL (PAF)

> Generado: 2026-06-26  
> Fuente auditada: `index.html` (estado del repo en commit `c495efc`)  
> Objetivo: checklist de seguridad previo a modularización en core.js / perfil-alumno.js / generador.js / registro.js / evidencia.js

---

## ⚠️ Aclaraciones previas al mapa

### Edge Function `generar-perfil` — NO es parte del PAF
- `supabase/functions/generar-perfil/index.ts` existe pero **solo la llama `generarBoletinEnApp()` (L2579)**.
- `generarPerfilAcademico()` llama directamente a `api.anthropic.com` desde el browser (L3483).
- No hay duplicación de lógica de Supabase entre cliente y servidor: la Edge Function solo envuelve el call a Claude (recibe `prompt`, devuelve `text`), sin consultar ninguna tabla.

### `evidencias` es Storage, no tabla SQL
- No existe tabla `evidencias`. Los archivos se guardan en `storage.from('evidencias')`.
- La referencia textual (descripción, análisis) de cada evidencia se escribe como observación en `notas_rapidas`.

### Nombres reales de tablas (vs. nombres en auditoría)
| Nombre en auditoría | Nombre real en Supabase |
|---|---|
| calificaciones | `grades` |
| asistencia | `attendance` |
| perfil_diferencial | `differential_profiles` |
| evidencias | Storage bucket `evidencias` |
| notas_rapidas | `notas_rapidas` ✓ |

---

## `generarPerfilAcademico()` — Fuentes de datos (L3334–L3593)

La función construye el prompt del PAF combinando 5 fuentes:

| Fuente | Cómo se obtiene | Tabla/Fuente Supabase |
|---|---|---|
| Notas del trimestre | Variable global `gradesData[_perfilStudentId]` (cargada por `initGrades()`) | `grades` |
| Observaciones del docente | SELECT directo a Supabase (L3367–L3372) | `notas_rapidas` |
| Ficha de conocimiento | SELECT directo a Supabase (L3403–L3406) | `differential_profiles` |
| Perfil diferencial | Mismo SELECT que ficha (campos `descripcion`, `necesidades`, `adaptaciones`) | `differential_profiles` |
| Asistencia | SELECT directo a Supabase (L3434–L3437) | `attendance` |

**Después de generar**, la función escribe en:
- `perfiles_generados` — INSERT del texto del PAF (L3524, tipo `'academico'`)
- `perfiles_generados` — INSERT de trazabilidad (L3570, tipo `'academico_traza'`)

---

## Mapa completo: tabla → escrituras → cómo las lee el PAF

### `notas_rapidas`

**Cómo la lee `generarPerfilAcademico()`:**  
SELECT `content, created_at` WHERE `teacher_id = user.id AND student_id = _perfilStudentId` ORDER BY `created_at DESC` LIMIT 20 (L3367–3372).  
Esto captura automáticamente todo lo que escriben las funciones de abajo, porque todas usan las mismas columnas `teacher_id + student_id + content`.

**Funciones que escriben (INSERT) — 12 implementaciones:**

| # | Función | Línea | Qué registra |
|---|---|---|---|
| 1 | `analizarConGemini()` | L1524 | Análisis de texto de lectura con Gemini |
| 2 | `guardarObservacionAlumno()` | L3908 | Observación manual desde perfil del alumno |
| 3 | `transcribirYGuardarLecturaPendiente()` | L5495 | Análisis de grabación de lectura (de la cola) |
| 4 | `subirYTranscribirAudioLectura()` | L5560 | Transcripción de grabación de lectura en tiempo real |
| 5 | `subirYAnalizarEvidencia()` | L5794 | Evidencia de foto archivada (aviso genérico) |
| 6 | `_analizarFotoEvidencia()` | L5836 | Análisis IA de foto de evidencia |
| 7 | `guardarReunionSupabase()` | L5923 | Acta/resumen de reunión familiar |
| 8 | `guardarNotaLocal()` | L6168 | Nota rápida desde modal Notas (prefijo `[NR·]`) |
| 9 | `guardarObservacionModal()` | L6356 | Nota rápida desde card del dashboard |
| 10 | `subirDocumentoAlumno()` | L6611 | Documento adjunto archivado (aviso genérico) |
| 11 | `analizarDocumentoAdjunto()` | L6703 | Análisis IA del contenido de documento adjunto |
| 12 | `generarDEI()` | L6968 | DEI generado y descargado |

**Otras operaciones sobre `notas_rapidas`:**
- UPDATE: `obsGuardar()` L3884 — edición de observación existente
- DELETE: `obsBorrar()` L3892 — elimina observación desde perfil
- DELETE: `borrarNota()` L6198 — elimina nota rápida desde modal Notas

**Nota sobre conteo histórico:** La auditoría del 25/06 reportó 11 INSERTs. El commit `a05d8ce` agregó `guardarObservacionModal()` (L6356), llevando el total a 12. El fix `1e854d7` no eliminó ningún INSERT, solo corrigió `user_id → teacher_id` en los afectados.

---

### `attendance`

**Cómo la lee `generarPerfilAcademico()`:**  
SELECT `status` WHERE `teacher_id = userFicha.id AND student_id = _perfilStudentId` (L3434–3437). Calcula % de presentes sobre total de registros.

**Funciones que escriben:**

| Función | Línea | Operación |
|---|---|---|
| `guardarAsistencia()` | L6127 | UPSERT (conflict: `student_id,date`) |
| (importación masiva) | L7334 | UPSERT (conflict: `student_id,date`) |

---

### `differential_profiles`

**Cómo la lee `generarPerfilAcademico()`:**  
SELECT de 12 campos (L3403–3406) con `.maybeSingle()`. Usa campos de conocimiento pedagógico (`como_aprende`, `matematica`, etc.) y campos de perfil diferencial (`descripcion`, `necesidades`, `adaptaciones`).

**Funciones que escriben:**

| Función | Línea | Operación |
|---|---|---|
| `guardarPerfilDif()` | L3811 | UPSERT |
| `guardarFicha()` | L4221 | UPSERT |

---

### `grades`

**Cómo la lee `generarPerfilAcademico()`:**  
No hace SELECT directo. Lee la variable global `gradesData[_perfilStudentId]` (L3344), cargada por `initGrades()` al abrir el perfil (L3473–3475).

**Funciones que escriben:**

| Función | Línea | Operación |
|---|---|---|
| `guardarNotas()` | L4606 | UPSERT (conflict: `student_id,subject_id,period`) |

---

### `perfiles_generados`

**Cómo la lee `generarPerfilAcademico()`:**  
No la lee directamente. Solo escribe en ella. La lectura es responsabilidad de:
- `cargarUltimoPerfilAcademico()` L3263 — carga el último PAF guardado
- `verTrazabilidadPAF()` L3230 — muestra la trazabilidad del PAF
- `cargarAvisosAutomaticos()` L1843 — detecta PAFs desactualizados para alertas

**Funciones que escriben:**

| Función | Línea | Operación | tipo |
|---|---|---|---|
| `generarPerfilAcademico()` | L3524 | INSERT | `'academico'` |
| `generarPerfilAcademico()` | L3570 | INSERT | `'academico_traza'` |
| `generarBoletinEnApp()` (vía Edge Function) | L7094 | INSERT | `'aulico_grupal'` |
| (actualización inline) | L7590 | INSERT | `'aulico_grupal'` |

---

### Storage bucket `evidencias`

**No es leído por `generarPerfilAcademico()`** — el PAF no accede a archivos de evidencia directamente. Las evidencias llegan al PAF solo si alguna función de análisis (`_analizarFotoEvidencia()` o `analizarDocumentoAdjunto()`) describió su contenido como observación en `notas_rapidas`, que sí es leída por el PAF.

**Funciones que escriben al bucket:**

| Función | Línea | Qué sube |
|---|---|---|
| `subirAudioLecturaSinTranscribir()` | L5419 | Audio .webm de lectura |
| `subirYTranscribirAudioLectura()` | L5515 | Audio .webm de lectura |
| `guardarFotosMultiples()` | L5667 | Fotos de evidencia múltiple |
| `subirYAnalizarEvidencia()` | L5789 | Foto de evidencia individual |
| `guardarReunionSupabase()` | L5930 | Acta de reunión (archivo) |
| `subirDocumentoAlumno()` | L6606 | Documento adjunto (PDF/imagen) |

---

## Dependencias críticas para modularización

Al separar en módulos, estas dependencias cruzadas requieren atención:

1. **`gradesData` (global)** — `generarPerfilAcademico()` lee esta variable. Si `grades` se mueve a `registro.js`, `perfil-alumno.js` necesita importar `gradesData` o `initGrades()`.

2. **`_perfilStudentId` (global)** — usada por `generarPerfilAcademico()`, `guardarObservacionAlumno()`, `obsGuardar()`, `obsBorrar()`, y múltiples funciones del perfil. Debe estar en `core.js` o en el estado compartido.

3. **`window.__sb` (cliente Supabase global)** — todas las funciones de escritura dependen de él. Debe inicializarse en `core.js` antes que cualquier otro módulo.

4. **`notas_rapidas` como bus de datos** — 12 funciones de 4 módulos distintos (registro, evidencia, perfil-alumno, generador) escriben en la misma tabla, que es la principal fuente del PAF. Cualquier cambio en el esquema de esa tabla afecta a todos los módulos simultáneamente.

5. **`gradesPeriodo` (global)** — definida en `index.html` L4313 (`var gradesPeriodo='1'`). La leen `abrirPerfilAcademico()` y `generarPerfilAcademico()` (en `perfil-alumno.js`) y también funciones de `registro.js`. **No se movió a `core.js` en la sesión de registro.js ni en la de perfil-alumno.js** — se deja en `index.html` como global hasta que se limpie el inline. Mover a `core.js` cuando llegue esa sesión.

6. **`generarInforme()` — candidata a `generador.js`** — actualmente en `perfil-alumno.js` (Bloque C, ~L3619–3738). Llama a Claude API igual que `generarPerfilAcademico()`. Se dejó en `perfil-alumno.js` porque está acoplada al DOM del modal de perfil (`perf-body`, `modal-informe`, `_perfilStudentId`). Mover a `generador.js` cuando se cree ese módulo.
