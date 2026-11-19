import { Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import PortalLayout from './layouts/PortalLayout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import PublicOnlyRoute from './routes/PublicOnlyRoute.jsx'
import ScrollToTop from './routes/ScrollToTop.jsx'
import { MEMBER_NAV, TRAINER_NAV } from './utils/portalNav.js'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Plans from './pages/Plans.jsx'
import Trainers from './pages/Trainers.jsx'
import Classes from './pages/Classes.jsx'
import Facilities from './pages/Facilities.jsx'
import Gallery from './pages/Gallery.jsx'
import Contact from './pages/Contact.jsx'
import MembershipRegistration from './pages/MembershipRegistration.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import NotFound from './pages/NotFound.jsx'
import PortalNotFound from './pages/PortalNotFound.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminMembers from './pages/admin/Members.jsx'
import AdminMemberDetail from './pages/admin/MemberDetail.jsx'
import AdminTrainers from './pages/admin/Trainers.jsx'
import AdminPlans from './pages/admin/Plans.jsx'
import AdminMemberships from './pages/admin/Memberships.jsx'
import AdminPayments from './pages/admin/Payments.jsx'
import AdminAttendance from './pages/admin/Attendance.jsx'
import AdminClasses from './pages/admin/Classes.jsx'
import AdminEnquiries from './pages/admin/Enquiries.jsx'
import AdminMessages from './pages/admin/Messages.jsx'
import AdminReports from './pages/admin/Reports.jsx'
import AdminActivityLogs from './pages/admin/ActivityLogs.jsx'
import AdminProfile from './pages/admin/Profile.jsx'
import { AdminNotFound } from './pages/admin/AdminSoon.jsx'
import MemberOverview from './pages/member/Overview.jsx'
import MemberMembership from './pages/member/Membership.jsx'
import MemberPayments from './pages/member/Payments.jsx'
import MemberAttendance from './pages/member/Attendance.jsx'
import MemberClasses from './pages/member/Classes.jsx'
import MemberProfile from './pages/member/Profile.jsx'
import TrainerOverview from './pages/trainer/Overview.jsx'
import TrainerMembers from './pages/trainer/Members.jsx'
import TrainerClasses from './pages/trainer/Classes.jsx'
import TrainerProfile from './pages/trainer/Profile.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="plans" element={<Plans />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="classes" element={<Classes />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="membership-registration" element={<MembershipRegistration />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Login / register (logged-in users are redirected away) */}
        <Route element={<AuthLayout />}>
          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin area */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="members/:id" element={<AdminMemberDetail />} />
            <Route path="trainers" element={<AdminTrainers />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="memberships" element={<AdminMemberships />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="activity-logs" element={<AdminActivityLogs />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>

        {/* Trainer area */}
        <Route element={<ProtectedRoute roles={['trainer']} />}>
          <Route path="trainer" element={<PortalLayout nav={TRAINER_NAV} area="Trainer area" />}>
            <Route index element={<TrainerOverview />} />
            <Route path="members" element={<TrainerMembers />} />
            <Route path="classes" element={<TrainerClasses />} />
            <Route path="profile" element={<TrainerProfile />} />
            <Route path="*" element={<PortalNotFound home="/trainer" />} />
          </Route>
        </Route>

        {/* Member area */}
        <Route element={<ProtectedRoute roles={['member']} />}>
          <Route path="member" element={<PortalLayout nav={MEMBER_NAV} area="Member area" />}>
            <Route index element={<MemberOverview />} />
            <Route path="membership" element={<MemberMembership />} />
            <Route path="payments" element={<MemberPayments />} />
            <Route path="attendance" element={<MemberAttendance />} />
            <Route path="classes" element={<MemberClasses />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="*" element={<PortalNotFound home="/member" />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}