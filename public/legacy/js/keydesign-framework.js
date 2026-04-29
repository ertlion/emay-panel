jQuery(document).ready(function ($) {
    $(".zoom-button-effect .elementskit-btn,.zoom-button-effect .keydesign-button").each(function () {
        $(this).contents().filter(function () {
            return this.nodeType === 3 && $.trim(this.nodeValue) !== '';
        }).each(function () {
            $(this).replaceWith('<span>' + $(this).text() + '</span>'); // Wrap text node in <span>
        });
        $(this).wrapInner("<span class='button-wrapper'></span>");
    });
    $(".flip-button-effect .elementskit-btn, .flip-button-effect .ekit-popup-btn__has-icon, .flip-button-effect .keydesign-button,.flip-button-effect .elementskit-single-pricing .elementskit-pricing-btn").each(function () {
        $button_text = $(this).text().trim();
        $(this).attr("data-text", $button_text);
        // $(this).wrapInner("<span class='button-wrapper'></span>");
        $(this).contents().filter(function () {
            return this.nodeType == 3 && $.trim(this.textContent) != '';
        }).wrap('<span class="button-wrapper" />');
    });
    if ($('.with-sidebar.sticky-sidebar').length) {
        $(".with-sidebar.sticky-sidebar .keydesign-sidebar").css('--header-height', $("#site-header").outerHeight() + "px");
    }

    var form_validation = $(".comment-form-url input, .comment-form-author input, .comment-form-email input, .comment-form-comment textarea");
    $(form_validation).blur(function () {
        if (!$(this).val()) {
            $(this).parent().removeClass("keydesign-not-empty");
        } else {
            $(this).parent().addClass("keydesign-not-empty");
        }
    });
    var contact_form = $(".keydesign-label input, .keydesign-label textarea");
    $(contact_form).blur(function () {
        if (!$(this).val()) {
            $(this).closest(".keydesign-label").removeClass("keydesign-not-empty");
        } else {
            $(this).closest(".keydesign-label").addClass("keydesign-not-empty");
        }
    });

    // KeyDesign Wrapper Link functionality
    $('[data-keydesign-wrapper-link="yes"]').each(function () {
        var $element = $(this);
        var url = $element.attr('data-keydesign-wrapper-link-url');
        var target = $element.attr('data-keydesign-wrapper-link-target') || '_self';
        var nofollow = $element.attr('data-keydesign-wrapper-link-nofollow') === 'yes';

        if (url && url !== '') {
            $element.css('cursor', 'pointer');
            $element.on('click', function (e) {
                if ($(e.target).closest('a, button, input[type="button"], input[type="submit"]').length > 0) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();

                var link = document.createElement('a');
                link.href = url;
                link.target = target;
                if (nofollow) {
                    link.rel = 'nofollow';
                }

                if (target === '_blank') {
                    window.open(url, '_blank');
                } else {
                    window.location.href = url;
                }
            });
        }
    });
});

jQuery(function ($) {
    $(".ekit-wid-con .elementskit-menu-hamburger").click(function () {
        $("#site-header").css('--kd-mobile-nav-height', $("#site-header").outerHeight() + "px");
        $(this).toggleClass("active");
        $("#site-header").toggleClass("mobile-menu-active");
    });
    $(".elementskit-navbar-nav li a").click(function () {
        if ($(".elementskit-menu-container").hasClass("ekit-nav-menu-one-page-yes")) {
            $("#site-header").removeClass("mobile-menu-active");
            $(".ekit-wid-con .elementskit-menu-hamburger").removeClass("active");
        }
    });
    if ($('.site-header.sticky-header').length) {
        const $win = $(window), $hdr = $('.site-header'), $showOn = $('.site-header.show-on-scroll');
        let lastTop = $win.scrollTop(), ticking = false, lastScrolled = null, lastHide = null;

        function update() {
            ticking = false;
            const top = $win.scrollTop();
            const scrolled = top > 95;
            if (scrolled !== lastScrolled) { $hdr.toggleClass('scrolled', scrolled); lastScrolled = scrolled; }
            const hide = top > lastTop && top > 0;
            if (hide !== lastHide) { $showOn.toggleClass('hide-menu', hide); lastHide = hide; }
            lastTop = top;
        }
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
        update();
    }

    if ($('.transform-3d').length) {
        var my_window = $(window);
        my_window.scroll(function () {
            if (my_window.scrollTop() > 0) {
                var angle = 12 - my_window.scrollTop() / 30;
                if (angle > 0) {
                    $('.transform-3d img').css('transform', 'rotateX(' + angle + 'deg)');
                }
            }
        });
    }

    // Sticky Navigation functionality new framework
    if ($('.keydesign-sticky .elementor-widget-keydesign-advanced-list').length) {
        const navLinks = document.querySelectorAll('.keydesign-sticky.e-con .elementor-widget-keydesign-advanced-list a');
        const menuHeight = 33; // Offset from top
        
        // Find the sticky element to get scroll offset
        const stickyElement = document.querySelector('[data-keydesign-sticky] .elementor-widget-keydesign-advanced-list')?.closest('[data-keydesign-sticky]');
        const scrollOffset = stickyElement ? parseInt(stickyElement.getAttribute('data-keydesign-sticky-scroll-offset'), 10) || 0 : 0;
        
        // Helper function to get absolute offset top (similar to old script)
        function getAbsoluteOffsetTopNew(element) {
            let offsetTop = 0;
            while (element) {
                offsetTop += element.offsetTop;
                element = element.offsetParent;
            }
            return offsetTop;
        }
        
        // Cache link-section pairs and positions (optimized)
        const linkSectionPairs = [];
        let cachedPositions = null;
        let currentActiveLink = null;
        
        // Build link-section pairs once (cache selectors)
        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            
            const sectionId = href.slice(1);
            const section = document.getElementById(sectionId);
            if (section) {
                linkSectionPairs.push({
                    link: link,
                    section: section,
                    sectionId: sectionId
                });
            }
        });
        
        // Cache section positions
        function updateCachedPositions() {
            cachedPositions = linkSectionPairs.map(function(pair) {
                const sectionTop = getAbsoluteOffsetTopNew(pair.section) - menuHeight - scrollOffset;
                return {
                    link: pair.link,
                    section: pair.section,
                    top: sectionTop,
                    bottom: sectionTop + pair.section.offsetHeight
                };
            });
        }
        
        // Initialize cached positions
        updateCachedPositions();
        
        // Recalculate positions on window resize (when layout changes)
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updateCachedPositions();
            }, 150);
        });
        
        // Optimized scroll handler with throttling
        let ticking = false;
        function changeActiveLink() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
                    
                    // Find active section using cached positions
                    let activePair = null;
                    for (let i = 0; i < cachedPositions.length; i++) {
                        const pair = cachedPositions[i];
                        if (scrollPosition >= pair.top && scrollPosition < pair.bottom) {
                            activePair = pair;
                            break;
                        }
                    }
                    
                    // Only update DOM if active link changed (optimized)
                    if (activePair && activePair.link !== currentActiveLink) {
                        // Remove active class from previous link (if exists)
                        if (currentActiveLink) {
                            currentActiveLink.classList.remove('active');
                        }
                        // Add active class to new link
                        activePair.link.classList.add('active');
                        currentActiveLink = activePair.link;
                    } else if (!activePair && currentActiveLink) {
                        // No active section, remove active class
                        currentActiveLink.classList.remove('active');
                        currentActiveLink = null;
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        // Call on scroll (throttled via requestAnimationFrame)
        document.addEventListener('scroll', changeActiveLink, { passive: true });
        // Call once on load to set initial active state
        changeActiveLink();
        
        // Handle anchor link clicks with scroll offset
        // Use event delegation to catch clicks even if elements are added dynamically
        $(document).on('click', '[data-keydesign-sticky] .elementor-widget-keydesign-advanced-list a[href^="#"]', function(e) {
            const href = $(this).attr('href');
            if (!href || href === '#') return;
            
            const targetId = href.slice(1);
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;
            
            // Find the sticky element that contains this link
            const stickyElement = $(this).closest('[data-keydesign-sticky]')[0];
            if (stickyElement) {
                e.preventDefault();
                e.stopPropagation();
                
                // Get scroll offset from data attribute (default to 0 if not set)
                const scrollOffsetAttr = stickyElement.getAttribute('data-keydesign-sticky-scroll-offset');
                const offset = scrollOffsetAttr ? parseInt(scrollOffsetAttr, 10) : 0;
                
                // Get admin bar height from CSS variable (check both documentElement and body)
                let adminBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--admin-bar'), 10) || 0;
                if (!adminBarHeight) {
                    adminBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue('--admin-bar'), 10) || 0;
                }
                
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset - adminBarHeight;
                
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }
        });
    }

     // Sticky Navigation functionality legacy framework
     function getAbsoluteOffsetTop(element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return rect.top + scrollTop;
    } 
    if ($('.sticky-navigation').length) {
        var navLinks = document.querySelectorAll(".sticky-navigation .ekit-stylish-list a");
        var sections = document.querySelectorAll("#main .e-con.e-flex.sticky-section");
        // var menuHeight = document.querySelector('.sticky-navigation').offsetHeight + 5;
        var menuHeight = 33;

        function changeActiveLink() {
            var scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;

            sections.forEach(function(section) {
                var sectionTop = getAbsoluteOffsetTop(section) - menuHeight;
                var sectionBottom = sectionTop + section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    var targetLink = document.querySelector('a[href="#' + section.id + '"]');
                    navLinks.forEach(function(link) {
                        link.classList.remove("active");
                    });
                    targetLink.classList.add("active");
                }
            });
        }
        document.addEventListener("scroll", changeActiveLink);
    }

    // Simple parallax initialization with lazy loading support
    function initParallax() {
        $('[data-keydesign-parallax]').each(function () {
            var $el = $(this);
            var speed = parseFloat($el.attr('data-keydesign-parallax-speed')) || 0.8;
            
            // Only initialize if element or parent is lazy loaded and has background
            var isLazyLoaded = $el.hasClass('e-lazyloaded') || $el.closest('.e-lazyloaded').length > 0;
            var hasBg = $el.css('background-image') !== 'none' || $el.find('[style*="background-image"]').length > 0;
            
            if (isLazyLoaded && hasBg) {
                if ($el.data('jarallax')) $el.jarallax('destroy');
                $el.jarallax({ speed: speed });
            }
        });
    }
    
    // Only initialize parallax if elements exist and not in Elementor editor
    if ($('[data-keydesign-parallax]').length > 0 && (!window.elementorFrontend || !window.elementorFrontend.isEditMode())) {
        initParallax();
        $(document).on('elementor/lazyload/loaded', initParallax);
        
        var reinitTimeout;
        
        var parallaxObserver = new MutationObserver(function(mutations) {
            var shouldReinit = false;
            mutations.forEach(function(mutation) {
                if (mutation.target.classList.contains('e-lazyloaded')) {
                    // Check if this lazy loaded element contains or is a parallax element
                    if (mutation.target.querySelector('[data-keydesign-parallax]') || 
                        mutation.target.hasAttribute('data-keydesign-parallax')) {
                        shouldReinit = true;
                    }
                }
            });
            
            if (shouldReinit) {
                clearTimeout(reinitTimeout);
                reinitTimeout = setTimeout(function() {
                    initParallax();
                }, 150);
            }
        });
        
        var parallaxContainers = [];
        $('[data-keydesign-parallax]').each(function() {
            var $container = $(this).closest('.e-con');
            if ($container.length > 0 && parallaxContainers.indexOf($container[0]) === -1) {
                parallaxContainers.push($container[0]);
            }
        });
        
        parallaxContainers.forEach(function(container) {
            parallaxObserver.observe(container, { attributes: true, attributeFilter: ['class'] });
        });
    }

});