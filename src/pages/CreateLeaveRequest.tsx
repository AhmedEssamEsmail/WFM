// 1. Add this helper to calculate business days (or total days)
const calculateDays = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day
};

// 2. Update your handleSubmit function inside the component:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  const requestedDays = calculateDays(startDate, endDate);

  try {
    // Check balance first
    const { data: balanceData, error: balanceError } = await supabase
      .from('leave_balances')
      .select('balance')
      .eq('user_id', user?.id)
      .eq('leave_type', leaveType)
      .single();

    if (balanceError) throw new Error('Could not verify leave balance.');

    if (balanceData.balance < requestedDays) {
      setError(`Insufficient balance. You requested ${requestedDays} days but only have ${balanceData.balance} available.`);
      setLoading(false);
      return;
    }

    // If balance is okay, proceed with the insert...
    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert([{
        user_id: user?.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        notes,
        status: 'pending_tl'
      }]);

    if (insertError) throw insertError;
    navigate('/leave-requests');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
