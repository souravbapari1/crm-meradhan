import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import LeadForm from "@/components/forms/LeadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserPlus, MessageSquare, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingFollowUps, setViewingFollowUps] = useState<Lead | null>(null);
  const [newFollowUpNote, setNewFollowUpNote] = useState("");
  const [newFollowUpDate, setNewFollowUpDate] = useState("");
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ["/api/leads", viewingFollowUps?.id, "follow-ups"],
    enabled: !!viewingFollowUps,
  });

  const addFollowUpMutation = useMutation({
    mutationFn: ({ leadId, note, followUpDate }: { leadId: number; note: string; followUpDate?: string }) =>
      api.post(`/leads/${leadId}/follow-ups`, { note, followUpDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", viewingFollowUps?.id, "follow-ups"] });
      setNewFollowUpNote("");
      setNewFollowUpDate("");
      toast({
        title: "Success",
        description: "Follow-up note added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add follow-up",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  const convertToCustomerMutation = useMutation({
    mutationFn: (leadId: number) => api.post("/customers", {
      leadId,
      name: leads.find(l => l.id === leadId)?.name,
      email: leads.find(l => l.id === leadId)?.email,
      phone: leads.find(l => l.id === leadId)?.phone,
      company: leads.find(l => l.id === leadId)?.company,
      status: "active",
      kycStatus: "pending",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Lead converted to customer successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to convert lead",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { variant: "default" as const, label: "New" },
      contacted: { variant: "secondary" as const, label: "Contacted" },
      qualified: { variant: "outline" as const, label: "Qualified" },
      converted: { variant: "default" as const, label: "Converted", className: "bg-green-100 text-green-800" },
      lost: { variant: "destructive" as const, label: "Lost" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getSourceLabel = (source: string) => {
    const sourceLabels = {
      website: "Website",
      referral: "Referral",
      social_media: "Social Media",
      email_campaign: "Email Campaign",
      direct: "Direct",
    };
    return sourceLabels[source as keyof typeof sourceLabels] || source;
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvertToCustomer = (leadId: number) => {
    if (window.confirm("Are you sure you want to convert this lead to a customer?")) {
      convertToCustomerMutation.mutate(leadId);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
            <p className="text-muted-foreground">Track and manage potential customers</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" />
                Add New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
              </DialogHeader>
              <LeadForm onSuccess={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email_campaign">Email Campaign</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Investment Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getSourceLabel(lead.source)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        {lead.investmentAmount ? `₹${parseFloat(lead.investmentAmount).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingFollowUps(lead)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Follow-up Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleConvertToCustomer(lead.id)}
                              disabled={lead.status === "converted"}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Convert to Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <LeadForm 
                lead={editingLead} 
                onSuccess={() => setEditingLead(null)} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Follow-up Notes Modal */}
        <Dialog open={!!viewingFollowUps} onOpenChange={() => setViewingFollowUps(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Follow-up Notes - {viewingFollowUps?.name}</DialogTitle>
            </DialogHeader>
            {viewingFollowUps && (
              <div className="space-y-4">
                {/* Add new follow-up */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Add Follow-up Note</h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Enter follow-up notes..."
                      value={newFollowUpNote}
                      onChange={(e) => setNewFollowUpNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor="followUpDate">Next Follow-up Date (Optional)</Label>
                        <Input
                          id="followUpDate"
                          type="datetime-local"
                          value={newFollowUpDate}
                          onChange={(e) => setNewFollowUpDate(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!newFollowUpNote.trim()) return;
                          addFollowUpMutation.mutate({
                            leadId: viewingFollowUps.id,
                            note: newFollowUpNote,
                            followUpDate: newFollowUpDate || undefined,
                          });
                        }}
                        disabled={!newFollowUpNote.trim() || addFollowUpMutation.isPending}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Existing follow-ups */}
                <div className="space-y-3">
                  <h4 className="font-medium">Follow-up History</h4>
                  {followUps.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No follow-up notes yet</p>
                  ) : (
                    followUps.map((followUp: any) => (
                      <div key={followUp.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {followUp.createdByName || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(followUp.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <p className="text-sm mb-2">{followUp.note}</p>
                        {followUp.followUpDate && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            Next follow-up: {format(new Date(followUp.followUpDate), "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
