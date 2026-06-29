import { cn } from "@/lib/utils";

type AppContentProps = {
  children: React.ReactNode;
  rail?: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function AppContent({ children, rail, className, mainClassName }: AppContentProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8", className)}>
      <div className="flex items-start gap-8 xl:gap-10">
        <div className={cn("min-w-0 flex-1", mainClassName)}>{children}</div>
        {rail && (
          <aside className="hidden xl:block w-[288px] shrink-0 sticky top-[7.25rem] self-start">
            {rail}
          </aside>
        )}
      </div>
    </div>
  );
}
