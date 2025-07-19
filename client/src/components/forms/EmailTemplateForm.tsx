import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const emailTemplateFormSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  category: z.enum(["welcome", "follow_up", "rfq_confirmation", "support"], {
    required_error: "Please select a category",
  }),
  isActive: z.boolean().default(true),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateFormSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  onSuccess: () => void;
}

export default function EmailTemplateForm({ template, onSuccess }: EmailTemplateFormProps) {
  const { toast } = useToast();
  const isEditing = !!template;
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
      category: (template?.category as any) || "welcome",
      isActive: template?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmailTemplateFormData) => api.post("/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create email template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmailTemplateFormData) => api.put(`/email-templates/${template!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailTemplateFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Template variables that can be used
  const templateVariables = [
    "{name} - Customer/User name",
    "{email} - Customer/User email",
    "{company} - Customer company",
    "{amount} - Investment amount",
    "{bondType} - Type of bond",
    "{rfqNumber} - RFQ reference number",
    "{ticketNumber} - Support ticket number",
    "{date} - Current date",
  ];

  const insertVariable = (variable: string) => {
    const currentBody = form.getValues("body");
    const variableName = variable.split(" -")[0];
    form.setValue("body", currentBody + " " + variableName);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="rfq_confirmation">RFQ Confirmation</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Subject *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email subject line" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Body *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter email body content. You can use HTML tags for formatting."
                      rows={8}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>

          {/* Template Variables */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Available Variables:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {templateVariables.map((variable, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{variable}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="h-6 px-2 text-xs"
                  >
                    Insert
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Active Template</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Only active templates can be used for sending emails
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="gradient-bg flex-1" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject:</label>
              <p className="text-sm bg-muted p-2 rounded">{form.watch("subject") || "No subject"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Body:</label>
              <div 
                className="text-sm bg-muted p-4 rounded max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ 
                  __html: form.watch("body")?.replace(/\n/g, '<br>') || "No content" 
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
