export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Access Restricted</h1>
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              This application is only accessible to users with <strong>@dabdoob.com</strong> email addresses.
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            If you believe this is an error, please contact your administrator.
          </p>
          <div className="mt-6">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}



