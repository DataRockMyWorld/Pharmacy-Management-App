import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Badge,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  ShoppingCart,
  Person,
  Add,
  Delete,
  Payment,
  AttachMoney,
  Smartphone,
  CreditCard,
  CheckCircle,
  History,
  Close,
  Cancel,
  Edit,
  Download as DownloadIcon,
  Email as EmailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 900,
  borderRadius: 16,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  overflow: 'visible',
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

const PaymentMethodCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(3),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: `2px solid ${selected ? '#5564EE' : '#e0e0e0'}`,
  backgroundColor: selected ? 'rgba(85, 100, 238, 0.05)' : '#fff',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
    borderColor: selected ? '#5564EE' : 'rgba(85, 100, 238, 0.3)'
  },
  '& .icon-container': {
    width: 60,
    height: 60,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: selected ? 'rgba(85, 100, 238, 0.1)' : 'rgba(0, 0, 0, 0.04)',
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s ease',
  },
  '& .method-icon': {
    fontSize: 32,
    color: selected ? '#5564EE' : theme.palette.text.secondary,
  },
  '& .method-name': {
    fontWeight: selected ? 600 : 500,
    color: selected ? '#5564EE' : theme.palette.text.primary,
  }
}));

const Purchase = () => {
  const [customer, setCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [totalAmount, setTotalAmount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [receiptActions, setReceiptActions] = useState({
    downloading: false,
    emailing: false,
    smsSending: false,
    emailSuccess: false,
    smsSuccess: false,
    error: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch customers and products
    axios.get('v1/customers/')
      .then(response => {
        // Ensure response.data is an array
        const customersData = Array.isArray(response.data) ? response.data : [];
        setCustomers(customersData);
      })
      .catch(error => {
        console.error("Error fetching customers:", error);
        setCustomers([]); // Set to empty array on error
      });
  
    axios.get('v1/products/')
      .then(response => {
        // Ensure products data is an array
        const productsData = Array.isArray(response.data) ? response.data : [];
        setProducts(productsData);
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        setProducts([]); // Set to empty array on error
      });
  }, []);

  useEffect(() => {
    // Calculate total amount whenever selectedProducts changes
    const newTotal = selectedProducts.reduce((sum, item) => {
      return sum + (item.price_at_sale * item.quantity);
    }, 0);
    setTotalAmount(newTotal);
  }, [selectedProducts]);

  useEffect(() => {
    // Validate form fields
    const newErrors = {};
    if (!customer) newErrors.customer = 'Customer is required';
    if (selectedProducts.length === 0) newErrors.products = 'At least one product is required';
    if (!paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (totalAmount <= 0) newErrors.totalAmount = 'Total amount must be greater than 0';

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [customer, selectedProducts, paymentMethod, totalAmount]);

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setCustomer(customerId);
    const cust = Array.isArray(customers) ? customers.find(c => c.id === customerId) : null;
    setSelectedCustomer(cust || null);
  };

  const handleProductChange = (e) => {
    setCurrentProduct(e.target.value);
  };

  const handleQuantityChange = (e) => {
    setCurrentQuantity(Number(e.target.value));
  };

  const handleAddProduct = () => {
    if (!currentProduct || currentQuantity <= 0) return;

    const productToAdd = products.find(p => p.id === currentProduct);
    if (!productToAdd) return;

    // Check if product already exists in the list
    const existingProductIndex = selectedProducts.findIndex(
      item => item.product === currentProduct
    );

    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += currentQuantity;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts([
        ...selectedProducts,
        {
          product: currentProduct,
          product_name: productToAdd.name,
          quantity: currentQuantity,
          price_at_sale: Number(productToAdd.unit_price)
        }
      ]);
    }

    // Reset current selection
    setCurrentProduct('');
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(item => item.product !== productId));
  };

  const handlePaymentMethodChange = (method) => setPaymentMethod(method);

  const handleVerifyOrder = () => {
    if (!isFormValid) return;
    setSummaryOpen(true);
  };

  const handleSubmit = () => {
    setIsProcessing(true);

    const userBranch = 1; // Adjust based on your auth system

    const transactionData = {
      customer,
      branch: userBranch,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      items: selectedProducts.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale,
      }))
    };

    axios.post('v1/sales/', transactionData)
      .then(response => {
        setTransactionId(response.data.id);
        setTransactionSubmitted(true);
        setIsProcessing(false);
        setSummaryOpen(false);
        setSnackbarOpen(true);
      })
      .catch(error => {
        console.error("Error creating transaction:", error.response?.data || error.message);
        setIsProcessing(false);
      });
  };

  const handleAmendOrder = () => {
    setSummaryOpen(false);
  };

  const handleCancelOrder = () => {
    setSummaryOpen(false);
  };

  const handleConfirmTransaction = () => {
    setCustomer('');
    setSelectedProducts([]);
    setCurrentProduct('');
    setCurrentQuantity(1);
    setPaymentMethod('CASH');
    setTotalAmount(0);
    setTransactionSubmitted(false);
    setSelectedCustomer(null);
    setReceiptActions({
      downloading: false,
      emailing: false,
      smsSending: false,
      emailSuccess: false,
      smsSuccess: false,
      error: null
    });
  };

  const navigateToTransactionHistory = () => {
    navigate('/transaction-history');
  };

  const handleDownloadReceipt = () => {
    window.open(`/receipts/${transactionId}/`, '_blank');
  };

  const handleEmailReceipt = async () => {
    setReceiptActions(prev => ({ ...prev, emailing: true, error: null }));
    try {
      await axios.post(`/receipts/${transactionId}/send-email/`);
      setReceiptActions(prev => ({ ...prev, emailing: false, emailSuccess: true }));
      setSnackbarOpen(true);
    } catch (error) {
      setReceiptActions(prev => ({ 
        ...prev, 
        emailing: false, 
        error: error.response?.data?.message || 'Failed to send email receipt' 
      }));
    }
  };

  const handleSmsReceipt = async () => {
    setReceiptActions(prev => ({ ...prev, smsSending: true, error: null }));
    try {
      await axios.post(`/api/receipts/${transactionId}/send-sms/`);
      setReceiptActions(prev => ({ ...prev, smsSending: false, smsSuccess: true }));
      setSnackbarOpen(true);
    } catch (error) {
      setReceiptActions(prev => ({ 
        ...prev, 
        smsSending: false, 
        error: error.response?.data?.message || 'Failed to send SMS receipt' 
      }));
    }
  };

  const getPaymentMethodName = (method) => {
    switch(method) {
      case 'CASH': return 'Cash';
      case 'MOMO': return 'Mobile Money';
      case 'CARD': return 'Card';
      default: return method;
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
      }}
    >
      <StyledCard>
        <CardContent>
          {!transactionSubmitted ? (
            <form>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: '#5564EE', mr: 2 }}>
                  <ShoppingCart />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  New Purchase
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 4 }} />
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      <Person sx={{ verticalAlign: 'middle', mr: 1, color: '#5564EE' }} />
                      Customer Information
                    </Typography>
                    <FormControl fullWidth error={!!errors.customer}>
  <InputLabel>Select Customer</InputLabel>
  <Select 
    value={customer} 
    onChange={handleCustomerChange}
    MenuProps={{
      PaperProps: {
        sx: {
          maxHeight: 300
        }
      }
    }}
  >
    {Array.isArray(customers) && customers.length > 0 ? (
      customers.map((cust) => (
        <MenuItem key={cust.id} value={cust.id}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ width: 24, height: 24, mr: 2, fontSize: '0.8rem', bgcolor: '#5564EE' }}>
              {cust.name?.charAt(0) || 'C'}
            </Avatar>
            {cust.name || 'Unknown Customer'}
          </Box>
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>No customers available</MenuItem>
    )}
  </Select>
  {errors.customer && <Typography color="error" variant="caption">{errors.customer}</Typography>}
</FormControl>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      <ShoppingCart sx={{ verticalAlign: 'middle', mr: 1, color: '#5564EE' }} />
                      Product Selection
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid item xs={12} sm={5}>
                      <FormControl fullWidth error={!!errors.products}>
  <InputLabel>Select Product</InputLabel>
  <Select 
    value={currentProduct} 
    onChange={handleProductChange}
    label="Select Product"
  >
    {Array.isArray(products) && products.length > 0 ? (
      products.map((prod) => (
        <MenuItem key={prod.id} value={prod.id}>
          <Box display="flex" justifyContent="space-between" width="100%">
            <span>{prod.name || 'N/A'}</span>
            <span>GHC {Number(prod.unit_price || 0).toFixed(2)}</span>
          </Box>
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>No products available</MenuItem>
    )}
  </Select>
</FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={currentQuantity}
                          onChange={handleQuantityChange}
                          fullWidth
                          InputProps={{
                            inputProps: { min: 1 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Add />}
                          onClick={handleAddProduct}
                          disabled={!currentProduct}
                          fullWidth
                          sx={{ height: '56px' }}
                        >
                          Add Product
                        </Button>
                      </Grid>
                    </Grid>
                    {errors.products && <Typography color="error" variant="caption">{errors.products}</Typography>}
                    
                    {selectedProducts.length > 0 && (
                      <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                          Selected Products
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedProducts.map((item) => (
                                <TableRow key={item.product}>
                                  <TableCell>{item.product_name}</TableCell>
                                  <TableCell align="right">GHC {item.price_at_sale.toFixed(2)}</TableCell>
                                  <TableCell align="right">{item.quantity}</TableCell>
                                  <TableCell align="right">
                                    GHC {(item.price_at_sale * item.quantity).toFixed(2)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleRemoveProduct(item.product)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      <Payment sx={{ verticalAlign: 'middle', mr: 1, color: '#5564EE' }} />
                      Payment Method
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <PaymentMethodCard 
                            selected={paymentMethod === 'CASH'}
                            onClick={() => handlePaymentMethodChange('CASH')}
                          >
                            <div className="icon-container">
                              <AttachMoney className="method-icon" />
                            </div>
                            <Typography variant="body1" className="method-name">Cash</Typography>
                          </PaymentMethodCard>
                        </motion.div>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <PaymentMethodCard 
                            selected={paymentMethod === 'MOMO'}
                            onClick={() => handlePaymentMethodChange('MOMO')}
                          >
                            <div className="icon-container">
                              <Smartphone className="method-icon" />
                            </div>
                            <Typography variant="body1" className="method-name">Mobile Money</Typography>
                          </PaymentMethodCard>
                        </motion.div>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <PaymentMethodCard 
                            selected={paymentMethod === 'CARD'}
                            onClick={() => handlePaymentMethodChange('CARD')}
                          >
                            <div className="icon-container">
                              <CreditCard className="method-icon" />
                            </div>
                            <Typography variant="body1" className="method-name">Card</Typography>
                          </PaymentMethodCard>
                        </motion.div>
                      </Grid>
                    </Grid>
                    {errors.paymentMethod && <Typography color="error" variant="caption">{errors.paymentMethod}</Typography>}
                  </Box>

                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Order Preview
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Number of Items:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Products:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedProducts.length}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total Amount:</Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        GHC {Number(totalAmount).toFixed(2)}
                      </Typography>
                    </Box>
                    {errors.totalAmount && <Typography color="error" variant="caption">{errors.totalAmount}</Typography>}
                  </Paper>
                </Grid>
              </Grid>

              <Box mt={4} display="flex" justifyContent="flex-end">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isProcessing || !isFormValid}
                    onClick={handleVerifyOrder}
                    sx={{
                      px: 6,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      backgroundColor: '#5564EE',
                      '&:hover': {
                        backgroundColor: '#3A4AED',
                      }
                    }}
                  >
                    Verify Order
                  </Button>
                </motion.div>
              </Box>
            </form>
          ) : (
            <Box textAlign="center" py={6}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <CheckCircle sx={{ fontSize: 20 }} />
                    </Avatar>
                  }
                >
                  <Avatar sx={{ 
                    bgcolor: '#5564EE', 
                    width: 80, 
                    height: 80,
                    mx: 'auto',
                    mb: 3
                  }}>
                    <ShoppingCart sx={{ fontSize: 40 }} />
                  </Avatar>
                </Badge>
              </motion.div>
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                Purchase Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Transaction ID: #{transactionId}
              </Typography>
              
              {/* Receipt Actions Section */}
              <Box mb={4}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Receipt Actions
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadReceipt}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        borderColor: '#5564EE',
                        color: '#5564EE',
                        '&:hover': {
                          borderColor: '#3A4AED',
                          backgroundColor: 'rgba(85, 100, 238, 0.04)'
                        }
                      }}
                    >
                      Download Receipt
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined"
                      startIcon={receiptActions.emailing ? <CircularProgress size={20} /> : <EmailIcon />}
                      onClick={handleEmailReceipt}
                      disabled={receiptActions.emailing}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        borderColor: '#5564EE',
                        color: '#5564EE',
                        '&:hover': {
                          borderColor: '#3A4AED',
                          backgroundColor: 'rgba(85, 100, 238, 0.04)'
                        }
                      }}
                    >
                      {receiptActions.emailing ? 'Sending...' : 'Email Receipt'}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined"
                      startIcon={receiptActions.smsSending ? <CircularProgress size={20} /> : <SmsIcon />}
                      onClick={handleSmsReceipt}
                      disabled={receiptActions.smsSending}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        borderColor: '#5564EE',
                        color: '#5564EE',
                        '&:hover': {
                          borderColor: '#3A4AED',
                          backgroundColor: 'rgba(85, 100, 238, 0.04)'
                        }
                      }}
                    >
                      {receiptActions.smsSending ? 'Sending...' : 'SMS Receipt'}
                    </Button>
                  </motion.div>
                </Box>
                {receiptActions.error && (
                  <Box mt={1}>
                    <Typography color="error" variant="body2">
                      {receiptActions.error}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box display="flex" justifyContent="center" gap={2}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConfirmTransaction}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      backgroundColor: '#5564EE',
                      '&:hover': {
                        backgroundColor: '#3A4AED',
                      }
                    }}
                  >
                    New Transaction
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={navigateToTransactionHistory}
                    startIcon={<History />}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      borderColor: '#5564EE',
                      color: '#5564EE',
                      '&:hover': {
                        borderColor: '#3A4AED',
                        color: '#3A4AED',
                        backgroundColor: 'rgba(85, 100, 238, 0.04)'
                      }
                    }}
                  >
                    View History
                  </Button>
                </motion.div>
              </Box>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* Order Summary Dialog */}
      <Dialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Order Summary
            </Typography>
            <IconButton onClick={() => setSummaryOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Customer Details
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: '#5564EE', mr: 2 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography fontWeight="medium">
                  {selectedCustomer?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Order Items
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedProducts.map((item) => (
                    <TableRow key={item.product}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">GHC {item.price_at_sale.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        GHC {(item.price_at_sale * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Payment Information
            </Typography>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                {paymentMethod === 'CASH' && <AttachMoney />}
                {paymentMethod === 'MOMO' && <Smartphone />}
                {paymentMethod === 'CARD' && <CreditCard />}
              </Avatar>
              <Typography>
                {getPaymentMethodName(paymentMethod)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Subtotal:</Typography>
              <Typography>GHC {Number(totalAmount).toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Tax (0%):</Typography>
              <Typography>GHC 0.00</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                Total Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                GHC {Number(totalAmount).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={handleCancelOrder}
            sx={{ mr: 2 }}
          >
            Cancel Order
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Edit />}
            onClick={handleAmendOrder}
            sx={{ mr: 2 }}
          >
            Amend Order
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper elevation={3} sx={{ p: 2, bgcolor: '#5564EE', color: 'white' }}>
          <Box display="flex" alignItems="center">
            <CheckCircle sx={{ mr: 1 }} />
            <Typography>
              {receiptActions.emailSuccess ? 'Email receipt sent successfully!' : 
               receiptActions.smsSuccess ? 'SMS receipt sent successfully!' : 
               'Transaction completed successfully!'}
            </Typography>
          </Box>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default Purchase;