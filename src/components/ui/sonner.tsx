import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-gray-600",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          success:
            "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 group-[.toaster]:!border-emerald-200",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200",
          warning:
            "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-900 group-[.toaster]:!border-amber-200",
          info:
            "group-[.toaster]:!bg-sky-50 group-[.toaster]:!text-sky-900 group-[.toaster]:!border-sky-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
