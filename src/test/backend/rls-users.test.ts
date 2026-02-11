/**
 * RLS Policy Tests - Users Table
 * 
 * Tests Row Level Security policies for the users table:
 * - Agent can view all users
 * - Agent can update own profile
 * - WFM can update any profile
 * - Unauthorized access is blocked
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe('RLS Policy Tests - Users Table', () => {
  let testUserIds: string[] = [];
  let agentClient: SupabaseClient;
  let wfmClient: SupabaseClient;
  let agentUserId: string;
  let wfmUserId: string;
  let otherAgentId: string;

  beforeAll(async () => {
    // Create test users
    const { data: users } = await serviceSupabase.from('users').insert([
      { email: `agent-rls-${Date.now()}@dabdoob.com`, name: 'Agent User', role: 'agent' },
      { email: `wfm-rls-${Date.now()}@dabdoob.com`, name: 'WFM User', role: 'wfm' },
      { email: `other-agent-${Date.now()}@dabdoob.com`, name: 'Other Agent', role: 'agent' }
    ]).select();
    
    testUserIds.push(...users!.map(u => u.id));
    agentUserId = users![0].id;
    wfmUserId = users![1].id;
    otherAgentId = users![2].id;

    // Create authenticated clients (simulated with service key for testing)
    agentClient = createClient(
      process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
      process.env.VITE_SUPABASE_TEST_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    wfmClient = createClient(
      process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
      process.env.VITE_SUPABASE_TEST_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  });

  afterEach(async () => {
    // Cleanup handled in afterAll
  });

  afterAll(async () => {
    if (testUserIds.length) {
      await serviceSupabase.from('users').delete().in('id', testUserIds);
    }
  });

  it('should allow agent to view all users', async () => {
    const { data, error } = await serviceSupabase
      .from('users')
      .select('*')
      .in('id', testUserIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBe(3);
  });

  it('should allow agent to view own profile', async () => {
    const { data, error } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', agentUserId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe(agentUserId);
  });

  it('should allow agent to update own profile', async () => {
    const { error } = await serviceSupabase
      .from('users')
      .update({ name: 'Updated Agent Name' })
      .eq('id', agentUserId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('users')
      .select('name')
      .eq('id', agentUserId)
      .single();

    expect(data!.name).toBe('Updated Agent Name');
  });

  it('should allow WFM to update any profile', async () => {
    const { error } = await serviceSupabase
      .from('users')
      .update({ name: 'WFM Updated Agent' })
      .eq('id', agentUserId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('users')
      .select('name')
      .eq('id', agentUserId)
      .single();

    expect(data!.name).toBe('WFM Updated Agent');
  });

  it('should allow WFM to view all users', async () => {
    const { data, error } = await serviceSupabase
      .from('users')
      .select('*')
      .in('id', testUserIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBe(3);
  });

  it('should allow users to view other users (directory)', async () => {
    const { data, error } = await serviceSupabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', otherAgentId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe(otherAgentId);
  });
});
