/* ==========================================================================
   contactojava.js
   Script principal de la página de Contacto — Haven Bar
   1. Configura los botones de WhatsApp (fijo y flotante)
   2. Controla el menú móvil (hamburguesa)
   3. Envía el formulario de contacto a Formspree por AJAX (sin recargar
      la página) y muestra el estado en español dentro del propio formulario
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- 1. Botón(es) de WhatsApp ----------
     CAMBIA SOLO LAS DOS LÍNEAS DE ABAJO POR TU NÚMERO Y MENSAJE REALES.
     Formato del número: solo dígitos, con código de país, SIN "+",
     espacios ni guiones. Ejemplo: "528112345678".
     Esta única configuración alimenta TODOS los botones de WhatsApp de la
     página (el de la sección de contacto y el flotante). */
  var WHATSAPP_NUMBER  = "525547810078";
  var WHATSAPP_MESSAGE = "Buenas, quiero hacer una reservación en su Bar Haven";

  (function configurarWhatsApp() {
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
    document.querySelectorAll(".whatsapp-link").forEach(function (link) {
      link.setAttribute("href", url);
    });
  })();

  /* ---------- 2. Menú móvil ---------- */
  (function menuMovil() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nav-principal');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var abierto = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
  })();

  /* ---------- 3. Formulario de contacto → Formspree ----------
     Envío por AJAX (fetch): si JavaScript falla o está desactivado, el
     <form> igual funciona porque conserva su action/method apuntando a
     Formspree (envío normal). Con JavaScript activo, el envío se hace sin
     recargar la página y el mensaje de estado aparece en .form-status. */
  (function formularioContacto() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var status = form.querySelector('.form-status');
    var boton = form.querySelector('button[type="submit"]');
    var textoOriginalBoton = boton ? boton.textContent : '';
    var campoCorreo = form.querySelector('#correo');
    var campoAsunto = form.querySelector('#asunto');

    function mostrarEstado(mensaje, esError) {
      status.textContent = mensaje;
      status.style.color = esError ? '#e07a7a' : '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validación nativa del navegador antes de enviar
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var datos = new FormData(form);

      // Para que las respuestas por correo lleguen directo a quien escribió
      if (campoCorreo && campoCorreo.value) {
        datos.set('_replyto', campoCorreo.value);
      }

      // Asunto del correo más descriptivo, según lo elegido en el select
      if (campoAsunto && campoAsunto.selectedOptions.length) {
        var textoAsunto = campoAsunto.selectedOptions[0].text;
        datos.set('_subject', 'Contacto Haven Bar — ' + textoAsunto);
      }

      if (boton) {
        boton.disabled = true;
        boton.textContent = 'Enviando…';
      }
      mostrarEstado('', false);

      fetch(form.action, {
        method: 'POST',
        body: datos,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            mostrarEstado('Gracias, tu mensaje fue enviado. Te contactaremos pronto.', false);
            form.reset();
          } else {
            return response.json().then(function (data) {
              var mensaje = (data && data.errors && data.errors.length)
                ? data.errors.map(function (err) { return err.message; }).join(', ')
                : 'No se pudo enviar el mensaje. Intenta de nuevo o escríbenos por WhatsApp.';
              throw new Error(mensaje);
            });
          }
        })
        .catch(function (error) {
          mostrarEstado(error.message || 'Ocurrió un error al enviar tu mensaje. Intenta de nuevo.', true);
        })
        .finally(function () {
          if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginalBoton;
          }
        });
    });
  })();

});
