import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Card,
  CardContent,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme, color }) => ({
  position: 'relative',
  overflow: 'visible',
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px 0 rgba(0,0,0,0.12)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: color,
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: color,
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px'
  }
}));

const Dashboard = () => {
  const [cardData, setCardData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [expiryData, setExpiryData] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [profitChartData, setProfitChartData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    branchId: '',
  });
  const [openSalesModal, setOpenSalesModal] = useState(false);
  const [openExpiryModal, setOpenExpiryModal] = useState(false);

  const iconMap = {
    'Total Sales': <AttachMoneyIcon />,
    'Total Customers': <PeopleIcon />,
    'Total Profits': <TrendingUpIcon />,
    'Out of Stock': <WarningIcon />,
  };

  const iconBgMap = {
    'Total Sales': '#4CAF50',
    'Total Customers': '#2196F3',
    'Total Profits': '#FF9800',
    'Out of Stock': '#F44336',
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchUserRole = async () => {
    try {
      const response = await axiosInstance.get('v1/user/me/');
      setUserRole(response.data.role);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axiosInstance.get('v1/sites/');
      setBranches(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const stats = await axiosInstance.get('v1/dashboard/statistics/', { params: { branch: filters.branchId } });
      const sales = await axiosInstance.get('v1/dashboard/sales-table/', { params: filters });
      const expiry = await axiosInstance.get('v1/dashboard/expiry-list/', { params: { branch: filters.branchId } });
      const monthly = await axiosInstance.get('v1/dashboard/monthly-sales/', { params: { branch: filters.branchId } });

      setCardData(stats.data.statistics);
      setSalesData(sales.data);
      setExpiryData(expiry.data);
      setSalesChartData(monthly.data);
      setProfitChartData(monthly.data.map(item => ({ month: item.month, profit: item.total / 2 })));
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSalesModal = () => setOpenSalesModal(true);
  const handleCloseSalesModal = () => setOpenSalesModal(false);
  const handleOpenExpiryModal = () => setOpenExpiryModal(true);
  const handleCloseExpiryModal = () => setOpenExpiryModal(false);

  useEffect(() => {
    fetchUserRole();
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchAllDashboardData();
  }, [filters]);

  if (loading) {
    return <Box sx={{ p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Typography color="error">Something went wrong loading the dashboard. Please try again.</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', width: '100%', margin: 'auto' }}>
      {(userRole === 'CEO' || userRole === 'superuser') && (
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 3,
          flexWrap: 'wrap',
          '& > *': { flex: '1 1 200px' }
        }}>
          <TextField 
            name="startDate" 
            label="Start Date" 
            type="date" 
            onChange={handleFilterChange} 
            InputLabelProps={{ shrink: true }}
          />
          <TextField 
            name="endDate" 
            label="End Date" 
            type="date" 
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl>
            <InputLabel>Branch</InputLabel>
            <Select
              name="branchId"
              value={filters.branchId}
              onChange={handleFilterChange}
              sx={{ minWidth: 200 }}
              label="Branch"
            >
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={fetchAllDashboardData} 
            sx={{ 
              bgcolor: '#5564EE',
              '&:hover': { bgcolor: '#4453DD' },
              minHeight: '56px'
            }}
          >
            Apply Filters
          </Button>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardData.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StyledCard color={iconBgMap[card.title]}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: iconBgMap[card.title], 
                      color: 'white', 
                      mr: 2,
                      width: 48, 
                      height: 48
                    }}
                  >
                    {iconMap[card.title]}
                  </Avatar>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography 
                  sx={{ 
                    fontWeight: 'bold', 
                    fontSize: 24,
                    color: 'text.primary',
                    textAlign: 'right'
                  }}
                >
                  {(card.title === 'Total Sales' || card.title === 'Total Profits') 
                    ? `GHC ${card.value.toLocaleString()}` 
                    : card.value.toLocaleString()}
                </Typography>
                {card.title === 'Total Profits' && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'right',
                      color: card.value > 0 ? '#4CAF50' : '#F44336'
                    }}
                  >
                    {card.value > 0 ? '↑ Profit' : '↓ Loss'}
                  </Typography>
                )}
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ my: 4}}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', position: 'relative' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Recent Sales
              </Typography>
              <Button 
                onClick={handleOpenSalesModal}
                sx={{
                  textTransform: 'none',
                  color: '#5564EE',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  },
                  position: 'absolute',
                  right: -170
                }}
              >
                See All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData.slice(0, 5).map((sale, index) => (
                    sale.items?.map(item => (
                      <TableRow key={`${index}-${item.product_id}`} hover>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">GHC {item.price_at_sale}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ fontWeight: 500 }}>
                            GHC {(item.quantity * item.price_at_sale).toFixed(2)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' , position: 'relative'}}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Expiring Soon
              </Typography>
              <Button 
                onClick={handleOpenExpiryModal}
                sx={{
                  textTransform: 'none',
                  color: '#5564EE',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  },
                  position: 'absolute',
                  right: -170
                }}
              >
                See All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expiryData.slice(0, 5).map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{row.product_name}</TableCell>
                      <TableCell>{new Date(row.expiration_date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openSalesModal} onClose={handleCloseSalesModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">All Recent Sales</Typography>
            <IconButton onClick={handleCloseSalesModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesData.map((sale, index) => (
                  sale.items?.map(item => (
                    <TableRow key={`${index}-${item.product_id}`} hover>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">GHC {item.price_at_sale}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ fontWeight: 500 }}>
                          GHC {(item.quantity * item.price_at_sale).toFixed(2)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      <Dialog open={openExpiryModal} onClose={handleCloseExpiryModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">All Expiring Products</Typography>
            <IconButton onClick={handleCloseExpiryModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiryData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell>{new Date(row.expiration_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Sales Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)' }} />
                <Legend />
                <Bar dataKey="sales" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Profit Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)' }} />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#2196F3" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;