import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";

interface Props {
  sprintId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function FundingRequestDialog({ sprintId, trigger, onSuccess }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<"angel" | "branding">("angel");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [agreement, setAgreement] = useState(false);

  // Branding extras
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [duration, setDuration] = useState("30");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const reset = () => {
    setType("angel"); setName(""); setPhone(""); setAmount(""); setMessage("");
    setAgreement(false); setBrandName(""); setWebsite(""); setDuration("30"); setLogoFile(null);
  };

  const handleSubmit = async () => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    if (!agreement) return toast({ title: "Please accept the agreement", variant: "destructive" });
    if (!name || !email || !amount) return toast({ title: "Fill all required fields", variant: "destructive" });
    if (type === "branding" && !brandName) return toast({ title: "Brand name required", variant: "destructive" });

    setSubmitting(true);
    try {
      console.log("[FundingRequest] Submitting", { sprintId, type, amount, name });
      const { data: req, error } = await supabase.from("funding_requests").insert({
        sprint_id: sprintId,
        investor_id: user.id,
        investor_type: type,
        investor_name: name,
        contact_email: email,
        contact_phone: phone || null,
        amount: parseFloat(amount),
        message: message || null,
        agreement_accepted: true,
      }).select().single();
      if (error) { console.error("[FundingRequest] insert error:", error); throw error; }
      console.log("[FundingRequest] Saved", req.id);

      if (type === "branding") {
        let logoUrl: string | null = null;
        if (logoFile) {
          const path = `${user.id}/${Date.now()}-${logoFile.name}`;
          const { error: upErr } = await supabase.storage.from("brand-logos").upload(path, logoFile);
          if (!upErr) {
            const { data: pub } = supabase.storage.from("brand-logos").getPublicUrl(path);
            logoUrl = pub.publicUrl;
          }
        }
        await supabase.from("branding_partnerships").insert({
          funding_request_id: req.id,
          sprint_id: sprintId,
          investor_id: user.id,
          brand_name: brandName,
          logo_url: logoUrl,
          website_url: website || null,
          duration_days: parseInt(duration) || 30,
        });
      }

      toast({ title: "Funding request sent!", description: "The founder will review your request shortly." });
      reset(); setOpen(false); onSuccess?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="gap-2"><DollarSign className="h-4 w-4" />Apply for Funding</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Investor Funding Request</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Investor Type</Label>
            <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-2 mt-2">
              <label className={`border rounded-lg p-3 cursor-pointer ${type === "angel" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="angel" className="sr-only" />
                <p className="font-semibold text-sm">Angel Investor</p>
                <p className="text-xs text-muted-foreground">Direct equity investment</p>
              </label>
              <label className={`border rounded-lg p-3 cursor-pointer ${type === "branding" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="branding" className="sr-only" />
                <p className="font-semibold text-sm">Branding Partner</p>
                <p className="text-xs text-muted-foreground">Sponsorship & visibility</p>
              </label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Your Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Amount (USD) *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>

          {type === "branding" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div><Label>Brand Name *</Label><Input value={brandName} onChange={(e) => setBrandName(e.target.value)} /></div>
              <div><Label>Website</Label><Input placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              <div><Label>Duration (days)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
              <div><Label>Logo</Label><Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} /></div>
            </div>
          )}

          <div><Label>Message to Founder</Label><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></div>

          <div className="flex items-start gap-2 p-3 border rounded-lg bg-amber-500/5 border-amber-500/30">
            <Checkbox id="agreement" checked={agreement} onCheckedChange={(c) => setAgreement(!!c)} className="mt-0.5" />
            <Label htmlFor="agreement" className="text-sm leading-snug cursor-pointer">
              I agree not to complete this deal outside the platform. A 1% platform fee applies on successful deals.
            </Label>
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !agreement} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Funding Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
