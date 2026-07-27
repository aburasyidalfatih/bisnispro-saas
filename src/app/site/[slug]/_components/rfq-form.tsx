"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rfqSchema, RfqFormValues } from "@/features/contact/schemas/rfq.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export function RfqForm({ slug }: { slug: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      companyName: "",
      country: "",
      productInterest: "",
      quantity: "",
      additionalMessage: "",
      deliveryTerms: "",
      targetTimeline: "",
      privacyConsent: false as true,
      companyWebsite: "",
    },
  });

  async function onSubmit(data: RfqFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/site/${slug}/rfq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit RFQ");
      }

      toast({
        title: "Request for Quotation Submitted",
        description: "We have received your request and will get back to you shortly.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white dark:bg-zinc-950/50 backdrop-blur-md rounded-2xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800">
      <CardHeader className="space-y-2 pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
        <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
          Request for Quotation
        </CardTitle>
        <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
          Tell us what you need, and we'll prepare a custom quote tailored to your requirements.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 px-6 md:px-8 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Company Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Acme Corp" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 234 567 890" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Country</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="United States" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">Expected Quantity / Volume</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 1000 units" 
                        {...field} 
                        className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="productInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">Product / Service of Interest *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Which product are you interested in?" 
                      {...field} 
                      className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">Additional Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us more about your specific requirements, timeline, or any questions you might have..." 
                      className="resize-none min-h-[120px] rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary p-4" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField control={form.control} name="deliveryTerms" render={({ field }) => <FormItem><FormLabel className="text-zinc-700 dark:text-zinc-300">Preferred delivery terms</FormLabel><FormControl><Input placeholder="e.g. FOB Jakarta, CIF" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="targetTimeline" render={({ field }) => <FormItem><FormLabel className="text-zinc-700 dark:text-zinc-300">Target timeline</FormLabel><FormControl><Input placeholder="e.g. Q3 2026" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FormField control={form.control} name="companyWebsite" render={({ field }) => <FormItem className="hidden" aria-hidden="true"><FormControl><Input tabIndex={-1} autoComplete="off" {...field} /></FormControl></FormItem>} />
            <FormField control={form.control} name="privacyConsent" render={({ field }) => <FormItem className="flex items-start gap-3 space-y-0 rounded-xl border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-sm font-medium leading-relaxed">I agree that my details may be used to respond to this quotation request.</FormLabel><FormMessage /></div></FormItem>} />

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                "Submit Request for Quotation"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
