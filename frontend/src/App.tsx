import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientOnboarding from './components/ClientOnboarding';
import ProposalGenerator from './components/ProposalGenerator';
import ContentCreator from './components/ContentCreator';
import SEOReporter from './components/SEOReporter';
import TaskManager from './components/TaskManager';
import CommunicationHub from './components/CommunicationHub';
import BillingModule from './components/BillingModule';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="onboarding" element={<ClientOnboarding />} />
          <Route path="proposals" element={<ProposalGenerator />} />
          <Route path="content" element={<ContentCreator />} />
          <Route path="seo" element={<SEOReporter />} />
          <Route path="tasks" element={<TaskManager />} />
          <Route path="communications" element={<CommunicationHub />} />
          <Route path="billing" element={<BillingModule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
