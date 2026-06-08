import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/site-icon.png" type="image/png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://cdn.jsdelivr.net" />
                <link rel="preconnect" href="https://www.googletagmanager.com" />
                <link
                    rel="preload"
                    as="style"
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                    rel="stylesheet"
                    media="print"
                />
                <noscript>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                        rel="stylesheet"
                    />
                </noscript>
                <script dangerouslySetInnerHTML={{ __html: `document.querySelector('link[media="print"]').media='all'` }} />
                <script src="https://accounts.google.com/gsi/client" async defer></script>
                {/* Google Tag Manager */}
                <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MFRCHQ8X');` }} />
                {/* End Google Tag Manager */}
                {/* Microsoft Clarity */}
                <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","tn1mu1gwo1");` }} />
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
