import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      expand
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          title: "group-[.toast]:text-sm group-[.toast]:font-bold",
          description: "group-[.toast]:text-xs group-[.toast]:text-gray-500",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-lg group-[.toast]:text-xs",
          closeButton: "group-[.toast]:bg-gray-100 group-[.toast]:border-gray-200 group-[.toast]:text-gray-500",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
