import type { DeviceInfo } from '../types';

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // Detect Operating System
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) {
    os = 'iOS (iPhone)';
    deviceType = 'mobile';
  } else if (/iPad/i.test(ua)) {
    os = 'iPadOS';
    deviceType = 'tablet';
  } else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) {
    os = 'Android';
    deviceType = /Tablet|iPad/i.test(ua) ? 'tablet' : 'mobile';
  } else if (/Linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';

  // Create friendly device label
  let deviceName = `${browser} on ${os}`;
  if (deviceType === 'mobile') {
    deviceName = `Mobile (${browser} on ${os})`;
  } else if (deviceType === 'tablet') {
    deviceName = `Tablet (${browser} on ${os})`;
  }

  return {
    deviceName,
    deviceType,
    browser,
    os,
    userAgent: ua
  };
}

const STORAGE_KEY = 'myphotos_device_token';

/**
 * Returns a persistent unique identifier for this specific device/browser installation.
 */
export function getOrCreateSessionToken(): string {
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

/**
 * Generates a fresh session token
 */
export function resetSessionToken(): string {
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(STORAGE_KEY, token);
  return token;
}
