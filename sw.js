const BLOCKED_HOSTS = [
    "doubleclick.net", "googlesyndication.com", "googleadservices.com",
    "pagead2.googlesyndication.com", "adservice.google.com",
    "adsafeprotected.com", "amazon-adsystem.com", "criteo.com",
    "criteo.net", "taboola.com", "outbrain.com", "pubmatic.com",
    "rubiconproject.com", "openx.net", "yieldmo.com", "casalemedia.com",
    "adnxs.com", "sharethrough.com", "smartadserver.com", "33across.com",
    "bidswitch.net", "sovrn.com", "lijit.com", "tremorhub.com",
    "spotxchange.com", "telaria.com", "springserve.com",
    "indexexchange.com", "3lift.com", "teads.tv", "districtm.io",
    "emxdgt.com", "conversantmedia.com", "media.net", "advertising.com",
    "adroll.com", "bidvertiser.com", "zedo.com", "serving-sys.com",
    "valueclick.com", "tribalfusion.com", "undertone.com",
    "specificclick.net", "adultadworld.com", "exponential.com",
    "adjuggler.com", "adengage.com", "adform.net", "cpmstar.com",
    "contextweb.com", "chitika.com", "infolinks.com", "buysellads.com",
    "propellerads.com", "propellerpops.com", "popads.net", "popcash.net",
    "adsterra.com", "adsterra.org", "exoclick.com", "juicyads.com",
    "trafficjunky.net", "trafficfactory.biz", "hilltopads.net",
    "clickadu.com", "admaven.com", "ad-maven.com", "pyppo.com",
    "pypo.me", "mgid.com", "revcontent.com", "onclckmn.com",
    "onclickalgo.com", "onclickmax.com", "onclck.org", "onclicksuper.com",
    "onclickmega.com", "onclickpredictiv.com", "popmatic.com",
    "popnc.com", "popmyads.com", "popunder.net", "popuptraffic.com",
    "clickaine.com", "trafficstars.com", "betweendigital.com",
    "traffic-media.co", "cpmrevenuegate.com", "clksite.com", "clk.wiki",
    "shorte.st", "adshnk.com", "go2cloud.org", "go2speed.org",
    "go2rpm.net", "link4link.online", "adf.ly", "sh.st",
    "linkvertise.com", "linkvertise.net", "ouo.io", "bc.vc", "fc.lc",
    "za.gl", "za.uy", "frtya.com", "frtyb.com", "frtye.com",
    "frtyj.com", "frtyk.com", "frtyo.com", "doktuk.com",
    "agacelebir.com", "bvtpk.com", "zdigital.online", "acscdn.com",
    "kinitrop.com", "trk-in.com", "revenuehits.com", "plugrush.com",
    "traffichaus.com", "adspyglass.com", "adspyglass.org", "moonads.net",
    "monetizemore.com", "a-ads.com", "coinzilla.io", "cointraffic.io",
    "bitmedia.io", "google-analytics.com", "googletagmanager.com"
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // 1. Block Ads strictly by hostname
    if (BLOCKED_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
        e.respondWith(new Response("", { status: 204 })); 
        return;
    }

    // 2. Do NOT block by path (it was too aggressive and blocking CSS/JS)
    // Just let everything else pass through the browser normally.
});st path = url.pathname.toLowerCase();
    if (path.includes('/adserver') || path.includes('/advert') || path.includes('/popunder') || path.includes('/banner')) {
        e.respondWith(new Response("", { status: 204 }));
        return;
    }

    // 3. Pass everything else through
    // (We don't cache TMDb or iframe embeds to save data)
    if (url.hostname.includes('themoviedb.org') || url.hostname.includes('vidsrc')) {
        return; 
    }
});