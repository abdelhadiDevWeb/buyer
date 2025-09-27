import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détails de l\'appel d\'offres - MazadClick',
  description: 'Consultez les détails de l\'appel d\'offres et soumettez votre offre',
};

export default function TenderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      paddingTop: '100px', // Space for fixed header
      paddingBottom: '50px',
    }}>
      {children}
    </div>
  );
}
