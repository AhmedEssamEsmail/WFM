/**
 * Test Data Seeding Script
 * 
 * This script seeds the test database with realistic test data for:
 * - Users (agents, TLs, WFM)
 * - Shifts
 * - Swap requests
 * - Leave requests
 * - Leave balances
 * 
 * Usage:
 *   1. Start Supabase local: npx supabase start
 *   2. Run this script: npm run seed-test-data
 */

import { createClient } from '@supabase/supabase-js';

// Test database configuration
const SUPABASE_TEST_URL = process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
const SUPABASE_TEST_ANON_KEY = process.env.VITE_SUPABASE_TEST_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY);

// Test user data
const testUsers = [
  // WFM users
  { email: 'wfm1@dabdoob.com', name: 'Sarah Johnson', role: 'wfm', department: 'Operations' },
  { email: 'wfm2@dabdoob.com', name: 'Michael Chen', role: 'wfm', department: 'Operations' },
  
  // TL users
  { email: 'tl1@dabdoob.com', name: 'Emily Davis', role: 'tl', department: 'Customer Support' },
  { email: 'tl2@dabdoob.com', name: 'James Wilson', role: 'tl', department: 'Sales' },
  { email: 'tl3@dabdoob.com', name: 'Lisa Anderson', role: 'tl', department: 'Technical Support' },
  
  // Agent users
  { email: 'agent1@dabdoob.com', name: 'John Smith', role: 'agent', department: 'Customer Support' },
  { email: 'agent2@dabdoob.com', name: 'Maria Garcia', role: 'agent', department: 'Customer Support' },
  { email: 'agent3@dabdoob.com', name: 'David Lee', role: 'agent', department: 'Sales' },
  { email: 'agent4@dabdoob.com', name: 'Jennifer Brown', role: 'agent', department: 'Sales' },
  { email: 'agent5@dabdoob.com', name: 'Robert Taylor', role: 'agent', department: 'Technical Support' },
  { email: 'agent6@dabdoob.com', name: 'Amanda White', role: 'agent', department: 'Technical Support' },
  { email: 'agent7@dabdoob.com', name: 'Christopher Martinez', role: 'agent', department: 'Customer Support' },
  { email: 'agent8@dabdoob.com', name: 'Jessica Rodriguez', role: 'agent', department: 'Sales' },
];

// Helper function to generate shifts for a user
function generateShifts(userId: string, startDate: Date, days: number) {
  const shifts = [];
  const shiftTypes = ['AM', 'PM', 'BET', 'OFF'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Assign shift type (80% working shifts, 20% OFF)
    const shiftType = Math.random() < 0.8 
      ? shiftTypes[Math.floor(Math.random() * 3)] 
      : 'OFF';
    
    shifts.push({
      user_id: userId,
      date: date.toISOString().split('T')[0],
      shift_type: shiftType,
    });
  }
  
  return shifts;
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const { data: users, error } = await supabase
    .from('users')
    .insert(testUsers)
    .select();
  
  if (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${users.length} users`);
  return users;
}

async function seedShifts(users: any[]) {
  console.log('Seeding shifts...');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Start 30 days ago
  
  const allShifts = [];
  for (const user of users) {
    const shifts = generateShifts(user.id, startDate, 60); // 60 days of shifts
    allShifts.push(...shifts);
  }
  
  const { data: shifts, error } = await supabase
    .from('shifts')
    .insert(allShifts)
    .select();
  
  if (error) {
    console.error('Error seeding shifts:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${shifts.length} shifts`);
  return shifts;
}

async function seedLeaveBalances(users: any[]) {
  console.log('Seeding leave balances...');
  
  const leaveBalances = [];
  const leaveTypes = ['annual', 'casual', 'sick', 'public_holiday', 'bereavement'];
  
  for (const user of users) {
    for (const leaveType of leaveTypes) {
      // Assign realistic balances
      let balance = 0;
      if (leaveType === 'annual') balance = Math.floor(Math.random() * 20) + 5; // 5-25 days
      if (leaveType === 'casual') balance = Math.floor(Math.random() * 10) + 2; // 2-12 days
      if (leaveType === 'sick') balance = Math.floor(Math.random() * 15) + 5; // 5-20 days
      if (leaveType === 'public_holiday') balance = 10; // Fixed 10 days
      if (leaveType === 'bereavement') balance = 3; // Fixed 3 days
      
      leaveBalances.push({
        user_id: user.id,
        leave_type: leaveType,
        balance,
      });
    }
  }
  
  const { data: balances, error } = await supabase
    .from('leave_balances')
    .insert(leaveBalances)
    .select();
  
  if (error) {
    console.error('Error seeding leave balances:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${balances.length} leave balances`);
  return balances;
}

async function seedSwapRequests(users: any[], shifts: any[]) {
  console.log('Seeding swap requests...');
  
  const agents = users.filter(u => u.role === 'agent');
  const swapRequests = [];
  
  // Create 5 swap requests with different statuses
  for (let i = 0; i < 5; i++) {
    const requester = agents[Math.floor(Math.random() * agents.length)];
    const target = agents.filter(a => a.id !== requester.id)[Math.floor(Math.random() * (agents.length - 1))];
    
    const requesterShifts = shifts.filter(s => s.user_id === requester.id && s.shift_type !== 'OFF');
    const targetShifts = shifts.filter(s => s.user_id === target.id && s.shift_type !== 'OFF');
    
    if (requesterShifts.length > 0 && targetShifts.length > 0) {
      const requesterShift = requesterShifts[Math.floor(Math.random() * requesterShifts.length)];
      const targetShift = targetShifts[Math.floor(Math.random() * targetShifts.length)];
      
      const statuses = ['pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected'];
      const status = statuses[i % statuses.length];
      
      swapRequests.push({
        requester_id: requester.id,
        target_user_id: target.id,
        requester_shift_id: requesterShift.id,
        target_shift_id: targetShift.id,
        status,
        requester_original_date: requesterShift.date,
        requester_original_shift_type: requesterShift.shift_type,
        target_original_date: targetShift.date,
        target_original_shift_type: targetShift.shift_type,
      });
    }
  }
  
  if (swapRequests.length > 0) {
    const { data: requests, error } = await supabase
      .from('swap_requests')
      .insert(swapRequests)
      .select();
    
    if (error) {
      console.error('Error seeding swap requests:', error);
      throw error;
    }
    
    console.log(`✓ Seeded ${requests.length} swap requests`);
    return requests;
  }
  
  console.log('✓ No swap requests seeded (insufficient shifts)');
  return [];
}

async function seedLeaveRequests(users: any[]) {
  console.log('Seeding leave requests...');
  
  const agents = users.filter(u => u.role === 'agent');
  const leaveRequests = [];
  
  // Create 8 leave requests with different statuses
  const statuses = ['pending_tl', 'pending_wfm', 'approved', 'rejected', 'denied'];
  const leaveTypes = ['annual', 'casual', 'sick'];
  
  for (let i = 0; i < 8; i++) {
    const user = agents[i % agents.length];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days in future
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days duration
    
    leaveRequests.push({
      user_id: user.id,
      leave_type: leaveTypes[i % leaveTypes.length],
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: statuses[i % statuses.length],
      notes: `Test leave request ${i + 1}`,
    });
  }
  
  const { data: requests, error } = await supabase
    .from('leave_requests')
    .insert(leaveRequests)
    .select();
  
  if (error) {
    console.error('Error seeding leave requests:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${requests.length} leave requests`);
  return requests;
}

async function seedComments(swapRequests: any[], leaveRequests: any[], users: any[]) {
  console.log('Seeding comments...');
  
  const comments = [];
  
  // Add comments to swap requests
  for (const request of swapRequests.slice(0, 3)) {
    const commenter = users[Math.floor(Math.random() * users.length)];
    comments.push({
      request_type: 'swap',
      request_id: request.id,
      user_id: commenter.id,
      content: 'This is a test comment on a swap request.',
      is_system: false,
    });
  }
  
  // Add comments to leave requests
  for (const request of leaveRequests.slice(0, 3)) {
    const commenter = users[Math.floor(Math.random() * users.length)];
    comments.push({
      request_type: 'leave',
      request_id: request.id,
      user_id: commenter.id,
      content: 'This is a test comment on a leave request.',
      is_system: false,
    });
  }
  
  if (comments.length > 0) {
    const { data: commentData, error } = await supabase
      .from('comments')
      .insert(comments)
      .select();
    
    if (error) {
      console.error('Error seeding comments:', error);
      throw error;
    }
    
    console.log(`✓ Seeded ${commentData.length} comments`);
    return commentData;
  }
  
  console.log('✓ No comments seeded');
  return [];
}

async function clearTestData() {
  console.log('Clearing existing test data...');
  
  // Delete in reverse order of dependencies
  await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('swap_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leave_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✓ Cleared existing test data');
}

async function main() {
  try {
    console.log('Starting test data seeding...\n');
    
    // Clear existing data
    await clearTestData();
    
    // Seed data in order
    const users = await seedUsers();
    const shifts = await seedShifts(users);
    await seedLeaveBalances(users);
    const swapRequests = await seedSwapRequests(users, shifts);
    const leaveRequests = await seedLeaveRequests(users);
    await seedComments(swapRequests, leaveRequests, users);
    
    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\nTest Database Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Shifts: ${shifts.length}`);
    console.log(`  - Swap Requests: ${swapRequests.length}`);
    console.log(`  - Leave Requests: ${leaveRequests.length}`);
    console.log('\nYou can now run tests against the local Supabase instance.');
    
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeding script
main();
