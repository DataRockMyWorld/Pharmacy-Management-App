import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Snackbar,
  CircularProgress,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Person, 
  Phone, 
  Email, 
  HowToReg, 
  ListAlt,
  Close,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import axios from '../utils/axiosInstance';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    background: 'linear-gradient(90deg, #5564EE, #7986FF)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  }
}));

const Customer = () => {
  const [formData, setFormData] = useState({
    title: 'Mr',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showCustomers, setShowCustomers] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Dr', label: 'Dr' }
  ];

  useEffect(() => {
    if (showCustomers) {
      fetchCustomers();
    }
  }, [showCustomers]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('v1/customers/');
      setCustomers(response.data);
      console.log(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch customers',
        severity: 'error'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        name: `${formData.title} ${formData.first_name} ${formData.last_name}`.trim()
      };
      
      const response = await axios.post('v1/customers/', payload);
      
      setSnackbar({
        open: true,
        message: 'Customer created successfully!',
        severity: 'success'
      });
      
      // Reset form after successful submission
      setFormData({
        title: 'Mr',
        first_name: '',
        last_name: '',
        phone_number: '',
        email: ''
      });

      // Refresh customer list if it's open
      if (showCustomers) {
        fetchCustomers();
      }

    } catch (error) {
      console.error('Error creating customer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create customer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const toggleCustomerList = () => {
    setShowCustomers(!showCustomers);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Grid container spacing={3}>
        {/* Registration Form */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ bgcolor: '#5564EE', mr: 2 }}>
                <Person />
              </Avatar>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Customer Registration
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Title */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Title</InputLabel>
                    <Select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      label="Title"
                    >
                      {titleOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* First Name */}
                <Grid item xs={12} sm={4.5}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                {/* Last Name */}
                <Grid item xs={12} sm={4.5}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                {/* Phone Number */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Phone sx={{ color: 'action.active', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email (Optional)"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <Email sx={{ color: 'action.active', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={24} /> : <HowToReg />}
                      sx={{ 
                        py: 1.5,
                        backgroundColor: '#5564EE',
                        '&:hover': {
                          backgroundColor: '#3A4AED',
                        }
                      }}
                    >
                      {loading ? 'Processing...' : 'Register Customer'}
                    </Button>
                  </motion.div>
                </Grid>
              </Grid>
            </form>
          </StyledPaper>
        </Grid>

        {/* Customer List Button */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={toggleCustomerList}
              startIcon={<ListAlt />}
              sx={{ 
                height: '100%',
                minHeight: 150,
                backgroundColor: '#5564EE',
                '&:hover': {
                  backgroundColor: '#3A4AED',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                View Customer List
              </Typography>
            </Button>
          </motion.div>
        </Grid>
      </Grid>

      {/* Customer List Dialog */}
      <Dialog
        open={showCustomers}
        onClose={toggleCustomerList}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#5564EE', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center">
            <ListAlt sx={{ mr: 1 }} />
            <Typography variant="h6">Customer List</Typography>
          </Box>
          <Box>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={fetchCustomers} 
                color="inherit"
                sx={{ mr: 1 }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={toggleCustomerList} color="inherit">
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default' }}>
          <Button 
            onClick={toggleCustomerList}
            sx={{ color: '#5564EE' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            bgcolor: snackbar.severity === 'success' ? '#5564EE' : 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          {snackbar.severity === 'success' ? (
            <CheckCircle sx={{ mr: 1 }} />
          ) : (
            <Close sx={{ mr: 1 }} />
          )}
          <Typography>{snackbar.message}</Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default Customer;
