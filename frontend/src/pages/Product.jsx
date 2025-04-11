import React, { useEffect, useState } from 'react';
import {
  Box, Stack, Typography, Button, CircularProgress,
  TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Add, Inventory2 } from '@mui/icons-material';
import axios from '../utils/axiosInstance';
import ProductTable from '../components/Product/ProductTable';
import ProductFormDialog from '../components/Product/ProductFormDialog';
import SnackbarAlert from '../components/Inventory/SnackbarAlert';
import { motion } from 'framer-motion';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('v1/products/');
      setProducts(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch products', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditProduct(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`v1/products/${id}/`);
      setSnackbar({ open: true, message: 'Product deleted', severity: 'success' });
      fetchProducts();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!categoryFilter || p.category === categoryFilter)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Inventory2 sx={{ fontSize: 36, color: '#5564EE' }} />
          <Typography variant="h5" fontWeight={700}>Product Catalog</Typography>
        </Stack>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            sx={{ bgcolor: '#5564EE', '&:hover': { bgcolor: '#3A4AED' } }}
          >
            Add New Product
          </Button>
        </motion.div>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <TextField
          label="Search by name or brand"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Filter by Category"
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set(products.map(p => p.category))].map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : (
        <ProductTable products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <ProductFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        editProduct={editProduct}
        setSnackbar={setSnackbar}
        onSuccess={fetchProducts}
      />

      <SnackbarAlert snackbar={snackbar} setSnackbar={setSnackbar} />
    </Box>
  );
};

export default Product;