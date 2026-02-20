import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { settingsService } from '../../services';
import { ROUTES } from '../../constants';
import { handleDatabaseError } from '../../lib/errorHandler';
import GeneralSettings from './GeneralSettings';
import LeaveTypeManager from './LeaveTypeManager';
import BreakScheduleSettings from './BreakScheduleSettings';
import ShiftConfigSettings from './ShiftConfigSettings';
import SkillsManager from './SkillsManager';
import OvertimeSettings from './OvertimeSettings';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'general' | 'leave-types' | 'break-schedule' | 'shift-configurations' | 'skills' | 'overtime'
  >('general');
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not WFM
    if (user && user.role !== 'wfm') {
      navigate(ROUTES.DASHBOARD);
      return;
    }
    fetchSettings();
  }, [user, navigate]);

  async function fetchSettings() {
    try {
      const autoApproveValue = await settingsService.getAutoApproveSetting();
      const exceptionsValue = await settingsService.getAllowLeaveExceptionsSetting();

      setAutoApprove(autoApproveValue);
      setAllowLeaveExceptions(exceptionsValue);
    } catch (err) {
      handleDatabaseError(err, 'fetch settings');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">WFM Settings</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('leave-types')}
            className={`${
              activeTab === 'leave-types'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Leave Types
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`${
              activeTab === 'skills'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('break-schedule')}
            className={`${
              activeTab === 'break-schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Break Schedule
          </button>
          <button
            onClick={() => setActiveTab('shift-configurations')}
            className={`${
              activeTab === 'shift-configurations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Shift Configurations
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`${
              activeTab === 'overtime'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
          >
            Overtime
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <GeneralSettings
          autoApprove={autoApprove}
          allowLeaveExceptions={allowLeaveExceptions}
          onAutoApproveChange={setAutoApprove}
          onAllowLeaveExceptionsChange={setAllowLeaveExceptions}
        />
      )}

      {activeTab === 'leave-types' && <LeaveTypeManager />}

      {activeTab === 'skills' && <SkillsManager />}

      {activeTab === 'break-schedule' && <BreakScheduleSettings />}

      {activeTab === 'shift-configurations' && <ShiftConfigSettings />}

      {activeTab === 'overtime' && <OvertimeSettings />}
    </div>
  );
}
