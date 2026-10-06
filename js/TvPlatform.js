/**
 * webOS TV integration without depending on webOSTV.js:
 * luna service calls go straight through PalmServiceBridge (which webOSTV.js wraps).
 * Everything here is a no-op in a desktop browser.
 */
const APP_ID = 'com.ublaze.quranflipboardtv';
const TVPOWER = 'luna://com.webos.service.tvpower/power/';

// Keep subscription bridges referenced, or they are garbage-collected and go silent
const tvBridges = [];

export class TvPlatform {
  static get isWebOS() {
    return typeof window.PalmServiceBridge !== 'undefined';
  }

  /** Call a luna service. onResult(responseObject) fires once, or repeatedly when subscribed. */
  static request(uri, params, onResult) {
    if (!TvPlatform.isWebOS) return false;
    try {
      const bridge = new window.PalmServiceBridge();
      bridge.onservicecallback = (msg) => {
        let res = {};
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false, errorText: String(msg) }; }
        if (onResult) onResult(res);
      };
      bridge.call(uri, JSON.stringify(params || {}));
      if (params && params.subscribe) tvBridges.push(bridge);
      return true;
    } catch (e) {
      console.warn('[TvPlatform] luna call failed:', uri, e);
      return false;
    }
  }

  /**
   * Stop the TV screensaver from covering the app.
   * Primary: veto each screensaver request via com.webos.service.tvpower.
   * That service has no public permission group, so a retail (non-dev-mode) TV may refuse it;
   * in that case fall back to a muted looping video, which keeps webOS in "media playing" state.
   */
  static keepScreenAwake() {
    if (!TvPlatform.isWebOS) return;
    let usingFallback = false;
    const fallback = (why) => {
      if (usingFallback) return;
      usingFallback = true;
      console.warn('[TvPlatform] screensaver veto unavailable (' + why + '), using video keep-alive');
      TvPlatform._startKeepAliveVideo();
    };

    const ok = TvPlatform.request(TVPOWER + 'registerScreenSaverRequest',
      { subscribe: true, clientName: APP_ID },
      (res) => {
        if (res.returnValue === false) { fallback(res.errorText || 'denied'); return; }
        if (res.state === 'Active') {
          TvPlatform.request(TVPOWER + 'responseScreenSaverRequest',
            { clientName: APP_ID, ack: false, timestamp: res.timestamp });
        }
      });
    if (!ok) fallback('bridge error');
  }

  static _startKeepAliveVideo() {
    if (document.getElementById('keepalive-video')) return;
    const v = document.createElement('video');
    v.id = 'keepalive-video';
    v.src = 'assets/keepalive.mp4';
    v.muted = true;
    v.loop = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    document.body.appendChild(v);
    const p = v.play();
    if (p && p.catch) p.catch(e => console.warn('[TvPlatform] keep-alive video blocked:', e));
  }

  static exitApp() {
    window.close();
  }
}
