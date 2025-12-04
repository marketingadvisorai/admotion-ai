import { FacebookConnect } from '@/components/integrations/facebook-connect';
import { ConversionTracking } from '@/components/integrations/conversion-tracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

export default async function IntegrationsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Integrations</h1>
                <p className="text-lg text-gray-500">
                    Connect your social media accounts and ad platforms to supercharge your workflow.
                </p>
            </div>

            <Tabs defaultValue="facebook" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="facebook">Facebook</TabsTrigger>
                    <TabsTrigger value="instagram" disabled>Instagram</TabsTrigger>
                    <TabsTrigger value="linkedin" disabled>LinkedIn</TabsTrigger>
                    <TabsTrigger value="twitter" disabled>Twitter</TabsTrigger>
                </TabsList>

                <TabsContent value="facebook" className="space-y-6">
                    <FacebookConnect orgId={orgId} />
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <ConversionTracking orgId={orgId} />
                    </div>
                </TabsContent>

                <TabsContent value="instagram">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Instagram className="h-5 w-5 text-pink-600" />
                                Instagram Integration
                            </CardTitle>
                            <CardDescription>Coming soon.</CardDescription>
                        </CardHeader>
                    </Card>
                </TabsContent>
                {/* Other tabs placeholders */}
            </Tabs>
        </div>
    );
}
