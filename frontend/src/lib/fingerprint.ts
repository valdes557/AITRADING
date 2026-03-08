/**
 * Browser/Device Fingerprint Generator
 * Combines multiple browser signals to create a unique device identifier.
 * This is the web equivalent of IMEI — it stays consistent across sessions
 * on the same device/browser even if cookies are cleared.
 */

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AI Trading Signals FP', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('AI Trading Signals FP', 4, 17);

    // Add arc for more uniqueness
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }
    return 'webgl-no-debug';
  } catch {
    return 'webgl-error';
  }
}

function getNavigatorFingerprint(): string {
  const nav = navigator;
  const parts = [
    nav.userAgent,
    nav.language,
    nav.languages?.join(',') || '',
    nav.hardwareConcurrency?.toString() || '',
    (nav as any).deviceMemory?.toString() || '',
    nav.platform || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth?.toString() || '',
    screen.pixelDepth?.toString() || '',
    new Date().getTimezoneOffset().toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    nav.maxTouchPoints?.toString() || '0',
    // Audio context fingerprint signal
    typeof AudioContext !== 'undefined' ? 'audio-yes' : 'audio-no',
  ];
  return parts.join('|||');
}

function getInstalledPlugins(): string {
  try {
    // navigator.plugins is deprecated but still useful for fingerprinting
    const plugins = Array.from(navigator.plugins || []);
    return plugins.map((p) => `${p.name}:${p.filename}`).join(',') || 'no-plugins';
  } catch {
    return 'plugins-error';
  }
}

/**
 * Generate a stable device fingerprint hash.
 * This combines canvas rendering, WebGL GPU info, navigator properties,
 * screen resolution, timezone, and plugins into a single SHA-256 hash.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getNavigatorFingerprint(),
    getInstalledPlugins(),
  ];

  const raw = components.join('###');
  const hash = await hashString(raw);
  return hash;
}
