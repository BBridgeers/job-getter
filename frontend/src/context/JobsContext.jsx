import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const JobsContext = createContext();

export function useJobs() {
    return useContext(JobsContext);
}

export function JobsProvider({ children }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', type: 'all' });
    const [statusFilter, setStatusFilter] = useState(null);
    const [view, setView] = useState('discovery');

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/get_jobs');
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            setJobs(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load jobs. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateFilter = useCallback((type, value) => {
        setFilters(prev => ({ ...prev, [type]: value }));
    }, []);

    const filteredJobs = useMemo(() => {
        let result = jobs;
        if (filters.type === 'tier1') result = result.filter(j => j.tier === 1);
        else if (filters.type === 'tier2') result = result.filter(j => j.tier === 2);
        else if (filters.type === 'high-match') result = result.filter(j => j.match_score >= 85);
        else if (filters.type === 'corporate') result = result.filter(j => j.search_type === 'corporate');
        else if (filters.type === 'nonprofit') result = result.filter(j => j.search_type === 'nonprofit');
        if (statusFilter) result = result.filter(j => (j.display_status || 'New') === statusFilter);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(j =>
                j.title.toLowerCase().includes(q) ||
                j.company.toLowerCase().includes(q)
            );
        }
        return result;
    }, [jobs, filters, statusFilter]);

    const ctx = useMemo(() => ({
        jobs: filteredJobs,
        allJobs: jobs,
        loading,
        error,
        filters,
        updateFilter,
        refreshJobs: fetchJobs,
        view,
        setView,
        statusFilter,
        setStatusFilter,
    }), [filteredJobs, jobs, loading, error, filters, updateFilter, fetchJobs, view, statusFilter]);

    return (
        <JobsContext.Provider value={ctx}>
            {children}
        </JobsContext.Provider>
    );
}
