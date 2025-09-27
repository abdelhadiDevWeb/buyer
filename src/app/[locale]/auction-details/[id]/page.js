import AuctionDetailsClient from "./AuctionDetailsClient";

export const metadata = {
  title: "Auction Details - MazadClick",
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
};

export default function AuctionDetailsPage({ params }) {
  return (
    <AuctionDetailsClient params={params} />
  );
} 