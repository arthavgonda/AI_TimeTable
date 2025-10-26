import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Good Morning, Student!
        </Text>
        <Text variant="bodyLarge" style={styles.date}>
          Today: {new Date().toLocaleDateString()}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.nextClass}>
            <MaterialCommunityIcons name="clock-outline" size={32} color="#2c3e50" />
            <View style={styles.nextClassInfo}>
              <Text variant="titleLarge">Next Class</Text>
              <Text variant="headlineSmall">Data Structures</Text>
              <Text variant="bodyMedium">Starts in 15 minutes</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="calendar"
          onPress={() => navigation.navigate('Timetable')}
          style={styles.actionButton}
        >
          Full Timetable
        </Button>
        <Button
          mode="contained"
          icon="map"
          onPress={() => navigation.navigate('RoomNavigation')}
          style={styles.actionButton}
        >
          Room Navigator
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Today's Schedule
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  greeting: {
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  nextClass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nextClassInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginVertical: 8,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
});

