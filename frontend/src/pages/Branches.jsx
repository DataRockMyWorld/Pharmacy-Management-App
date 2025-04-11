import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { AddBusiness } from "@mui/icons-material";
import axios from "../utils/axiosInstance";
import BranchTable from "../components/Branches/BranchTable";
import BranchFormDialog from "../components/Branches/BranchFormDialog";
import SnackbarAlert from "../components/Inventory/SnackbarAlert";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get("v1/sites/");
      setBranches(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to fetch branches",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const filteredList = branches.filter(
      (b) =>
        (!search || b.name.toLowerCase().includes(search.toLowerCase())) &&
        (!region || b.region === region)
    );
    setFiltered(filteredList);
  }, [branches, search, region]);

  const handleEdit = (branch) => {
    setEditBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`v1/sites/${id}/`);
      setSnackbar({
        open: true,
        message: "Branch deleted",
        severity: "success",
      });
      fetchBranches();
    } catch (e) {
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <AddBusiness sx={{ fontSize: 38, color: "#5564EE" }} />
          <Typography variant="h5" fontWeight={700}>
            Branches
          </Typography>
        </Stack>
        <Button
          variant="contained"
          onClick={() => {
            setEditBranch(null);
            setDialogOpen(true);
          }}
          startIcon={<AddBusiness />}
          sx={{
            fontSize: 14,
            px: 2.5,
            py: 1.2,
            width: 200,
            textTransform: "none",
            borderRadius: 2,
            bgcolor: "#5564EE",
            "&:hover": { bgcolor: "#3A4AED" },
          }}
        >
          Add Branch
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          label="Search by name"
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Filter by Region</InputLabel>
          <Select
            label="Filter by Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set(branches.map((b) => b.region))].map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <BranchTable
          branches={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <BranchFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editBranch={editBranch}
        setSnackbar={setSnackbar}
        onSuccess={fetchBranches}
      />

      <SnackbarAlert snackbar={snackbar} setSnackbar={setSnackbar} />
    </Box>
  );
};

export default Branches;
