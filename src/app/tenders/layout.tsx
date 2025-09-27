import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appels d\'Offres - MazadClick',
  description: 'Découvrez les derniers appels d\'offres et soumettez vos meilleures propositions',
};

export default function TendersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
