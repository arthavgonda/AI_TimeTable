import React, { useState, useEffect, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import axios from 'axios';

const API_URL = "http://localhost:8000";
const DEBOUNCE_DELAY = 300;


const queryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const SearchableTeacherSelector = ({ value, onChange, loading: parentLoading = false, label = "Search and select a teacher" }) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceTimer = useRef(null);
  

  const fetchTeachers = async (searchQuery = '') => {
    const cacheKey = searchQuery || 'all';
    const cached = queryCache.get(cacheKey);
    

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    try {
      const response = await axios.get(`${API_URL}/teachers/search`, {
        params: { search: searchQuery, limit: 50 }
      });
      
      const teacherNames = response.data.teachers;
      

      queryCache.set(cacheKey, {
        data: teacherNames,
        timestamp: Date.now()
      });
      
      return teacherNames;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  };


  const debouncedSearch = (query) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      const results = await fetchTeachers(query);
      setOptions(results);
      setLoading(false);
    }, DEBOUNCE_DELAY);
  };


  useEffect(() => {
    if (open && options.length === 0 && !loading) {
      fetchTeachers().then(results => setOptions(results));
    }
  }, [open]);


  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);


  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    
    if (newInputValue) {
      debouncedSearch(newInputValue);
    } else {

      fetchTeachers().then(results => setOptions(results));
    }
  };

  return (
    <Autocomplete
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={value || null}
      onChange={(event, newValue) => onChange(newValue || "")}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      loading={loading}
      getOptionLabel={(option) => option || ""}
      renderInput={(params) => (
        <TextField 
          {...params}
          label={label}
          placeholder="Type to search for a teacher..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText="No teacher found. Start typing to search..."
      loadingText="Loading teachers..."
      clearOnEscape
      clearOnBlur={false}
      autoHighlight
      filterOptions={(x) => x}
    />
  );
};

export default SearchableTeacherSelector;

