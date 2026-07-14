import { X } from "lucide-react";

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "K"], description: "Open search" },
  { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close dialog / modal" },
  { keys: ["↑", "↓"], description: "Navigate problem list" },
  { keys: ["Enter"], description: "Open selected problem" },
  { keys: ["Ctrl", "C"], description: "Copy code from submission" },
  { keys: ["Tab"], description: "Move between form fields" },
  { keys: ["Ctrl", "Enter"], description: "Submit form" },
];

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <ul className="space-y-2">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">Ctrl</kbd>+<kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">/</kbd> anytime to open this
        </p>
      </div>
    </div>
  );
}
