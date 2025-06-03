import { ProfileResource, getReferenceString } from '@medplum/core';
import {
  AppShell,
  Loading,
  Logo,
  NotificationIcon,
  useMedplum,
  useMedplumNavigate,
  useMedplumProfile,
} from '@medplum/react';
import {
  IconClipboardCheck,
  IconMail,
  IconPencil,
  IconTimeDuration0,
  IconTransformPoint,
  IconUser,
  IconUpload,
  IconReportAnalytics,
  IconBuilding,
  IconUsers,
  IconActivity,
  IconFileSearch,
} from '@tabler/icons-react';
import { JSX, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { DoseSpotIcon } from './components/DoseSpotIcon';
import { hasDoseSpotIdentifier } from './components/utils';
import './index.css';
import { HomePage } from './pages/HomePage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SchedulePage } from './pages/SchedulePage';
import { SearchPage } from './pages/SearchPage';
import { SignInPage } from './pages/SignInPage';
import { EncounterChart } from './pages/encounter/EncounterChart';
import { EncounterModal } from './pages/encounter/EncounterModal';
import { CommunicationTab } from './pages/patient/CommunicationTab';
import { DoseSpotTab } from './pages/patient/DoseSpotTab';
import { EditTab } from './pages/patient/EditTab';
import { ExportTab } from './pages/patient/ExportTab';
import { IntakeFormPage } from './pages/patient/IntakeFormPage';
import { PatientPage } from './pages/patient/PatientPage';
import { PatientSearchPage } from './pages/patient/PatientSearchPage';
import { TaskTab } from './pages/patient/TaskTab';
import { TimelineTab } from './pages/patient/TimelineTab';
import { ResourceCreatePage } from './pages/resource/ResourceCreatePage';
import { ResourceDetailPage } from './pages/resource/ResourceDetailPage';
import { ResourceEditPage } from './pages/resource/ResourceEditPage';
import { ResourceHistoryPage } from './pages/resource/ResourceHistoryPage';
import { ResourcePage } from './pages/resource/ResourcePage';
import { TaskDetails } from './pages/tasks/TaskDetails';
import { ImageUploadPage } from './pages/ImageUploadPage';
import { AiAnalysisTab } from './pages/patient/AiAnalysisTab';
import { ProjectManagementPage } from './pages/admin/ProjectManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { SystemHealthPage } from './pages/admin/SystemHealthPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SiteMetricsPage } from './pages/admin/SiteMetricsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export function App(): JSX.Element | null {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const navigate = useMedplumNavigate();

  if (medplum.isLoading()) {
    return null;
  }

  const membership = medplum.getProjectMembership();
  const hasDoseSpot = hasDoseSpotIdentifier(membership);

  return (
    <AppShell
      logo={<span>MyOphtha</span>}
      menus={[
        {
          title: 'Main',
          links: [
            { icon: <IconUser />, label: 'Patient Search', href: '/' },
            { icon: <IconUpload />, label: 'Image Upload', href: '/upload' },
          ],
        },
        {
          title: 'Onboarding',
          links: [{ icon: <IconPencil />, label: 'New Patient', href: '/onboarding' }],
        },
        {
          title: 'Integrations',
          links: [{ icon: <IconTransformPoint />, label: 'Integrations', href: '/integrations' }],
        },
        {
          title: 'Admin',
          links: [
            { icon: <IconActivity />, label: 'Admin Dashboard', href: '/admin' },
            { icon: <IconReportAnalytics />, label: 'Site Metrics', href: '/metrics' },
            { icon: <IconBuilding />, label: 'Project Management', href: '/admin/projects' },
            { icon: <IconUsers />, label: 'User Management', href: '/admin/users' },
            { icon: <IconActivity />, label: 'System Health', href: '/admin/health' },
            { icon: <IconFileSearch />, label: 'Audit Logs', href: '/admin/audit' },
          ],
        },
      ]}
      resourceTypeSearchDisabled={true}
      notifications={
        profile && (
          <>
            <NotificationIcon
              label="Mail"
              resourceType="Communication"
              countCriteria={`recipient=${getReferenceString(profile as ProfileResource)}&status:not=completed&_summary=count`}
              subscriptionCriteria={`Communication?recipient=${getReferenceString(profile as ProfileResource)}`}
              iconComponent={<IconMail />}
              onClick={() =>
                navigate(
                  `/Communication?recipient=${getReferenceString(profile as ProfileResource)}&status:not=completed&_fields=sender,recipient,subject,status,_lastUpdated`
                )
              }
            />
            <NotificationIcon
              label="Tasks"
              resourceType="Task"
              countCriteria={`owner=${getReferenceString(profile as ProfileResource)}&status:not=completed&_summary=count`}
              subscriptionCriteria={`Task?owner=${getReferenceString(profile as ProfileResource)}`}
              iconComponent={<IconClipboardCheck />}
              onClick={() =>
                navigate(
                  `/Task?owner=${getReferenceString(profile as ProfileResource)}&status:not=completed&_fields=subject,code,description,status,_lastUpdated`
                )
              }
            />
            {hasDoseSpot && <DoseSpotIcon />}
          </>
        )
      }
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          {profile ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/Patient/:patientId" element={<PatientPage />}>
                <Route path="Encounter/new" element={<EncounterModal />} />
                <Route path="Encounter/:encounterId" element={<EncounterChart />}>
                  <Route path="Task/:taskId" element={<TaskDetails />} />
                </Route>
                <Route path="edit" element={<EditTab />} />
                <Route path="ai-analysis" element={<AiAnalysisTab />} />
                <Route path="communication" element={<CommunicationTab />} />
                <Route path="communication/:id" element={<CommunicationTab />} />
                {hasDoseSpot && <Route path="dosespot" element={<DoseSpotTab />} />}
                <Route path="Task/:id">
                  <Route index element={<TaskTab />} />
                  <Route path="*" element={<TaskTab />} />
                </Route>
                <Route path="timeline" element={<TimelineTab />} />
                <Route path="export" element={<ExportTab />} />
                <Route path=":resourceType" element={<PatientSearchPage />} />
                <Route path=":resourceType/new" element={<ResourceCreatePage />} />
                <Route path=":resourceType/:id" element={<ResourcePage />}>
                  <Route path="" element={<ResourceDetailPage />} />
                  <Route path="edit" element={<ResourceEditPage />} />
                  <Route path="history" element={<ResourceHistoryPage />} />
                </Route>
                <Route path="" element={<TimelineTab />} />
              </Route>
              <Route path="Task/:id">
                <Route index element={<TaskTab />} />
                <Route path="*" element={<TaskTab />} />
              </Route>
              <Route path="/onboarding" element={<IntakeFormPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/dosespot" element={<DoseSpotTab />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/upload" element={<ImageUploadPage />} />
              <Route path="/:resourceType" element={<SearchPage />} />
              <Route path="/:resourceType/new" element={<ResourceCreatePage />} />
              <Route path="/:resourceType/:id" element={<ResourcePage />}>
                <Route path="" element={<ResourceDetailPage />} />
                <Route path="edit" element={<ResourceEditPage />} />
                <Route path="history" element={<ResourceHistoryPage />} />
              </Route>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/metrics" element={<SiteMetricsPage />} />
              <Route path="/admin/projects" element={<ProjectManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/health" element={<SystemHealthPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
            </>
          ) : (
            <>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="*" element={<Navigate to="/signin" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </AppShell>
  );
}
