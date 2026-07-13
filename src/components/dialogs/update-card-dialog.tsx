import { useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBillingStore } from "@/stores/billing-store";
import { useActivityStore } from "@/stores/activity-store";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

const BRANDS = ["Visa", "Mastercard", "Amex", "Discover"] as const;

function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function UpdateCardDialog({ open, onOpenChange }: Props) {
  const updatePayment = useBillingStore((s) => s.updatePayment);
  const log = useActivityStore((s) => s.log);
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>("Visa");
  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!luhn(number)) next.number = "Enter a valid card number";
    const m = Number(expMonth);
    if (!Number.isInteger(m) || m < 1 || m > 12) next.expMonth = "MM";
    const y = Number(expYear);
    const currYear = new Date().getFullYear() % 100;
    if (!Number.isInteger(y) || y < currYear || y > currYear + 20) next.expYear = "YY";
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = "CVC";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    // Simulate a card-processor round-trip.
    await new Promise((r) => setTimeout(r, 600));
    const last4 = number.replace(/\D/g, "").slice(-4);
    updatePayment({ brand, last4 });
    log("billing", "Payment method updated", `${brand} •••• ${last4}`);
    toast.success("Payment method updated");
    setSubmitting(false);
    setNumber("");
    setExpMonth("");
    setExpYear("");
    setCvc("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Update payment method</DialogTitle>
          <DialogDescription>Cards are validated with the Luhn algorithm before saving.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Brand</Label>
            <Select value={brand} onValueChange={(v) => setBrand(v as (typeof BRANDS)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Card number</Label>
            <Input
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="font-mono"
            />
            {errors.number && <div className="text-xs text-destructive">{errors.number}</div>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1.5">
              <Label>Exp month</Label>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                placeholder="08"
                className="font-mono"
              />
              {errors.expMonth && <div className="text-xs text-destructive">{errors.expMonth}</div>}
            </div>
            <div className="grid gap-1.5">
              <Label>Exp year</Label>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                placeholder="28"
                className="font-mono"
              />
              {errors.expYear && <div className="text-xs text-destructive">{errors.expYear}</div>}
            </div>
            <div className="grid gap-1.5">
              <Label>CVC</Label>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="font-mono"
              />
              {errors.cvc && <div className="text-xs text-destructive">{errors.cvc}</div>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? "Saving…" : "Save card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
