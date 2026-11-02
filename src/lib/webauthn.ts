/**
 * WebAuthn / Passkey helper utility.
 * Interfaces with native browser Public Key Credential API (Face ID, Touch ID, Windows Hello, YubiKey).
 * NOTE: Passkeys rely on the browser's hardware-backed authenticator and never store or access raw biometric data.
 */

export async function isWebAuthnSupported(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!(await isWebAuthnSupported())) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a passkey for this device using standard WebAuthn APIs
 */
export async function registerDevicePasskey(email: string, userId: string): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!(await isWebAuthnSupported())) {
    return {
      success: false,
      error: 'Passkey / WebAuthn is not supported on this browser or device.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'My Photos — Hidden Pics',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: email,
        displayName: email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Registration was cancelled or failed.' };
    }

    // Save credential ID locally or in database
    const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    localStorage.setItem(`myphotos_passkey_${email}`, credId);

    return { success: true, credentialId: credId };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      error: error.message || 'Passkey setup could not be completed.'
    };
  }
}

/**
 * Authenticate using a registered device passkey
 */
export async function authenticateWithPasskey(email: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isWebAuthnSupported())) {
    return {
      success: false,
      error: 'Passkey authentication is not supported by your browser.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const storedCredId = localStorage.getItem(`myphotos_passkey_${email}`);

    const allowCredentials: PublicKeyCredentialDescriptor[] = storedCredId
      ? [
          {
            type: 'public-key',
            id: Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0)),
            transports: ['internal'],
          },
        ]
      : [];

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'preferred',
      timeout: 60000,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      return { success: false, error: 'Passkey verification failed or was cancelled.' };
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      error: error.message || 'Failed to authenticate with passkey.'
    };
  }
}
