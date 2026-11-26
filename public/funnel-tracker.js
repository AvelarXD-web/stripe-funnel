/**
 * ⚡ FUNNEL RADAR & SCROLL ANALYTICS TRACKER (v2.0 - Triple Redundancy)
 * Rastreamento à prova de falhas: Image Beacon + SendBeacon + Fetch CORS
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://funnel-checkout-27-whats-psi.vercel.app/api/funnel-analytics';

  // 1. Session ID estável
  var sidKey = 'funnel_analytics_sid';
  var sessionId = '';
  try {
    sessionId = sessionStorage.getItem(sidKey) || localStorage.getItem(sidKey);
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem(sidKey, sessionId);
      localStorage.setItem(sidKey, sessionId);
    }
  } catch (e) {
    sessionId = 's_' + Math.random().toString(36).substring(2, 10);
  }

  // 2. Extração de UTMs
  var urlParams = new URLSearchParams(window.location.search);
  var utm = {
    utm_source: urlParams.get('utm_source') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_content: urlParams.get('utm_content') || '',
  };
  try {
    if (utm.utm_source) {
      sessionStorage.setItem('utm_source', utm.utm_source);
      sessionStorage.setItem('utm_campaign', utm.utm_campaign);
      sessionStorage.setItem('utm_medium', utm.utm_medium);
      sessionStorage.setItem('utm_content', utm.utm_content);
    } else {
      utm.utm_source = sessionStorage.getItem('utm_source') || '';
      utm.utm_campaign = sessionStorage.getItem('utm_campaign') || '';
      utm.utm_medium = sessionStorage.getItem('utm_medium') || '';
      utm.utm_content = sessionStorage.getItem('utm_content') || '';
    }
  } catch (e) {}

  var firedEvents = {};

  function sendEvent(event, step, extra) {
    if (!extra) extra = {};
    if (firedEvents[event] && !extra.allowRepeat) return;
    firedEvents[event] = true;

    var scrollVal = extra.scrollPercent || 0;
    var vslVal = extra.vslSeconds || 0;

    // MÉTODO 1: Pixel Ping GET (100% imune a CORS, nunca é bloqueado por navegadores móveis)
    try {
      var img = new Image();
      var qs = 'sid=' + encodeURIComponent(sessionId) +
               '&event=' + encodeURIComponent(event) +
               '&step=' + encodeURIComponent(step || event) +
               '&scroll=' + encodeURIComponent(scrollVal) +
               '&vsl=' + encodeURIComponent(vslVal) +
               '&t=' + Date.now();
      if (utm.utm_source) qs += '&utm_source=' + encodeURIComponent(utm.utm_source);
      if (utm.utm_campaign) qs += '&utm_campaign=' + encodeURIComponent(utm.utm_campaign);
      if (utm.utm_medium) qs += '&utm_medium=' + encodeURIComponent(utm.utm_medium);
      if (utm.utm_content) qs += '&utm_content=' + encodeURIComponent(utm.utm_content);
      img.src = ENDPOINT + '?' + qs;
    } catch (e) {}

    // MÉTODO 2: Payload POST com sendBeacon (texto puro para não disparar OPTIONS preflight)
    var payload = {
      sessionId: sessionId,
      event: event,
      step: step || event,
      utm: utm,
      scrollPercent: scrollVal,
      vslSeconds: vslVal,
      extra: extra,
    };
    var jsonStr = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([jsonStr], { type: 'text/plain' });
        navigator.sendBeacon(ENDPOINT, blob);
      } else if (window.fetch) {
        fetch(ENDPOINT, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: jsonStr,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // ═════════════════════════════════════════════════════════════════════
  // DETECÇÃO AUTOMÁTICA DA ETAPA
  // ═════════════════════════════════════════════════════════════════════

  function init() {
    var href = (window.location.href || '').toLowerCase();
    var path = (window.location.pathname || '').toLowerCase();

    var isResultado = path.indexOf('resultado') !== -1 ||
                      href.indexOf('resultado') !== -1 ||
                      !!document.getElementById('countdown') ||
                      !!document.getElementById('display-phone');

    var isEtapa1 = !isResultado && (
      !!document.getElementById('phone-form') ||
      !!document.getElementById('vista-numero') ||
      !!document.getElementById('submit-btn') ||
      path.indexOf('/2') !== -1 ||
      path.indexOf('/lat') !== -1
    );

    var isCheckout = path.indexOf('checkout') !== -1 || (path === '/' && !isEtapa1 && !isResultado);

    // ──────────────────────────── ETAPA 1 (FORM + VSL) ────────────────────────────
    if (isEtapa1) {
      sendEvent('form_view', 'etapa_1_formulario');

      var submitBtn = document.getElementById('submit-btn');
      var phoneForm = document.getElementById('phone-form');

      function onPhoneSubmit() {
        sendEvent('form_submit', 'etapa_1_numero_enviado');
      }

      if (submitBtn) submitBtn.addEventListener('click', onPhoneSubmit);
      if (phoneForm) phoneForm.addEventListener('submit', onPhoneSubmit);

      // Iniciar contagem de VSL quando #vista-analise aparecer
      var vistaAnalise = document.getElementById('vista-analise');
      var vslStartTime = 0;
      var vslInterval = null;

      function startVslTracking() {
        if (vslStartTime) return;
        vslStartTime = Date.now();
        sendEvent('vsl_start', 'etapa_2_vsl_iniciada');

        vslInterval = setInterval(function () {
          var elapsedSec = Math.floor((Date.now() - vslStartTime) / 1000);
          if (elapsedSec >= 30) sendEvent('vsl_30s', 'vsl_30s', { vslSeconds: elapsedSec });
          if (elapsedSec >= 60) sendEvent('vsl_1m', 'vsl_1m', { vslSeconds: elapsedSec });
          if (elapsedSec >= 120) sendEvent('vsl_2m', 'vsl_2m', { vslSeconds: elapsedSec });
          if (elapsedSec >= 180) sendEvent('vsl_3m', 'vsl_3m', { vslSeconds: elapsedSec });
          if (elapsedSec >= 300) sendEvent('vsl_5m', 'vsl_5m', { vslSeconds: elapsedSec });
          if (elapsedSec >= 465) sendEvent('vsl_7m45s', 'vsl_7m45s', { vslSeconds: elapsedSec });
        }, 5000);
      }

      if (vistaAnalise) {
        if (!vistaAnalise.hasAttribute('hidden') && vistaAnalise.style.display !== 'none') {
          startVslTracking();
        } else if (window.MutationObserver) {
          var observer = new MutationObserver(function () {
            if (!vistaAnalise.hasAttribute('hidden') && vistaAnalise.style.display !== 'none') {
              startVslTracking();
            }
          });
          observer.observe(vistaAnalise, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
        }
      }

      // Observar botão de CTA da VSL quando liberado
      var ctaSlot = document.querySelector('[data-cta-slot]') || document.querySelector('.cta-slot') || document.getElementById('cta-btn-vsl');
      if (ctaSlot) {
        if (window.MutationObserver) {
          var ctaObserver = new MutationObserver(function () {
            if (!ctaSlot.hasAttribute('hidden') && ctaSlot.style.display !== 'none') {
              sendEvent('vsl_cta_revealed', 'vsl_cta_liberado');
            }
          });
          ctaObserver.observe(ctaSlot, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
        }
        ctaSlot.addEventListener('click', function () {
          sendEvent('vsl_cta_clicked', 'vsl_cta_clicado');
        });
      }
    }

    // ──────────────────────────── ETAPA 2 (RESULTADO) ────────────────────────────
    if (isResultado) {
      sendEvent('resultado_view', 'etapa_3_resultado_aberto');

      // 1. Rastreamento de Profundidade de Scroll
      var maxScroll = 0;
      var scrollTimer = null;

      function checkScroll() {
        var h = document.documentElement;
        var b = document.body;
        var st = 'scrollTop';
        var sh = 'scrollHeight';

        var scrollHeight = Math.max(h[sh] || 0, b[sh] || 0);
        var clientHeight = h.clientHeight || window.innerHeight || 1;
        var currentScroll = (h[st] || b[st] || window.pageYOffset || 0);

        var totalDist = scrollHeight - clientHeight;
        var percent = totalDist > 0 ? Math.round((currentScroll / totalDist) * 100) : 0;
        if (isNaN(percent) || percent < 0) percent = 0;

        if (percent > maxScroll) {
          maxScroll = percent;
          if (maxScroll >= 25) sendEvent('scroll_25', 'resultado_scroll_25', { scrollPercent: maxScroll });
          if (maxScroll >= 50) sendEvent('scroll_50', 'resultado_scroll_50', { scrollPercent: maxScroll });
          if (maxScroll >= 75) sendEvent('scroll_75', 'resultado_scroll_75', { scrollPercent: maxScroll });
          if (maxScroll >= 90) sendEvent('scroll_100', 'resultado_scroll_100', { scrollPercent: maxScroll });
        }

        // Fallback: Verificar se o botão entrou na tela durante o scroll
        checkButtonVisibility();
      }

      window.addEventListener('scroll', function () {
        if (!scrollTimer) {
          scrollTimer = setTimeout(function () {
            checkScroll();
            scrollTimer = null;
          }, 200);
        }
      }, { passive: true });

      // 2. Visibilidade do Botão de Compra
      var btns = document.querySelectorAll('#checkout-btn, .checkout-btn, a.checkout-link');

      function checkButtonVisibility() {
        if (firedEvents['btn_in_view']) return;
        for (var i = 0; i < btns.length; i++) {
          var rect = btns[i].getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom >= 0) {
            sendEvent('btn_in_view', 'resultado_botao_visivel_na_tela');
            break;
          }
        }
      }

      if ('IntersectionObserver' in window && btns.length > 0) {
        var btnObserver = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              sendEvent('btn_in_view', 'resultado_botao_visivel_na_tela');
              btnObserver.disconnect();
              break;
            }
          }
        }, { threshold: 0.1 });

        for (var j = 0; j < btns.length; j++) {
          btnObserver.observe(btns[j]);
        }
      }

      // 3. Clique no botão de ir para o checkout
      for (var k = 0; k < btns.length; k++) {
        btns[k].addEventListener('click', function () {
          sendEvent('btn_clicked', 'resultado_botao_clicado');
        });
      }

      // Check inicial de scroll/visibilidade
      setTimeout(checkScroll, 1000);
    }

    // ──────────────────────────── CHECKOUT ────────────────────────────
    if (isCheckout) {
      if (document.getElementById('payment-element') || document.querySelector('form')) {
        sendEvent('checkout_view', 'checkout_aberto');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
