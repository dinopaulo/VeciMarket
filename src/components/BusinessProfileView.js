import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Layout, Text, Card, Button, Icon, Avatar } from '@ui-kitten/components';
import colors from '../lib/colors';

// Iconos
const FolderIcon = (props) => (
  <Icon {...props} name='folder-outline' pack='eva'/>
);

const EyeIcon = (props) => (
  <Icon {...props} name='eye-outline' pack='eva'/>
);

const CheckIcon = (props) => (
  <Icon {...props} name='checkmark-circle-outline' pack='eva'/>
);

const ClockIcon = (props) => (
  <Icon {...props} name='clock-outline' pack='eva'/>
);

export default function BusinessProfileView() {
  const [activeTab, setActiveTab] = useState('overview');

  const businessProfile = {
    name: 'Mi Negocio Local',
    type: 'Restaurante & Catering',
    avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
    stats: {
      followers: '2.5k',
      following: '150',
      projects: '24'
    }
  };

  const folders = [
    {
      id: 1,
      name: 'Menús del Día',
      created: '28 Feb, 2024',
      collaborators: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50'
      ]
    },
    {
      id: 2,
      name: 'Recetas Especiales',
      created: '15 Mar, 2024',
      collaborators: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50'
      ]
    }
  ];

  const teamProjects = [
    {
      id: 1,
      title: 'Menú de Verano',
      status: 'En Progreso',
      icon: '🍽️',
      team: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40'
      ]
    },
    {
      id: 2,
      title: 'Catering Empresarial',
      status: 'Completado',
      icon: '🎉',
      team: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40'
      ]
    },
    {
      id: 3,
      title: 'Nuevo Local',
      status: 'En Progreso',
      icon: '🏪',
      team: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40'
      ]
    },
    {
      id: 4,
      title: 'Marketing Digital',
      status: 'Completado',
      icon: '📱',
      team: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40'
      ]
    }
  ];

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <Image source={{ uri: businessProfile.avatar }} style={styles.profileAvatar} />
      <Text style={styles.profileName}>{businessProfile.name}</Text>
      <Text style={styles.profileType}>{businessProfile.type}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{businessProfile.stats.followers}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{businessProfile.stats.following}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{businessProfile.stats.projects}</Text>
          <Text style={styles.statLabel}>Proyectos</Text>
        </View>
      </View>
    </View>
  );

  const renderFolders = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Carpetas</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.foldersContainer}>
        {folders.map((folder) => (
          <Card key={folder.id} style={styles.folderCard}>
            <View style={styles.folderContent}>
              <View style={styles.folderIconContainer}>
                <FolderIcon style={styles.folderIcon} fill={colors.secondary} />
              </View>
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderDate}>Creado {folder.created}</Text>
                <View style={styles.collaboratorsContainer}>
                  {folder.collaborators.map((collaborator, index) => (
                    <Avatar
                      key={index}
                      source={{ uri: collaborator }}
                      style={styles.collaboratorAvatar}
                      size="tiny"
                    />
                  ))}
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderTeamProjects = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mi Equipo</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.projectsContainer}>
        {teamProjects.map((project) => (
          <Card key={project.id} style={styles.projectCard}>
            <View style={styles.projectContent}>
              <View style={styles.projectIconContainer}>
                <Text style={styles.projectIcon}>{project.icon}</Text>
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <View style={styles.projectStatus}>
                  {project.status === 'Completado' ? (
                    <CheckIcon style={styles.statusIcon} fill={colors.success} />
                  ) : (
                    <ClockIcon style={styles.statusIcon} fill={colors.secondary} />
                  )}
                  <Text style={[
                    styles.projectStatusText,
                    project.status === 'Completado' && styles.statusCompleted
                  ]}>
                    {project.status}
                  </Text>
                </View>
              </View>
              <View style={styles.projectTeam}>
                {project.team.map((member, index) => (
                  <Avatar
                    key={index}
                    source={{ uri: member }}
                    style={styles.teamMemberAvatar}
                    size="tiny"
                  />
                ))}
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );

  return (
    <Layout style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderFolders()}
        {renderTeamProjects()}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: colors.primary,
    padding: 24,
    alignItems: 'center',
    paddingBottom: 32,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  profileType: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  foldersContainer: {
    gap: 16,
  },
  folderCard: {
    borderRadius: 12,
    marginBottom: 0,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  folderIcon: {
    width: 24,
    height: 24,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  folderDate: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 8,
  },
  collaboratorsContainer: {
    flexDirection: 'row',
  },
  collaboratorAvatar: {
    marginRight: 8,
  },
  projectsContainer: {
    gap: 16,
  },
  projectCard: {
    borderRadius: 12,
    marginBottom: 0,
  },
  projectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  projectIcon: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  projectStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  projectStatusText: {
    fontSize: 14,
    color: colors.secondary,
  },
  statusCompleted: {
    color: colors.success,
  },
  projectTeam: {
    flexDirection: 'row',
  },
  teamMemberAvatar: {
    marginLeft: 8,
  },
});
