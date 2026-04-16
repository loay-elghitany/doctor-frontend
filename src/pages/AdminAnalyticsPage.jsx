import React from "react";
import { MainLayout } from "../components/layout/Layout";
import AdminAnalyticsDashboard from "../components/AdminAnalyticsDashboard";

export const AdminAnalyticsPage = () => {
  return (
    <MainLayout userType="admin">
      <AdminAnalyticsDashboard />
    </MainLayout>
  );
};
