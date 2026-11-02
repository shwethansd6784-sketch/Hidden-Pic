export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  secret_code_enabled: boolean;
  passkey_enabled: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  photo_count?: number;
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  album_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  caption: string | null;
  is_favorite: boolean;
  signed_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  ip_address: string | null;
  is_active: boolean;
  is_current?: boolean;
  revoked_at: string | null;
  last_active_at: string;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: 'new_device_login' | 'session_revoked' | 'password_changed' | 'suspicious_attempt';
  title: string;
  message: string;
  device_info: {
    browser?: string;
    os?: string;
    device_name?: string;
    ip?: string;
    time?: string;
  };
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
}

export interface DeviceInfo {
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  userAgent: string;
}
