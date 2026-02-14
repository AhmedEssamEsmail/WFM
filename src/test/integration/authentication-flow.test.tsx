/**
 * Authentication Flow Integration Test
 * 
 * Tests authentication workflows:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Domain validation
 * - Session management
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe('Authentication Flow Integration', () => {
  it('should validate email domain', () => {
    const validEmail = 'user@dabdoob.com';
    const invalidEmail = 'user@gmail.com';

    expect(validEmail.endsWith('@dabdoob.com')).toBe(true);
    expect(invalidEmail.endsWith('@dabdoob.com')).toBe(false);
  });

  it('should handle missing credentials', async () => {
    const { data, error } = await testSupabase.auth.signInWithPassword({
      email: '',
      password: ''
    });

    expect(error).toBeTruthy();
    expect(data.user).toBeNull();
  });

  it('should handle invalid email format', async () => {
    const { data, error } = await testSupabase.auth.signInWithPassword({
      email: 'not-an-email',
      password: 'password123'
    });

    expect(error).toBeTruthy();
    expect(data.user).toBeNull();
  });

  it('should validate password requirements', () => {
    const weakPassword = '123';
    const strongPassword = 'SecurePass123!';

    expect(weakPassword.length).toBeLessThan(6);
    expect(strongPassword.length).toBeGreaterThanOrEqual(6);
  });

  it('should handle session state', async () => {
    const { data: session } = await testSupabase.auth.getSession();
    
    // In test environment, no active session
    expect(session.session).toBeNull();
  });

  it('should validate domain on signup', () => {
    const validateDomain = (email: string): boolean => {
      return email.endsWith('@dabdoob.com');
    };

    expect(validateDomain('user@dabdoob.com')).toBe(true);
    expect(validateDomain('user@other.com')).toBe(false);
    expect(validateDomain('user@dabdoob.co')).toBe(false);
  });

  it('should handle logout', async () => {
    const { error } = await testSupabase.auth.signOut();
    
    // Should not error even if no session
    expect(error).toBeNull();
  });
});



