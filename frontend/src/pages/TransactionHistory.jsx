import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  CircularProgress,
  Button,
  Grid,
  Snackbar,
  Chip,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  KeyboardArrowDown, 
  KeyboardArrowUp, 
  Clear, 
  Search,
  PictureAsPdf
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from '../utils/axiosInstance';

const TransactionHistory = () => {
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [expandedRows, setExpandedRows] = useState({});
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
    paymentMethod: '',
    customer: '',
    product: '',
    searchQuery: '',
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [branch, setBranch] = useState('');

  // Fetch initial data with error handling
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get current user and branch info
      const userRes = await axios.get('v1/user/me/').catch(err => {
        throw new Error('Failed to fetch user data');
      });
      setCurrentUser(userRes.data);
      setBranch(userRes.data.branch?.name || 'Head Office');

      // Fetch customers, products, and sales
      const [customersRes, productsRes, salesRes] = await Promise.all([
        axios.get('v1/customers/').catch(err => {
          console.error("Error fetching customers:", err);
          return { data: [] };
        }),
        axios.get('v1/products/').catch(err => {
          console.error("Error fetching products:", err);
          return { data: [] };
        }),
        axios.get('v1/sales/').catch(err => {
          console.error("Error fetching sales:", err);
          return { data: [] };
        })
      ]);
      
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      
      // Enhance sales data
      const salesData = salesRes.data.results || salesRes.data || [];
      const enhancedSales = salesData.map((sale, index) => ({
        ...sale,
        frontendId: index + 1,
        customerName: customersRes.data?.find(c => c.id === sale.customer)?.name || 'N/A',
        productNames: sale.items?.map(item => item.product_name).join(', ') || 'N/A'
      }));

      setAllSales(enhancedSales);
      setSales(enhancedSales);
      setTotalPages(Math.ceil(enhancedSales.length / perPage) || 1);

    } catch (error) {
      console.error("Error fetching initial data:", error);
      setSnackbar({ 
        open: true, 
        message: 'Error loading data. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Apply filters
  useEffect(() => {
    if (allSales.length === 0) return;

    let filteredData = [...allSales];

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredData = filteredData.filter(sale => 
        sale.customerName.toLowerCase().includes(query) ||
        sale.payment_method.toLowerCase().includes(query) ||
        sale.productNames.toLowerCase().includes(query) ||
        sale.total_amount.toString().includes(query) ||
        sale.frontendId.toString().includes(query)
      );
    }

    // Other filters
    if (filter.paymentMethod) {
      filteredData = filteredData.filter(sale => 
        sale.payment_method === filter.paymentMethod
      );
    }

    if (filter.customer) {
      filteredData = filteredData.filter(sale => 
        sale.customer === parseInt(filter.customer)
      );
    }

    if (filter.product) {
      filteredData = filteredData.filter(sale => 
        sale.items?.some(item => item.product === parseInt(filter.product))
      );
    }

    if (filter.startDate && filter.endDate) {
      filteredData = filteredData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= new Date(filter.startDate) && 
               saleDate <= new Date(filter.endDate);
      });
    }

    setSales(filteredData);
    setPage(1);
    setTotalPages(Math.ceil(filteredData.length / perPage));
  }, [filter, allSales]);

  // Get current page data
  const currentPageData = sales.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Transactions Report', 14, 16);
    
    const tableData = currentPageData.flatMap(sale => {
      const mainRow = [
        sale.frontendId,
        sale.customerName,
        currentUser?.full_name || 'N/A',
        branch,
        sale.payment_method,
        `GHC ${sale.total_amount}`,
        'Success'
      ];
      
      const itemRows = sale.items?.length > 0 
        ? sale.items.map(item => [
            '', '', '', '',
            `${item.product_name} (x${item.quantity})`,
            `GHC ${item.price_at_sale}`,
            ''
          ])
        : [['', '', '', '', 'No items', '', '']];
      
      return [mainRow, ...itemRows];
    });

    doc.autoTable({
      startY: 20,
      head: [['ID', 'Customer', 'Processed By', 'Branch', 'Payment', 'Amount', 'Status']],
      body: tableData,
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'Success') {
          doc.setTextColor(0, 128, 0);
        }
      },
      styles: { fontSize: 8 }
    });

    doc.save('sales_transactions.pdf');
    setSnackbar({ 
      open: true, 
      message: 'PDF exported successfully!', 
      severity: 'success' 
    });
  };

  const paymentMethods = [
    { value: '', label: 'All Methods' },
    { value: 'CASH', label: 'Cash' },
    { value: 'MOMO', label: 'Mobile Money' },
    { value: 'CARD', label: 'Card' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Transaction History</Typography>
      
      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Date Range */}
        <Grid item xs={12} sm={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={filter.startDate}
              onChange={(newValue) => setFilter({ ...filter, startDate: newValue })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={filter.endDate}
              onChange={(newValue) => setFilter({ ...filter, endDate: newValue })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Dropdown Filters */}
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={filter.paymentMethod}
              onChange={(e) => setFilter({ ...filter, paymentMethod: e.target.value })}
              label="Payment Method"
            >
              {paymentMethods.map(method => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth>
            <InputLabel>Customer</InputLabel>
            <Select
              value={filter.customer}
              onChange={(e) => setFilter({ ...filter, customer: e.target.value })}
              label="Customer"
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers.map(customer => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth>
            <InputLabel>Product</InputLabel>
            <Select
              value={filter.product}
              onChange={(e) => setFilter({ ...filter, product: e.target.value })}
              label="Product"
            >
              <MenuItem value="">All Products</MenuItem>
              {products.map(product => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Search and Action Buttons */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Search"
            value={filter.searchQuery}
            onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1}>
          <Tooltip title="Clear all filters">
            <Button
              variant="outlined"
              onClick={() => setFilter({
                startDate: null,
                endDate: null,
                paymentMethod: '',
                customer: '',
                product: '',
                searchQuery: '',
              })}
              fullWidth
              sx={{ height: '56px' }}
            >
              <Clear />
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={6} sm={3} md={1}>
          <Tooltip title="Export to PDF">
            <Button
              variant="contained"
              onClick={handleExportPDF}
              fullWidth
              sx={{ height: '56px' }}
            >
              <PictureAsPdf />
            </Button>
          </Tooltip>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white' }}>Customer</TableCell>
                  <TableCell sx={{ color: 'white' }}>Processed By</TableCell>
                  <TableCell sx={{ color: 'white' }}>Branch</TableCell>
                  <TableCell sx={{ color: 'white' }}>Payment</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Amount</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white' }}>Items</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <TableRow>
                        <TableCell>{sale.frontendId}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{currentUser?.full_name || 'N/A'}</TableCell>
                        <TableCell>{branch}</TableCell>
                        <TableCell>{sale.payment_method}</TableCell>
                        <TableCell align="right">GHC {sale.total_amount}</TableCell>
                        <TableCell>
                          <Chip label="Success" color="success" size="small" />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedRows(prev => ({
                              ...prev,
                              [sale.id]: !prev[sale.id]
                            }))}
                          >
                            {expandedRows[sale.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                          {sale.items?.length || 0} item(s)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0 }}>
                          <Collapse in={expandedRows[sale.id]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                Products Sold
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Unit Price</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sale.items?.length > 0 ? (
                                    sale.items.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">GHC {item.price_at_sale}</TableCell>
                                        <TableCell align="right">
                                          GHC {(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center">
                                        No items recorded
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No transactions found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionHistory;