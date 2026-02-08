import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:bg-white/10 group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/20 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-white/70",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70",
          success:
            "group-[.toaster]:!bg-emerald-500/15 group-[.toaster]:!text-emerald-200 group-[.toaster]:!border-emerald-400/30",
          error:
            "group-[.toaster]:!bg-red-500/15 group-[.toaster]:!text-red-200 group-[.toaster]:!border-red-400/30",
          warning:
            "group-[.toaster]:!bg-amber-500/15 group-[.toaster]:!text-amber-200 group-[.toaster]:!border-amber-400/30",
          info:
            "group-[.toaster]:!bg-sky-500/15 group-[.toaster]:!text-sky-200 group-[.toaster]:!border-sky-400/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
