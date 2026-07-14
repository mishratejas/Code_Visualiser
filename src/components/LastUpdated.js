import { useEffect, useState } from "react";

interface LastUpdatedProps {
  date: string | Date;
  className?: string;
}

export function LastUpdated({ date, className = "" }: LastUpdatedProps) {
  const [relative, setRelative] = useState("");

  useEffect(() => {
    const updateRelative = () => {
      const now = new Date();
      const then = new Date(date);
      const diffMs = now.getTime() - then.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffSecs < 60) setRelative("just now");
      else if (diffMins < 60) setRelative(`${diffMins}m ago`);
      else if (diffHours < 24) setRelative(`${diffHours}h ago`);
      else if (diffDays < 7) setRelative(`${diffDays}d ago`);
      else if (diffWeeks < 4) setRelative(`${diffWeeks}w ago`);
      else setRelative(`${diffMonths}mo ago`);
    };

    updateRelative();
    const interval = setInterval(updateRelative, 60000);
    return () => clearInterval(interval);
  }, [date]);

  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <time
      dateTime={new Date(date).toISOString()}
      title={formattedDate}
      className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}
    >
      Updated {relative}
    </time>
  );
}
