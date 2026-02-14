import { Link } from 'react-router-dom'
import { ROUTES } from '../constants'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
            <div className="text-center max-w-md">
                <h1 className="text-7xl font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-4">
                    404
                </h1>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Page Not Found
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to={ROUTES.DASHBOARD}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>
        </div>
    )
}



