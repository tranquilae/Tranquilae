'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Eye, 
  EyeOff, 
  Mail, 
  Webhook, 
  MessageSquare, 
  Settings,
  RefreshCw,
  Download,
  Filter,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MapPin,
  Globe
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_id?: string;
  user_agent?: string;
  event_data: any;
  resolved: boolean;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
}

interface SecurityMetrics {
  period_days: number;
  failed_logins: number;
  successful_logins: number;
  security_events: number;
  critical_events: number;
  active_blocks: number;
  events_by_type: Record<string, number>;
}

interface AlertConfiguration {
  id: string;
  name: string;
  event_type: string;
  threshold_count: number;
  threshold_window_minutes: number;
  severity: string;
  enabled: boolean;
  alert_channels: string[];
  recipients: string[];
  auto_block: boolean;
  auto_block_duration_minutes: number;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  block_type: 'temporary' | 'permanent';
  reason: string;
  blocked_until?: string;
  failed_attempts: number;
  created_at: string;
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfiguration[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Filter events when filters change
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ip_address?.includes(searchTerm) ||
        event.event_type.includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === typeFilter);
    }

    if (resolvedFilter !== 'all') {
      filtered = filtered.filter(event => 
        resolvedFilter === 'resolved' ? event.resolved : !event.resolved
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, severityFilter, typeFilter, resolvedFilter]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      const [metricsRes, eventsRes, alertsRes, blockedRes] = await Promise.all([
        fetch('/api/admin/security/metrics'),
        fetch('/api/admin/security/events'),
        fetch('/api/admin/security/alerts'),
        fetch('/api/admin/security/blocked-ips')
      ]);

      const [metricsData, eventsData, alertsData, blockedData] = await Promise.all([
        metricsRes.json(),
        eventsRes.json(),
        alertsRes.json(),
        blockedRes.json()
      ]);

      setMetrics(metricsData);
      setEvents(eventsData);
      setAlertConfigs(alertsData);
      setBlockedIPs(blockedData);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveEvent = async (eventId: string) => {
    try {
      await fetch(`/api/admin/security/events/${eventId}/resolve`, {
        method: 'POST'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const unblockIP = async (ipId: string) => {
    try {
      await fetch(`/api/admin/security/blocked-ips/${ipId}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <Users className="h-4 w-4" />;
      case 'brute_force_attempt': return <AlertTriangle className="h-4 w-4" />;
      case 'privilege_escalation': return <Shield className="h-4 w-4" />;
      case 'suspicious_activity': return <Eye className="h-4 w-4" />;
      case 'ip_blocked': return <Ban className="h-4 w-4" />;
      case 'unusual_location': return <MapPin className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const chartData = metrics ? [
    { name: 'Failed Logins', value: metrics.failed_logins, color: '#ef4444' },
    { name: 'Successful Logins', value: metrics.successful_logins, color: '#22c55e' },
    { name: 'Security Events', value: metrics.security_events, color: '#f59e0b' },
    { name: 'Critical Events', value: metrics.critical_events, color: '#dc2626' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events, manage alerts, and track threats
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.security_events || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.critical_events || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_blocks || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.failed_logins || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Security Activity Overview</CardTitle>
          <CardDescription>Distribution of security events in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="alerts">Alert Configuration</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Real-time security event monitoring and management</CardDescription>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="flex items-center space-x-2">
                        {getEventTypeIcon(event.event_type)}
                        <div>
                          <div className="font-medium">{formatEventType(event.event_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.description.substring(0, 100)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.ip_address && (
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span className="font-mono text-sm">{event.ip_address}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.resolved ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Security Event Details</DialogTitle>
                                <DialogDescription>
                                  Full details for security event {selectedEvent?.id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedEvent && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Event Type</Label>
                                      <p className="font-mono">{selectedEvent.event_type}</p>
                                    </div>
                                    <div>
                                      <Label>Severity</Label>
                                      <Badge className={getSeverityColor(selectedEvent.severity)}>
                                        {selectedEvent.severity.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label>IP Address</Label>
                                      <p className="font-mono">{selectedEvent.ip_address || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label>Time</Label>
                                      <p>{new Date(selectedEvent.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <p className="mt-1 text-sm">{selectedEvent.description}</p>
                                  </div>
                                  <div>
                                    <Label>Event Data</Label>
                                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                                      {JSON.stringify(selectedEvent.event_data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                {selectedEvent && !selectedEvent.resolved && (
                                  <Button onClick={() => {
                                    resolveEvent(selectedEvent.id);
                                    setSelectedEvent(null);
                                  }}>
                                    Mark as Resolved
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          {!event.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveEvent(event.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
              <CardDescription>Manage blocked IP addresses and view blocking reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Failed Attempts</TableHead>
                    <TableHead>Blocked Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono">{ip.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant={ip.block_type === 'permanent' ? 'destructive' : 'secondary'}>
                          {ip.block_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={ip.reason}>
                        {ip.reason}
                      </TableCell>
                      <TableCell>{ip.failed_attempts}</TableCell>
                      <TableCell>
                        {ip.blocked_until 
                          ? new Date(ip.blocked_until).toLocaleString()
                          : 'Permanent'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unblockIP(ip.id)}
                        >
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Configuration Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configurations</CardTitle>
              <CardDescription>Configure automated security alerts and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Name</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Auto Block</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>{formatEventType(config.event_type)}</TableCell>
                      <TableCell>
                        {config.threshold_count} in {config.threshold_window_minutes}m
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {config.alert_channels.map((channel) => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                              {channel === 'webhook' && <Webhook className="h-3 w-3 mr-1" />}
                              {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.auto_block ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.enabled ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
