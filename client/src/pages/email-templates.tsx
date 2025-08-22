import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import EmailTemplateForm from "@/components/forms/EmailTemplateForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/types";
import { Plus, Search, Filter, MoreHorizontal, Edit, Eye, Copy, Send, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function EmailTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const duplicateMutation = useMutation({
    mutationFn: (template: EmailTemplate) => api.post("/email-templates", {
      name: `${template.name} (Copy)`,
      subject: template.subject,
      body: template.body,
      category: template.category,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to duplicate template",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.put(`/email-templates/${id}`, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Template deactivated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to deactivate template",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      welcome: { variant: "default" as const, label: "Welcome", className: "bg-blue-100 text-blue-800" },
      follow_up: { variant: "secondary" as const, label: "Follow Up", className: "" },
      rfq_confirmation: { variant: "outline" as const, label: "RFQ Confirmation", className: "" },
      support: { variant: "destructive" as const, label: "Support", className: "" },
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || { variant: "outline" as const, label: category, className: "" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDuplicate = (template: EmailTemplate) => {
    duplicateMutation.mutate(template);
  };

  const handleDeactivate = (templateId: number) => {
    if (window.confirm("Are you sure you want to deactivate this template?")) {
      deactivateMutation.mutate(templateId);
    }
  };

  const templatesByCategory = templates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
            <p className="text-muted-foreground">Manage email templates for customer communication</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" />
                Create New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Email Template</DialogTitle>
              </DialogHeader>
              <EmailTemplateForm onSuccess={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold text-foreground">{templates.length}</p>
                </div>
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Welcome</p>
                  <p className="text-2xl font-bold text-foreground">
                    {templatesByCategory.welcome || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Follow Up</p>
                  <p className="text-2xl font-bold text-foreground">
                    {templatesByCategory.follow_up || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Support</p>
                  <p className="text-2xl font-bold text-foreground">
                    {templatesByCategory.support || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="rfq_confirmation">RFQ Confirmation</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                Create your first email template to get started with customer communication.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="card-shadow hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Test Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeactivate(template.id)}
                          className="text-destructive"
                        >
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getCategoryBadge(template.category)}
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="line-clamp-3">{template.body.replace(/<[^>]*>/g, '')}</p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <EmailTemplateForm 
                template={editingTemplate} 
                onSuccess={() => setEditingTemplate(null)} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Email Template Preview</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <p className="text-sm text-muted-foreground">{previewTemplate.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <p className="text-sm text-muted-foreground">{previewTemplate.category}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <p className="text-sm text-muted-foreground">{previewTemplate.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email Body</label>
                  <div 
                    className="mt-2 p-4 border rounded-lg bg-muted/50 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
