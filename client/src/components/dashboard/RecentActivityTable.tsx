import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, ExternalLink } from "lucide-react";
import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityTableProps {
  activities?: Activity[];
}

export default function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case "rfq":
        return "📋";
      case "lead":
        return "👤";
      case "customer":
        return "🏢";
      case "ticket":
        return "🎫";
      default:
        return "📝";
    }
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case "create":
        return <Badge className="bg-blue-100 text-blue-800">Created</Badge>;
      case "update":
        return <Badge className="bg-yellow-100 text-yellow-800">Updated</Badge>;
      case "delete":
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gradient-bg">
              <ExternalLink className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getActivityIcon(activity.entityType)}</span>
                      <span className="font-medium capitalize">
                        {activity.action} {activity.entityType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{activity.userName || "System"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {activity.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(activity.action)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
