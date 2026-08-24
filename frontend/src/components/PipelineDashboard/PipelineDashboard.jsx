import StatsBar from '../StatsBar/StatsBar';
import PipelineSection from '../PipelineSection/PipelineSection';
import ActivityTimeline from '../ActivityTimeline/ActivityTimeline';
import FunnelChart from '../FunnelChart/FunnelChart';
import FollowUpAlert from '../FollowUpAlert/FollowUpAlert';

function PipelineDashboard() {
    return (
        <div className="w-full pb-8">
            <StatsBar />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 xl:grid-cols-4 gap-5">
                {/* Main pipeline */}
                <div className="xl:col-span-3">
                    <PipelineSection />
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="h-[360px]">
                        <ActivityTimeline />
                    </div>
                    <div className="h-[300px]">
                        <FunnelChart />
                    </div>
                </div>
            </div>

            <FollowUpAlert />
        </div>
    );
}

export default PipelineDashboard;
