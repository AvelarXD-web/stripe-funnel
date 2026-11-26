/**
 * ⚡ FUNNEL RADAR & SCROLL ANALYTICS TRACKER
 * Script ultra-leve de rastreamento para o funil ZapRadar
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
    utm_source: urlParams.get('utm_source') || sessionStorage.getItem('utm_source'),
    utm_campaign: urlParams.get('utm_campaign') || sessionStorage.getItem('utm_campaign'),
    utm_medium: urlParams.get('utm_medium') || sessionStorage.getItem('utm_medium'),
    utm_content: urlParams.get('utm_content') || sessionStorage.getItem('utm_content'),
  };
  if (urlParams.get('utm_source')) {
    try {
      sessionStorage.setItem('utm_source', urlParams.get('utm_source') || '');
      sessionStorage.setItem('utm_campaign', urlParams.get('utm_campaign') || '');
      sessionStorage.setItem('utm_medium', urlParams.get('utm_medium') || '');
      sessionStorage.setItem('utm_content', urlParams.get('utm_content') || '');
    } catch (e) {}
  }

  var firedEvents = {};

  function sendEvent(event, step, extra) {
    if (firedEvents[event] && !extra?.allowRepeat) return;
    firedEvents[event] = true;

    var payload = {
      sessionId: sessionId,
      event: event,
      step: step || event,
      utm: utm,
      scrollPercent: extra?.scrollPercent || 0,
      vslSeconds: extra?.vslSeconds || 0,
      extra: extra || {},
    };

    var jsonStr = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([jsonStr], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, blob);
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {
      try {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
          keepalive: true,
        }).catch(function () {});
      } catch (err) {}
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // DETECÇÃO AUTOMÁTICA DA ETAPA
  // ═════════════════════════════════════════════════════════════════════

  function init() {
    var isEtapa1 = !!document.getElementById('phone-form') || !!document.getElementById('vista-numero');
    var isResultado = window.location.pathname.indexOf('resultado') !== -1 || !!document.getElementById('countdown') || !!document.getElementById('display-phone');
    var isCheckout = window.location.pathname.indexOf('checkout') !== -1 || window.location.pathname === '/';

    // ──────────────────────────── ETAPA 1 (FORM + VSL) ────────────────────────────
    if (isEtapa1) {
      sendEvent('form_view', 'etapa_1_formulario');

      // Clique no botão de enviar número
      var submitBtn = document.getElementById('submit-btn');
      var phoneForm = document.getElementById('phone-form');

      function onPhoneSubmit() {
        sendEvent('form_submit', 'etapa_1_numero_enviado');
      }

      if (submitBtn) submitBtn.addEventListener('click', onPhoneSubmit);
      if (phoneForm) phoneForm.addEventListener('submit', onPhoneSubmit);

      // Transição para a VSL (#vista-analise desocultada)
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
        if (!vistaAnalise.hasAttribute('hidden')) {
          startVslTracking();
        } else {
          var observer = new MutationObserver(function () {
            if (!vistaAnalise.hasAttribute('hidden')) {
              startVslTracking();
            }
          });
          observer.observe(vistaAnalise, { attributes: true, attributeFilter: ['hidden', 'style'] });
        }
      }

      // Observar botão de CTA da VSL se revelando
      var ctaSlot = document.querySelector('[data-cta-slot]') || document.querySelector('.cta-slot');
      if (ctaSlot) {
        var ctaObserver = new MutationObserver(function () {
          if (!ctaSlot.hasAttribute('hidden') && ctaSlot.style.display !== 'none') {
            sendEvent('vsl_cta_revealed', 'vsl_cta_liberado');
          }
        });
        ctaObserver.observe(ctaSlot, { attributes: true, attributeFilter: ['hidden', 'style'] });

        // Clique no CTA da VSL
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

        var percent = Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);
        if (isNaN(percent) || percent < 0) percent = 0;

        if (percent > maxScroll) {
          maxScroll = percent;
          if (maxScroll >= 25) sendEvent('scroll_25', 'resultado_scroll_25', { scrollPercent: maxScroll });
          if (maxScroll >= 50) sendEvent('scroll_50', 'resultado_scroll_50', { scrollPercent: maxScroll });
          if (maxScroll >= 75) sendEvent('scroll_75', 'resultado_scroll_75', { scrollPercent: maxScroll });
          if (maxScroll >= 90) sendEvent('scroll_100', 'resultado_scroll_100', { scrollPercent: maxScroll });
        }
      }

      window.addEventListener('scroll', function () {
        if (!scrollTimer) {
          scrollTimer = setTimeout(function () {
            checkScroll();
            scrollTimer = null;
          }, 200);
        }
      }, { passive: true });

      // 2. IntersectionObserver: O botão de compra realmente APARECEU na tela do usuário?
      var btns = document.querySelectorAll('#checkout-btn, .checkout-btn, a.checkout-link');
      if ('IntersectionObserver' in window && btns.length > 0) {
        var btnObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              sendEvent('btn_in_view', 'resultado_botao_visivel_na_tela');
              btnObserver.disconnect();
            }
          });
        }, { threshold: 0.1 });

        btns.forEach(function (b) { btnObserver.observe(b); });
      }

      // 3. Clique no botão de ir para o checkout
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          sendEvent('btn_clicked', 'resultado_botao_clicado');
        });
      });
    }

    // ──────────────────────────── CHECKOUT ────────────────────────────
    if (isCheckout) {
      // Se tiver elemento de formulário de cartão ou stripe
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
