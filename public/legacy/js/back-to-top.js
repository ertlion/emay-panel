(function ($) {
	$(function () {
	  'use strict';
  
	  if (window.__kdBackToTopInit) return;
	  window.__kdBackToTopInit = true;
  
	  $.easing.easeOutCubic = function (p) { return 1 - Math.pow(1 - p, 3); };
  
	  const doc = document;
	  const $win = $(window);
	  const $btn = $('.back-to-top');
	  const $circle = $('.back-to-top.scroll-position-style circle');
  
	  const THRESHOLD = 150;
	  let viewport = 1;
	  let ticking = false;
	  let lastActive = false;
  
	  const se = () => doc.scrollingElement || doc.documentElement;
	  const getScrollTop = () => se().scrollTop || 0;
  
	  function recomputeViewport() {
		viewport = Math.max(1, se().scrollHeight - window.innerHeight);
		updateOnScroll();
	  }
  
	  function updateOnScroll() {
		ticking = false;
		const scrollPos = getScrollTop();
		const active = scrollPos > THRESHOLD;
		if (active !== lastActive) {
		  $btn.toggleClass('active', active);
		  lastActive = active;
		}
		if ($circle.length) {
		  const dash = 262 - (scrollPos / viewport) * 150;
		  $circle.css('stroke-dashoffset', dash + 'px');
		}
	  }
  
	  function onScroll() {
		if (!ticking) {
		  ticking = true;
		  requestAnimationFrame(updateOnScroll);
		}
	  }
  
	  window.addEventListener('scroll', onScroll, { passive: true });
	  $win.on('resize orientationchange', recomputeViewport);
  
	  if ('ResizeObserver' in window) {
		const ro = new ResizeObserver(recomputeViewport);
		ro.observe(doc.documentElement);
		ro.observe(doc.body);
	  } else {
		setInterval(recomputeViewport, 500);
	  }
  
	  recomputeViewport();
  
	  $btn.on('click', function (event) {
		event.preventDefault();
		if ('scrollBehavior' in doc.documentElement.style) {
		  window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
		  $('html, body').stop().animate({ scrollTop: 0 }, 200, 'easeOutCubic');
		}
	  });
	});
  })(jQuery);  