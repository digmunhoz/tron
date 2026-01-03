import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Clusters from './pages/Clusters'
import Environments from './pages/Environments'
import Applications from './pages/Webapps'
import ApplicationDetail from './pages/ApplicationDetail'
import InstanceComponents from './pages/InstanceComponents'
import Templates from './pages/Templates'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="clusters" element={<Clusters />} />
        <Route path="environments" element={<Environments />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:uuid" element={<ApplicationDetail />} />
        <Route path="applications/:uuid/instances/:instanceUuid/components" element={<InstanceComponents />} />
        <Route path="templates" element={<Templates />} />
      </Route>
    </Routes>
  )
}

export default App

