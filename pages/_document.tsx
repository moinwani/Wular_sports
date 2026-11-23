
import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Not on the admin panel: Clarity records sessions, and the admin screens show
 * customers' names, phone numbers and addresses.
 *
 * Tracking (Google Tag Manager → GA4 / Meta pixel, and Microsoft Clarity) starts
 * as soon as the visitor first touches, scrolls or types — or 5 seconds after
 * the page has loaded, whichever comes first. Until then the phone spends its
 * time showing the page instead of running tracking code. Nothing is lost:
 * events pushed to dataLayer / clarity() before that are queued and sent once
 * the scripts arrive.
 */
const DEFERRED_TRACKING = `(function(w,d){
w.dataLayer=w.dataLayer||[];
if(w.location.pathname.indexOf('/admin')===0)return;
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};
var started=false,ev=['pointerdown','touchstart','scroll','keydown','mousemove'];
function add(src){var s=d.createElement('script');s.async=true;s.src=src;d.head.appendChild(s);}
function start(){if(started)return;started=true;
ev.forEach(function(e){w.removeEventListener(e,start,true)});
add('https://www.googletagmanager.com/gtm.js?id=GTM-MFRCHQ8X');
add('https://www.clarity.ms/tag/tn1mu1gwo1');}
ev.forEach(function(e){w.addEventListener(e,start,{capture:true,passive:true})});
if(d.readyState==='complete')setTimeout(start,5000);else w.addEventListener('load',function(){setTimeout(start,5000)});
})(window,document);`;

/**
 * OpenAI Ads measurement pixel (ChatGPT ads), Pixel ID 9PvsxTZQb7RNGwGkdNNxgH.
 * OpenAI's own setup snippet, loaded async near the top of <head>; not on the
 * admin panel. Events are sent from src/services/openaiPixel.ts.
 * Set debug:true temporarily to see the pixel's activity in the browser console.
 */
const OPENAI_PIXEL = `(function(w){if(w.location.pathname.indexOf('/admin')===0)return;
!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f);}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
oaiq("init",{pixelId:"9PvsxTZQb7RNGwGkdNNxgH",debug:false});
})(window);`;

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="UTF-8" />
                <script dangerouslySetInnerHTML={{ __html: OPENAI_PIXEL }} />
                <link rel="icon" href="https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/site-icon.png" type="image/png" />
                {/* Our own fonts (public/fonts) — the two used above the fold load first */}
                <link rel="preload" href="/fonts/oswald-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/fonts/lato-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <script dangerouslySetInnerHTML={{ __html: DEFERRED_TRACKING }} />
            </Head>
            <body>
                {/* Google Tag Manager (noscript) */}
                <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MFRCHQ8X" height={0} width={0} style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
                {/* End Google Tag Manager (noscript) */}
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
