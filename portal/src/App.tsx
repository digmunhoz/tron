import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Clusters from './pages/clusters/Clusters'
import Environments from './pages/environments/Environments'
import Applications from './pages/applications/Applications'
import CreateApplication from './pages/applications/CreateApplication'
import CreateInstance from './pages/applications/CreateInstance'
import InstanceDetail from './pages/applications/InstanceDetail'
import WebappDetail from './pages/applications/WebappDetail'
import Templates from './pages/templates/Templates'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="clusters" element={<Clusters />} />
        <Route path="environments" element={<Environments />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/new" element={<CreateApplication />} />
        <Route path="applications/:uuid/instances/new" element={<CreateInstance />} />
        <Route path="applications/:uuid/instances/:instanceUuid/components" element={<InstanceDetail />} />
        <Route path="applications/:uuid/instances/:instanceUuid/components/:componentUuid" element={<WebappDetail />} />
        <Route path="templates" element={<Templates />} />
      </Route>
    </Routes>
  )
}

export default App

