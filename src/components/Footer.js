export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Code Visualiser
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              v1.0.0
            </span>
          </div>

          <nav aria-label="Footer navigation" className="flex items-center gap-6 text-sm">
            <a
              href="/about"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              About
            </a>
            <a
              href="/privacy"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              GitHub
            </a>
          </nav>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {currentYear} Code Visualiser. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
