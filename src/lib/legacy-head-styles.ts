// Mirror'in <head>'inden direkt cekildi.
// Mirror: emaypanel-clone/emaypanel.com/urun/emay-smart-3h-dv/index.html
// Bu CSS'siz Elementor 4. konteynerden sonrasini lazy-hide ediyor + WooCommerce
// gallery opacity:0 kaliyor + admin custom CSS bazi butonlari gizliyor.
// Tum sayfalarda birebir ayni iceriktir; layout.tsx <head>'e inject eder.

export const LEGACY_HEAD_STYLES = String.raw`/* === wp-img-auto-sizes-contain-inline-css === */
img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
/*# sourceURL=wp-img-auto-sizes-contain-inline-css */

/* === wp-emoji-styles-inline-css === */
img.wp-smiley, img.emoji {
		display: inline !important;
		border: none !important;
		box-shadow: none !important;
		height: 1em !important;
		width: 1em !important;
		margin: 0 0.07em !important;
		vertical-align: -0.1em !important;
		background: none !important;
		padding: 0 !important;
	}
/*# sourceURL=wp-emoji-styles-inline-css */

/* === wp-block-library-theme-inline-css === */
.wp-block-audio :where(figcaption){color:#555;font-size:13px;text-align:center}.is-dark-theme .wp-block-audio :where(figcaption){color:#ffffffa6}.wp-block-audio{margin:0 0 1em}.wp-block-code{border:1px solid #ccc;border-radius:4px;font-family:Menlo,Consolas,monaco,monospace;padding:.8em 1em}.wp-block-embed :where(figcaption){color:#555;font-size:13px;text-align:center}.is-dark-theme .wp-block-embed :where(figcaption){color:#ffffffa6}.wp-block-embed{margin:0 0 1em}.blocks-gallery-caption{color:#555;font-size:13px;text-align:center}.is-dark-theme .blocks-gallery-caption{color:#ffffffa6}:root :where(.wp-block-image figcaption){color:#555;font-size:13px;text-align:center}.is-dark-theme :root :where(.wp-block-image figcaption){color:#ffffffa6}.wp-block-image{margin:0 0 1em}.wp-block-pullquote{border-bottom:4px solid;border-top:4px solid;color:currentColor;margin-bottom:1.75em}.wp-block-pullquote :where(cite),.wp-block-pullquote :where(footer),.wp-block-pullquote__citation{color:currentColor;font-size:.8125em;font-style:normal;text-transform:uppercase}.wp-block-quote{border-left:.25em solid;margin:0 0 1.75em;padding-left:1em}.wp-block-quote cite,.wp-block-quote footer{color:currentColor;font-size:.8125em;font-style:normal;position:relative}.wp-block-quote:where(.has-text-align-right){border-left:none;border-right:.25em solid;padding-left:0;padding-right:1em}.wp-block-quote:where(.has-text-align-center){border:none;padding-left:0}.wp-block-quote.is-large,.wp-block-quote.is-style-large,.wp-block-quote:where(.is-style-plain){border:none}.wp-block-search .wp-block-search__label{font-weight:700}.wp-block-search__button{border:1px solid #ccc;padding:.375em .625em}:where(.wp-block-group.has-background){padding:1.25em 2.375em}.wp-block-separator.has-css-opacity{opacity:.4}.wp-block-separator{border:none;border-bottom:2px solid;margin-left:auto;margin-right:auto}.wp-block-separator.has-alpha-channel-opacity{opacity:1}.wp-block-separator:not(.is-style-wide):not(.is-style-dots){width:100px}.wp-block-separator.has-background:not(.is-style-dots){border-bottom:none;height:1px}.wp-block-separator.has-background:not(.is-style-wide):not(.is-style-dots){height:2px}.wp-block-table{margin:0 0 1em}.wp-block-table td,.wp-block-table th{word-break:normal}.wp-block-table :where(figcaption){color:#555;font-size:13px;text-align:center}.is-dark-theme .wp-block-table :where(figcaption){color:#ffffffa6}.wp-block-video :where(figcaption){color:#555;font-size:13px;text-align:center}.is-dark-theme .wp-block-video :where(figcaption){color:#ffffffa6}.wp-block-video{margin:0 0 1em}:root :where(.wp-block-template-part.has-background){margin-bottom:0;margin-top:0;padding:1.25em 2.375em}
/*# sourceURL=/wp-includes/css/dist/block-library/theme.min.css */

/* === woocommerce-inline-inline-css === */
.woocommerce form .form-row .required { visibility: visible; }
/*# sourceURL=woocommerce-inline-inline-css */

/* === wpml-legacy-horizontal-list-0-inline-css === */
.wpml-ls-statics-footer a, .wpml-ls-statics-footer .wpml-ls-sub-menu a, .wpml-ls-statics-footer .wpml-ls-sub-menu a:link, .wpml-ls-statics-footer li:not(.wpml-ls-current-language) .wpml-ls-link, .wpml-ls-statics-footer li:not(.wpml-ls-current-language) .wpml-ls-link:link {color:#444444;background-color:#ffffff;}.wpml-ls-statics-footer .wpml-ls-sub-menu a:hover,.wpml-ls-statics-footer .wpml-ls-sub-menu a:focus, .wpml-ls-statics-footer .wpml-ls-sub-menu a:link:hover, .wpml-ls-statics-footer .wpml-ls-sub-menu a:link:focus {color:#000000;background-color:#eeeeee;}.wpml-ls-statics-footer .wpml-ls-current-language > a {color:#444444;background-color:#ffffff;}.wpml-ls-statics-footer .wpml-ls-current-language:hover>a, .wpml-ls-statics-footer .wpml-ls-current-language>a:focus {color:#000000;background-color:#eeeeee;}
/*# sourceURL=wpml-legacy-horizontal-list-0-inline-css */

/* === keydesign-frontend-inline-css === */
.page-header {--page-title-width: 550px;}
/*# sourceURL=keydesign-frontend-inline-css */

/* === inline-anonymous === */
.vue_is_disabled {
			display: none;
		}

/* === inline-anonymous === */
.woocommerce-product-gallery{ opacity: 1 !important; }

/* === inline-anonymous === */
.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload),
				.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload) * {
					background-image: none !important;
				}
				@media screen and (max-height: 1024px) {
					.e-con.e-parent:nth-of-type(n+3):not(.e-lazyloaded):not(.e-no-lazyload),
					.e-con.e-parent:nth-of-type(n+3):not(.e-lazyloaded):not(.e-no-lazyload) * {
						background-image: none !important;
					}
				}
				@media screen and (max-height: 640px) {
					.e-con.e-parent:nth-of-type(n+2):not(.e-lazyloaded):not(.e-no-lazyload),
					.e-con.e-parent:nth-of-type(n+2):not(.e-lazyloaded):not(.e-no-lazyload) * {
						background-image: none !important;
					}
				}

/* === wp-custom-css === */
.breadcrumb-trail, .woocommerce-result-count,.woocommerce-ordering, .button  {
display: none !important;
}


.woocommerce ul.products li.product .woocommerce-loop-product__title, .woocommerce ul.products li.product .woocommerce-loop-category__title {
    text-align: center;
}

`;
