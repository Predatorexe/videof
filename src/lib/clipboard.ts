import { toast } from "sonner";

export async function copyToClipboard(
  text: string,
  { successMessage = "Copied", errorMessage = "Copy failed" }: {
    successMessage?: string;
    errorMessage?: string;
  } = {},
): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    }

    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        toast.success(successMessage);
        return true;
      }
    }

    toast.error(errorMessage, { description: "Clipboard is not available in this browser." });
    return false;
  } catch (err) {
    const description = err instanceof Error ? err.message : "Unknown error";
    toast.error(errorMessage, { description });
    return false;
  }
}
