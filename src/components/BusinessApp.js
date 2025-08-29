import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainLayout from './MainLayout';
import BusinessHomeView from './BusinessHomeView';
import BusinessesView from './BusinessesView';
import FavoritesView from './FavoritesView';
import CartView from './CartView';
import BusinessProfileView from './BusinessProfileView';

export default function BusinessApp() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabSelect = (index) => {
    setCurrentTab(index);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 0:
        return <BusinessHomeView />;
      case 1:
        return <BusinessesView />;
      case 2:
        return <FavoritesView />;
      case 3:
        return <CartView />;
      case 4:
        return <BusinessProfileView />;
      default:
        return <BusinessHomeView />;
    }
  };

  return (
    <View style={styles.container}>
      <MainLayout 
        currentTab={currentTab}
        onTabSelect={handleTabSelect}
      >
        {renderCurrentView()}
      </MainLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
