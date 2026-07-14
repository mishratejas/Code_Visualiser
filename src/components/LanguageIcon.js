const languageConfig: Record<string, { icon: string; color: string; label: string }> = {
  javascript: { icon: "JS", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "JavaScript" },
  typescript: { icon: "TS", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "TypeScript" },
  python: { icon: "PY", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Python" },
  java: { icon: "JV", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Java" },
  cpp: { icon: "C+", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "C++" },
  csharp: { icon: "C#", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", label: "C#" },
  go: { icon: "GO", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", label: "Go" },
  rust: { icon: "RS", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "Rust" },
  ruby: { icon: "RB", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400", label: "Ruby" },
  php: { icon: "PH", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400", label: "PHP" },
  swift: { icon: "SW", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Swift" },
  kotlin: { icon: "KT", color: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400", label: "Kotlin" },
};

interface LanguageIconProps {
  language: string;
  size?: "sm" | "md";
}

export function LanguageIcon({ language, size = "sm" }: LanguageIconProps) {
  const config = languageConfig[language.toLowerCase()] || {
    icon: language.substring(0, 2).toUpperCase(),
    color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    label: language,
  };

  const sizeClasses = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";

  return (
    <span
      className={`inline-flex items-center justify-center rounded font-mono font-bold ${config.color} ${sizeClasses}`}
      title={config.label}
      aria-label={config.label}
    >
      {config.icon}
    </span>
  );
}

export { languageConfig };
