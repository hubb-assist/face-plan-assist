
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  backLink: string;
  backText: string;
}

const PlaceholderPage = ({ title, description, backLink, backText }: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-hubAssist-primary">{title}</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-center text-muted-foreground mb-6">{description}</p>
          <Link to={backLink}>
            <Button className="btn-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
