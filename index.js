<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>🚨 Reporte de Mantenimiento</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  <style>
    :root {
      --bg: #faf8f2;
      --card-bg: #fff8e1;
      --text: #333;
      --label: #6F4E37;
      --border: #e0e0e0;
      --accent: #6F4E37;
      --accent-hover: #563C2D;
      --radius: 8px;
      --spacing: 1rem;
      --font-body: 'Inter', sans-serif;
      --font-heading: 'Playfair Display', serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      background: var(--bg);
      font-family: var(--font-body);
    }
    .container {
      background: var(--card-bg);
      max-width: 480px;
      margin: 1rem auto;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .logo {
      display: block;
      margin: 0 auto 1rem;
      width: 300px;
    }
    h2 {
      text-align: center;
      color: var(--label);
      font-family: var(--font-heading);
    }
    label {
      font-weight: 600;
      display: block;
      margin-top: 1rem;
      color: var(--label);
    }
    input, select, textarea {
      width: 100%; padding: 0.75rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      font-family: var(--font-body);
    }
    input[readonly] { background-color: #eee; }
    input[type="hidden"] { display: none; }
    button {
      width: 100%;
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--accent);
      color: white;
      border: none;
      font-weight: bold;
      font-family: var(--font-heading);
      font-size: 1rem;
      border-radius: var(--radius);
      cursor: pointer;
    }
    button:hover { background: var(--accent-hover); }
    .disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="logo LM mantenimientocafe.png" class="logo" />
    <h2>🚨 Reporte de Mantenimiento</h2>
    <form id="form">
      <!-- 1) ID y chat_id siempre presentes, no editables salvo modo manual -->
      <label for="reportId">ID del Reporte</label>
      <input type="text" id="reportId" readonly />

      <label for="chat_id">Chat ID</label>
      <input type="text" id="chat_id" />

      <!-- 2) SELECCIÓN OBLIGATORIA DE TIENDA (lo primero que se debe hacer) -->
      <label for="tienda">Tienda</label>
      <select id="tienda" required>
        <option value="">Seleccione una tienda</option>
        <!-- <option>pobladas dinámicamente en JS</option> -->
      </select>

      <!-- Campos de ubicación (visibles) y coordenadas (ocultas) para enviar a Supabase -->
      <label for="ubicacion">Ubicación</label>
      <input type="text" id="ubicacion" readonly />

      <input type="hidden" id="latitud" name="lat" />
      <input type="hidden" id="longitud" name="lng" />

      <!-- El resto de campos quedan deshabilitados hasta que el usuario elija una tienda -->
      <label for="tipoProblema">Tipo de problema</label>
      <input type="text" id="tipoProblema" required disabled />

      <label for="prioridad">Prioridad</label>
      <select id="prioridad" required disabled>
        <option value="">Seleccione prioridad</option>
        <option>Alta</option>
        <option>Media</option>
        <option>Baja</option>
      </select>

      <label for="descripcion">Descripción</label>
      <textarea id="descripcion" required disabled></textarea>

      <label for="evidencia">Evidencia (máx. 6 archivos)</label>
      <input type="file" id="evidencia" multiple accept="image/*,video/*" disabled />

      <label for="tecnicoAsignado">Técnico asignado</label>
      <select id="tecnicoAsignado" required disabled>
        <option value="">Seleccione técnico</option>
      </select>

      <div class="form-group" id="tecnicoChatManual" style="display: none;">
        <label for="chat_id_tecnico">Chat ID del Técnico</label>
        <input type="text" id="chat_id_tecnico" />
      </div>

      <button type="submit" id="submitBtn" class="disabled">Enviar Reporte</button>
    </form>
  </div>

  <script>
    const tg = window.Telegram.WebApp;
    const supabase = window.supabase.createClient(
      'https://gaiqdzjctyscufkljxvm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaXFkempjdHlzY3Vma2xqeHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU1NDUsImV4cCI6MjA2MzY4MTU0NX0._FvgAfqrHVzQtlPpFpPEl6HcGCnOQka2nfhRzT1LUcQ'
    );

    // 1. Arreglo con datos de las tiendas (ejemplos; completa las 110 tiendas con su nombre, técnico único, ubicación, lat y lng)
    const storesData = [
      {
        nombre: "Tienda Centro Histórico",
        técnico: "Baron",
        ubicacion: "Calle 5 de Mayo #123, CDMX",
        lat: 19.4333,
        lng: -99.1333
      },
      {
        nombre: "Tienda Polanco",
        técnico: "Cecilio",
        ubicacion: "Campos Elíseos #456, CDMX",
        lat: 19.4361,
        lng: -99.1998
      },
      {
        nombre: "Tienda Coyoacán",
        técnico: "Baron",
        ubicacion: "Av. Universidad #789, CDMX",
        lat: 19.3460,
        lng: -99.1620
      },
      {
        nombre: "Tienda La Condesa",
        técnico: "Cecilio",
        ubicacion: "Av. Tamaulipas #101, CDMX",
        lat: 19.4123,
        lng: -99.1737
      },
      {
        nombre: "Tienda San Ángel",
        técnico: "Baron",
        ubicacion: "Av. Revolución #202, CDMX",
        lat: 19.3295,
        lng: -99.1870
      },
      {
        nombre: "Tienda Roma Norte",
        técnico: "Cecilio",
        ubicacion: "Alvaro Obregón #303, CDMX",
        lat: 19.4192,
        lng: -99.1647
      },
      {
        nombre: "Tienda Tacubaya",
        técnico: "Baron",
        ubicacion: "Av. Revolución #404, CDMX",
        lat: 19.4097,
        lng: -99.1895
      },
      {
        nombre: "Tienda Del Valle",
        técnico: "Cecilio",
        ubicacion: "Av. Insurgentes Sur #505, CDMX",
        lat: 19.3625,
        lng: -99.1841
      },
      {
        nombre: "Tienda Narvarte",
        técnico: "Baron",
        ubicacion: "Av. Universidad #606, CDMX",
        lat: 19.3884,
        lng: -99.1669
      },
      {
        nombre: "Tienda Xochimilco",
        técnico: "Cecilio",
        ubicacion: "Av. Guadalupe I. Ramírez #707, CDMX",
        lat: 19.2621,
        lng: -99.1205
      },
      // …PROSIGUE AÑADIENDO EL RESTO DE LAS TIENDAS (hasta 110 en total)…
    ];

    tg.ready();

    document.addEventListener('DOMContentLoaded', () => {
      const chatId = tg?.initDataUnsafe?.user?.id || '';
      const modoManual = new URLSearchParams(location.search).get('modo') === 'manual';

      // 2. Setear ID del reporte y chat_id del usuario (lectura/solo lectura según modo manual)
      document.getElementById('reportId').value = crypto.randomUUID();
      document.getElementById('chat_id').value = chatId;
      document.getElementById('chat_id').readOnly = !modoManual;
      document.getElementById('reportId').readOnly = !modoManual;

      // 3. Mostrar campo de chat_id_tecnico sólo en modo manual
      const tecnicoChatGroup = document.getElementById('tecnicoChatManual');
      const tecnicoChatInput = document.getElementById('chat_id_tecnico');
      if (modoManual) {
        tecnicoChatInput.readOnly = false;
        tecnicoChatGroup.style.display = 'block';
      }

      // 4. Llenar el select de tiendas
      const tiendaSelect = document.getElementById('tienda');
      storesData.forEach(store => {
        const opt = document.createElement('option');
        opt.value = store.nombre;
        opt.textContent = store.nombre;
        tiendaSelect.appendChild(opt);
      });

      // 5. Función que habilita o deshabilita los campos del formulario
      const camposParaHabilitar = [
        'tipoProblema',
        'prioridad',
        'descripcion',
        'evidencia',
        'tecnicoAsignado',
      ].map(id => document.getElementById(id));
      const submitBtn = document.getElementById('submitBtn');

      function setCamposDisabled(state) {
        camposParaHabilitar.forEach(c => {
          c.disabled = state;
        });
        if (state) submitBtn.classList.add('disabled');
        else submitBtn.classList.remove('disabled');
      }

      // Al inicio, bloquear todo menos la tienda
      setCamposDisabled(true);

      // 6. Escuchar cambio de tienda
      tiendaSelect.addEventListener('change', () => {
        const sel = tiendaSelect.value;
        const ubicacionInput = document.getElementById('ubicacion');
        const latInput = document.getElementById('latitud');
        const lngInput = document.getElementById('longitud');
        const tecnicoSelect = document.getElementById('tecnicoAsignado');

        if (!sel) {
          // Si no hay tienda seleccionada, dejar todo bloqueado y limpiar valores
          ubicacionInput.value = '';
          latInput.value = '';
          lngInput.value = '';
          tecnicoSelect.innerHTML = '<option value="">Seleccione técnico</option>';
          tecnicoChatInput.value = '';
          setCamposDisabled(true);
        } else {
          // Hay tienda seleccionada: habilitar los campos
          setCamposDisabled(false);

          // Buscar la tienda en storesData
          const tiendaObj = storesData.find(s => s.nombre === sel);
          if (tiendaObj) {
            // Rellenar ubicación y coordenadas
            ubicacionInput.value = tiendaObj.ubicacion;
            latInput.value = tiendaObj.lat;
            lngInput.value = tiendaObj.lng;

            // Rellenar técnicoAsignado con el técnico único de esa tienda
            tecnicoSelect.innerHTML = '<option value="">Seleccione técnico</option>';
            const optTec = document.createElement('option');
            optTec.value = tiendaObj.técnico;
            optTec.textContent = tiendaObj.técnico;
            tecnicoSelect.appendChild(optTec);

            // Si no es modo manual, asignar automáticamente chat_id_tecnico
            tecnicoSelect.addEventListener('change', () => {
              if (!modoManual) {
                // Mapeo de técnicos a sus chat_ids
                let idTec = '';
                if (tiendaObj.técnico === 'Baron') idTec = '7939979525';
                else if (tiendaObj.técnico === 'Cecilio') idTec = '7939979526';
                else idTec = '';
                tecnicoChatInput.value = idTec;
              }
            });
          }
        }
      });
    });

    // 7. Función para subir cada archivo a Supabase
    async function subirArchivo(file, path) {
      const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
      const filename = `${crypto.randomUUID()}.${extension}`;
      const fullPath = `${path}/${filename}`;
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(fullPath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('evidencias').getPublicUrl(fullPath);
      return data.publicUrl;
    }

    // 8. Envío del formulario
    document.getElementById('form').addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const id = document.getElementById('reportId').value;
      const chat_id = document.getElementById('chat_id').value;
      const chat_id_tecnico = document.getElementById('chat_id_tecnico').value;
      const tienda = document.getElementById('tienda').value;
      const tipoProblema = document.getElementById('tipoProblema').value;
      const prioridad = document.getElementById('prioridad').value;
      const descripcion = document.getElementById('descripcion').value;
      const tecnicoAsignado = document.getElementById('tecnicoAsignado').value;
      const ubicacion = document.getElementById('ubicacion').value;
      const lat = document.getElementById('latitud').value;
      const lng = document.getElementById('longitud').value;

      const evidenciaInput = document.getElementById('evidencia');
      const files = Array.from(evidenciaInput.files);
      if (files.length > 6) {
        return alert('Máximo 6 archivos');
      }

      try {
        const urls = [];
        for (const f of files) {
          const url = await subirArchivo(f, `Reportes/${id}`);
          urls.push(url);
        }

        const { error } = await supabase.from('Reportes').insert([{
          id,
          chat_id,
          chat_id_tecnico,
          tienda,
          tipoProblema,
          prioridad,
          descripcion,
          tecnicoAsignado,
          fecha: new Date().toISOString(),
          ubicacion,
          lat,
          lng,
          evidencia: urls
        }]);

        if (error) throw error;
        alert('✅ Reporte enviado con éxito');
        form.reset();

        // Limpiar campos de ubicación, lat/lng y técnicos
        document.getElementById('ubicacion').value = '';
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        document.getElementById('tecnicoAsignado').innerHTML = '<option value="">Seleccione técnico</option>';
        document.getElementById('chat_id_tecnico').value = '';
        // Mantener ID y chat_id iniciales; si hay modo manual, se puede volver a editar
      } catch (err) {
        console.error('Error:', err);
        alert('❌ Error al enviar el reporte.');
      }
    });
  </script>
</body>
</html>
