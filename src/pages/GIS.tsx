import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { gisFeatures, projects } from '@/mock';
import { MapPin } from 'lucide-react';
import { GoogleMap } from '@/components/gis/GoogleMap';

const GIS = () => {
  const { t } = useLanguage();
  
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('common.gis')}</h1>
        <p className="text-gray-600 mt-1">Geographic Information System & Spatial Mapping</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Locations Map - India</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Interactive map showing all project locations and GIS features across India
          </p>
        </CardHeader>
        <CardContent>
          <GoogleMap projects={projects} gisFeatures={gisFeatures} apiKey={apiKey} />
        </CardContent>
      </Card>

      {/* GIS Features List */}
      <Card>
        <CardHeader>
          <CardTitle>GIS Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gisFeatures.map((feature) => (
              <div
                key={feature.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="text-primary-600" size={20} />
                  <h3 className="font-medium">{feature.properties.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{feature.properties.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                    {feature.type}
                  </span>
                  {feature.properties.projectId && (
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                      Project: {feature.properties.projectId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GIS;


