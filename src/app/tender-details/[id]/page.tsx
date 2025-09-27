"use client";

import MultipurposeDetails2 from "@/components/tender-details/MultipurposeDetails2";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';

export default function TenderDetails() {
  return (
    <SnackbarProvider>
      <AxiosInterceptor>
        <RequestProvider>
          <Header />
          <MultipurposeDetails2 />
      <Footer />
    </RequestProvider>
  </AxiosInterceptor>
</SnackbarProvider>
  );
}