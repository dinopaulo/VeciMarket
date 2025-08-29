import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction, BottomNavigation, BottomNavigationTab, Text, Icon } from '@ui-kitten/components';
import colors from '../lib/colors';

// Iconos para la navegación superior
const SearchIcon = (props) => (
  <Icon {...props} name='search-outline'/>
);

const BellIcon = (props) => (
  <Icon {...props} name='bell-outline'/>
);

// Iconos para la navegación inferior
const HomeIcon = (props) => (
  <Icon {...props} name='home-outline'/>
);

const BusinessIcon = (props) => (
  <Icon {...props} name='briefcase-outline'/>
);

const HeartIcon = (props) => (
  <Icon {...props} name='heart-outline'/>
);

const CartIcon = (props) => (
  <Icon {...props} name='shopping-cart-outline'/>
);

const PersonIcon = (props) => (
  <Icon {...props} name='person-outline'/>
);

export default function MainLayout({ children, currentTab = 0, onTabSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(currentTab);

  const onSelect = (index) => {
    setSelectedIndex(index);
    if (onTabSelect) {
      onTabSelect(index);
    }
  };

  const renderTopNavigation = () => (
    <TopNavigation
      title={() => (
        <Text style={styles.appTitle}>VeciMarket</Text>
      )}
      accessoryRight={() => (
        <View style={styles.topActions}>
          <TopNavigationAction icon={SearchIcon} />
          <TopNavigationAction icon={BellIcon} />
        </View>
      )}
      style={styles.topNavigation}
    />
  );

  const renderBottomNavigation = () => (
    <BottomNavigation
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      style={styles.bottomNavigation}
    >
      <BottomNavigationTab
        title='Inicio'
        icon={HomeIcon}
        style={styles.bottomTab}
      />
      <BottomNavigationTab
        title='Negocios'
        icon={BusinessIcon}
        style={styles.bottomTab}
      />
      <BottomNavigationTab
        title='Favoritos'
        icon={HeartIcon}
        style={styles.bottomTab}
      />
      <BottomNavigationTab
        title='Carrito'
        icon={CartIcon}
        style={styles.bottomTab}
      />
      <BottomNavigationTab
        title='Perfil'
        icon={PersonIcon}
        style={styles.bottomTab}
      />
    </BottomNavigation>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.layout}>
        {renderTopNavigation()}
        
        <View style={styles.content}>
          {children}
        </View>
        
        {renderBottomNavigation()}
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  layout: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topNavigation: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingTop: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bottomNavigation: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  bottomTab: {
    paddingVertical: 8,
  },
});
