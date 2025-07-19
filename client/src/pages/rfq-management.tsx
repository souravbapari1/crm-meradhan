import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import RFQForm from "@/components/forms/RFQForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { RFQ } from "@/types";
import { Plus, Search, Filter, MoreHorizontal, Edit, Eye, FileText, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RFQManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bondTypeFilter, setBondTypeFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState<RFQ | null>(null);
  const { toast } = useToast();

  const { data: rfqs = [], isLoading } = useQuery<RFQ[]>({
    queryKey: ["/api/rfqs"],
  });

  const submitToNSEMutation = useMutation({
    mutationFn: (id: number) => api.put(`/rfqs/${id}`, { 
      status: "submitted",
      submittedAt: new Date().toISOString(),
      nseRfqId: `NSE-${Date.now()}` // Mock NSE ID
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Success",
        description: "RFQ submitted to NSE successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit RFQ",
        variant: "destructive",
      });
    },
  });

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.bondName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rfq.nseRfqId || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    const matchesBondType = bondTypeFilter === "all" || rfq.bondType === bondTypeFilter;
    return matchesSearch && matchesStatus && matchesBondType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      submitted: { variant: "default" as const, label: "Submitted", className: "bg-blue-100 text-blue-800" },
      executed: { variant: "default" as const, label: "Executed", className: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getBondTypeBadge = (bondType: string) => {
    const typeConfig = {
      government: { variant: "outline" as const, label: "Government" },
      corporate: { variant: "outline" as const, label: "Corporate" },
      municipal: { variant: "outline" as const, label: "Municipal" },
    };
    
    const config = typeConfig[bondType as keyof typeof typeConfig] || typeConfig.government;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleSubmitToNSE = (rfqId: number) => {
    if (window.confirm("Are you sure you want to submit this RFQ to NSE?")) {
      submitToNSEMutation.mutate(rfqId);
    }
  };

  const totalValue = filteredRFQs.reduce((sum, rfq) => {
    return sum + (parseFloat(rfq.faceValue) * rfq.quantity);
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">RFQ Management</h1>
            <p className="text-muted-foreground">Manage Request for Quotes and NSE submissions</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" />
                Create New RFQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New RFQ</DialogTitle>
              </DialogHeader>
              <RFQForm onSuccess={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total RFQs</p>
                  <p className="text-2xl font-bold text-foreground">{rfqs.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {rfqs.filter(r => r.status === "pending").length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Executed</p>
                  <p className="text-2xl font-bold text-foreground">
                    {rfqs.filter(r => r.status === "executed").length}
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
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{(totalValue / 10000000).toFixed(1)}Cr
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bondTypeFilter} onValueChange={setBondTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by bond type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bond Types</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RFQs Table */}
        <Card>
          <CardHeader>
            <CardTitle>RFQs ({filteredRFQs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading RFQs...</div>
            ) : filteredRFQs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No RFQs found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Bond Name</TableHead>
                    <TableHead>Bond Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Face Value</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>NSE ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRFQs.map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-medium">{rfq.rfqNumber}</TableCell>
                      <TableCell>{rfq.bondName}</TableCell>
                      <TableCell>{getBondTypeBadge(rfq.bondType)}</TableCell>
                      <TableCell>{rfq.quantity.toLocaleString()}</TableCell>
                      <TableCell>₹{parseFloat(rfq.faceValue).toLocaleString()}</TableCell>
                      <TableCell>
                        ₹{(parseFloat(rfq.faceValue) * rfq.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(rfq.status)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {rfq.nseRfqId || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingRFQ(rfq)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {rfq.status === "pending" && (
                              <DropdownMenuItem 
                                onClick={() => handleSubmitToNSE(rfq.id)}
                                className="text-primary"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Submit to NSE
                              </DropdownMenuItem>
                            )}
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
        <Dialog open={!!editingRFQ} onOpenChange={() => setEditingRFQ(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit RFQ</DialogTitle>
            </DialogHeader>
            {editingRFQ && (
              <RFQForm 
                rfq={editingRFQ} 
                onSuccess={() => setEditingRFQ(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
