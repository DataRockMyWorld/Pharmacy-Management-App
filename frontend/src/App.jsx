import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './components/login'
import ResetPassword from './components/ResetPassword'
import ErrorBoundary from './components/ErrorBoundary';
import ResetPasswordConfirm from './components/ResetPasswordConfirm'
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout';
import Purchase from './pages/Purchase'
import Customer from './pages/Customer';
import Product from './pages/Product';
import Manufacturer from './pages/Manufacturer';
import Stock from './pages/Stock';
import Warehouse from './pages/Warehouse';
import TransactionHistory from './pages/TransactionHistory';
import {NotificationProvider} from './context/NotificationContext'
import {AuthProvider} from './utils/AuthContext';



function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ToastContainer />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password-confirm/:user_id/reset_code" element={<ResetPasswordConfirm />} />

              {/* Protected routes with layout */}
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="/purchase" element={<Purchase />} />
                <Route path="/transaction-history" element={<TransactionHistory />} />
                <Route path="/customer" element={<Customer />} />
                <Route path="/product" element={<Product />} />
                <Route path="/manufacturer" element={<Manufacturer />} />
                <Route path="/stock" element={<Stock />} />
                
                {/* CEO-only routes */}
                <Route element={<PrivateRoute roles={['CEO']} />}>
                  <Route path="/warehouse" element={<Warehouse />} />
                </Route>
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;