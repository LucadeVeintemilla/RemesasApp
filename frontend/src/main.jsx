import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import Products from './pages/Products.jsx'
import Remesas from './pages/Remesas.jsx'
import Delivery from './pages/Delivery.jsx'
import Reports from './pages/Reports.jsx'
import { Toaster } from 'react-hot-toast'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/students', element: <Students /> },
          { path: '/products', element: <Products /> },
          { path: '/remesas', element: <Remesas /> },
          { path: '/delivery', element: <Delivery /> },
          { path: '/reports', element: <Reports /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px' } }} />
    </AuthProvider>
  </StrictMode>,
)
