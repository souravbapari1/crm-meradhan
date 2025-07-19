import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { RFQ, Customer } from "@/types";

const rfqFormSchema = z.object({
  customerId: z.coerce.number({ required_error: "Please select a customer" }),
  bondType: z.enum(["government", "corporate", "municipal"], {
    required_error: "Please select bond type",
  }),
  bondName: z.string().min(2, "Bond name must be at least 2 characters"),
  faceValue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Face value must be a positive number"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  bidPrice: z.string().optional(),
  askPrice: z.string().optional(),
  status: z.enum(["pending", "submitted", "executed", "cancelled"]).default("pending"),
  notes: z.string().optional(),
});

type RFQFormData = z.infer<typeof rfqFormSchema>;

interface RFQFormProps {
  rfq?: RFQ;
  onSuccess: () => void;
}

export default function RFQForm({ rfq, onSuccess }: RFQFormProps) {
  const { toast } = useToast();
  const isEditing = !!rfq;

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const activeCustomers = customers.filter(customer => customer.status === "active");

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: {
      customerId: rfq?.customerId || undefined,
      bondType: (rfq?.bondType as any) || "government",
      bondName: rfq?.bondName || "",
      faceValue: rfq?.faceValue || "",
      quantity: rfq?.quantity || 1,
      bidPrice: rfq?.bidPrice || "",
      askPrice: rfq?.askPrice || "",
      status: (rfq?.status as any) || "pending",
      notes: rfq?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RFQFormData) => api.post("/rfqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Success",
        description: "RFQ created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create RFQ",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RFQFormData) => api.put(`/rfqs/${rfq!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Success",
        description: "RFQ updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update RFQ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RFQFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculate total value
  const faceValue = parseFloat(form.watch("faceValue") || "0");
  const quantity = form.watch("quantity") || 0;
  const totalValue = faceValue * quantity;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bondType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bond Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bond type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="government">Government Bonds</SelectItem>
                    <SelectItem value="corporate">Corporate Bonds</SelectItem>
                    <SelectItem value="municipal">Municipal Bonds</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bondName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bond Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bond name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="faceValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Face Value (₹) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter face value" 
                    {...field} 
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
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {totalValue > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">
              Total Value: ₹{totalValue.toLocaleString()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bidPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bid Price (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Enter bid price" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="askPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ask Price (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Enter ask price" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes about this RFQ"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="gradient-bg flex-1" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update RFQ" : "Create RFQ"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
