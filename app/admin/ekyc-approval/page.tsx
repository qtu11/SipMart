'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminEKYCPage() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadVerifications();
    }, [status]);

    const loadVerifications = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/ekyc?status=${status}`);
            const data = await response.json();
            setVerifications(data.verifications || []);
        } catch (error) {
            console.error('Failed to load verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (verificationId: string, action: 'approve' | 'reject') => {
        setProcessingId(verificationId);
        try {
            const response = await fetch('/api/admin/ekyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verification_id: verificationId,
                    action,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            alert(`eKYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setNotes('');
            loadVerifications();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setProcessingId('');
        }
    };

    return (
        <div className="container mx-auto max-w-6xl p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">eKYC Approval Queue</h1>
                <p className="text-sm text-muted-foreground">
                    Review and approve identity verifications
                </p>
            </div>

            <Tabs value={status} onValueChange={setStatus}>
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={status} className="space-y-4 mt-4">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : verifications.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                No {status} verifications
                            </CardContent>
                        </Card>
                    ) : (
                        verifications.map((v) => (
                            <Card key={v.verification_id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            {v.full_name}
                                        </div>
                                        <div className="text-sm font-normal">
                                            AI Score: <span className="font-bold">{v.ai_match_score}</span>/100
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">CCCD:</span>{' '}
                                            <span className="font-medium">{v.id_card_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">DOB:</span>{' '}
                                            <span className="font-medium">{v.date_of_birth}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Email:</span>{' '}
                                            <span className="font-medium">{v.users?.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Submitted:</span>{' '}
                                            <span className="font-medium">
                                                {new Date(v.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Images Preview */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Front</p>
                                            <div className="border rounded-lg p-2 bg-gray-50 h-32 flex items-center justify-center">
                                                <span className="text-xs">📄 CCCD Front</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Back</p>
                                            <div className="border rounded-lg p-2 bg-gray-50 h-32 flex items-center justify-center">
                                                <span className="text-xs">📄 CCCD Back</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Face</p>
                                            <div className="border rounded-lg p-2 bg-gray-50 h-32 flex items-center justify-center">
                                                <span className="text-xs">👤 Selfie</span>
                                            </div>
                                        </div>
                                    </div>

                                    {status === 'pending' && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium">Admin Notes</label>
                                                <Textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Optional notes..."
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAction(v.verification_id, 'approve')}
                                                    disabled={processingId === v.verification_id}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="mr-2 w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleAction(v.verification_id, 'reject')}
                                                    disabled={processingId === v.verification_id}
                                                    variant="destructive"
                                                    className="flex-1"
                                                >
                                                    <XCircle className="mr-2 w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    {status !== 'pending' && (
                                        <Alert>
                                            <Clock className="h-4 w-4" />
                                            <AlertDescription>
                                                {status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                                                {new Date(v.created_at).toLocaleString('vi-VN')}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
