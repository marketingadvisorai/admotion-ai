import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading workspace...</span>
        </div>
    );
}
