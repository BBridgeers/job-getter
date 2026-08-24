import { useMemo } from 'react';
import { useJobs } from '../context/JobsContext';

export function useStats() {
    const { allJobs } = useJobs();

    const stats = useMemo(() => {
        // display_status is the normalized field from the API (app_status || status)
        const st = (j) => j.display_status || j.status || 'New';

        const totalActive = allJobs.filter(j => st(j) !== 'Rejected').length;
        const interestedCount = allJobs.filter(j => st(j) === 'Interested').length;
        const appliedCount = allJobs.filter(j => st(j) === 'Applied').length;
        const interviewCount = allJobs.filter(j => st(j) === 'Interview').length;
        const offerCount = allJobs.filter(j => st(j) === 'Offer').length;
        const rejectedCount = allJobs.filter(j => st(j) === 'Rejected').length;

        // Response rate: decisions / total applications
        const totalDecisions = interviewCount + offerCount + rejectedCount;
        const totalApplications = appliedCount + totalDecisions;
        const responseRate = totalApplications > 0
            ? Math.round((totalDecisions / totalApplications) * 100)
            : 0;

        // Applications in the last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weeklyApplications = allJobs.filter(j => {
            if (!j.applied_date) return false;
            return new Date(j.applied_date).getTime() >= weekAgo;
        }).length;

        // Avg days to response: applied_date -> decision date is not tracked per-stage,
        // so we compute avg age of currently-in-decision applications as a proxy.
        const decisionJobs = allJobs.filter(j =>
            ['Interview', 'Offer', 'Rejected'].includes(st(j)) && j.applied_date);
        const avgDaysToResponse = decisionJobs.length > 0
            ? Math.round(decisionJobs.reduce((acc, j) =>
                acc + (Date.now() - new Date(j.applied_date).getTime()) / (1000 * 60 * 60 * 24), 0) / decisionJobs.length)
            : 0;

        const base = allJobs.length || 1;
        const funnelData = [
            { stage: 'New', count: allJobs.filter(j => st(j) === 'New').length, conversionRate: 100 },
            { stage: 'Interested', count: interestedCount, conversionRate: Math.round((interestedCount / base) * 100) },
            { stage: 'Applied', count: appliedCount, conversionRate: Math.round((appliedCount / base) * 100) },
            { stage: 'Interview', count: interviewCount, conversionRate: Math.round((interviewCount / base) * 100) },
            { stage: 'Offer', count: offerCount, conversionRate: Math.round((offerCount / base) * 100) },
        ];

        return {
            totalActive,
            interestedCount,
            appliedCount,
            interviewCount,
            offerCount,
            rejectedCount,
            responseRate,
            avgDaysToResponse,
            weeklyApplications,
            funnelData
        };
    }, [allJobs]);

    return stats;
}
